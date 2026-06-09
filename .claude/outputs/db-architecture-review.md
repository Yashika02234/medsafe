# Database Architecture Review — MedSafe

> Role: Principal Database Engineer
> Scope: Complete schema review before first migration
> Authority: This review supersedes schema decisions in the Architecture Baseline where conflicts exist
> Tone: Direct. Every finding represents a real data integrity, performance, or compliance risk.

---

## EXECUTIVE FINDING

The schema has a correct shape and most decisions are sound. Three findings require changes before any migration runs. The remaining findings are improvements that should be implemented before the first data enters the system — not because they can't be added later, but because adding them after real data exists requires careful migration work.

**Finding severity classification:**

- 🔴 **CRITICAL** — Will cause silent data corruption, query failures, or compliance gaps. Must be fixed before migration.
- 🟠 **HIGH** — Will cause hard-to-debug bugs or significant rework. Fix before migration.
- 🟡 **MEDIUM** — Suboptimal design that degrades gracefully but should be addressed now.
- 🟢 **LOW** — Quality improvement. Can be done in Phase 1 with no urgency.

---

## CHALLENGE 1: NORMALIZATION

---

### Finding N-1: Parallel Array Anti-Pattern in medicines 🔴 CRITICAL

**The Problem**

`salts TEXT[]` and `rxcuis TEXT[]` store ingredients and their resolved identifiers as parallel arrays with an implicit positional dependency: `salts[0]` corresponds to `rxcuis[0]`, `salts[1]` to `rxcuis[1]`. PostgreSQL cannot enforce this relationship. No constraint, index, or trigger can guarantee the arrays stay in sync.

This design fails under three real scenarios:

**Scenario A — Partial resolution breaks the positional contract**

Combiflam has salts `["Ibuprofen", "Paracetamol"]`. Ibuprofen resolves to RxCUI 5640. Paracetamol fails (imagine a RxNorm outage during the call). The intended state is `rxcuis = ["5640", null]`. But Prisma's `String[]` does not cleanly support null elements — an empty string `""` or sentinel like `"UNRESOLVED"` must be used instead. Now every interaction check must defensively filter `WHERE rxcui != '' AND rxcui != 'UNRESOLVED'`. This logic belongs in the database, not scattered through application code.

**Scenario B — Re-resolution changes array length**

A user adds a medicine incorrectly (types "Combiflam" but the CDSCO lookup returns a different entry). Resolution produces `salts = ["Diclofenac"]` and `rxcuis = ["41493"]`. User later edits the medicine name to "Combiflam" and triggers re-resolution. New result: `salts = ["Ibuprofen", "Paracetamol"]` and `rxcuis = ["5640", "161"]`. The arrays grew. If a bug in the update path replaces only the first element of each array, the database silently holds `salts = ["Ibuprofen", "Paracetamol"]` but `rxcuis = ["5640", "41493"]`. Paracetamol now points at Diclofenac's RxCUI. Interactions are checked against the wrong drug. No error is raised.

**Scenario C — Future fields per ingredient become impossible to add cleanly**

Phase 5 OCR needs to track which ingredient the OCR scanner identified. Future features may need per-ingredient dosage (Augmentin 375: Amoxicillin 250mg + Clavulanic Acid 125mg). With parallel arrays, adding any per-ingredient field means adding another array — a third, fourth, fifth parallel array, each one another constraint PostgreSQL cannot verify.

**Recommended Fix: medicine_ingredients Junction Table**

Replace `salts TEXT[]` and `rxcuis TEXT[]` with a dedicated table:

```
medicine_ingredients
  id              UUID         PK
  medicine_id     UUID         FK → medicines(id) ON DELETE CASCADE
  ordinal         SMALLINT     NOT NULL  -- preserves ingredient order (display only)
  salt_name       TEXT         NOT NULL  -- e.g. "Ibuprofen"
  rxcui           TEXT         NULLABLE  -- null until resolved; empty means unresolved
  resolution_status TEXT       NOT NULL DEFAULT 'pending'
                               -- CHECK IN ('pending', 'resolved', 'unresolvable')
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
```

Benefits:
- Partial resolution is representable without sentinel values
- Per-ingredient resolution status is a proper column, not an array position
- Future per-ingredient fields (dosage strength, OCR source, confidence) add a column, not a parallel array
- Queries become natural: `WHERE rxcui IS NOT NULL`, not array manipulation
- Constraint enforcement is possible: `CHECK (resolution_status IN (...))`

Trade-off acknowledged: This adds a JOIN to every medicine query. For a medicine list with 20 medicines, that's one additional table scan of at most 40-60 rows (most medicines have 1-2 ingredients). At MVP scale, this is imperceptible. The correctness benefit outweighs the trivial query cost.

**Impact if not fixed:** When a user with Combiflam adds Warfarin and the Paracetamol-Warfarin pair gets checked with Diclofenac's RxCUI instead, the interaction engine either returns a wrong result or no result. No error. No warning. Silent incorrectness in a safety-critical feature.

---

### Finding N-2: Derived Data Redundancy in medicines 🟠 HIGH

**The Problem**

`expiry_month INT` and `expiry_year INT` are derivable from `expiry_date DATE` using PostgreSQL's `EXTRACT()` function. Storing derived data violates 3NF and creates a synchronization invariant that the database cannot enforce.

The specific failure mode: the `normalizeExpiryDate()` utility must be called at every point where expiry data enters the system — the add form, the edit form, the OCR parser, any future import path. If any single path fails to call it (a new developer writes a quick edit endpoint without reading the utility documentation), `expiry_date` is stored correctly but `expiry_month` and `expiry_year` reflect the original input. The display layer shows "June 2025" but the database's `expiry_date` is `2025-07-31`. Notifications fire at the wrong time. Expiry status badges show the wrong color.

The stated reason for the redundancy is "display without date parsing." But PostgreSQL provides:
```sql
EXTRACT(MONTH FROM expiry_date)  -- returns 6 for June
EXTRACT(YEAR FROM expiry_date)   -- returns 2025
```

And modern JavaScript provides:
```javascript
expiryDate.getMonth() + 1  // trivial
expiryDate.getFullYear()
```

Neither requires a database round-trip. Neither is expensive. The redundancy buys nothing.

**Recommended Fix:** Drop `expiry_month` and `expiry_year`. Extract month and year from `expiry_date` in the application layer wherever display requires it. The `normalizeExpiryDate()` utility becomes the sole entry point, and synchronization bugs become structurally impossible.

**Impact if not fixed:** Synchronization bug in any write path silently produces inconsistent displayed expiry vs actual stored expiry date. Bugs of this type are discovered through user complaints ("it says July but the strip says June"), not through error logs.

---

### Finding N-3: Uncontrolled Vocabulary in TEXT Fields 🟠 HIGH

**The Problem**

Six fields store categorical values as unvalidated TEXT, with valid values documented only in comments:

| Table | Field | Valid Values |
|-------|-------|-------------|
| medicines | resolution_status | pending, resolved, partial, unresolvable |
| medicines | added_via | manual, scan |
| family_members | relationship | self, parent, spouse, child, sibling, other |
| interactions_cache | severity | severe, moderate, mild, unknown |
| interactions_cache | source | rxnav, gemini |
| notification_log | notification_type | expiry_30, expiry_7, expiry_1 |

None of these have CHECK constraints or PostgreSQL ENUM types. The database accepts any string.

The failure mode is subtle and dangerous. Consider severity: the interactions_cache table relies on `severity = 'severe'` queries to count severe interactions for the dashboard. If a mapping bug in Phase 3 stores `'Severe'` (capitalized, as RxNav might return it) instead of `'severe'`, the dashboard shows "0 severe interactions" for a user who has several. The medicine cabinet still shows warnings (if the card component renders based on the stored value), but the dashboard summary is wrong. The user sees inconsistent data with no explanation.

Similarly, `notification_type = 'expiry30'` (missing underscore) doesn't match the UNIQUE constraint against `'expiry_30'`, so the same medicine-tier combination can generate two notification log entries — and two emails.

**Recommended Fix:** Add PostgreSQL CHECK constraints to every categorical field. In Prisma, this is expressed via `@db.Check()` or raw SQL in the migration. Example:

```sql
ALTER TABLE medicines 
  ADD CONSTRAINT chk_resolution_status 
  CHECK (resolution_status IN ('pending', 'resolved', 'partial', 'unresolvable'));

ALTER TABLE medicines 
  ADD CONSTRAINT chk_added_via 
  CHECK (added_via IN ('manual', 'scan'));
```

This is a one-time cost during schema creation. The constraint catches vocabulary violations at INSERT/UPDATE time, in the database, regardless of which code path created the row.

**Impact if not fixed:** Vocabulary drift across code paths. Silent query misses. Inconsistent UI state that is hard to trace to a root cause.

---

## CHALLENGE 2: SCALABILITY

---

### Finding S-1: Missing Critical Performance Indexes 🟠 HIGH

**The Problem**

The current schema defines indexes only on `interactions_cache(rxcui_a, rxcui_b)` and the implicit index created by `checked_pairs` composite PK. Three additional indexes are critical for production query performance and are absent.

**Index 1: medicines(family_member_id, is_active, expiry_date)**

This index serves the application's most frequent query: fetch all active medicines for a given family member, sorted by expiry date. Without it, PostgreSQL performs a full scan of the medicines table filtered by family_member_id, then sorts. At 10 medicines per user, this is imperceptible. At 10,000 medicines across 1,000 users, a full scan is expensive for every dashboard page load.

The index must be composite in this exact order:
- `family_member_id` first: highest selectivity, filters to one family member's rows
- `is_active` second: eliminates soft-deleted medicines
- `expiry_date` third: enables index-ordered scan, eliminating the sort operation

**Index 2: medicines(expiry_date, is_active)**

This index serves the cron job. The nightly expiry check queries all medicines where `expiry_date BETWEEN today AND today+30 AND is_active = true`. Without this index, the cron performs a full-table scan across ALL medicines from ALL users, every night. This is the query that will first show performance problems as the user base grows, because it has no family_member_id predicate to narrow the scan.

**Index 3: family_members(user_id)**

This index exists implicitly as the backing index for the foreign key relationship. However, the RLS policy for medicines executes a correlated subquery: `family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())`. This subquery runs for every row PostgreSQL evaluates when scanning the medicines table under RLS. An explicit index on `family_members(user_id)` ensures this subquery is fast. Most databases create this automatically for FK relationships — confirm Supabase does so for all FK columns.

**Recommended Fix:** Add all three indexes in the initial migration. Indexes added before data enters the table are free — PostgreSQL builds them instantly on an empty table. Indexes added after data exists require a potentially blocking table rebuild.

**Impact if not fixed:** Page load degradation as users accumulate medicines. Cron job timeouts as total medicine count grows. RLS policy overhead on every authenticated API call.

---

### Finding S-2: RLS Policy Uses Correlated Subquery Per Row 🟡 MEDIUM

**The Problem**

The medicines RLS policy:
```sql
CREATE POLICY "medicines_user_only" ON medicines
  USING (
    family_member_id IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );
```

PostgreSQL executes this subquery for every row evaluated during a scan of the medicines table. For a user with 50 medicines, that's 50 subquery executions. Under concurrent load with many active users, this RLS pattern generates significant additional query overhead.

**Recommended Fix:** Supabase's `auth.uid()` is a SQL function that PostgreSQL can cache within a transaction. The subquery itself is fast given the family_members(user_id) index. For MVP scale this is not a problem. But it's worth being aware that this pattern does not scale linearly — it scales as O(rows × subquery_cost). A materialized view or a different policy structure could improve this at larger scale. Document this as a known scalability ceiling.

**Impact if not fixed:** Not a problem at MVP scale (<50 users). Becomes a concern at 500+ concurrent users. Acceptable to defer.

---

### Finding S-3: Soft-Delete Accumulation Has No Purge Mechanism 🟢 LOW

**The Problem**

Medicines with `is_active = false` accumulate indefinitely. Every query that includes `WHERE is_active = true` must scan past inactive rows (unless the index on `is_active` provides row elimination, which depends on the selectivity of `is_active = false` in the total population). Over years, a user who adds and removes medicines frequently will have more inactive rows than active ones.

**Recommended Fix:** Document a data retention policy. A scheduled job that hard-deletes medicines where `is_active = false AND updated_at < now() - interval '1 year'` would keep the table clean. This is not an MVP task but the schema should support it — which it does, since the `updated_at` field exists. Log this as a post-launch maintenance task.

**Impact if not fixed:** Table bloat over time. Not a practical concern for the first year of operation.

---

## CHALLENGE 3: INTERACTION MODELING

---

### Finding I-1: checked_pairs Has No Stale Data Mechanism 🟡 MEDIUM

**The Problem**

The `checked_pairs` table is the negative cache — once a pair is in this table, the interaction engine never calls RxNav for it again. But pharmaceutical databases are updated. An interaction that didn't exist in RxNav in 2025 may be added in 2026 based on new research. A pair recorded as `has_interactions = false` in `checked_pairs` will never be re-evaluated.

The current design has no expiry mechanism. The `checked_at` timestamp exists but is never read in the interaction engine logic — it's purely informational.

**Recommended Fix:** Add a recency check: when serving an interaction result from cache, include the `checked_at` timestamp in the response. If it's older than 90 days, add the pair to a "needs re-check" queue. The re-check can happen lazily (next time the pair is requested) or in a background batch. This requires no schema change — the `checked_at` column already exists. What needs to be defined is the re-check threshold (90 days is a reasonable default) and the mechanism (a column flag or an external queue).

Minimal schema addition: `needs_recheck BOOLEAN DEFAULT false` on `checked_pairs`. A monthly maintenance job sets `needs_recheck = true` for all pairs where `checked_at < now() - interval '90 days'`. The interaction engine treats `needs_recheck = true` as "not in cache" for the purpose of triggering a RxNav call.

**Impact if not fixed:** The interaction engine's accuracy degrades over time as its cached data ages. New interactions between drugs the user is already taking are never detected. For a safety-critical product, this is an important limitation that at minimum should be documented in the user-facing disclaimer.

---

### Finding I-2: Interaction Engine Can't Detect Stale Pairs After Medicine Re-Resolution 🟡 MEDIUM

**The Problem**

When a user edits a medicine's brand name (changing, say, "Crocin" to "Paracetamol 650"), re-resolution generates new rxcuis. The new ingredient might produce a different RxCUI than the old one. But the `checked_pairs` table retains the old RxCUI pairs as "already checked" — and the new RxCUI pairs aren't in `checked_pairs` at all, so they'll be correctly identified as needing checking.

The problem is inverse: old pairs from the previous RxCUI remain in `checked_pairs` even though the medicine they came from no longer uses those RxCUIs. They're not wrong (the interaction data is still valid between those two drugs), but they're now orphaned — no medicine in the user's cabinet has those RxCUIs anymore. They waste space in the cache and could cause confusion in future analytics.

**Impact assessment:** This is not a correctness bug. Old pairs don't cause wrong interaction results. New pairs are correctly identified as unchecked. The issue is cache hygiene — orphaned entries that will never be referenced again. At MVP scale with a small user base, this is not worth addressing. At larger scale, a periodic cleanup of checked_pairs entries not referenced by any current medicine's rxcuis would be appropriate. Document as a known technical debt.

---

### Finding I-3: Severity Ordering Has No Database-Level Support 🟢 LOW

**The Problem**

The interaction engine returns interactions sorted by severity (severe first, moderate second, mild last). But severity is stored as TEXT and has no natural sort order. The sort must happen in application code based on a hard-coded priority mapping (severe=1, moderate=2, mild=3). If a new severity level is introduced (e.g., "contraindicated" which is more urgent than "severe"), the sort order in multiple places must be updated.

**Recommended Fix:** Add an `severity_ordinal SMALLINT NOT NULL` column to `interactions_cache`. Values: severe=1, moderate=2, mild=3, unknown=99. This enables `ORDER BY severity_ordinal ASC` at the database level, removing sort logic from the application layer and making severity ordering a data concern, not a code concern. If a new severity level is introduced, a single UPDATE to severity_ordinal fixes the display everywhere.

**Impact if not fixed:** Sort logic duplicated in interaction engine and dashboard summary code. New severity levels require application code changes instead of data updates.

---

## CHALLENGE 4: MEDICINE RESOLUTION

---

### Finding R-1: Resolution State Machine Has No Failure Context 🟠 HIGH

**The Problem**

When `resolution_status = 'unresolvable'`, the schema records that resolution failed but not why. The failure reasons are meaningfully different:

- CDSCO lookup: brand not found in dataset → brand_name typo vs. medicine not in dataset
- RxNorm lookup: salt name not recognized → name variant (fixable with synonym) vs. genuinely not in database
- Network error during resolution → transient failure, should retry vs. permanent failure

Without this context:
- The user sees "interaction data unavailable" with no actionable explanation
- The developer can't distinguish "fix the synonym table" problems from "RxNorm genuinely doesn't know this drug" problems
- The system can't implement smart retry logic (retry transient failures, don't retry permanent ones)

**Recommended Fix:** Add two columns to medicines:
- `resolution_error TEXT NULLABLE` — a short code like "cdsco_miss", "rxnorm_miss", "network_error", "partial" (with which salts resolved noted)
- `resolution_attempt_count SMALLINT DEFAULT 0` — incremented on each resolution attempt; enables retry limits (stop retrying after 3 attempts) and analytics (how many medicines needed multiple attempts before resolving?)

**Impact if not fixed:** "Unresolvable" is a dead-end state. No information to act on. No way to distinguish fixable problems from genuine gaps.

---

### Finding R-2: The is_self Constraint Has No Database Enforcement 🟠 HIGH

**The Problem**

The schema relies on application code to ensure exactly one `family_members` row per user has `is_self = true`. Nothing in the database prevents:
- A bug creating two `is_self = true` members for the same user (duplicate self members)
- A bug creating zero `is_self = true` members for a user (missing self member after a failed transaction)

Both conditions silently break the medicine cabinet. "Find the self member's family_member_id" is the first operation in every medicine query. If it returns two rows, the query is ambiguous. If it returns zero rows, the user can't add medicines.

**Recommended Fix:** Create a partial unique index:
```sql
CREATE UNIQUE INDEX idx_one_self_per_user 
  ON family_members (user_id) 
  WHERE is_self = true;
```

This index enforces exactly one `is_self = true` row per user at the database level, regardless of application code bugs. It also doesn't affect non-self family members (the partial condition `WHERE is_self = true` makes it a partial index — it indexes only the relevant rows).

**Impact if not fixed:** A race condition or bug in the signup handler can silently create an unusable account — one where the medicine cabinet is inaccessible because the "self" lookup is ambiguous or missing.

---

### Finding R-3: No Deduplication Guard on Active Medicines 🟡 MEDIUM

**The Problem**

A user can add the same medicine twice. There's no constraint preventing:
```
family_member_id: X
brand_name: "Crocin"
expiry_date: 2025-06-30
is_active: true
[row 1]

family_member_id: X
brand_name: "Crocin"
expiry_date: 2025-06-30
is_active: true
[row 2]
```

Both rows generate their own interaction checks against all other medicines — so Crocin would appear to interact with itself (Paracetamol vs Paracetamol). The dashboard counts "2 medicines" when there's really 1. The UI shows two identical cards.

A duplicate constraint is not straightforward because legitimate use cases exist: a user could have two strips of the same brand with different expiry months. A strict unique on `(family_member_id, brand_name)` where `is_active = true` would prevent this.

**Recommended fix for MVP:** A partial unique index on `(family_member_id, brand_name, expiry_month, expiry_year)` where `is_active = true`. This allows two strips of the same medicine with different expiry months (both valid) but prevents identical duplicates.

If medicine_ingredients is adopted (N-1), this constraint becomes `(family_member_id, brand_name, expiry_date)` since expiry_month and expiry_year would be dropped. 

**Note:** This is a medium-priority recommendation, not critical. Duplicates are visible to users and self-correctable by deleting one. But preventing them structurally is cleaner than having deduplication logic in the application layer.

---

## CHALLENGE 5: FAMILY ACCOUNTS

---

### Finding F-1: family_members.relationship Has No Controlled Vocabulary 🟡 MEDIUM

**The Problem**

`relationship TEXT DEFAULT 'self'` accepts any string. Valid values ("self", "parent", "spouse", "child", "sibling", "other") exist only in comments. There's no database constraint.

This matters beyond just data hygiene. The `is_self = true` row is expected to have `relationship = 'self'`. If a bug stores `relationship = 'Self'` (capitalized) for the self member, and any query filters by `WHERE relationship = 'self'`, it misses the self member. Cascade with the is_self partial unique index recommendation above — both protections are needed.

**Recommended Fix:** 
```sql
ALTER TABLE family_members 
  ADD CONSTRAINT chk_relationship 
  CHECK (relationship IN ('self', 'parent', 'spouse', 'child', 'sibling', 'other'));
```

---

### Finding F-2: Family Mode Has No Per-Member Access Control 🟢 LOW

**The Problem**

The current design supports one user managing medicines for multiple family members. All family members and their medicines are visible to the account owner. There's no concept of a family member having their own login and seeing only their own medicines while the account owner sees everyone.

For MVP this is fine — the stated design is single-account family management. But the schema has no design path for the multi-account family access pattern if it's ever needed. The `family_members.user_id` foreign key only connects to the account owner — there's no field like `member_user_id` that would link a family member to their own Supabase auth account.

**Impact:** Not a current problem. Documents a known limitation of the family model. If "shared family access" becomes a feature request, it requires a schema change (adding a nullable `linked_user_id` to `family_members`). Design the model knowing this is possible future scope.

---

## CHALLENGE 6: AUDITABILITY

---

### Finding A-1: notification_log Records Sends But Not Failures or Opt-Outs 🟠 HIGH

**The Problem**

The notification_log table records successful notification sends. When Resend returns an error (network issue, invalid email address, account suspended), nothing is recorded. The log shows a gap — the medicine should have an "expiry_7" entry but doesn't — and there's no way to distinguish "alert not yet sent" from "alert attempted and failed."

Additionally, when a user disables notifications, subsequent cron runs skip them silently. There's no record that the notification was skipped due to user preference. If a user later complains "I never got my expiry alert," the system can't show whether the alert was sent, failed, or suppressed.

**Recommended Fix:** Add two columns to notification_log:
- `status TEXT NOT NULL DEFAULT 'sent'` — values: "sent" | "failed" | "skipped_preference"
  - Apply CHECK constraint on these values
- `error_message TEXT NULLABLE` — the Resend error message if status is "failed"

Remove the `@@unique([medicine_id, notification_type])` constraint — it only makes sense for successful sends. With the status field, two rows can exist for the same medicine+type: one "failed" and one "sent" (on a later retry). Replace it with: `CREATE UNIQUE INDEX ... WHERE status = 'sent'` to enforce at most one successful send per medicine+type.

**Impact if not fixed:** No ability to debug email delivery. No audit trail for DPDPA compliance (can you prove you notified the user?). Users who report missing alerts cannot be helped.

---

### Finding A-2: No Consent Version Tracking 🟠 HIGH

**The Problem**

`users.consent_given_at` records when the user consented. But it doesn't record which version of the consent text they agreed to.

DPDPA requires that consent be re-sought when the purposes for processing change materially. If MedSafe adds a feature in Phase 6 (say, sharing anonymized medicine data for public health research — hypothetical), users who consented under the original terms must be re-prompted. There's no way to determine which version they consented to.

**Recommended Fix:** Add `consent_text_version TEXT NOT NULL DEFAULT 'v1.0'` to users. When the consent screen is updated (new data collected, new purposes), increment the version (v1.1, v1.2). On each login, middleware checks: `IF user.consent_text_version != CURRENT_CONSENT_VERSION → redirect to new consent screen`. This is a small schema addition with significant legal protection.

**Recommended accompanying addition:** A separate `consent_history` table (future scope, not MVP):
```
consent_history
  user_id UUID FK
  version TEXT
  consented_at TIMESTAMPTZ
  withdrawn_at TIMESTAMPTZ NULLABLE
```
This enables a complete consent audit trail. Not required for MVP, but the pattern should be known.

**Impact if not fixed:** If the consent text ever changes, there's no way to identify which users need re-prompting. Mass re-consent prompting for all users is the only fallback.

---

### Finding A-3: No Medicine Edit History 🟢 LOW

**The Problem**

When a user edits a medicine — changes the brand name, corrects the expiry date, updates the dosage — the previous values are permanently lost. `updated_at` records that something changed, not what.

For debugging (user reports "why does this show the wrong date?"), for OCR accuracy measurement (was the OCR result different from what the user saved?), and for long-term health data quality, edit history is valuable.

**Recommended design (not MVP scope, but plan for):**

```
medicine_edits
  id UUID PK
  medicine_id UUID FK
  field_name TEXT NOT NULL     -- "brand_name", "expiry_date", etc.
  old_value TEXT               -- serialized as text for simplicity
  new_value TEXT
  changed_by TEXT              -- "user_edit", "ocr_correction", "re_resolution"
  changed_at TIMESTAMPTZ       -- DEFAULT now()
```

This table is append-only. Every update to a medicine creates a row per changed field. No deletes. This pattern is standard for auditable health data systems.

---

## CHALLENGE 7: COMPLIANCE (DPDPA)

---

### Finding C-1: No Data Retention Boundary at Database Level 🟡 MEDIUM

**The Problem**

DPDPA requires data to be retained only as long as necessary for its purpose. The current schema has no mechanism to identify data that has passed its retention boundary:

- Notification logs older than 2 years serve no purpose (alert history for medicines long expired)
- Medicines inactive for 5+ years serve no purpose
- interactions_cache entries for drug pairs no active user takes may never be referenced again

No column exists to enable automated cleanup. The database will grow indefinitely, and "as long as the account exists" is effectively the retention policy — which may not satisfy DPDPA's minimization requirements.

**Recommended Fix:**
- Add `can_purge_after TIMESTAMPTZ` to notification_log, set to `sent_at + interval '2 years'`
- Add `can_purge_after TIMESTAMPTZ` to interactions_cache, set to `cached_at + interval '1 year'` (refreshed on access)
- Document the retention policy in the privacy policy and implement a monthly maintenance job

This requires no application logic change — the column provides the signal for a background cleanup script.

---

### Finding C-2: interactions_cache and checked_pairs Have No RLS But Contain RxCUI Data 🟢 LOW

**The Problem**

The RLS decision for these tables is documented as intentional: they're shared lookup tables, not user data. But RxCUIs are drug identifiers — an attacker who can read the `checked_pairs` table can infer which drug combinations have been checked (and therefore potentially which drug combinations some user in the system takes).

For a small-scale student project with 50 users, this is a theoretical concern, not a practical one. At larger scale, the presence of a (Warfarin, Metformin) pair in `checked_pairs` implies some user in the system takes both — mild but real information leakage.

**For MVP:** Accept this as a known, documented limitation. Add a comment to the RLS setup script explaining why these tables intentionally lack RLS and what information they expose.

**Future mitigation:** Once user count is meaningful, consider hashing the RxCUI pairs before storing in `checked_pairs` so the table reveals that some pair has been checked without revealing which pair. Or: move the cache to Redis (which has no RLS requirement) in a future architecture iteration.

---

## CHALLENGE 8: FUTURE OCR REQUIREMENTS

---

### Finding O-1: OCR Metadata Is Completely Absent from Schema 🟠 HIGH

**The Problem**

`added_via = 'scan'` is the entire record of OCR activity. When Phase 5 ships, the following questions are unanswerable from the database:

**For debugging:** What did Tesseract actually extract from the strip? Was the medicine name correct? What confidence score was reported?

**For UX measurement:** How often do users correct the extracted medicine name? How often do they correct the extracted expiry date? This data determines whether the OCR pipeline is accurate enough or needs improvement.

**For portfolio metrics:** "X% of medicines added via OCR required user correction" is a compelling data-driven claim. Without the `medicine_scan_log`, this metric cannot be produced.

**Recommended Fix:** Design the `medicine_scan_log` table now. It costs nothing to define the schema before Phase 5, and it ensures the Phase 5 developer (which will be a future Claude session) knows to populate it.

```
medicine_scan_log
  id                   UUID         PK, auto-generated
  medicine_id          UUID         FK → medicines(id) ON DELETE CASCADE
  raw_ocr_text         TEXT         NOT NULL  -- full Tesseract output before parsing
  confidence_score     REAL         NOT NULL  -- 0.0–100.0, mean word confidence
  parsed_brand_name    TEXT         NULLABLE  -- what OCR parser extracted as brand name
  parsed_expiry        TEXT         NULLABLE  -- raw string extracted as expiry ("06/2025")
  user_edited_name     BOOLEAN      NOT NULL DEFAULT false  -- did user change parsed name?
  user_edited_expiry   BOOLEAN      NOT NULL DEFAULT false  -- did user change parsed expiry?
  saved_brand_name     TEXT         NOT NULL  -- final value user saved (after any edits)
  saved_expiry_date    DATE         NOT NULL  -- final expiry date saved
  tesseract_version    TEXT         NULLABLE  -- e.g., "5.3.0" for model tracking
  scanned_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
```

This table is write-once at scan time. The `user_edited_*` flags are set to true if the user changes the pre-filled form fields before saving.

**Important:** Do not store the actual image. Images belong in object storage (Supabase Storage), not in the database. The scan log references the derived data from OCR, not the source image.

**Impact if not fixed:** Phase 5 ships with no ability to measure OCR quality. OCR accuracy improvements require deploying new code and waiting for future data — with no baseline to compare against. The portfolio narrative ("X% of users successfully added medicines via OCR scan") cannot be substantiated.

---

### Finding O-2: No Image Storage Strategy Defined 🟡 MEDIUM

**The Problem**

If users photograph medicine strips, where do those images live? The current schema has no object storage plan. Three options exist:

**Option A: Discard images after OCR** — Send to FastAPI, extract text, return text, never store the image. Zero storage cost. Zero debugging capability. Cannot improve the OCR pipeline by reviewing failure cases.

**Option B: Store in Supabase Storage** — Free tier provides 1GB. Images can be referenced by UUID in `medicine_scan_log`. Enables reviewing failure cases. Supabase Storage has its own RLS policies.

**Option C: Store temporarily, delete after 30 days** — Store in Supabase Storage with a 30-day cleanup job. Enables short-term debugging without indefinite storage accumulation.

This decision has schema implications: if images are stored, `medicine_scan_log.image_path TEXT NULLABLE` provides the reference. If images are discarded, this column is omitted.

**For MVP:** Option A (discard) is recommended. Storage complexity is premature at MVP scale. Add `image_stored_at TIMESTAMPTZ NULLABLE` to `medicine_scan_log` as a placeholder — null in MVP, populated if Option B/C is adopted later.

---

## FINAL SCHEMA STRATEGY

### Changes Required Before First Migration

These are non-negotiable. Running the first migration with these unresolved creates future migration debt on a live database.

**1. Replace parallel arrays with medicine_ingredients table (N-1)**

The positional dependency between `salts[]` and `rxcuis[]` is indefensible from a data integrity standpoint. The junction table is the correct relational design. This change requires accepting one additional JOIN in medicine queries — a trivial cost.

Drop `salts TEXT[]` and `rxcuis TEXT[]` from medicines.
Add `medicine_ingredients` table as specified in Finding N-1.
Move `resolution_status` from medicines to medicine_ingredients (per-ingredient status is more precise than per-medicine status).
Keep `resolution_status` on medicines as a computed summary: the medicine's overall status is the worst status among its ingredients.

**2. Drop expiry_month and expiry_year (N-2)**

Remove the derived columns. Extract month and year from `expiry_date` in application code wherever needed.

**3. Add CHECK constraints on all categorical fields (N-3)**

Apply CHECK constraints to: `medicines.resolution_status`, `medicines.added_via`, `family_members.relationship`, `interactions_cache.severity`, `interactions_cache.source`, `notification_log.notification_type`.

**4. Add partial unique index for is_self (R-2)**

```sql
CREATE UNIQUE INDEX idx_one_self_per_user ON family_members (user_id) WHERE is_self = true;
```

**5. Add all performance indexes (S-1)**

```sql
CREATE INDEX idx_medicines_member_active_expiry ON medicines (family_member_id, is_active, expiry_date);
CREATE INDEX idx_medicines_expiry_active ON medicines (expiry_date, is_active);
```

**6. Add notification_log status field (A-1)**

Add `status TEXT NOT NULL DEFAULT 'sent'` and `error_message TEXT NULLABLE` to notification_log. Replace `@@unique([medicine_id, notification_type])` with a partial unique index where `status = 'sent'`.

**7. Add consent versioning (A-2)**

Add `consent_text_version TEXT NOT NULL DEFAULT 'v1.0'` to users.

### Changes Strongly Recommended Before Phase 3

**8. Add resolution failure context to medicines/medicine_ingredients (R-1)**

Add `resolution_error TEXT NULLABLE` and `resolution_attempt_count SMALLINT DEFAULT 0`.

**9. Add severity_ordinal to interactions_cache (I-3)**

Add `severity_ordinal SMALLINT NOT NULL` for database-level severity sort ordering.

**10. Add needs_recheck to checked_pairs (I-1)**

Add `needs_recheck BOOLEAN NOT NULL DEFAULT false` to support cache invalidation.

### Schema Design for Phase 5 (no migration needed until Phase 5)

**11. Define medicine_scan_log table (O-1)**

Design the complete table now. Implement in Phase 5 migration. This ensures the Phase 5 developer has a clear specification.

### Decisions That Remain Deferred (acceptable)

- Medicine edit history table (A-3) — post-launch
- Consent history table (A-2 extended) — post-launch
- Data purge columns (C-1) — post-launch
- Image storage strategy (O-2) — decide before Phase 5

---

## REVISED SCHEMA SUMMARY

The final schema for Phase 1 migration has eight tables, not six:

| Table | Change From Baseline | Reason |
|-------|---------------------|--------|
| users | + consent_text_version | Consent versioning (DPDPA) |
| family_members | + partial unique index on is_self | Prevent duplicate self members |
| medicines | - salts[], - rxcuis[], - expiry_month, - expiry_year, + resolution_error, + resolution_attempt_count | Array anti-pattern fix, derived data removal, resolution context |
| medicine_ingredients | NEW TABLE | Replaces parallel arrays in medicines |
| interactions_cache | + severity_ordinal, + CHECK on severity/source | Sort support, vocabulary control |
| checked_pairs | + needs_recheck | Cache invalidation support |
| notification_log | + status, + error_message, partial unique on 'sent' | Delivery audit trail |
| medicine_scan_log | NEW TABLE (empty in Phase 1) | OCR metadata (populated in Phase 5) |

---

## IMPACT ON ARCHITECTURE BASELINE

The following Architecture Baseline decisions (ND series) must be revised:

**ND-5 revised:** `medicines.rxcuis TEXT[]` → replaced by `medicine_ingredients` table. The architecture baseline must be updated to reflect this change. The pair generation algorithm in Part 4 must be updated to JOIN through `medicine_ingredients` instead of array-traversing `medicines.rxcuis`.

**New ND-13:** `medicine_scan_log` table exists from Phase 1 migration, empty, populated in Phase 5.

**New ND-14:** All categorical TEXT fields have CHECK constraints enforced at the database level. Application code must use values matching these constraints exactly (lowercase, underscore-separated).

No other non-negotiable decisions (ND-1 through ND-12) are affected by this review.
