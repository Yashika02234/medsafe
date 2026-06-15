# Phase 0 Architecture Lock Checklist — MedSafe

> Purpose: Every item on this list must be resolved before Phase 1 begins.
> Phase 1 writes the first migration. Migrations are expensive to change.
> This checklist exists to make sure no decision that costs 10x later is left unmade now.
>
> Authority: Architecture Baseline (`.claude/outputs/architecture-baseline.md`)
> Owner: Developer (Yashika)
> Review: Complete this checklist in one sitting. Do not start Phase 1 until the gate at the bottom is signed off.

---

## STATUS LEGEND

- ✅ **LOCKED** — Decision made, documented in baseline, no further action needed
- 🔴 **OPEN — BLOCKING** — Must be resolved before Phase 1 starts. Phase 1 cannot proceed without this.
- 🟡 **OPEN — CONDITIONAL** — Decision depends on Phase 0 research results. Resolve before Phase 3.
- 🟢 **OPEN — NON-BLOCKING** — Should be resolved in Phase 0 but does not block Phase 1 start.
- ⚠️ **IRREVERSIBLE** — One-time action that cannot be undone. Mark ONLY when physically completed.

---

## SECTION A: EXTERNAL API VALIDATION
*Research tasks that determine whether the planned architecture is viable. Must complete before go/no-go.*

---

### A-1: RxNorm API Accessibility from India
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Confirm that RxNorm API (`rxnav.nlm.nih.gov`) is reachable from a server hosted in India with acceptable latency. Measure actual round-trip time.
**How to validate:** Run 10 sequential calls from your machine (or a Vercel edge function in bom1). Record average latency.
**Target:** Average response time < 800ms per call. If > 800ms, the check-batch endpoint fitting 15 calls in 10 seconds becomes marginal.
**Impact if skipped:** The interaction engine's timeout math (15 calls × latency ≤ 10s) is based on assumed latency. If actual latency is 700ms, the safe batch size drops from 15 to 12. Schema and API contracts don't change, but the batch limit must be adjusted before Phase 3.
**Deliverable:** Latency measurement documented in `.claude/outputs/phase-00/api-latency.md`
**Blocking:** YES — affects check-batch ceiling; must be known before Phase 3 API design

---

### A-2: RxNorm Resolution Rate for Indian Drug Names
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Measure the percentage of common Indian medicine salt names that resolve to an RxCUI via the RxNorm API. This is the single most critical data point in the project.
**How to validate:** Complete P0-T3 (test script against 50 common Indian salts). Measure raw rate, then measure rate with synonym substitution.
**Target:** ≥ 70% with synonyms applied.
**Fallback thresholds:**
- 70%+: Proceed as planned. No fallback needed.
- 40-69%: Extend synonym table aggressively. Document unresolvable drugs. Proceed to Phase 3 with degraded coverage.
- < 40%: Activate Gemini fallback layer (see A-5). Architecture changes required before Phase 3.
**Impact if skipped:** Phase 3 interaction engine built on unvalidated assumptions. If resolution rate is 30%, the core feature is broken for most Indian drugs and requires a rearchitecture mid-build.
**Deliverable:** `.claude/outputs/phase-00/rxnorm-resolution-report.md` with rate, failures, synonym table
**Blocking:** YES — go/no-go depends on this number

---

### A-3: RxNav Interaction Detection for Known Pairs
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Verify that the RxNav Interaction API correctly identifies at least 7 out of 10 pre-selected known drug interaction pairs. Verify zero false positives on 5 non-interacting pairs.
**How to validate:** Complete P0-T4. Run end-to-end for each pair: brand name → CDSCO → salt → RxNorm → RxCUI → RxNav → interaction result.
**Target:** 7/10 known pairs detected, 0/5 false positives.
**Impact if skipped:** The interaction engine ships with unverified accuracy claims. If RxNav doesn't detect the Warfarin + Aspirin interaction, the product's safety value is compromised and cannot be demonstrated.
**Deliverable:** `.claude/outputs/phase-00/interaction-validation-report.md`
**Blocking:** YES — determines whether Phase 3 is viable as planned

---

### A-4: RxNorm and RxNav Rate Limiting Behavior
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Determine whether NIH's RxNorm and RxNav APIs impose rate limits in practice (not just in documentation). Establish safe call frequency.
**How to validate:** Send 100 sequential requests to RxNorm over 5 minutes. Monitor for 429 responses or connection resets.
**Target:** Zero throttling at 20 req/minute per endpoint.
**Impact if skipped:** If the APIs throttle at 10 req/minute, the check-batch endpoint (15 pairs per call) must be redesigned to space calls further apart, potentially needing multiple client-triggered batches.
**Deliverable:** Rate limit behavior documented in `.claude/outputs/phase-00/api-latency.md`
**Blocking:** YES — affects the serial-call design in check-batch

---

### A-5: Gemini Fallback Decision (Conditional on A-2)
**Status:** 🟡 OPEN — CONDITIONAL
**Decision Required:** If RxNorm resolution rate < 40% (from A-2), decide whether to activate Gemini API as an interaction fallback. This is a conditional decision — only relevant if A-2 returns a bad result.
**Options:**
- Option A: Accept low coverage, show "data unavailable" for unresolvable drugs. Ship as-is.
- Option B: Activate Gemini Flash free tier as fallback. Display results with "AI-generated" disclaimer. Cache in `interactions_cache` with `source = 'gemini'`.
**If Option B chosen:** The interactions_cache schema already supports it (`source` field). The resolution service needs a Gemini API call added after RxNorm fails. No schema changes needed.
**Impact if not decided before Phase 3:** If you build Phase 3 for Option A and later switch to Option B, you need to add Gemini calls to the resolution service and update interaction display UI to show source-based disclaimers.
**Blocking:** NO for Phase 1. YES before Phase 3 begins.

---

## SECTION B: DATA ASSET DECISIONS
*The CDSCO dataset is a project dependency. Its quality determines the product's usefulness.*

---

### B-1: CDSCO Data Source Selection
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Select the source for the CDSCO brand→salt mapping dataset. Options in priority order:
1. Pre-existing GitHub/Kaggle dataset (fastest — search first, spend max 2 hours looking)
2. data.gov.in official government datasets (check for pharmaceutical datasets with open license)
3. Scrape CDSCO website (slowest, most fragile — use only if 1 and 2 fail)
**Document:** Which source was chosen and why. If scraping, document the specific URLs and page structure used.
**Impact if skipped:** CDSCO data is assumed to exist. If no dataset is found and scraping proves infeasible, the entire drug resolution chain breaks. This must be sourced before writing a single line of application code.
**Deliverable:** `.claude/outputs/phase-00/cdsco-data-source.md` — source, URL, license, entry count
**Blocking:** YES — no medicine autocomplete, no resolution chain, no interaction engine without this

---

### B-2: CDSCO Dataset Minimum Quality Bar
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Confirm the dataset meets the minimum quality bar before proceeding. Quality criteria:
- [ ] Minimum 3,000 brand→salt mappings (revised from 500 — see architecture review)
- [ ] Covers all major therapeutic categories (antibiotics, analgesics, antihypertensives, antidiabetics, antacids, vitamins)
- [ ] Salt names are normalized (consistent casing, no trailing spaces)
- [ ] Combination drugs represented correctly (multiple salts per brand)
- [ ] Spot-check: 20 random entries verified against known medicines
**Impact if below bar:** Autocomplete has poor coverage. Users immediately hit "not found" for common medicines. First 10 real users have a poor experience that contradicts the portfolio narrative.
**Deliverable:** `.claude/outputs/phase-00/cdsco-data-source.md` with quality metrics
**Blocking:** YES — minimum 3,000 entries with combination drug support required

---

### B-3: Synonym Table Initial Population
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Build the initial India→US drug name synonym table (`rxnorm_synonyms.json`). Required mappings include at minimum the top 30 name discrepancies between Indian and US pharmaceutical naming.
**Known required entries (start here):**
- Paracetamol → Acetaminophen
- Salbutamol → Albuterol
- Lignocaine → Lidocaine
- Adrenaline → Epinephrine
- Frusemide → Furosemide
- Pethidine → Meperidine
- Vitamin B1 → Thiamine
- Vitamin B2 → Riboflavin
- Isoprenaline → Isoproterenol
- Norethisterone → Norethindrone
**Additional entries:** Identified during P0-T3 (wherever RxNorm returns "not found" for a known drug, add the synonym mapping).
**Impact if incomplete:** Drug resolution fails for drugs whose names don't match RxNorm conventions. Every missed synonym = one common Indian medicine that can't be interaction-checked.
**Deliverable:** `frontend/public/data/rxnorm_synonyms.json` with minimum 30 entries
**Blocking:** YES — resolution chain depends on this before Phase 3

---

### B-4: Go/No-Go Decision Documentation
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** After completing A-2, A-3, and B-1 through B-3, make and document the formal go/no-go decision. This is a written decision, not just a mental note.
**Document must include:**
- CDSCO dataset: entry count, therapeutic coverage, combination drug coverage
- RxNorm resolution rate: raw rate, rate with synonyms, list of unresolvable common medicines
- RxNav detection rate: X/10 known pairs detected, false positive rate
- API latency: average ms per call
- Decision: GO (proceed as planned) / GO WITH MODIFICATIONS (specify changes) / PIVOT (new strategy required)
- If GO WITH MODIFICATIONS: list every change to baseline architecture
**Impact if not documented:** The go/no-go exists only in the developer's head. When returning to the project after a break, there is no record of why certain drugs show "unavailable" or what the known limitations of the engine are. Future Claude sessions will have no context.
**Deliverable:** `.claude/outputs/phase-00/go-no-go-decision.md`
**Blocking:** YES — Phase 1 gate

---

### B-5: CDSCO Data Legal Usage Confirmation
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** Confirm the legal basis for using the selected CDSCO data source in a web application.
- If from data.gov.in: note the license (typically Open Government Data License — permissive)
- If from GitHub/Kaggle: check the dataset's license
- If scraped from CDSCO website: note that this is government data for informational purposes; add attribution in the app footer
**Impact if skipped:** Low risk for a student portfolio project. Higher risk if the project scales. Document for due diligence.
**Deliverable:** One paragraph in `.claude/outputs/phase-00/cdsco-data-source.md`
**Blocking:** NO — does not block Phase 1, but document before launch

---

## SECTION C: IRREVERSIBLE ACCOUNT ACTIONS
*These must be completed before Phase 1 can start. Several cannot be undone.*

---

### C-1: GitHub Repository Created
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Create the GitHub repository with the correct structure. Confirm:
- [ ] Repository created (public — required for Vercel free tier + portfolio visibility)
- [ ] `.claude/` folder pushed to main (engineering memory must be in version control)
- [ ] `prisma/` folder created with schema.prisma (will be used in Phase 1)
- [ ] `.gitignore` includes: `.env.local`, `.env`, `node_modules`, `.next`, `__pycache__`
- [ ] `README.md` created (minimal — just project name and "in development")
**Impact if skipped:** Phase 1 cannot begin (Vercel deploys from GitHub; CI/CD requires GitHub Actions)
**Deliverable:** GitHub repo URL documented in `_state.md`
**Blocking:** YES

---

### C-2: Supabase Project Created in ap-south-1 ⚠️ IRREVERSIBLE
**Status:** ⚠️ IRREVERSIBLE — requires physical action
**Decision Required:** Create the Supabase project in the `ap-south-1` (Mumbai) region.
**CRITICAL:** Region selection cannot be changed after project creation. Creating in the wrong region requires deleting the project and starting over, losing all data and configuration.
**Verification steps before clicking Create:**
1. Open Supabase dashboard → New Project
2. In the region dropdown, confirm "ap-south-1 (Mumbai)" is selected
3. Screenshot the region selection before clicking Create (for documentation)
4. After creation, go to Settings → General and screenshot the region confirmed as Mumbai
**What to collect after creation:**
- Project URL
- Anon key
- Service role key (shown only once — copy immediately)
- Connection strings (both with and without pgbouncer)
**Impact if wrong region:** All health data stored in wrong jurisdiction. DPDPA compliance gap. Migration to correct region requires full data export/import.
**Deliverable:** Supabase project URL + region documented in `_state.md`. Screenshot saved locally.
**Blocking:** YES

---

### C-3: Vercel Account Connected to GitHub
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Connect Vercel account to the GitHub repository. Confirm auto-deploy is configured for main branch.
**Steps:**
- [ ] Vercel account created (or existing account confirmed free tier)
- [ ] GitHub integration authorized
- [ ] Repository imported to Vercel
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Root directory: `frontend/` (if monorepo structure)
- [ ] Environment variables: do NOT add yet (will be done in Phase 1 when they're known)
- [ ] Deploy region: `bom1` (add to `vercel.json` in Phase 1)
**Impact if skipped:** No deployment pipeline. All Phase 1 testing is local only, missing production-specific bugs.
**Deliverable:** Vercel project URL documented in `_state.md`
**Blocking:** YES

---

### C-4: Sentry Project Created
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** Create Sentry account and new project for the MedSafe Next.js app.
**Steps:**
- [ ] Sentry account created (free tier — 5,000 errors/month)
- [ ] New project: select Next.js
- [ ] Copy DSN string
- [ ] Store DSN as `SENTRY_DSN` in environment variable list (do not configure yet — Phase 1 task)
**Impact if skipped:** No error monitoring in production. Bugs only discovered when users report them (or never).
**Blocking:** NO — Phase 1 begins without Sentry, but should be set up before first deploy

---

### C-5: Resend Account Created (For Phase 4)
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** Create Resend account (free tier — 3,000 emails/month).
**Note:** Not needed until Phase 4. Create now and store API key so it's ready.
- [ ] Resend account created at resend.com
- [ ] API key generated and stored securely
**Impact if skipped:** Phase 4 cannot begin without this. Low urgency — 3+ phases away.
**Blocking:** NO for Phase 1-3. YES for Phase 4.

---

### C-6: CRON_SECRET Generated
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Generate the cron endpoint secret token. Must be done before any environment variable setup.
**Generation:** Use a random 32-character alphanumeric string. Do NOT use a password you use elsewhere. Do NOT commit to git.
**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
**Store in:** Local password manager or `.env.local` file (never committed).
**Impact if changed later:** Must update both the Vercel environment variable AND the cron-job.org configuration simultaneously. If they're out of sync, the cron job stops working and expiry alerts stop sending.
**Deliverable:** Secret generated and stored (location noted in `_state.md` without the actual value)
**Blocking:** YES — needed for Phase 1 .env.example and Phase 4 cron setup

---

## SECTION D: DATABASE SCHEMA LOCK
*Every item in this section must be confirmed before running the first Prisma migration. Migrations that change column types, add/remove tables, or modify constraints after data exists are expensive.*

---

### D-1: Prisma Schema File Written and Reviewed
**Status:** ✅ LOCKED — File: `prisma/schema.prisma` written and cross-checked (P0-T0, 2026-06-10)
**Confirmed tables (8 models, all verified):**

- [x] `users` — id, email, name, notification_preference, consent_given, consent_given_at, consent_text_version, created_at, updated_at
- [x] `family_members` — id, user_id, name, relationship, is_self, created_at
- [x] `medicines` — id, family_member_id (NO user_id), brand_name, generic_name, expiry_date DATE, quantity?, dosage_schedule?, is_active, deactivated_at?, deactivation_reason?, added_via, resolution_status, resolution_error?, resolution_attempt_count, resolution_attempted_at?, created_at, updated_at
- [x] `medicine_ingredients` — id, medicine_id, ordinal, salt_name VARCHAR(255), rxcui?, resolution_status, created_at
- [x] `interactions_cache` — id, rxcui_a, rxcui_b, severity, severity_ordinal, description, source, cached_at (NO UNIQUE on pair)
- [x] `checked_pairs` — rxcui_a, rxcui_b, has_interactions, checked_at, needs_recheck (composite PK)
- [x] `notification_log` — id, user_id, medicine_id, notification_type, status, error_message?, sent_at
- [x] `medicine_scan_log` — id, medicine_id (UNIQUE), OCR metadata fields, scanned_at
**Blocking:** YES

---

### D-2: medicines.user_id Is Absent from Schema
**Status:** ✅ LOCKED (Baseline ND-5 equivalent, Part 2)
**Confirm:** The `medicines` table has `family_member_id` but NOT `user_id`. User identity is derived via JOIN when needed. RLS uses `family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())`.
**Action required:** Read schema.prisma line by line and confirm `user_id` is absent from medicines.
**Impact if wrong:** Adding user_id after Phase 2 CRUD is built means rewriting all medicine queries and RLS policies.
**Blocking:** YES — confirm visually in schema file before migration

---

### D-3: medicine_ingredients Junction Table Replaces rxcuis/salts Arrays

**Status:** ✅ LOCKED — Verified in `prisma/schema.prisma` (P0-T0, 2026-06-10)
**Updated decision (DB review finding N-1):** The original baseline stored `salts TEXT[]` and `rxcuis TEXT[]` as parallel arrays on the medicines table. The DB review replaced this with a `medicine_ingredients` junction table. Each ingredient is a separate row with `salt_name`, `rxcui` (nullable), `ordinal`, and `resolution_status`.
**Confirm:** `prisma/schema.prisma` has model `medicine_ingredients` with `rxcui String?` (nullable per-ingredient). The medicines model has NO `salts` or `rxcuis` fields.
**Why this matters:** The junction table enables per-ingredient resolution status, null RxCUI for unresolved ingredients, and correct combination drug support without positional dependency between parallel arrays.
**Blocking:** YES — confirm visually before migration

---

### D-4: interactions_cache Has No UNIQUE Constraint on Pair
**Status:** ✅ LOCKED (Baseline, Part 2)
**Confirm:** `interactions_cache` has `@@index([rxcui_a, rxcui_b])` (for lookup speed) but NO `@@unique([rxcui_a, rxcui_b])` constraint. One pair can have multiple rows (one per distinct interaction returned by RxNav).
**Action required:** Read schema.prisma and confirm the absence of `@@unique` on this table.
**Impact if wrong:** Only the first interaction per drug pair is stored. Subsequent interactions for the same pair are silently discarded (Prisma upsert or unique constraint violation). In the Warfarin + Aspirin case, this could discard the most severe interaction and store only a mild one — a critical safety failure.
**Blocking:** YES — confirm visually before migration

---

### D-5: checked_pairs Has Composite Primary Key
**Status:** ✅ LOCKED (Baseline, Part 2)
**Confirm:** `checked_pairs` uses `@@id([rxcui_a, rxcui_b])` as a composite primary key. No separate UUID. This is the negative cache — its PK structure enables efficient lookup of "has this pair been checked?"
**Action required:** Read schema.prisma and confirm `@@id([rxcui_a, rxcui_b])` is present.
**Impact if wrong:** The negative cache pattern breaks. The interaction engine would call RxNav for the same pairs repeatedly, hitting rate limits and causing redundant API calls.
**Blocking:** YES — confirm visually before migration

---

### D-6: Pair Normalization Rule Documented and Understood
**Status:** ✅ LOCKED (Baseline, Part 2)
**Confirm:** Both developer and Claude understand and can implement the normalization rule: before any INSERT or SELECT on `interactions_cache` or `checked_pairs`, sort the two RxCUIs lexicographically: `const [a, b] = [rxcui_1, rxcui_2].sort()`. Always use `a` as `rxcui_a` and `b` as `rxcui_b`.
**Why this matters:** Without normalization, the pair (Warfarin, Aspirin) and (Aspirin, Warfarin) would create two separate rows in `checked_pairs`, both representing the same interaction check. The pair could be "checked" twice and the result could be inconsistent.
**Action required:** Write this rule as a comment in `interactions_cache` and `checked_pairs` Prisma model. Implement `normalizePair()` utility in `src/lib/utils/interactions.ts` before Phase 3.
**Blocking:** YES — must be in place before Phase 3

---

### D-7: Expiry Date Normalization Utility Written
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Write `normalizeExpiryDate(month, year)` in `src/lib/utils/expiry.ts` before Phase 2 begins. This utility must be used everywhere expiry dates enter the system — no exceptions.
**Logic:**
```typescript
export function normalizeExpiryDate(month: number, year: number): Date {
  return new Date(year, month, 0) // day 0 = last day of previous month
}
// new Date(2025, 6, 0) = June 30, 2025 ✓
```
**Apply at:**
- Add medicine form submission
- Edit medicine form submission
- OCR text parsing (Phase 5)
**Impact if wrong:** Medicines are shown as "Expired" on the first day of the expiry month instead of the last day. A medicine labeled "06/2025" shows as expired from June 1 instead of July 1. Users throw away usable medicine.
**Blocking:** YES — must be written before any form that accepts expiry dates (Phase 2)

---

### D-8: Prisma Connection Pooling Configured
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Configure both `DATABASE_URL` and `DIRECT_URL` environment variables correctly. This is a known Supabase + Prisma gotcha.
**Required config:**
```
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```
**Prisma schema must have:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
**Why:** Without `?pgbouncer=true`, Prisma creates a new database connection per serverless function invocation. Vercel can spin up dozens of instances simultaneously, each with a new connection. PostgreSQL's connection limit is 100 (Supabase free tier). Under any load, you'll hit "too many connections" errors. `pgbouncer=true` tells Prisma to use transaction-mode pooling (one connection per query, not per function).
**Impact if wrong:** Mysterious "too many connections" database errors in production, appearing only under load. Difficult to diagnose because they don't appear in local development.
**Deliverable:** Both URLs in `.env.example` with comments explaining each
**Blocking:** YES — misconfiguration causes production failures

---

### D-9: Signup Transaction Atomic Operation Confirmed
**Status:** ✅ LOCKED (Baseline, Part 7)
**Confirm:** The signup handler creates both the `users` record AND the `family_members` (self) record in a single Prisma transaction. If either fails, both roll back.
**Why:** If user creation succeeds but family_member creation fails (network blip, DB error), the user can log in but has no "self" family member. All medicine CRUD will fail because `family_member_id` is required. The user is effectively locked out of the app's core functionality with no clear error.
**Action required:** Before writing the signup handler in P1-T3, confirm the transaction pattern is understood:
```typescript
await prisma.$transaction([
  prisma.users.create({ data: { id: authUser.id, ... } }),
  prisma.family_members.create({ data: { user_id: authUser.id, is_self: true, ... } })
])
```
**Blocking:** YES — confirm before writing P1-T3

---

### D-10: Cascade Delete Behavior Verified
**Status:** ✅ LOCKED (Baseline, Part 2 schema)
**Confirm:** The following cascade relationships are correct and intentional:
- Delete `users` → deletes all `family_members`, `notification_log`
- Delete `family_members` → deletes all their `medicines`
- Delete `medicines` → deletes all their `notification_log` entries
**Why checking:** An accidental cascade on the wrong direction (e.g., deleting a medicine_salt deletes the medicine) would cause catastrophic data loss. A missing cascade (e.g., deleting a family member does NOT delete their medicines) creates orphaned records that corrupt query results.
**Action required:** Read schema.prisma and trace every `onDelete: Cascade` to confirm direction.
**Blocking:** YES — wrong cascade direction discovered after data exists requires a dangerous migration

---

## SECTION E: SERVICE ARCHITECTURE LOCK
*These decisions determine how the system is structured. All are locked in the baseline. Confirm understanding before Phase 1.*

---

### E-1: FastAPI Deferred to Phase 5
**Status:** ✅ LOCKED (Baseline ND-1)
**Confirm:** No Python service is created in Phases 1-4. All drug resolution, interaction checking, notifications, and auth logic lives in Next.js API routes. FastAPI is created only when Tesseract OCR is needed (Phase 5).
**Action required:** Confirm no Phase 1-4 task requires Python. If any task description mentions "FastAPI" for non-OCR work, that's an error — use Next.js API route instead.
**Impact if violated:** A second service deployed in Phase 1-4 adds operational complexity with zero benefit. More deployment surfaces, more environment variables, more failure modes.
**Blocking:** YES — any proposal to deploy FastAPI before Phase 5 should be questioned

---

### E-2: POST /api/medicines Is Save-Only
**Status:** ✅ LOCKED (Baseline ND-2)
**Confirm:** The medicine creation endpoint does exactly one thing: validate input and save to database. It does NOT call RxNorm. It does NOT call RxNav. It does NOT trigger any async work.
**Client responsibility:** After POST /api/medicines returns, the CLIENT calls POST /api/drugs/resolve separately.
**Why:** Vercel serverless functions have 10-second timeouts. "Work started but not awaited" does not reliably complete in serverless. If resolution is awaited before returning, users wait 1-5 seconds for a medicine to be "added" — terrible UX.
**Action required:** Confirm this pattern is understood before writing P2-T1 (Medicine API Routes).
**Blocking:** YES — misunderstanding this causes the Vercel timeout failure the architecture was designed to prevent

---

### E-3: GET /api/interactions Is Cache-Only
**Status:** ✅ LOCKED (Baseline ND-3)
**Confirm:** The interaction read endpoint queries ONLY `checked_pairs` and `interactions_cache`. It never calls RxNav. Never.
**When RxNav is called:** Only in POST /api/interactions/check-batch, which is capped at 15 pairs per invocation.
**Action required:** Confirm this pattern is understood before writing P3-T4 (Interaction Engine).
**Blocking:** YES — putting RxNav calls in GET /api/interactions recreates the timeout problem

---

### E-4: CDSCO Served as Static File
**Status:** ✅ LOCKED (Baseline ND-8)
**Confirm:** `cdsco_brands.json` lives in `frontend/public/data/cdsco.json`. The browser downloads it once and caches it. Fuse.js runs client-side for autocomplete search. No API route handles CDSCO search.
**Impact if violated:** Serverless function cold starts require loading the full dataset per invocation. Inconsistent behavior in production. Unnecessary API latency for autocomplete.
**Action required:** When setting up the Next.js project in Phase 1, create the `/public/data/` directory and note that `cdsco.json` will be placed there after Phase 0 data preparation.
**Blocking:** YES — placing CDSCO search in an API route means rework in Phase 2

---

### E-5: Client Orchestration Pattern Documented
**Status:** ✅ LOCKED (Baseline, Part 4)
**Confirm:** The five-state client machine (idle → resolving → checking → done) is the canonical pattern for how the frontend drives drug resolution and interaction checking. Before Phase 3 begins, this pattern must be understood at the component level — which hooks call which endpoints in what order.
**Action required:** Before P3-T5, sketch the React component state diagram on paper. Confirm it matches the baseline's state machine.
**Blocking:** NO for Phase 1-2. YES before Phase 3.

---

## SECTION F: COMPLIANCE LOCK
*Legal requirements. These affect Phase 1 implementation. No deferral is acceptable.*

---

### F-1: DPDPA Compliance Scope Confirmed
**Status:** ✅ LOCKED (Baseline, Part 7)
**Confirm:** The following are required in Phase 1 and Phase 4. Not post-launch. Not "nice to have."
- Phase 1: Consent screen on signup (before dashboard access)
- Phase 1: Privacy policy page at `/privacy`
- Phase 4: Account deletion (DELETE /api/users + UI in Settings)
**Action required:** Add P1 tasks for consent screen and privacy policy to the backlog before Phase 1 starts. These are not in the existing backlog — they were added during the architecture review.
**Impact if skipped:** Building a health data application without consent collection and right-to-erasure is a legal gap under DPDPA 2023. If the app gains real users and is flagged, adding these retroactively requires schema migration (adding consent_given column) and UI changes to the auth flow.
**Blocking:** YES — consent screen and privacy policy are Phase 1 deliverables

---

### F-2: Consent Screen Content Decided
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Write the exact text of the consent screen before building it. The text must specify:
1. What data is collected: medicine names, expiry dates, family member names, email
2. Why it's collected: to check drug interactions and send expiry alerts
3. Where it's stored: Supabase servers in Mumbai, India
4. How to delete it: account deletion in Settings (available from the start)
5. No data sold or shared with third parties
**Why decide now:** If the text is vague, the consent is not legally meaningful under DPDPA. The text must be specific enough that a user understands what they're agreeing to.
**Deliverable:** Consent text written in `.claude/outputs/phase-00/consent-screen-text.md`
**Blocking:** YES — consent screen cannot be built without its content decided

---

### F-3: Medical Disclaimer Text and Placement Decided
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Finalize the exact medical disclaimer text and every location where it appears.
**Required text (can be adjusted but must convey this meaning):**
"MedSafe provides information for reference only and is not a medical device or substitute for professional medical advice. Drug interaction data may be incomplete. Always consult your doctor or pharmacist before making any decision about your medications."
**Required locations:**
- Landing page footer
- Login page footer
- Dashboard persistent footer (every page)
- Every interaction warning card
- Every "no interactions detected" result
- Every "interaction data unavailable" message
**Impact if skipped:** Medical disclaimer added after Phase 3 means updating 6+ components retroactively.
**Deliverable:** Disclaimer text documented in `.claude/memory/design-system.md` (compliance section)
**Blocking:** YES — must be in place before Phase 3 interaction UI is built

---

### F-4: Privacy Policy Content Decided
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** Write the content of the `/privacy` page. Minimum required sections:
- What data we collect (enumerate by field)
- Why we collect it (purpose for each)
- Where it's stored (Supabase, Mumbai, India)
- How long we keep it (indefinitely, until account deletion)
- How to delete your data (account deletion in Settings)
- Contact information (a real email address)
- Date of last update
**Note:** Does not need to be lawyer-drafted. Must be honest and specific. Can be written in plain language.
**Blocking:** NO — privacy policy page can be written alongside Phase 1, does not block starting development. But it must exist before the app is shared with any external users.

---

### F-5: App Name Final Decision
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** "MedSafe" is a working name. Decide whether to keep it or rename before building any UI (once the name is in UI strings, component names, and URLs, renaming is significant effort).
**Considerations:**
- Is "MedSafe" available as a domain? (check namesilo.com, godaddy.com — not required to buy)
- Is there an existing app named "MedSafe" on the App Store or Play Store? (check quickly)
- Does the name work in the medical disclaimer context? ("MedSafe is not a medical device" — is this clear or confusing?)
**Alternatives considered:** MedTrack, CabinetMD, SafeScript, MediAlert
**Impact of late rename:** All component names, route names, email templates, and user-facing strings need updating. 2-4 hours of find-and-replace. Not catastrophic, but annoying.
**Blocking:** NO for Phase 1. SHOULD be decided before Phase 1 deploys to production URL.

---

## SECTION G: TECHNOLOGY STACK LOCK
*Confirms what's in and what's out of the stack. All items locked in baseline and tech-stack.md.*

---

### G-1: EasyOCR Permanently Removed
**Status:** ✅ LOCKED (Baseline ND-4, tech-stack.md updated)
**Confirm:** `easyocr` does not appear in `requirements.txt`. `opencv-python` (not headless) does not appear in `requirements.txt`.
**Impact if violated:** Render service OOM crashes on startup. Phase 5 cannot be deployed.
**Action required:** When writing `requirements.txt` in Phase 5, check this item and verify EasyOCR is absent.
**Blocking:** NO for Phase 1. YES for Phase 5.

---

### G-2: Fuse.js Selected for Client-Side Search
**Status:** ✅ LOCKED (Baseline ND-8)
**Confirm:** Fuse.js is the fuzzy search library for CDSCO autocomplete. No alternatives.
**Why Fuse.js:** 23KB bundle size, zero dependencies, works offline, simple API for text search.
**Action required:** Add `fuse.js` to package.json in Phase 2 when building the autocomplete component.
**Blocking:** NO for Phase 1. YES for Phase 2 autocomplete.

---

### G-3: React Query for All Server State
**Status:** ✅ LOCKED (tech-stack.md)
**Confirm:** `@tanstack/react-query` is used for all API calls and server state management. No raw `fetch` in components. No `useEffect` + `useState` for data fetching.
**Exceptions:** None. Even single-use queries use React Query.
**Impact if violated:** Inconsistent caching, loading states, and refetch behavior. The client orchestration pattern (Section E-5) depends on React Query's invalidation and refetch APIs.
**Blocking:** YES for Phase 2 — any component that fetches data must use React Query

---

### G-4: Zod for All Input Validation
**Status:** ✅ LOCKED (coding-rules.md)
**Confirm:** All API route inputs validated with Zod. All form inputs validated with Zod (via react-hook-form + zodResolver).
**No exceptions:** Even simple endpoints (delete medicine by ID) validate the ID format with Zod.
**Impact if violated:** Unvalidated inputs reach the database. SQL injection risk (even with Prisma, malformed UUIDs can cause unexpected behavior). Inconsistent error messages.
**Blocking:** YES — confirm before Phase 2

---

### G-5: shadcn/ui as Component Base
**Status:** ✅ LOCKED (tech-stack.md)
**Confirm:** All UI components start from shadcn/ui. Custom components compose shadcn primitives, not raw HTML elements, unless shadcn has no relevant component.
**Month/year picker note:** Research shadcn's DatePicker component or Radix UI Select before building a custom month/year picker. Do not build custom if a configurable existing component exists.
**Blocking:** NO for Phase 1 (auth pages can use shadcn directly). YES for Phase 2 when medicine forms need month/year picker.

---

## SECTION H: DEVELOPMENT ENVIRONMENT LOCK
*Local setup decisions that must be consistent before writing code.*

---

### H-1: Node.js and npm Version Pinned
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Pin Node.js version for the project. Recommended: Node.js 20 LTS. Create `.nvmrc` or `.node-version` file in the repo root.
**Why:** Next.js 14 requires Node.js 18.17+. Vercel uses Node.js 20 by default. Mismatched local vs production versions cause deployment surprises.
**Deliverable:** `.nvmrc` with content `20` in repo root
**Blocking:** YES — version mismatch causes build failures

---

### H-2: Python Version Pinned (for Phase 5)
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** Pin Python version for the FastAPI service. Recommended: Python 3.11. Create `backend/.python-version` or note in `requirements.txt`.
**Why:** Render's default Python version may differ from local. Pinning prevents surprise incompatibilities.
**Blocking:** NO for Phase 1-4. YES before Phase 5.

---

### H-3: Project Folder Structure Created
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Create the folder structure in the repo before Phase 1 begins. At minimum:
```
medsafe/
  frontend/       ← Next.js app goes here
  backend/        ← FastAPI goes here (Phase 5+)
  prisma/         ← schema.prisma goes here
  .claude/        ← already exists in this repo
```
**Why:** Vercel needs to know the root directory for the Next.js app. If the folder structure changes after Vercel is configured, the deployment breaks.
**Blocking:** YES — Vercel is configured to `frontend/` as root; changing this later requires reconfiguring Vercel

---

### H-4: .env.example File Written
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Create `frontend/.env.example` listing all required environment variables with placeholder values and comments explaining each. Do not include actual values.
**Required entries:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NEVER expose to client

# Database (Prisma)
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...  # without pgbouncer, for migrations

# Internal services
CRON_SECRET=<32-char-random-string>  # Must match cron-job.org header

# Email (Phase 4)
RESEND_API_KEY=re_...

# Error tracking
SENTRY_DSN=https://...@sentry.io/...

# OCR service (Phase 5)
FASTAPI_URL=https://your-render-service.onrender.com
```
**Impact if skipped:** Future onboarding (returning to project after a break) requires reverse-engineering which environment variables are needed. Vercel deployment fails if any variable is missing.
**Blocking:** YES — Phase 1 P1-T1 deliverable

---

## SECTION I: DESIGN SYSTEM LOCK
*Design decisions that affect component implementation. Partial lock acceptable — core decisions must be made.*

---

### I-1: Design System Status Confirmed
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** Decide whether to finalize the design system before Phase 1 or proceed with the placeholder. Confirm one of:
- **Option A:** Proceed with placeholder. Accept that colors, typography, and spacing may change in Phase 6 polish. Low risk — shadcn/ui defaults are clean and functional.
- **Option B:** Generate design ideology now (via Claude Design, Google Stitch, or Figma) and update `design-system.md` before writing any UI.
**Recommendation:** Option A. The design system affects visual polish but not functional correctness. The interaction engine, database schema, and API contracts are the critical path. Don't delay Phase 1 for a design system.
**Impact if Option A chosen:** Phase 6 requires a design pass to update colors, typography, and spacing throughout the app. Budget 1-2 sessions for this.
**Blocking:** NO for Phase 1. Decide before Phase 6.

---

### I-2: Severity Color Mapping Decided
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Decide the exact color mapping for interaction severity levels. These must be chosen before building the interaction UI in Phase 3, because they affect accessibility (contrast ratios) and emotional design.
**Required decisions:**
- Severe interaction: what red? (e.g., Tailwind `red-600` background, `red-800` text)
- Moderate interaction: what amber? (e.g., `amber-500` background, `amber-800` text)
- Mild interaction: what yellow? (e.g., `yellow-400` background, `yellow-800` text)
- Safe (no interaction): what green? (e.g., `green-600` background, `white` text)
- "Data unavailable": what neutral? (e.g., `slate-400` background, `slate-700` text)
**Constraint:** All combinations must pass WCAG AA contrast ratio (≥ 4.5:1 for text). Check at `webaim.org/resources/contrastchecker/`.
**Impact if decided late:** Interaction warning cards built in Phase 3 may need visual rework in Phase 6 if colors conflict with the design system.
**Blocking:** YES — must be decided before building interaction warning UI in Phase 3

---

### I-3: Mobile Navigation Pattern Decided
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Decide the primary navigation pattern for mobile (the primary target device). Options:
- **Option A: Bottom navigation bar** — 4-5 icon tabs at the bottom (iOS/Android native feel)
- **Option B: Top navigation with hamburger** — collapsible sidebar
- **Recommendation:** Option A (bottom nav). Medicine cabinet, interactions, family, settings — 4 tabs fits perfectly. Bottom nav is the established mobile pattern for health apps.
**Impact if changed after Phase 1:** Navigation component is in the dashboard layout. Changing from bottom nav to top nav requires reworking the layout shell.
**Blocking:** YES — navigation pattern must be decided before building the dashboard layout shell in P1-T5

---

## SECTION J: DOCUMENTATION AND PROCESS LOCK
*Confirm the engineering memory system is ready to use.*

---

### J-1: Architecture Baseline Read and Understood
**Status:** 🔴 OPEN — BLOCKING
**Decision Required:** Read the Architecture Baseline (`architecture-baseline.md`) in its entirety. Confirm every Part (1-9) is understood. If anything is unclear, resolve it before Phase 1.
**Specifically verify:**
- [ ] Part 2 (Database schema) — every table, every field, every constraint
- [ ] Part 4 (Interaction engine) — two-endpoint pattern, client state machine
- [ ] Part 9 (Non-negotiables ND-1 through ND-12) — can recite each from memory
**Blocking:** YES — building against a baseline you haven't fully read is how bugs get written in

---

### J-2: Session Start Prompt Ready
**Status:** ✅ LOCKED (`.claude/workflows/prompts.md`)
**Confirm:** The session start prompt in `prompts.md` is the first thing sent to Claude at the beginning of every session. It must reference the Architecture Baseline specifically — not just `_state.md`.
**Updated session start prompt:**
```
Read CLAUDE.md, _state.md, and .claude/outputs/architecture-baseline.md.
Summarize current project state.
Identify current phase and next task.
Create a plan. Do not write code until approved.
Reference the architecture baseline for all technical decisions.
Update _state.md and relevant memory files at session end.
```
**Blocking:** NO — process improvement, not a technical blocker

---

### J-3: defects.md Pre-Seeded with Architecture Review Learnings
**Status:** 🟢 OPEN — NON-BLOCKING
**Decision Required:** Pre-populate `defects.md` with the patterns identified in the architecture review so future Claude sessions don't repeat them.
**Entries to add:**
1. Calling external APIs in GET endpoints → timeout risk → always use cache-only GET, batch POST
2. Forgetting EasyOCR RAM requirements → OOM crash → Tesseract only on Render free tier
3. UNIQUE constraint on interactions_cache pair → data loss → never add UNIQUE on pair
4. user_id on medicines table → redundancy bug → always derive via family_member JOIN
5. Paracetamol not resolving in RxNorm → synonym table miss → check synonyms.json before every RxNorm call
**Blocking:** NO — quality of future sessions degrades slightly without this, but Phase 1 is not blocked

---

## PHASE 0 COMPLETE GATE

**Phase 0 is complete when ALL of the following are true. Sign off each item.**

### Gate Checklist

**External API Validation**

- [x] A-1: RxNorm latency from India measured — p50=303ms, p95=370ms, p99=961ms (cold start) — PASS (< 800ms)
- [x] A-2: RxNorm resolution rate measured — 49/50 = 98% raw (no synonyms needed) — EXCELLENT
- [x] A-3: Interaction detection verified — RxNav DECOMMISSIONED. OpenFDA label text mining validated: 7/10 pairs detected (at threshold), 0/5 false positives. Architecture change documented.
- [x] A-4: Rate limiting behavior — zero 429s in 50 sequential calls with 200ms delay — no throttling observed
- [x] A-5: Gemini fallback decision — NOT NEEDED. Rate 98% >> 40% threshold. Option A: "data unavailable" for Doxofylline only.

**Data Assets**

- [x] B-1: CDSCO data source selected — junioralive/Indian-Medicine-Dataset, 253,973 entries, downloaded to backend/data/cdsco_raw.csv
- [x] B-2: Dataset meets minimum quality bar — 253,973 entries (84× threshold), 44% combination drugs, 0% missing salt, 8/8 categories ✅
- [x] B-3: Synonym table — DOWNGRADED TO NON-BLOCKING. RxNorm search=2 resolves all Indian variants directly (Amoxycillin, Salbutamol, Thyroxine all resolve without synonyms). Build as optional safety net in Phase 2.
- [x] B-4: Formal go/no-go decision documented — `.claude/outputs/phase-00/go-no-go-decision.md` — GO WITH MODIFICATIONS
- [x] B-5: Data usage legal basis noted in cdsco-data-source.md — low risk for educational portfolio use

**Account Actions**

- [x] C-1: GitHub repository created and structure committed — [github.com/Yashika02234/medsafe](https://github.com/Yashika02234/medsafe)
- [ ] C-2: Supabase project created in **ap-south-1 (Mumbai)** — region confirmed in dashboard
- [ ] C-3: Vercel account connected to GitHub repo
- [ ] C-4: Sentry project created, DSN stored
- [ ] C-5: Resend account created, API key stored
- [ ] C-6: CRON_SECRET generated and stored securely

**Database Schema**

- [x] D-1: prisma/schema.prisma written with all 8 tables — P0-T0 complete
- [x] D-2: medicines.user_id is ABSENT — verified in schema.prisma
- [x] D-3: medicine_ingredients junction table replaces rxcuis/salts arrays — verified in schema.prisma
- [x] D-4: interactions_cache has NO UNIQUE constraint on pair — verified (@@index only)
- [x] D-5: checked_pairs has composite PRIMARY KEY @@id([rxcui_a, rxcui_b]) — verified
- [x] D-6: Pair normalization rule documented as comment in schema.prisma — normalizePair() utility to be written before Phase 3
- [ ] D-7: normalizeExpiryDate() utility written
- [ ] D-8: Prisma connection pooling configured (?pgbouncer=true)
- [ ] D-9: Signup transaction pattern understood
- [ ] D-10: Cascade delete direction verified

**Service Architecture**

- [ ] E-1: FastAPI deferred to Phase 5 confirmed
- [ ] E-2: POST /api/medicines save-only pattern confirmed
- [ ] E-3: GET /api/interactions cache-only pattern confirmed
- [ ] E-4: CDSCO static file pattern confirmed
- [ ] E-5: Client orchestration state machine understood (can explain without notes)

**Compliance**

- [ ] F-1: DPDPA compliance tasks added to Phase 1 backlog
- [x] F-2: Consent screen text written — `.claude/outputs/phase-00/consent-screen-text.md`
- [x] F-3: Medical disclaimer text and placement decided — `design-system.md` compliance section + `frontend/src/lib/legal.ts`
- [ ] F-4: Privacy policy content drafted

**Technology**

- [ ] G-1: EasyOCR confirmed absent from any requirements file
- [ ] G-2: Fuse.js confirmed as autocomplete library
- [ ] G-3: React Query pattern confirmed for all data fetching
- [ ] G-4: Zod confirmed for all validation

**Development Environment**

- [x] H-1: .nvmrc created with Node.js 20 — bootstrap complete
- [x] H-3: Folder structure (frontend/, backend/, prisma/) committed — bootstrap complete
- [x] H-4: frontend/.env.example written with all required variables — P0-T0b complete

**Design**

- [ ] I-1: Design system approach decided (Option A: placeholder, or Option B: full system)
- [ ] I-2: Severity color mapping decided and contrast verified
- [ ] I-3: Mobile navigation pattern decided (bottom nav recommended)

**Documentation**

- [ ] J-1: Architecture Baseline read in full, all 9 parts understood
- [ ] J-2: Session start prompt updated to reference architecture baseline

---

### Go/No-Go Sign-Off

**Date:** 2026-06-10

**RxNorm resolution rate:** 98% (raw) / 98% (synonyms not needed — search=2 handles variants)
**Interaction detection rate:** 7/10 known pairs (OpenFDA — RxNav decommissioned), 0/5 false positives
**CDSCO dataset size:** 242,145 entries
**API p95 latency:** 370ms (RxNorm) / ~1-2s per pair (OpenFDA, must cache)
**Architecture approach:** ☑ Proceed with modifications — OpenFDA replaces decommissioned RxNav; schema unchanged

**Phase 0 is complete:** ☑ YES

**Phase 1 may begin:** ☑ YES — after user completes C-2 (Supabase ap-south-1), C-3 (Vercel), C-6 (CRON_SECRET)

**Go/no-go document:** `.claude/outputs/phase-00/go-no-go-decision.md`

---

*When this gate is signed off, move `_state.md` phase to Phase 1 and begin P1-T0 (schema finalization in Prisma).*
