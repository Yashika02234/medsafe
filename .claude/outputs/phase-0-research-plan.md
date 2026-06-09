# Phase 0 Research Execution Plan — MedSafe

> Role: Senior Technical Researcher
> Objective: Validate every critical assumption before Phase 1 begins.
> This plan is executable. Each section tells you exactly what to do, what to measure, what the result means, and what to build next.
>
> Research must precede implementation. Architecture decisions made without evidence are guesses that become technical debt.

---

## RESEARCH PRINCIPLES

**Principle 1: Measure, don't assume.**
Every number in the architecture (15 pairs per batch, 10-second timeout, 70% resolution target) was derived from assumptions. This plan replaces assumptions with measurements.

**Principle 2: Fail fast on blockers.**
The CDSCO data source and RxNorm resolution rate are the highest-risk unknowns. They must be investigated first, not last. If they fail, everything else is moot.

**Principle 3: Evidence must be reproducible.**
Every research finding must be recorded in an output file that another person (or a future Claude session) can read and understand without re-running the experiment.

**Principle 4: Every result has a predetermined response.**
There is no "hmm, I need to think about what this means." The decision tree for every result is defined below before the research runs. Results slot into pre-defined buckets, each with a corresponding action.

**Principle 5: Stop when you have enough data.**
Research has diminishing returns. The goal is not exhaustive academic study — it's enough confidence to make a go/no-go decision. When a threshold is crossed, stop and document.

---

## RESEARCH DEPENDENCY MAP

```
R1: CDSCO Source Discovery
  └─► R2: Dataset Quality Validation
        └─► R4: RxNorm Resolution Rate
              └─► R6: RxNav Interaction Detection
                    └─► B4: Go/No-Go Decision
              └─► R8: Gemini Fallback (CONDITIONAL — only if R4 < 40%)

R3: API Latency Measurement (independent)
  └─► Finalizes check-batch ceiling (15 or lower)

R5: RxNorm Rate Limiting (independent, runs alongside R4)
  └─► Confirms serial vs parallel call design

R7: RxNav Response Structure (runs alongside R6)
  └─► Confirms interaction parsing logic

R9: Supabase Connection Limits (independent)
  └─► Confirms pgbouncer configuration requirement

R10: Vercel Timeout Validation (independent)
  └─► Confirms 10-second ceiling assumption

R11: Render Tesseract Compatibility (independent, desk research)
  └─► Confirms Phase 5 OCR deployment is viable
```

### Recommended Execution Sequence

```
Session 1 (4-5 hours): R1 + R2 (data acquisition)
Session 2 (3-4 hours): R3 + R5 + R10 + R11 (infrastructure validation, parallelisable)
Session 3 (3-4 hours): R4 (resolution rate — depends on R2 data)
Session 4 (2-3 hours): R6 + R7 (interaction validation — depends on R4)
Session 5 (2 hours):   R8 if needed + B4 Go/No-Go decision + documentation
```

Total estimated research time: 14-18 hours across 5 sessions.
Total calendar time: 4-5 days (assuming 3-4 focused hours per day).

---

## RESEARCH ITEM R1: CDSCO DATA SOURCE DISCOVERY

### Why This Research Matters

The entire drug resolution chain — autocomplete, salt lookup, synonym mapping — depends on having a clean dataset of Indian brand names mapped to their salt/generic ingredients. Without this dataset, there is no Phase 2 medicine autocomplete, no Phase 3 interaction engine, and no product. This is the most foundational dependency of the project. Discovering mid-Phase 2 that the dataset is unusable would require stopping all development.

### Research Methodology

Execute the following four strategies in strict priority order. Stop at the first one that succeeds.

**Strategy 1: GitHub Search (time-box to 60 minutes)**

Search GitHub with each of the following queries in sequence:
- `india medicine brand generic dataset`
- `indian drugs brand name salt composition CSV`
- `CDSCO drugs database JSON`
- `india pharmaceutical dataset API`
- `drugs.com india brand name API dataset`

For each promising result:
- Click → inspect the README
- Download a sample (first 100 rows)
- Count total entries
- Check whether combination drugs (multiple salts) are represented
- Check the license

Accept a dataset if: entries ≥ 3,000, combination drugs present in at least some entries, license is permissive (MIT, CC-BY, open government, or unlicensed).

**Strategy 2: Kaggle Search (time-box to 30 minutes)**

Search Kaggle for `india pharmaceutical drugs` and `CDSCO medicine dataset`. Kaggle datasets often come with metadata about source and license. Same acceptance criteria as Strategy 1.

**Strategy 3: data.gov.in Search (time-box to 30 minutes)**

Go to data.gov.in and search for `drugs` and `pharmaceuticals`. The Indian government publishes datasets under OGDL (Open Government Data License), which is permissive. Look for any dataset from CDSCO, DGCI, or the Ministry of Health containing brand/generic/salt information.

**Strategy 4: Direct CDSCO Extraction (time-box to 2 hours if reached)**

If Strategies 1-3 fail, the CDSCO drug register is at `https://cdsconet.nic.in/CDSCO/PublicPage/formNEW_drugs`. The public-facing search allows searching by drug name. If a structured extraction method exists, document the approach and column structure precisely. Note the date of access for freshness tracking.

**Strategy 5: Hybrid manual construction (only if all above fail)**

Manually compile a starter dataset of the top 200 most commonly prescribed Indian medicines from:
- NPPA (National Pharmaceutical Pricing Authority) essential medicines list
- WHO Essential Medicines List for India
- Common household medicine brands from personal knowledge

This is the fallback of last resort. A manually constructed 200-entry dataset is enough to continue Phase 0 validation but would require expansion before Phase 2 launch.

### Expected Outputs

An output file at `.claude/outputs/phase-00/cdsco-data-source.md` containing:
- Strategy used (1-5) and reason others were skipped
- Dataset URL, access date, and license
- Total entry count
- Sample of 5 entries showing the data structure
- Assessment of combination drug representation
- Known gaps by therapeutic category

A raw data file at `backend/data/cdsco_raw.json` or `.csv`.

### Acceptance Thresholds

| Threshold | Verdict |
|-----------|---------|
| ≥ 5,000 entries, combination drugs represented | Excellent — proceed directly |
| 3,000-4,999 entries, combination drugs represented | Acceptable — proceed |
| 1,500-2,999 entries | Marginal — proceed but note coverage gap in go/no-go |
| < 1,500 entries OR no combination drugs | Fail — attempt next strategy or hybrid construction |

### Failure Criteria

Research fails if after all 5 strategies, no dataset with at least 1,500 entries is found. In this scenario:

The project still proceeds, but the MVP scope for Phase 2 is reduced: autocomplete becomes a manual text search against a curated 300-entry starter dataset. The CDSCO dataset goal of 3,000+ entries becomes an ongoing background task rather than a pre-Phase 1 blocker. Document this explicitly in the go/no-go decision.

### Architectural Decisions That Depend on This Result

- **Autocomplete coverage** — The user-visible quality of the autocomplete is directly proportional to dataset size. A 500-entry dataset means most users will type their medicine and see nothing. A 5,000-entry dataset means most users will find their medicine immediately.
- **Resolution chain viability** — A dataset that doesn't include combination drugs means Combiflam, Augmentin, and similar high-risk medicines cannot have their interactions fully checked. This is a safety gap that must be documented.
- **Phase 2 scope** — If the dataset is below threshold, Phase 2 must include building it up as a task rather than treating it as a given.

---

## RESEARCH ITEM R2: CDSCO DATASET QUALITY VALIDATION

### Why This Research Matters

Raw datasets are rarely usable without cleaning. The most common problems are: inconsistent casing (Paracetamol vs PARACETAMOL vs paracetamol), extra whitespace in values, duplicate entries for the same brand with different spellings, missing salt composition for some entries, and incorrect data (wrong brand-to-salt mappings). Sending uncleaned data into the resolution chain would produce unreliable results in R4, making the resolution rate measurement meaningless.

### Research Methodology

**Step 1: Statistical profile of the raw dataset (30 minutes)**

Load the raw dataset and compute:
- Total entry count
- Number of unique brand names
- Number of unique generic/salt names
- Number of entries where salt field is empty or null
- Number of entries with multiple salts (combination drugs) vs single salt
- Distribution across therapeutic categories (if category field exists)

**Step 2: Normalization assessment (30 minutes)**

Take a random sample of 100 entries and examine:
- Are brand names consistently cased? (all Title Case? Mixed? UPPERCASE?)
- Are salt names consistently cased?
- Are there obvious encoding issues (accented characters, special symbols)?
- Are strength values in consistent format (e.g., "500mg" vs "500 mg" vs "500MG")?
- Are there trailing spaces or newline characters in string values?

**Step 3: Accuracy spot check (30 minutes)**

Take 20 entries at random. For each:
- Look up the brand name in a known reference (Drugs.com, 1mg.com, or your own knowledge)
- Confirm the listed salt/generic matches the actual medicine
- Flag any incorrect mappings

Target: 19 out of 20 (95%) spot-checked entries are accurate.

**Step 4: Combination drug verification (20 minutes)**

Identify 10 known combination drugs in the dataset:
- Combiflam (Ibuprofen + Paracetamol)
- Augmentin (Amoxicillin + Clavulanic Acid)
- Calmpose (Diazepam — single, not combination, as control)
- Telma-H (Telmisartan + Hydrochlorothiazide)
- Glycomet GP (Glimepiride + Metformin)
- Corex (Chlorpheniramine + Codeine)

For each: does the dataset have both salts listed, or only one?

**Step 5: Category coverage audit (20 minutes)**

Verify that the dataset includes at least 10 entries from each of these therapeutic categories:
- Analgesics/antipyretics
- Antibiotics
- Antihypertensives
- Antidiabetics
- Antacids/proton pump inhibitors
- Antihistamines/allergy
- Vitamins/supplements
- Cardiovascular

### Expected Outputs

Additions to `.claude/outputs/phase-00/cdsco-data-source.md`:
- Total entries after deduplication
- Missing salt percentage
- Combination drug coverage (X out of Y known combinations found)
- Normalization issues identified and how they'll be fixed
- Spot-check accuracy result (X out of 20 correct)
- Category coverage gaps

### Acceptance Thresholds

| Metric | Accept | Marginal | Fail |
|--------|--------|----------|------|
| Entry count (post-dedup) | ≥ 3,000 | 1,500-2,999 | < 1,500 |
| Missing salt % | < 5% | 5-15% | > 15% |
| Combination drug coverage | ≥ 4/6 checked | 2-3/6 | < 2/6 |
| Spot-check accuracy | ≥ 18/20 (90%) | 15-17/20 | < 15/20 |
| Category coverage | All 8 categories | 6-7 categories | < 6 |

### Architectural Decisions That Depend on This Result

- **Normalization pipeline design** — The cleaning transformations needed depend on what normalization issues are found. If all salt names are uppercase, the cleaning pipeline lowercases then title-cases them. If combination drugs are missing, R4 must use single-salt-only testing and the interaction engine's combination drug support is effectively untested until real users add combination medicines.
- **Search quality** — If brand name casing is inconsistent, Fuse.js fuzzy matching needs its threshold tuned appropriately to handle case variations.

---

## RESEARCH ITEM R3: API LATENCY MEASUREMENT

### Why This Research Matters

The check-batch endpoint is bounded at 15 pairs based on an assumption of 500ms average latency per RxNav call. The math: 15 × 500ms = 7,500ms, leaving a 2,500ms safety buffer below the 10-second Vercel limit. If actual latency from India is 700ms, the safe ceiling drops to 12 pairs. If it's 900ms, the ceiling drops to 9 pairs. These are not arbitrary numbers — they directly define the batch limit in the API contract, which affects how quickly users see interaction results.

This research must run from the same geographic location as the developer (India). Running it from a European or American location produces meaningless data.

### Research Methodology

**Test environment setup:**

Run from your primary development machine in India. Do not use a VPN that routes through a non-Indian server, as this changes the apparent network path and invalidates the measurements.

**RxNorm latency test (30 minutes):**

Run 50 sequential HTTP GET requests to:
```
https://rxnav.nlm.nih.gov/REST/rxcui.json?name=Acetaminophen&search=2
```
Use the same query each time (Acetaminophen is guaranteed to resolve). This isolates network latency from server processing time variation caused by different queries.

Record for each request:
- Start time (milliseconds)
- End time (milliseconds)
- Response status code
- Whether a result was returned

Compute: p50 (median), p95 (95th percentile), p99 (99th percentile), min, max, and standard deviation.

**RxNav latency test (30 minutes):**

Run 50 sequential HTTP GET requests to:
```
https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=161
```
RxCUI 161 is Warfarin (stable reference). Same measurement protocol as RxNorm.

**Batch ceiling calculation:**

After collecting both latency datasets, calculate the safe batch ceiling:

```
Available time = 9,000ms (10,000ms limit minus 1,000ms overhead)
Safe batch ceiling = floor(9,000 / p95_latency)

Example: p95 = 600ms → floor(9000/600) = 15 (matches baseline)
Example: p95 = 750ms → floor(9000/750) = 12 (must update baseline)
Example: p95 = 900ms → floor(9000/900) = 10 (must update baseline)
```

**Day/time variation test (optional, 30 minutes):**

If time allows, run the 50-request test at two different times of day (morning IST and evening IST) to assess whether latency varies significantly based on US server load. If p95 varies by more than 20% between tests, use the higher (slower) measurement for the ceiling calculation.

### Expected Outputs

File: `.claude/outputs/phase-00/api-latency.md`
- RxNorm: p50, p95, p99 latency in milliseconds
- RxNav: p50, p95, p99 latency in milliseconds
- Calculated safe batch ceiling for check-batch endpoint
- Time of measurement and location (city, IST timezone)
- Whether baseline batch size of 15 is confirmed or must be revised

### Acceptance Thresholds

| p95 Latency | Safe Batch Ceiling | Status |
|-------------|-------------------|--------|
| < 500ms | 18 (use 15 — headroom) | Excellent |
| 500-650ms | 13-18 (use 13) | Good — baseline confirmed |
| 650-800ms | 11-13 (use 11) | Marginal — reduce baseline |
| 800-1000ms | 9-11 (use 9) | Poor — reduce baseline, add client iteration |
| > 1000ms | < 9 | Bad — consider FastAPI delegation |

### Failure Criteria

If p95 > 1,200ms consistently (not occasional spikes), the 15-pair batch approach with Vercel becomes structurally unviable. In this scenario: delegate all RxNav calls to FastAPI (which has no timeout), but this requires deploying FastAPI in Phase 3 rather than Phase 5 — a significant scope change.

### Architectural Decisions That Depend on This Result

- **check-batch maximum pairs constant** — The `MAX_BATCH_PAIRS` constant in the API route is set based on this measurement. If this research shows 650ms p95, the constant must be 11, not 15.
- **Client iteration design** — If the batch is smaller, users with many medicines need more client-side iterations to complete a full interaction check. The UI loading states must reflect this.

---

## RESEARCH ITEM R4: RXNORM RESOLUTION RATE

### Why This Research Matters

This is the most consequential measurement in Phase 0. The entire interaction engine — the product's core differentiator — depends on resolving Indian drug names to RxCUI identifiers. If Indian drug names don't resolve in RxNorm, there are no interaction checks. A resolution rate of 70%+ means the interaction engine works for the vast majority of common household medicines. A rate below 40% means the RxNorm approach is fundamentally broken for Indian medicines and requires the Gemini fallback.

Unlike all other research items, this one directly determines which version of the product gets built.

### Research Methodology

**Test drug selection (30 minutes before running):**

Compile the official test list of 50 salt names. Take them from the CDSCO dataset (R2 output) — choose the 50 most common based on whatever frequency signal the dataset provides, or based on known prevalence in Indian households. The list must include:

- At least 5 from each therapeutic category
- At least 10 combination drugs (testing each salt separately)
- The following mandatory inclusions (cross-validate results with these known cases):
  - Paracetamol (known: resolves as Acetaminophen with synonym)
  - Ibuprofen (known: resolves directly)
  - Metformin (known: resolves directly)
  - Levothyroxine (known: resolves directly)
  - Salbutamol (known: resolves as Albuterol with synonym)
  - Aceclofenac (uncertain: verify if RxNorm knows this Indian-specific NSAID)
  - Nimesulide (uncertain: banned in many countries, may not be in RxNorm)
  - Doxylamine (uncertain: sedating antihistamine common in Indian cold medicines)

**Round 1 — Raw resolution (1 hour):**

For each of the 50 salt names:
1. Query RxNorm: `GET /REST/rxcui.json?name={salt_name}&search=2`
2. Record: salt name → rxcui (or "NOT_FOUND")
3. For NOT_FOUND cases: record the response (was it an empty result or an error?)

**Round 2 — Synonym-enhanced resolution (1 hour):**

For every salt that returned NOT_FOUND in Round 1:
1. Check: is there a known India/UK ↔ US name difference?
2. If yes: add to synonym table, query again with substituted name
3. If no: classify as "genuinely unresolvable via RxNorm"

**Round 3 — Analysis (30 minutes):**

Categorize each of the 50 salts:
- **Resolved directly**: RxNorm recognized the name as-is
- **Resolved via synonym**: RxNorm recognized it after substitution
- **Unresolvable — name variant**: Known drug but RxNorm uses different terminology (requires deeper synonym research)
- **Unresolvable — not in database**: Drug exists but RxNorm genuinely doesn't have it (common for Indian-specific generics, ayurvedic-derived, or recently approved drugs)
- **Unresolvable — regional/banned**: Drug not in RxNorm because it's not used in the US (Aceclofenac, Nimesulide, Drotaverine)

### Expected Outputs

File: `.claude/outputs/phase-00/rxnorm-resolution-report.md`

Structure:
```
## Summary
- Total tested: 50
- Resolved directly: X (Y%)
- Resolved with synonym: A (B%)
- Total resolved: X+A (Y+B%)
- Unresolvable (name variant): C
- Unresolvable (not in database): D
- Unresolvable (regional/banned): E

## Resolution Rate
Raw: Y%
With synonyms (current table): Y+B%
With expanded synonyms (estimated after table growth): ~Z%

## Synonym Table Additions
[List every synonym added during this research]

## Unresolvable Drugs by Category
[List every drug that couldn't be resolved, with reason]

## Therapeutic Coverage Assessment
[For each of the 8 key categories: resolution rate within that category]
```

File: `frontend/public/data/rxnorm_synonyms.json`
- All synonym mappings confirmed during this research
- Format: `{ "IndianName": "USName", ... }`

### Acceptance Thresholds

| Resolution Rate (with synonyms) | Decision | Required Action |
|--------------------------------|----------|-----------------|
| ≥ 80% | Excellent | Proceed exactly as planned |
| 70-79% | Pass — baseline scenario | Proceed as planned, document gaps |
| 55-69% | Marginal pass | Proceed, commit to synonym table expansion in Phase 3 sprint |
| 40-54% | Borderline fail | Extend synonym table aggressively before Phase 3 (2-3 extra sessions); re-test before starting interaction engine |
| < 40% | Fail | Activate Gemini fallback research (R8); decision required before Phase 3 |

### Failure Criteria

Two types of failure require different responses:

**Failure Type 1: Low resolution rate but fixable with synonyms (40-69%)**
Many Indian drug names have US equivalents that RxNorm knows. The solution is time-consuming but mechanical: identify each unresolved drug's US equivalent name and add to the synonym table. Target is to get to 70%+ through synonym expansion. This is not an architecture change — it's a data task.

**Failure Type 2: Fundamentally unresolvable drugs in RxNorm (<40% even with aggressive synonyms)**
This means Indian-specific molecules (Aceclofenac, Nimesulide, Drotaverine), ayurvedic compounds, and very recently approved Indian generics are simply not in the US drug database. No synonym table can fix this — the drugs don't exist in RxNorm regardless of name. This requires the Gemini fallback.

### Architectural Decisions That Depend on This Result

- **Gemini fallback activation** — Only activated if result is < 40%. If activated, adds Gemini API key to environment variables, adds a fallback code path in the resolution service, adds a source-aware disclaimer in the interaction UI.
- **Phase 3 scope** — If borderline (40-69%), Phase 3 must include a dedicated session for synonym table expansion before the interaction engine is considered complete.
- **Product messaging** — The "we check interactions for your medicines" claim needs a qualifier if resolution rate is below 70%: "for most common medicines" vs "for all medicines." This affects landing page and onboarding copy.
- **Interaction engine success metrics** — The MVP definition says "identify 5 out of 7 known interacting pairs." If resolution is < 70%, the set of testable pairs must be drawn from the successfully-resolved subset.

---

## RESEARCH ITEM R5: RXNORM AND RXNAV RATE LIMITING

### Why This Research Matters

The baseline assumes RxNorm and RxNav have "no hard rate limit" based on documentation language. This is unverified. If the NIH APIs throttle at 10 requests per minute, the serial-call design in check-batch (which can send 15 requests per invocation) would trigger throttling during first-time interaction checks, returning errors instead of interaction data. Discovering this in Phase 3 would require redesigning the batch endpoint to add inter-request delays.

### Research Methodology

**Burst test (30 minutes):**

Send 30 sequential requests to RxNorm as fast as possible (no artificial delay):
```
GET https://rxnav.nlm.nih.gov/REST/rxcui.json?name=Ibuprofen&search=2
```

Record: response status code for each request, time of each request, any changes in response time (a sudden jump often precedes a rate limit).

Repeat for RxNav:
```
GET https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=5640
```
(RxCUI 5640 = Ibuprofen, known to have several interactions.)

**Sustained test (30 minutes):**

Send 60 requests at a controlled rate of 1 request every 3 seconds (20 req/minute) to each endpoint. This represents the approximate peak rate during a Phase 3 interaction check for a user with many medicines. Monitor for any 429 responses or response time degradation.

**Boundary test (optional, 15 minutes):**

If burst test shows no throttling, increase to 60 simultaneous-ish requests (one per second for 60 seconds). Identify where throttling begins, if anywhere.

### Expected Outputs

Section in `.claude/outputs/phase-00/api-latency.md`:
- Burst test results (30 requests): any 429s? Response time stability?
- Sustained test results (60 requests at 20/min): any 429s?
- Identified safe call rate (requests per minute with zero throttling)
- Recommended call pattern for check-batch (serial, 1 per second gap, or other)

### Acceptance Thresholds

| Finding | Status | Required Change |
|---------|--------|----------------|
| Zero 429s at any rate tested | Excellent | No change to baseline |
| 429s appear only at > 30 req/min | Good | Add 100ms delay between calls in check-batch |
| 429s appear at 20 req/min | Moderate | Add 200ms delay; recalculate batch ceiling |
| 429s appear at < 10 req/min | Bad | Serial calls with 6-second interval; reduce batch to 5 pairs |

### Architectural Decisions That Depend on This Result

- **Inter-request delay in check-batch** — If throttling occurs, the batch endpoint needs `await delay(Xms)` between RxNav calls. This extends the execution time and lowers the batch ceiling further.
- **Batch ceiling revision** — If a delay is required, recalculate: `floor((9000ms - (pairs-1 × delay_ms)) / p95_latency)`.

---

## RESEARCH ITEM R6: RXNAV INTERACTION DETECTION ACCURACY

### Why This Research Matters

The interaction engine's value — and the product's core safety claim — is only valid if the data returned by RxNav is accurate and complete for the drugs Indian users are likely to take. This research validates that the end-to-end pipeline (brand → salt → RxCUI → RxNav → interaction result) actually returns meaningful safety information, not just that the API is technically reachable.

Two failure modes must be tested: false negatives (missing a real interaction) and false positives (reporting an interaction that doesn't exist). False negatives are the dangerous failure mode. False positives undermine user trust.

### Research Methodology

**Prepare the test set (before running):**

Select 10 known interacting pairs and 5 known non-interacting pairs from authoritative sources. Cross-reference each pair against Drugs.com interaction checker or a pharmacist-verified reference before using in the test. Do not rely solely on general knowledge.

**Recommended test pairs (verify these against Drugs.com before testing):**

Known interactions to detect:
1. Warfarin + Aspirin — Severe bleeding risk (classic textbook interaction)
2. Warfarin + Ibuprofen — Severe bleeding risk (similar mechanism)
3. Warfarin + Metronidazole — Severe INR increase (common Indian antibiotic combination)
4. Ciprofloxacin + Antacids (Calcium carbonate) — Moderate absorption reduction
5. Levothyroxine + Calcium carbonate — Moderate absorption interference (extremely common in India — thyroid + calcium supplement)
6. Metformin + Alcohol — Moderate lactic acidosis risk
7. Atorvastatin + Clarithromycin — Severe myopathy risk (antibiotic commonly prescribed with statins)
8. Amlodipine + Simvastatin — Moderate statin exposure increase
9. Diclofenac + Aspirin — Moderate competing mechanisms
10. Telmisartan + Potassium supplements — Moderate hyperkalemia risk

Known non-interactions (verify these are truly non-interacting):
1. Paracetamol + Vitamin D3
2. Cetirizine + Omeprazole
3. Amlodipine + Folic acid
4. Metformin + Vitamin B12 (B12 deficiency association exists but not a drug-drug interaction)
5. Atorvastatin + Cetirizine

**End-to-end test for each pair (2-3 hours):**

For each pair, run the full resolution chain:
1. Find the brand name in CDSCO dataset (or use the salt name directly if no brand found)
2. Resolve salt → RxCUI via RxNorm (using synonym table from R4)
3. Call RxNav with RxCUI: `GET /REST/interaction/interaction.json?rxcui={rxcui_drug_a}`
4. Parse response: look for an interaction involving drug B's RxCUI
5. Record: interaction found? Severity reported? Description?

Document every step for every pair — the raw RxNorm response and the raw RxNav response. This creates an evidence trail.

### Expected Outputs

File: `.claude/outputs/phase-00/interaction-validation-report.md`

For each of the 15 pairs:
- Drug A name (brand) → salt → RxCUI obtained
- Drug B name (brand) → salt → RxCUI obtained
- RxNav interaction found: YES / NO
- If YES: severity reported, description excerpt
- Expected result: MATCH or MISMATCH
- Notes on any surprises

Summary:
- True positives: X out of 10 known interactions detected
- False positives: Y out of 5 non-interacting pairs incorrectly flagged
- Overall assessment

### Acceptance Thresholds

| Metric | Pass | Marginal | Fail |
|--------|------|----------|------|
| True positives (known interactions detected) | ≥ 8/10 | 6-7/10 | < 6/10 |
| False positives (non-interactions flagged) | 0/5 | 1/5 | ≥ 2/5 |

Note: A false positive is worse than a missed interaction from a trust standpoint. Users who see a "severe interaction" warning for two safe drugs will lose confidence in the system and stop using it.

### Failure Criteria

**Scenario A: 5 or fewer known interactions detected**

The RxNav dataset has substantial gaps for Indian-relevant drug combinations. In this scenario, the interaction engine still ships but the product messaging must be significantly more conservative: "We flag interactions when data is available. Many interactions may not yet be in our database." The go/no-go decision should note this limitation explicitly.

**Scenario B: 2 or more false positives**

This is a critical failure. False positives for drug interactions are not merely inaccurate — they cause users to stop taking medication they shouldn't stop taking. If false positives occur: investigate whether they're caused by a resolution error (wrong RxCUI obtained) or a data quality issue in RxNav. If the cause is resolution errors, fixing R4 may fix this. If the cause is RxNav data quality, add a confidence score filter: only display interactions above a severity threshold.

### Architectural Decisions That Depend on This Result

- **Severity filter default** — If false positives appear, the interaction display should default to "moderate and severe only" with mild interactions hidden behind an expand option.
- **Product messaging** — The landing page interaction accuracy claim must match this result.
- **MVP success criteria** — The architecture baseline says "identify 5 out of 7 known pairs" for MVP. This research provides the evidence for whether that target is realistic.

---

## RESEARCH ITEM R7: RXNAV RESPONSE STRUCTURE VALIDATION

### Why This Research Matters

The interaction engine parsing code in Phase 3 must correctly extract severity levels and descriptions from RxNav's response format. If the actual response structure differs from what's assumed, the parser produces wrong results silently. This research establishes the ground truth response format before any parsing code is written.

### Research Methodology

**Run alongside R6.** For each of the 10 known interacting pairs, capture the full raw JSON response from RxNav. Do not filter or parse — save the complete response.

Examine each response for:
- Top-level structure: what are the keys?
- Where is the list of interactions?
- What field contains severity?
- What values does severity take? (is it "High/Moderate/Low", "severe/moderate/mild", or something else?)
- What field contains the description?
- What does a "no interaction" response look like? (is it an empty array, a null, a 200 with empty results, or a 404?)
- Are there multiple interactions per drug pair? How many in the worst case?

Also test the RxNorm response for one case where a drug name has multiple matching RxCUIs (e.g., if "Aspirin" returns multiple concept entries). Document how to select the correct one.

### Expected Outputs

Section in `.claude/outputs/phase-00/interaction-validation-report.md`:
- Annotated example of a full RxNav response for a pair with an interaction
- Annotated example of a full RxNav response for a pair without an interaction
- Annotated example of a full RxNorm response with a single result
- Annotated example of a full RxNorm response with multiple concept candidates
- Severity value vocabulary (exact strings used by RxNav)
- Description field name and typical length
- Parsing rules derived from the above

### Acceptance Thresholds

This research has no pass/fail — it is documentation research. The output directly informs Phase 3 parser implementation. If the response format is more complex than expected (e.g., nested structures, pagination), document that and plan for it in Phase 3.

---

## RESEARCH ITEM R8: GEMINI API FALLBACK VALIDATION (CONDITIONAL)

> **This research item is CONDITIONAL. Run it ONLY if R4 resolution rate < 40%.**
> If R4 ≥ 40%, skip R8 entirely and proceed to the go/no-go decision.

### Why This Research Matters

If RxNorm cannot resolve Indian drug names reliably, Gemini Flash is the only viable free-tier alternative. But Gemini is an LLM, not a pharmaceutical database. It can hallucinate drug interactions that don't exist, or miss interactions that do. For a safety-critical feature, hallucination is not acceptable without stringent controls. This research validates whether Gemini can be used with sufficient reliability and what safeguards are needed.

### Research Methodology

**Select test cases:**

Use the same 10 known interaction pairs and 5 non-interacting pairs from R6. This enables direct comparison between RxNav and Gemini.

**Prompt design:**

Test this exact prompt template (do not vary the template between runs):
```
You are a clinical pharmacist. List all clinically significant drug-drug interactions between [Drug A generic name] and [Drug B generic name].

Respond in JSON format only:
{
  "has_interaction": true or false,
  "confidence": "high" or "medium" or "low",
  "interactions": [
    {
      "severity": "severe" or "moderate" or "mild",
      "description": "one sentence clinical description"
    }
  ]
}

If you are not confident about the interaction status, set has_interaction to false and return an empty interactions array. Never guess.
```

**Consistency test:**

Run the same prompt for each of the 5 non-interacting pairs THREE times. Record whether Gemini gives the same answer all three times. Inconsistency on non-interacting pairs is a serious reliability concern.

**Accuracy test:**

Compare Gemini's results against the R6 RxNav results for all 15 pairs. Where Gemini and RxNav disagree, flag for manual investigation.

**Latency test:**

Measure the response time for each Gemini call. Calculate whether Gemini can fit within the Vercel 10-second timeout as part of the resolution service.

### Expected Outputs

File: `.claude/outputs/phase-00/gemini-fallback-assessment.md`
- Accuracy: X/10 known interactions correctly identified by Gemini
- False positives: Y/5 non-interactions incorrectly flagged
- Consistency: Z/5 non-interacting pairs gave same answer across 3 runs
- Average latency per Gemini call
- Comparison table: RxNav vs Gemini for all 15 pairs
- Decision: viable fallback (with what disclaimer text) OR not viable

### Acceptance Thresholds

| Metric | Viable as Fallback | Not Viable |
|--------|-------------------|------------|
| True positives | ≥ 7/10 | < 7/10 |
| False positives | ≤ 1/5 | ≥ 2/5 |
| Consistency (same answer 3 runs) | ≥ 4/5 | < 4/5 |
| Latency | < 5s (fits in resolution chain) | > 8s (too slow) |

If Gemini passes: activate with disclaimer "⚠️ AI-generated result — not from a verified pharmaceutical database. Verify with your doctor before making any decision."

If Gemini fails: the only remaining option is a manually curated interaction database covering the top 50 common drug pairs in India. This is a significant additional data task (5-10 hours) that must be planned into Phase 3.

---

## RESEARCH ITEM R9: SUPABASE FREE TIER LIMITS

### Why This Research Matters

The architecture relies on Supabase free tier hosting all user data for the project's lifetime. If the free tier is insufficient for even a small user base, the deployment plan breaks. Two specific limits matter most: database connections (the pgbouncer requirement is predicated on connection limits being an actual constraint) and database storage (500MB must be sufficient for the expected data volume).

### Research Methodology

**Connection calculation (20 minutes, desk research):**

Supabase free tier uses PgBouncer automatically for connection pooling. PostgreSQL on Supabase free tier supports approximately 15-20 direct connections (not PgBouncer pooled connections — the actual database). With `pgbouncer=true&connection_limit=1` in Prisma, each Vercel function invocation uses at most 1 connection from the pool.

Calculate peak connection demand:
- Vercel can spin up to 100 concurrent function invocations
- With `connection_limit=1`: 100 concurrent invocations → 100 connections requested
- PgBouncer pools these into the 15-20 available database connections
- As long as PgBouncer is used, this is fine

Confirm: is PgBouncer available by default on Supabase free tier, or does it require a paid plan?

**Storage calculation (15 minutes, desk research):**

Estimate storage usage for 100 active users, each with 10 medicines:
- 1 users row ≈ 200 bytes
- 1 family_members row ≈ 150 bytes
- 1 medicines row (with TEXT[] fields) ≈ 500 bytes
- 1 interactions_cache row ≈ 300 bytes
- 1 checked_pairs row ≈ 100 bytes
- 1 notification_log row ≈ 150 bytes

Calculate: 100 users × (1 users + 2 family + 10 medicines + ~20 interaction pairs + 10 notification logs) = rough data footprint.

Target: total data footprint must be well below 500MB free tier limit for realistic user scale.

**Current free tier confirmation (10 minutes):**

Check Supabase's current pricing page for actual free tier limits — they change periodically. Confirm:
- Database size limit
- Whether PgBouncer is available on free tier
- Row count limits (if any)
- API request limits

### Expected Outputs

Section in `.claude/outputs/phase-00/deployment-validation.md`:
- Supabase free tier limits (as of today)
- PgBouncer availability confirmed or denied
- Estimated storage for 50 users / 100 users / 500 users
- Conclusion: how many users can the free tier realistically serve?

### Acceptance Thresholds

- PgBouncer available on free tier: required. If not, must evaluate alternative connection pooling approach.
- 500MB sufficient for 500+ users: required. If not, the product's growth ceiling is lower than expected.

---

## RESEARCH ITEM R10: VERCEL TIMEOUT VALIDATION

### Why This Research Matters

The entire check-batch endpoint design is built around a 10-second function timeout. If Vercel's actual behavior differs from documentation (for example, if the cold start time is included in the 10-second budget, or if Next.js App Router routes have different timeout rules than Pages Router), the batch ceiling calculation is wrong.

### Research Methodology

**Documentation verification (20 minutes):**

Read the current Vercel documentation for:
- Function execution timeout for free tier (confirm 10 seconds)
- Whether cold start time is included in the timeout budget
- Whether `src/app/api/` routes (App Router) have the same timeout as `pages/api/` routes
- What happens when a function times out — does the client get a 504? A network error? An empty response?

This is desk research — read the docs and record the findings.

**Timeout confirmation plan (document for Phase 1):**

Write a planned test: in Phase 1, after the Next.js project is set up, deploy a test route that intentionally sleeps for 9 seconds, then 10 seconds, then 11 seconds. Record the actual cutoff point. This test runs in Phase 1 (week 1), not Phase 0 — it requires a deployed Vercel environment.

### Expected Outputs

Section in `.claude/outputs/phase-00/deployment-validation.md`:
- Vercel free tier timeout: X seconds (confirmed from docs)
- Whether cold start time is inside or outside the timeout budget
- App Router vs Pages Router timeout behavior (same or different)
- What error the client receives on timeout (504, network error, or other)
- Plan for verification test in Phase 1

### Acceptance Thresholds

- Timeout ≥ 10 seconds: required. If the actual limit is 5 seconds (Vercel Pro is 60 seconds, Hobby/free is 10 seconds — confirm this), the batch ceiling must be recalculated.
- Cold start NOT inside timeout budget: preferred. If cold start IS inside the budget, factor it into ceiling calculations.

---

## RESEARCH ITEM R11: RENDER FREE TIER TESSERACT COMPATIBILITY

### Why This Research Matters

Phase 5 OCR depends on Tesseract running on a Render free tier instance. Three specific concerns: RAM usage (is 512MB enough for Tesseract + OpenCV + FastAPI?), build process (can Tesseract be installed via apt-get in Render's build environment?), and cold start time (how long before the first OCR request is ready?). Building Phase 5 only to discover Render can't run Tesseract would be a complete loss of a development phase.

This is desk research only in Phase 0 — there's no Render account or FastAPI service yet. The goal is to gather evidence from authoritative sources (Render documentation, community posts, GitHub issues) before committing to this approach.

### Research Methodology

**RAM profile research (30 minutes):**

Search for: "Tesseract Python memory usage" and "pytesseract RAM requirements"

Determine: how much RAM does Tesseract consume when loaded with English language data?
Target: < 200MB, leaving 300MB+ for FastAPI + OpenCV + request handling.

Search for: "opencv-python-headless memory usage" and "OpenCV Python RAM"

Determine: how much RAM does OpenCV add?
Target: < 150MB.

Verify: 512MB Render free tier is sufficient for Tesseract + OpenCV + FastAPI + Python runtime combined.

**Build process research (30 minutes):**

Search for: "Render.com deploy Tesseract OCR" and "Render custom build commands apt-get"

Confirm: does Render's free tier support `apt-get install -y tesseract-ocr` in the build command? Or does it require a Dockerfile?

Find at least one community-verified example of Tesseract deployed on Render. If none exists, check if Render's Ubuntu base image has Tesseract available (it should — it's a standard Ubuntu package).

**Cold start research (20 minutes):**

Search for: "Render free tier cold start time Python"

Expected finding: 30-60 second cold start after 15 minutes of idle. Verify this estimate with community data. Identify the RAM impact of the cold start (does Tesseract preload language data on startup, or only on first request?).

**Alternative backup plan (15 minutes):**

If any research finding suggests Tesseract on Render free tier is not viable, identify one free alternative:
- EasyOCR on a paid tier (not viable — budget constraint)
- Tesseract on Railway.app free tier (similar constraints to Render — research their RAM limit)
- Tesseract on a locally-run service during development (viable for testing, not production)
- Pure Tesseract.js in the Next.js API route (runs on Vercel, no Render needed) — research whether Tesseract.js + language data fits in Vercel's 50MB function bundle limit

The backup plan exists only to be documented — the primary approach (Render free tier) is expected to work.

### Expected Outputs

Section in `.claude/outputs/phase-00/deployment-validation.md`:
- Tesseract RAM footprint: estimated MB when loaded
- OpenCV RAM footprint: estimated MB
- Total estimated RAM usage: X MB (must be < 450MB, leaving 62MB buffer)
- Render build process: confirmed working (link to evidence) or unconfirmed
- Estimated cold start time: X seconds
- Whether Tesseract preloads on startup (longer cold start) or on first request
- Backup plan if primary approach fails

### Acceptance Thresholds

- Estimated total RAM < 450MB: required
- Tesseract apt-get installation on Render: confirmed with evidence or high confidence from documentation
- Cold start time < 90 seconds: acceptable (keep-alive strategy mitigates this)

---

## SECTION: GO/NO-GO DECISION FRAMEWORK

### Decision Inputs

After completing R1 through R7, populate this table with measured values:

| Input | Measurement | Threshold | Pass/Fail |
|-------|-------------|-----------|-----------|
| CDSCO entry count | ___ entries | ≥ 3,000 | |
| Combination drug coverage | ___/6 found | ≥ 4/6 | |
| Dataset spot-check accuracy | ___/20 correct | ≥ 18/20 | |
| RxNorm resolution rate (raw) | ___% | — | |
| RxNorm resolution rate (with synonyms) | ___% | ≥ 70% | |
| RxNav true positive rate | ___/10 | ≥ 7/10 | |
| RxNav false positive rate | ___/5 | 0/5 | |
| RxNorm p95 latency | ___ ms | < 800ms | |
| Safe batch ceiling (calculated) | ___ pairs | ≥ 10 | |
| Rate limit observed | YES/NO | NO | |

### Decision Tree

```
ALL thresholds pass at acceptable level?
  YES → Decision: GO — proceed as planned
  NO → continue below

One or more thresholds in "Marginal" range but none failing hard?
  YES → Decision: GO WITH MODIFICATIONS — document every modification
         Common modifications:
         - Reduce batch ceiling (if latency > 650ms)
         - Add synonym expansion session to Phase 3 (if resolution 55-69%)
         - Add rate limit delay to check-batch (if throttling observed)
  NO → continue below

Resolution rate < 40%?
  YES → Run R8 (Gemini research)
         R8 passes? → Decision: GO WITH GEMINI FALLBACK
           Modifications: add Gemini API key, add fallback code path in resolver,
                          add stronger disclaimers to interaction UI
         R8 fails? → Decision: GO WITH MANUAL INTERACTION DATABASE
           Modifications: create curated top-50-pairs database, Phase 3 adds this task
  NO → continue below

RxNav false positives ≥ 2?
  YES → Decision: GO WITH SEVERITY FILTER
    Modifications: default to moderate+severe only, hide mild interactions
  NO → This case should not occur if resolution > 40%

CDSCO entry count < 1,500 despite all strategies?
  YES → Decision: GO WITH REDUCED SCOPE
    Modifications: autocomplete covers only curated 300-entry starter set;
                   expand dataset as ongoing background task
```

### Go/No-Go Decision Document

File: `.claude/outputs/phase-00/go-no-go-decision.md`

Must contain:
1. All measured values from the table above
2. The decision (GO / GO WITH MODIFICATIONS / GO WITH GEMINI FALLBACK / GO WITH REDUCED SCOPE)
3. Every modification to the baseline architecture, if any
4. Every modification to the Phase 0 Lock Checklist items, if any
5. Updated batch ceiling value (if different from 15)
6. Updated synonym table target (if resolution was borderline)
7. Sign-off line with date

---

## OUTPUT ARTIFACTS SUMMARY

All research outputs live in `.claude/outputs/phase-00/`. They must exist before Phase 1 begins.

| File | Produced By | Contains |
|------|-------------|---------|
| `cdsco-data-source.md` | R1, R2 | Source, license, quality metrics, coverage assessment |
| `rxnorm-resolution-report.md` | R4 | Resolution rates, synonym additions, unresolvable drug list |
| `api-latency.md` | R3, R5 | Latency percentiles, batch ceiling, rate limit behavior |
| `interaction-validation-report.md` | R6, R7 | Pair test results, RxNav response structure, parsing rules |
| `gemini-fallback-assessment.md` | R8 (conditional) | Gemini accuracy, consistency, decision on viability |
| `deployment-validation.md` | R9, R10, R11 | Supabase limits, Vercel timeout, Render Tesseract RAM |
| `go-no-go-decision.md` | B4 | Final decision with all measurements and modifications |

Additionally, these data files are produced:
- `frontend/public/data/rxnorm_synonyms.json` (from R4)
- `backend/data/cdsco_raw.json` or `.csv` (from R1)

---

## TIMING AND PRIORITY

```
Day 1 (Session 1 — ~4 hours):
  R1: CDSCO source discovery
  R2: Quality validation (if source found same day)
  R9: Supabase limits (desk research — 30 minutes, fits in gaps)
  R10: Vercel timeout (desk research — 30 minutes, fits in gaps)

Day 2 (Session 2 — ~3 hours):
  R3: API latency (1 hour — requires India network, time it carefully)
  R5: Rate limiting (1 hour — runs alongside R3)
  R11: Render Tesseract compatibility (desk research — 1 hour)
  R2: Quality validation (if not completed Day 1)

Day 3 (Session 3 — ~4 hours):
  R4: RxNorm resolution rate (most time-consuming)
  Synonym table expansion (iterative alongside R4)

Day 4 (Session 4 — ~3 hours):
  R6: RxNav interaction detection
  R7: Response structure documentation
  R8: Gemini fallback (ONLY if R4 < 40%)

Day 5 (Session 5 — ~2 hours):
  Compile all findings
  Populate go/no-go decision table
  Write go/no-go-decision.md
  Complete Phase 0 Lock Checklist
  Gate sign-off
```

**The single most important research item is R4.** Everything else is risk reduction. R4 determines which product you build. Run it with the rigor it deserves.
