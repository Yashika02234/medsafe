# Staff Engineer Architecture Review — MedSafe

> Reviewed by: Technical Architect
> Review date: Pre-Phase 1
> Status: BLOCKING — do not begin Phase 1 until decisions in Section 9 are resolved
> Tone: Skeptical. Every finding below represents real risk of wasted development effort.

---

## EXECUTIVE SUMMARY

The project is well-structured and the phased approach is sound. However, I identified **3 critical bugs** in the current design that will cause silent failures in production, **1 compliance gap** that could require a full data architecture rethink if discovered late, and **7 design decisions** that will force rework if not addressed before Phase 1 begins.

The good news: all of these are fixable now, cheaply. They become expensive only after code is written.

**Severity classification used in this review:**
- 🔴 **CRITICAL** — Will cause production failure or legal exposure. Blocks Phase 1.
- 🟠 **HIGH** — Will cause significant rework or bad user experience. Fix before building affected phase.
- 🟡 **MEDIUM** — Suboptimal design that should be corrected now.
- 🟢 **LOW** — Minor improvements worth noting.

---

## SECTION 1: CRITICAL BUGS IN THE CURRENT DESIGN

### 🔴 C1: Vercel Serverless Timeout Will Kill the Interaction Engine

**Where:** Phase 3 — Interaction Engine, specifically P3-T4 and P3-T5

**The Bug:**
The plan calls for serial RxNav API calls inside a Next.js API route (one call per drug pair). Vercel's free tier serverless functions have a **10-second execution timeout**. The plan describes RxNav latency from India at 200-500ms per call.

Do the math:
- User with 5 medicines = 10 unique pairs = 10 RxNav calls = 2-5 seconds ✅
- User with 7 medicines = 21 unique pairs = 21 RxNav calls = 4-10 seconds ⚠️
- User with 10 medicines = 45 unique pairs = 45 RxNav calls = 9-22 seconds 💀

At 10 medicines, the serverless function **times out**. The interaction check returns a 504 error silently. The user has no interactions shown. They assume they're safe. This is worse than showing an error — it's a false negative on a safety-critical feature.

**Why the caching doesn't save you:**
Caching only helps on the second load for already-seen pairs. On first use, every pair is uncached. A user adding their 10th medicine triggers a full re-check of all new pairs involving that medicine — up to 9 new uncached pairs.

**The root cause:**
The architecture conflates two different things: the "check is expensive the first time" (network-bound) and "check is cheap after caching" (DB-bound). The current design puts the expensive first-time check in a synchronous request-response cycle that has a hard timeout.

**Required fix:**
The interaction check must be decoupled from the request-response cycle. Options:

*Option A (Recommended for student project):*
On medicine add/edit → immediately return success response → kick off background resolution via a separate client-side triggered fetch after the UI updates. The interaction check becomes a fire-and-forget from the client. The user sees a "checking interactions..." state for a few seconds. This is acceptable UX.

*Option B (More robust):*
Move interaction checking to the FastAPI service (not Next.js API routes). FastAPI on Render has no timeout — it can run for minutes. The Next.js route delegates: "hey FastAPI, check interactions for this family member and update the DB when done." The client polls `/api/interactions` every few seconds until results appear.

*Option C (Simplest but limited):*
Use Vercel's `maxDuration` config (Pro feature) to extend timeout to 300s. Not free.

**Decision needed before Phase 3 begins:** Choose Option A or B.

---

### 🔴 C2: EasyOCR Will Crash Render Free Tier Immediately

**Where:** Phase 5 — OCR Scanner, P5-T1 and P5-T3

**The Bug:**
The requirements list includes: `easyocr` in `requirements.txt`. EasyOCR works by downloading a PyTorch model (CRAFT text detection + recognition models) that totals approximately **1.5-2GB of RAM** when loaded.

Render's free tier provides **512MB of RAM**.

EasyOCR will either:
a. Fail to load entirely (OOM error on startup), crashing the entire FastAPI service
b. Load but crash on first inference request

This isn't a performance concern — it's a hard failure. The service will not work at all.

Additionally, `opencv-python` (not `opencv-python-headless`) has GUI dependencies that don't exist on Render's Linux environment. Must use `opencv-python-headless`.

**Required fix:**
Remove EasyOCR from the stack entirely. It was listed as a "fallback" for low-confidence Tesseract results, but that fallback is not viable on free hosting. The Tesseract + preprocessing pipeline alone is the OCR strategy.

The low-confidence fallback can instead be: show the result to the user with a visual confidence indicator and let them correct it. Human correction is more reliable than EasyOCR on challenging medicine strips anyway.

Update `tech-stack.md` to remove EasyOCR and document why.

---

### 🔴 C3: Database Schema Has a Data-Loss Bug

**Where:** Phase 1 — Prisma Schema, specifically the `interactions_cache` table

**The Bug:**
The schema defines:
```sql
interactions_cache (
  rxcui_a TEXT,
  rxcui_b TEXT,
  severity TEXT,
  description TEXT,
  UNIQUE(rxcui_a, rxcui_b)
)
```

The `UNIQUE(rxcui_a, rxcui_b)` constraint assumes one row per drug pair. But RxNav returns **multiple interactions per drug pair**. A single pair can have 2-4 distinct interaction descriptions, each with potentially different severity levels.

Example: Warfarin + Aspirin can trigger warnings about:
1. Increased bleeding risk (severe)
2. GI bleeding specifically (moderate)
3. CYP450 enzyme interaction (moderate)

With the current schema, only the first insert succeeds. Subsequent inserts for the same pair silently fail or throw a constraint violation. You lose 2-3 interactions per pair. In a worst case, you lose the most severe interaction and only store a mild one.

**Required fix:**
Remove the UNIQUE constraint on the pair. Add a composite primary key instead:
```sql
interactions_cache (
  id UUID PRIMARY KEY,
  rxcui_a TEXT NOT NULL,
  rxcui_b TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT,
  cached_at TIMESTAMPTZ,
  -- No UNIQUE constraint on the pair
  -- Instead, index for fast lookup:
  INDEX idx_interactions_pair (rxcui_a, rxcui_b)
)
```

The interaction check logic must change accordingly: "for this pair, are there any rows in cache?" If yes → serve all of them. If no rows → call RxNav → insert all returned interactions → return them.

Also add a `checked_at` column to represent when the pair was last checked (separate from per-interaction row), or add a separate `checked_pairs` table as a negative cache (explained in Section 2).

---

## SECTION 2: HIGH-SEVERITY DESIGN ISSUES

### 🟠 H1: No Fallback Plan If Phase 0 Go/No-Go = NO-GO

**The Problem:**
The Phase 0 go/no-go decision is treated as binary: if the drug resolution chain works, proceed. If it doesn't, the plan ends. There is no documented fallback architecture.

In reality, the resolution rate may come back at 50-60% for common Indian medicines. That's not a clean GO or NO-GO — it's a "proceed with degraded functionality" situation that requires a conscious decision about what to do for the 40-50% of unresolvable medicines.

**Three scenarios Phase 0 may reveal:**

*Scenario A: Resolution rate 70%+ (best case)*
Proceed as planned. Unresolvable medicines show disclaimer.

*Scenario B: Resolution rate 40-69% (likely)*
RxNorm knows Indian generic names but misses many. This is fixable with a larger synonym table — invest time in extending the synonym mapping rather than treating it as a failure.

*Scenario C: Resolution rate <40% (worst case)*
The RxNorm bridge is fundamentally broken for Indian medicines. In this case:

**Fallback Option — Gemini API for Interaction Lookup:**
Gemini Flash is free and has knowledge of drug interactions. Prompt: "List all clinically significant drug interactions between [Drug A] and [Drug B]. Format: severity (severe/moderate/mild), description. If none, say NONE. Only respond if you are confident."

Pros: Knows Indian brand names directly (no CDSCO bridge needed), free, handles combination drugs naturally.
Cons: Non-deterministic, hallucination risk on a safety-critical feature.

If using Gemini: the interaction display MUST include stronger disclaimers ("AI-generated — verify with your doctor") and filtering (only show if Gemini is confident). This is viable for a portfolio project but would not be acceptable in a real medical product.

**Required action before Phase 1:** Document all three scenarios and their responses in `master-roadmap.md`. Phase 0 must produce a decision, not just a number.

---

### 🟠 H2: Combination Drugs Not Handled — Affects Core Feature Correctness

**The Problem:**
India's most commonly consumed medicines are combination drugs:
- Combiflam = Ibuprofen + Paracetamol
- Dolo-650 = Paracetamol (single salt, fine)
- Augmentin = Amoxicillin + Clavulanic Acid
- Caldikind = Calcium + Vitamin D3
- Telma-H = Telmisartan + Hydrochlorothiazide
- Metformin SR-500 + Glimepiride combinations (diabetics — highest-risk group)

The current architecture resolves one drug → one rxcui. But a combination drug has multiple active ingredients, each of which should independently be checked for interactions.

If a user takes Combiflam + Warfarin:
- Combiflam's Ibuprofen interacts with Warfarin (severe — increased bleeding risk)
- The current engine would look up "Combiflam" → get one rxcui (if it resolves at all) → check that single rxcui → likely miss the Ibuprofen-Warfarin interaction

This is a correctness bug in the core safety feature. Combination drugs are especially common in the patient population most at risk (elderly, diabetics, hypertensives).

**Required fix:**
When a medicine has multiple salts (e.g., `salts: ["Ibuprofen", "Paracetamol"]`), the resolution service must:
1. Resolve EACH salt to its own rxcui
2. Store ALL rxcuis on the medicine record (need a `rxcuis TEXT[]` array column or separate table)
3. Interaction engine checks: for each salt in Medicine A × each salt in Medicine B

The schema change: `medicines.rxcui TEXT` → `medicines.rxcuis TEXT[]` (PostgreSQL array). Alternatively, a `medicine_salts` junction table.

This is a schema change that must be made in Phase 1 (Prisma schema), not retrofitted in Phase 3.

---

### 🟠 H3: DPDPA 2023 Compliance Gap — India's New Data Protection Law

**The Problem:**
The plan has no mention of India's **Digital Personal Data Protection Act 2023 (DPDPA)**. This act was passed and is being phased into enforcement. Medicine cabinet data (what medicines you take, what conditions you may have) is sensitive health data that triggers specific obligations.

Key requirements that affect this project:

**1. Explicit Consent**
You must obtain explicit, informed consent before collecting health data. A checkbox on signup saying "I agree to terms" is not sufficient — consent must specify what data is collected and why. This means a consent screen, not just a privacy policy link.

**2. Data Minimization**
You may only collect what is necessary. The plan collects dosage schedules, family member relationships, and medication history — document the legitimate purpose for each field.

**3. Right to Erasure**
Users must be able to delete all their data. The plan has no "delete account" feature. Cascading deletes in the schema exist, but there is no user-facing flow to exercise this right.

**4. Data Localization Consideration**
Supabase defaults to US-region hosting. Health data for Indian users may face localization requirements (regulations are still evolving on this). Supabase supports `ap-south-1` (Mumbai). Consider using it.

**5. Breach Notification**
If a security breach affects health data, there are notification requirements.

**This is not theoretical — it affects Phase 1 directly.** You need:
- A consent screen on signup (simple, but needs to be designed)
- A "delete my account" endpoint and UI
- Privacy policy page
- Supabase region selection (Mumbai vs default)

None of these require significant engineering effort if built from the start. They require significant rework if added later.

---

### 🟠 H4: Expiry Date Storage Will Cause Early "Expired" Flags

**The Problem:**
The `medicines` table stores `expiry_date DATE`. Indian medicine strips print expiry as `MM/YYYY` — they expire at the END of the stated month, not the beginning.

If Crocin says "EXP 06/2025" and you store `2025-06-01`:
- On June 1, the medicine is flagged as "Expired"
- In reality it's usable for the entire month of June
- A user throws away a perfectly usable medicine

If you store `2025-06-30`:
- Correct behavior — medicine is valid until end of June

The schema must store the last day of the stated month. The OCR parser and manual form must both normalize MM/YYYY to the last day of that month.

This affects the Prisma schema, the form validation, the OCR parser, and the expiry badge logic. If discovered after Phase 3 is built, it touches 5 places. Fix the schema in Phase 1 and document the normalization rule.

**Required fix:**
Keep `expiry_date DATE`, but in `src/lib/utils/expiry.ts`, add: `normalizeExpiryDate(month: number, year: number) → last day of that month`. Use this function everywhere expiry dates are handled.

---

### 🟠 H5: No Negative Caching for "No Interaction" Results

**The Problem:**
The interaction engine checks a pair → if not in `interactions_cache` → calls RxNav → if interaction found, inserts into cache.

But: what happens when RxNav says "no interaction"? Nothing is inserted into the cache. On the next page load, the engine checks the same pair again → not in cache → calls RxNav again → "no interaction" again → nothing cached → repeat forever.

For a user with 10 medicines where 40 out of 45 pairs have no interaction, the engine makes 40 live RxNav calls on every page load (after initial caching of the 5 that do have interactions). The cache is only partially effective.

**Required fix:**
Add a `checked_pairs` table:
```sql
checked_pairs (
  rxcui_a TEXT NOT NULL,
  rxcui_b TEXT NOT NULL,
  last_checked TIMESTAMPTZ,
  has_interactions BOOLEAN,
  PRIMARY KEY (rxcui_a, rxcui_b)
)
```

Before calling RxNav: check `checked_pairs`. If found → serve from `interactions_cache` (all rows for this pair) without an API call, even if the result set is empty. If not found → call RxNav → insert result into `interactions_cache` (0 or more rows) → insert into `checked_pairs` with `has_interactions = (result.length > 0)`.

This also enables a background refresh: pairs with `last_checked` older than 30 days could be rechecked (interactions occasionally get added to the database). Not required for MVP, but the schema supports it.

---

### 🟠 H6: CDSCO Dataset Coverage is Deeply Insufficient at 500 Entries

**The Problem:**
The plan targets 500+ entries in the CDSCO dataset. India has approximately 60,000+ marketed drug brands. The top 500 covers roughly the top 1% of medicines. A user with any non-common medicine will hit "data unavailable."

More critically: the plan says the acceptance criteria for P0-T2 is "500+ entries." This creates a false sense that 500 is adequate. It isn't — it's a starting point.

**What 500 entries actually covers:**
- The top ~15-20 most prescribed therapeutic categories
- Roughly 70% of the medicines a typical household might have

**What it misses:**
- Specialty medicines (oncology, rare conditions)
- Regional brands
- Recent generics
- Any medicine outside the top-tier brands

**Realistic strategy:**
The CDSCO website has approximately 70,000+ records. The public-facing search pages are scrapeable. The realistic target for a well-built dataset should be **5,000-10,000 entries** covering the top medicines by prescription volume. This takes more time to build but dramatically improves the product's usefulness.

Also: search GitHub before scraping. Several repositories have partially-built Indian pharmaceutical datasets. Some may already have 3,000-5,000 entries and save multiple sessions of work.

**Revised acceptance criteria for P0-T2:** 3,000+ entries minimum. Document coverage by therapeutic category.

---

### 🟠 H7: "Auto-Resolve on Add" Architecture Will Create User-Visible Hangs

**The Problem:**
P3-T5 says: after medicine add → trigger resolution → trigger interaction check, but "don't block the response."

The phrase "don't block the response" is vague. In a serverless Next.js API route, there is no background thread. Once you `return NextResponse.json(medicine)`, the function execution context starts shutting down. Any async work started but not awaited may not complete.

Vercel has documented this: "Work that is not awaited will not complete reliably in serverless functions."

If you await the resolution before returning: user waits 1-5 seconds for a medicine to be "added." That's terrible UX.
If you don't await it: resolution may not complete in serverless context.

**Required fix:**
The add-medicine endpoint does exactly one thing: save the medicine and return. The resolution and interaction check are triggered CLIENT-SIDE, as separate API calls, after the save completes. Sequence:

1. Client calls `POST /api/medicines` → medicine saved → response: `{ id: "xyz" }`
2. Client shows medicine in list (optimistic UI or after invalidating cache)
3. Client immediately calls `POST /api/drugs/resolve?medicine_id=xyz` (separate request)
4. After resolution completes, client calls `GET /api/interactions?family_member_id=X`
5. UI shows "checking interactions..." until step 4 completes

This is standard pattern for non-blocking UI updates and works perfectly in Next.js + React Query. The medicine appears instantly. Interaction results populate a few seconds later. Clear, honest UX.

---

## SECTION 3: MEDIUM-SEVERITY ISSUES

### 🟡 M1: Autocomplete Architecture Is Wrong for Serverless

**The Problem:**
The plan says: CDSCO JSON loaded into memory on server, searched per API call, cached in module scope. In a serverless function, "module scope" caching is unreliable — each new function instance starts cold, without the cache warm. Under load, you'll have dozens of function instances each loading the 5MB+ JSON independently.

**Better approach:** Serve `cdsco_brands.json` as a static file from `/public/data/`. The browser downloads it once (cached by browser for subsequent visits). Add `Fuse.js` (lightweight, 23KB) for client-side fuzzy search. This removes the API call entirely, works offline, and is faster.

**Implementation:** Add task P2-T2 revision: serve CDSCO as static asset, implement client-side Fuse.js search.

---

### 🟡 M2: Prisma on Vercel Requires Explicit Connection Pool Config

**The Problem:**
Supabase uses PgBouncer for connection pooling. Prisma requires specific connection string parameters to work with PgBouncer: `?pgbouncer=true&connection_limit=1`. Without these, you'll see "too many connections" errors in production — especially under load or after Vercel spins up multiple function instances.

This is a well-known Supabase + Prisma gotcha. It's not complex, but if not set up in Phase 1, you'll hit mysterious connection errors in Phase 2 and spend half a session debugging it.

**Required action:** Add to P1-T2 subtasks: configure `DATABASE_URL` with `?pgbouncer=true&connection_limit=1` suffix. Add `DIRECT_URL` without pooling (used for migrations only). Document both in `.env.example`.

---

### 🟡 M3: medicines.user_id Is Redundant and Creates Data Integrity Risk

**The Problem:**
The schema has `user_id` on both `medicines` AND derivable via `medicines.family_member_id → family_members.user_id`. This redundancy means two sources of truth. If a bug ever creates a medicine where `medicine.user_id ≠ medicine.family_member.user_id`, the data is silently inconsistent.

**Recommendation:** Remove `user_id` from `medicines`. All queries that need the user can JOIN through `family_members`. RLS policies should filter by `family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())`. This is a one-line SQL change but requires updating RLS policies and Prisma queries.

**Make this decision in Phase 1 schema design.** Changing it after Phase 2 CRUD is built means rewriting all queries.

---

### 🟡 M4: No Error Monitoring Plan

**The Problem:**
There is no plan for knowing when things break in production. Vercel's built-in logging shows recent errors but doesn't alert you, doesn't aggregate patterns, and doesn't show you what a user experienced when something failed.

Without monitoring, you'll find out about production bugs when a user tells you — or never.

**Free solution:** Sentry has a generous free tier (5,000 errors/month, 14-day retention). Integration is one `npm install` and 3 lines of config. It catches runtime errors, shows stack traces, groups repeated errors, and emails you on new issues.

**Add to Phase 1:** One subtask in P1-T7: initialize Sentry, verify it catches a test error. 30 minutes of work that pays dividends for the entire project.

---

### 🟡 M5: Cron Job Will Time Out as User Base Grows

**The Problem:**
The cron endpoint queries ALL medicines across ALL users, sends emails via Resend, and logs each notification — in a single synchronous serverless function. With 50 users averaging 5 medicines each, Resend calls (sequential, 200ms each) = 250 × 200ms = 50 seconds. Vercel timeout = 10 seconds. Silent failure.

Even earlier: with 30 users and 5 medicines each: 75 emails × 200ms = 15 seconds. Already broken.

**Required fix:**
Use Vercel's native cron + streaming, or redesign:

*Option A:* Vercel supports `vercel.json` cron jobs with up to 60 seconds on Pro (not free). Not viable.

*Option B:* cron-job.org triggers the endpoint → endpoint queries medicines expiring soon → for each user, enqueues a separate Resend call. Use `Promise.allSettled()` with batching (10 concurrent): `~250 emails / 10 concurrent = 25 batches × 200ms = 5 seconds`. Within 10s limit at current scale.

*Option C:* Split cron into per-user sub-jobs. cron-job.org calls `/api/cron/check-expiry` daily → endpoint immediately returns 200 → spawns individual `/api/cron/notify/{userId}` calls for each user. These can run in parallel without blocking each other.

**Option B is the simplest change.** Replace sequential Resend calls with batched parallel calls (max 10 concurrent). Handles 50+ users comfortably within the 10s limit.

**Add to P4-T1:** use `Promise.allSettled()` with batch size 10 for Resend calls, not sequential.

---

### 🟡 M6: Signup Must Be Transactional

**The Problem:**
Signup flow: Supabase creates auth user → Prisma creates `users` record → Prisma creates `family_members` (self) record. Three separate operations. If step 2 succeeds but step 3 fails (network blip, Prisma error), the user can log in but has no "self" family member, and the entire medicine cabinet is broken for that user.

**Required fix:** Wrap the `users` record creation and `family_members` record creation in a Prisma transaction:
```
prisma.$transaction([
  prisma.users.create(...),
  prisma.family_members.create(...)
])
```
If either fails, both roll back. Auth user may still exist in Supabase, but on next login, the API can detect missing user record and re-create it.

**Add to P1-T3:** Prisma transaction for user + family member creation.

---

### 🟡 M7: No Rate Limiting on API Routes

**The Problem:**
Any authenticated user can call `/api/drugs/resolve` and `/api/interactions` in a tight loop, burning your RxNorm/RxNav rate limits and your Vercel function invocation budget. While RxNorm says it has "no hard limit," aggressive use from a single IP will likely trigger throttling or a ban.

**Minimum viable rate limiting:** Add `src/middleware.ts` rate limit check for `/api/drugs/resolve` and `/api/interactions`: max 30 calls per user per minute. Implement with a simple in-memory Map (not reliable across serverless instances, but good enough as a basic guard). Or use Vercel's built-in rate limiting configuration.

---

## SECTION 4: INCORRECT ASSUMPTIONS

### A1: "RxNorm has no hard rate limit" — Unverified

The plan states RxNorm has no hard limit. This is documented nowhere officially. The NIH API documentation says "be reasonable." Anecdotally, sustained high-volume use has triggered temporary blocks. For MVP with <50 users, this is probably fine. But don't treat it as guaranteed.

### A2: "CDSCO scraping is straightforward"

CDSCO's website changes structure periodically. Scraping may require significant CSS selector updates. More importantly, check whether CDSCO data is available via a cleaner path first: `data.gov.in` (Government of India open data portal) publishes various datasets. Some pharmaceutical datasets may be available there with proper open licensing.

### A3: "Render free tier handles Tesseract fine"

Tesseract itself is fine (it's a C library, low memory). The Python bindings (`pytesseract`) add some overhead but are manageable. `opencv-python-headless` is fine. What's NOT fine: model loading times. Tesseract's first inference after a cold start takes 2-3 seconds to load language data. Combined with preprocessing and Render's general cold start, first OCR request may take 45-90 seconds. This is very unpleasant for users. The keep-alive strategy (ping every 14 minutes) is correct but needs to be in place from day one of Phase 5 deployment.

### A4: "Interaction data from RxNav is authoritative"

RxNav's interaction data comes from multiple sources (DrugBank, NDF-RT, ONCHigh). The quality is variable. Some documented interactions are very minor or theoretical. Some well-known Indian-specific interactions may not appear. The plan correctly shows disclaimers, but the team should understand: RxNav interactions are a starting point, not ground truth. The "consult your doctor" messaging isn't just legal cover — it's genuinely necessary because the data has real gaps.

### A5: "500 CDSCO entries is adequate for MVP"

Already covered in H6. 500 is not adequate. Reframe this: the MVP needs enough coverage that the first 10 real users don't all immediately hit "data unavailable." That requires ~3,000 entries covering the most-prescribed medicines.

---

## SECTION 5: MISSING REQUIREMENTS

### MR1: Account Deletion Flow

Required by DPDPA (right to erasure). Also required by basic product ethics — if a user wants to leave, they should be able to delete all their data. Not currently in any phase.

**Add to Phase 1:** `DELETE /api/users` endpoint (deletes all medicines, family members, notification logs, and user record). `DELETE /api/users` button on Settings page (with "this is permanent" confirmation). Supabase Auth user deletion. Schedule for Phase 4 (Settings page exists then).

### MR2: Consent Screen on Signup

Required by DPDPA. Collecting health data (medicine names, dosages, family medical history) requires explicit consent. Must be separate from "I agree to terms."

**Add to Phase 1 auth flow:** After account creation, show a one-time consent screen explaining: what data is collected (medicine names, expiry dates, family member info), why (to check interactions and send expiry alerts), and how to delete it (account deletion). User must explicitly click "I understand and consent" before reaching dashboard.

### MR3: Privacy Policy Page

Required by DPDPA and any reasonable product standard. Does not need to be lawyer-drafted for a student project, but must exist.

**Add to Phase 1:** Simple privacy policy page at `/privacy` linked from signup and footer.

### MR4: "Incomplete Resolution" User Communication

When a medicine is added and drug resolution fails (null rxcui), the user currently sees a generic "data unavailable" message. But there's no way for a user to manually provide the salt/generic name to help the system.

**Missing feature:** On the "unresolvable" medicine card, show: "We couldn't find drug data for this medicine. Do you know the generic name? [Input field]" — this lets the user manually provide the salt, which gets stored and potentially improves future resolution attempts.

**Add to Phase 3** as a follow-up task after P3-T7.

### MR5: No "Last Checked" Indicator for Interactions

Users need to know when the interaction check was last run. If a user adds a medicine and immediately looks at interactions, they may see stale results (check hasn't run yet for the new medicine). Without a timestamp, this looks like a bug.

**Add to Phase 3:** Display "Interactions last checked: [X seconds/minutes ago]" or "Checking..." indicator.

---

## SECTION 6: FEATURES TO DELAY

### D1: Month/Year Picker — Delay Implementation, Not Feature

The plan builds a custom month/year picker. Don't. shadcn/ui's DatePicker with a `month-year-only` restriction is either built-in or achievable with configuration. Spending time on a custom picker is waste. Research existing solutions before building. This is a 10-minute research task that may save 2 hours.

### D2: Notification History View — Push to Post-Launch

P4-T3 lists "notification history view (optional)." Make this explicit: do not build this. It's optional, low-value, and adds a page that users will check once and never revisit. The notification_log table exists for deduplication — it doesn't need a UI in MVP.

### D3: "Show All Interactions" Toggle (Mild Severity) — Remove from MVP

The master roadmap mentions filtering to show only moderate/severe by default with a "show all" toggle. This toggle adds complexity for questionable value. For MVP: show ALL detected interactions, but order by severity (severe first). The "show mild by default" decision can be made in Phase 6 polish based on actual user feedback.

### D4: Dashboard Redesign in Phase 6 — Simplify

The Phase 6 dashboard redesign is ambitious: per-member breakdowns, aggregate stats, "most urgent" widget, quick action buttons. For Phase 6, which is already the most time-pressured phase, limit dashboard changes to: add family member switcher + update summary numbers to reflect selected member. Full redesign is post-launch scope.

---

## SECTION 7: AREAS THAT WILL CAUSE REWORK

### R1: medicines Schema (combination drugs, user_id redundancy, expiry date) — Rework at Phase 3 if not fixed now

If `rxcui TEXT` is not changed to `rxcuis TEXT[]` before Phase 2 is built, Phase 3 will require a migration plus rewriting all medicine queries.

### R2: interactions_cache Schema (UNIQUE constraint bug) — Rework at Phase 3 if not fixed now

If the schema is deployed with the UNIQUE constraint bug, Phase 3 will produce silently incomplete interaction data, discovered only after testing.

### R3: Autocomplete Architecture — Rework at Phase 2 if not fixed now

If the server-side JSON-loading approach is built, it will work locally but show inconsistent behavior in production (some cold invocations miss the cache). The client-side Fuse.js approach is also simpler to implement. Fix the design before Phase 2 begins.

### R4: Consent + Deletion — DPDPA Rework if Discovered Late

If compliance is discovered in Phase 5 or 6, adding a consent flow requires modifying the signup page, adding a consent flag to the `users` table (migration), and auditing all data collection points. Much cheaper to design into Phase 1.

---

## SECTION 8: COMPLIANCE, PRIVACY & HEALTHCARE CONCERNS

### Legal: DPDPA 2023

Covered in detail in H3. Summary: consent screen, erasure right, privacy policy, consider Mumbai Supabase region.

### Medical Liability

The plan correctly uses "consult your doctor" disclaimers. Two additions needed:

1. **Disclaimer on "no interactions found"**: Currently implied but not explicitly required in the UI. It must be explicit: "No interactions detected with your current medicines. This is based on available data and does not mean all combinations are safe. Always consult your doctor."

2. **App category disclosure**: The app should display "This app is for informational purposes only and is not a medical device or substitute for professional medical advice" on the landing page, login page, and a persistent footer within the dashboard.

### Data Minimization

Review every collected field against DPDPA's minimization principle:
- `quantity` — nice-to-have, not needed for interactions or expiry. Consider removing.
- `dosage_schedule` — useful for family management but not for core features. Consider making optional and not required.
- `family_member.relationship` — useful for doctor export PDF but not core. Keep, but document purpose.

---

## SECTION 9: CRITICAL DECISIONS BEFORE PHASE 1

These must be decided before writing the first line of application code. They affect the Prisma schema, which is expensive to change later.

### Decision 1: How to handle combination drugs?
**Options:**
- A: `medicines.rxcuis TEXT[]` (PostgreSQL array) — simple, no new tables
- B: `medicine_salts` junction table — more normalized, more complex
- **Recommendation: Option A.** Simpler, adequate for MVP. If needed, migrate to B later.
- **Action:** Update Prisma schema before P1-T2.

### Decision 2: Remove medicines.user_id redundancy?
**Options:**
- A: Remove user_id from medicines, derive from family_member
- B: Keep both, add CHECK constraint ensuring consistency
- **Recommendation: Option A.** Simpler schema, no data integrity risk.
- **Action:** Update Prisma schema and RLS policies before P1-T2.

### Decision 3: Interaction engine timeout strategy?
**Options:**
- A: Client-side fire-and-forget (separate POST /api/drugs/resolve after save)
- B: Delegate resolution + check to FastAPI (FastAPI has no timeout)
- **Recommendation: Option A for MVP.** Option B is better architecture but requires FastAPI earlier (Phase 3 instead of Phase 5). For a student project optimizing for shipping, Option A is adequate.
- **Action:** Update P3-T5 to describe client-side orchestration pattern before Phase 3 begins.

### Decision 4: Gemini fallback for unresolvable drugs?
**Options:**
- A: No fallback — show "data unavailable" for all unresolvable drugs
- B: Use Gemini Flash as fallback with explicit "AI-generated, lower confidence" disclaimer
- **Recommendation: Decide after Phase 0 results.** If resolution rate is 70%+, Option A is fine. Below 60%, consider Option B.
- **Action:** Add to Phase 0 go/no-go decision framework.

### Decision 5: DPDPA compliance scope?
**Options:**
- A: Full compliance (consent screen, deletion, privacy policy, Mumbai region)
- B: Minimal (just deletion endpoint + basic privacy policy)
- **Recommendation: Option A.** It's a student project but it has real users. Option A adds ~3-4 hours of total work and removes legal risk entirely.
- **Action:** Add P1 tasks for consent screen, privacy policy page, account deletion endpoint.

---

## SECTION 10: RECOMMENDED CHANGES SUMMARY

### Schema Changes (Must be in Phase 1 Prisma schema)

| Change | Reason | Impact |
|--------|--------|--------|
| `medicines.rxcui TEXT` → `rxcuis TEXT[]` | Combination drug support | Affects all medicine queries |
| Remove `medicines.user_id` | Redundancy + data integrity | Affects RLS + queries |
| Remove `UNIQUE(rxcui_a, rxcui_b)` from interactions_cache | Data loss bug | Affects all interaction storage |
| Add `checked_pairs` table | Negative caching | Interaction engine performance |
| Add `medicines.expiry_date` normalization note | Last-day-of-month correctness | Form + OCR parser |
| Add `users.consent_given BOOLEAN` | DPDPA compliance | Auth flow |

### Architecture Changes

| Change | Reason | When |
|--------|--------|------|
| Remove EasyOCR from stack | OOM crash on Render 512MB | Before Phase 5 starts |
| Client-side fire-and-forget for resolution | Serverless timeout prevention | Before Phase 3 starts |
| Serve CDSCO as static JSON + client Fuse.js | Serverless caching unreliability | Before Phase 2 starts |
| Batched parallel Resend calls (max 10) | Cron timeout prevention | Before Phase 4 starts |

### New Tasks to Add to Backlog

| Task | Phase | Effort |
|------|-------|--------|
| Add consent screen to signup | Phase 1 | 1 session |
| Add privacy policy page | Phase 1 | 0.5 session |
| Add Sentry error monitoring | Phase 1 | 0.5 session |
| Add connection pool config to Prisma | Phase 1 | 0.25 session |
| Add Prisma transaction to signup | Phase 1 | 0.5 session |
| Add account deletion endpoint + UI | Phase 4 | 1 session |
| Add "manual salt input" for unresolvable drugs | Phase 3 | 0.5 session |
| Add "interactions last checked" timestamp | Phase 3 | 0.5 session |
| Extend CDSCO target to 3,000+ entries | Phase 0 | Revise acceptance criteria |
| Document all three go/no-go scenarios | Phase 0 | 1 session |

### Updated MVP Scope

The MVP definition does not change: manually add medicines, see expiry, check interactions. But two things change:

1. **MVP now includes** a consent screen and privacy policy page (non-negotiable, legal requirement).
2. **MVP now explicitly excludes** account deletion (added to Phase 4 alongside other settings).

---

## SECTION 11: FINAL RISK MATRIX

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Interaction engine timeouts (10+ medicines) | HIGH | HIGH — silent safety failure | Client-side fire-and-forget pattern |
| EasyOCR crashes Render | CERTAIN | HIGH — Phase 5 blocked entirely | Remove from stack now |
| interactions_cache loses data | HIGH | HIGH — incomplete interaction results | Fix schema before Phase 1 |
| RxNorm resolution rate <50% | MEDIUM | HIGH — core feature unreliable | Prepare Gemini fallback strategy |
| DPDPA compliance gap | MEDIUM | HIGH — legal exposure | Consent + deletion in Phase 1 |
| Combination drug interactions missed | HIGH | MEDIUM — incorrect safety data | Array-based rxcuis schema |
| Cron timeout at 30+ users | HIGH | MEDIUM — missed notifications | Parallel batch sending |
| Expiry date off by month | HIGH | MEDIUM — user confusion | Normalize to last-of-month |
| Autocomplete cold cache | MEDIUM | LOW | Static JSON + Fuse.js |
| Negative cache missing | HIGH | LOW-MEDIUM — redundant API calls | checked_pairs table |

---

## FINAL VERDICT

This project is buildable and has genuine resume value. The architecture is sound in its overall shape. The issues found are fixable without changing the core vision.

**Before starting Phase 1, do these things in this order:**

1. Update the Prisma schema with all schema changes in this review
2. Remove EasyOCR from tech-stack.md
3. Update Phase 0 with 3,000+ entry target and three-scenario go/no-go framework
4. Add consent/privacy/deletion tasks to Phase 1
5. Update Phase 3 interaction engine design to use client-side fire-and-forget
6. Update Phase 4 cron to use parallel batch sending
7. Update Phase 5 to remove EasyOCR references

**Everything else in this review is important but can be addressed as you encounter it.** The seven items above are the ones that, if not addressed now, will cause you to throw away already-written code.
