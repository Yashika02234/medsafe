# P0-T4: Interaction API Validation Report

**Date:** 2026-06-10
**Planned API:** RxNav Drug Interaction API (`rxnav.nlm.nih.gov/REST/interaction/`)
**Actual API used:** OpenFDA Drug Label API (`api.fda.gov/drug/label.json`)
**Status:** ✅ COMPLETE — architecture change required, thresholds met

---

## CRITICAL FINDING: RxNav Drug Interaction API Decommissioned

The RxNav Drug Interaction API — which the architecture baseline planned to use for drug interaction checking — **no longer exists at rxnav.nlm.nih.gov**.

| Endpoint Tested | Result |
|----------------|--------|
| `GET /REST/interaction/interaction.json?rxcui=11289` | 404 Not Found (body: "Not found") |
| `GET /REST/interaction/list.json?rxcuis=11289+1191` | 404 Not Found |
| `GET /REST/version.json` | 200 OK (API version 3.1.353, 01-Jun-2026) |

The base API is alive and healthy (version endpoint works, RxNorm name resolution works). The `interaction/` subpath does not exist.

**Confirmation:** Fetched the full resource list from `GET /REST/` — all 36 available endpoints listed. Zero interaction-related endpoints appear in the list. The interaction service was removed at some point and is completely absent from the current API.

### Impact on Architecture

| Component | Original Plan | Revised Plan |
|-----------|--------------|--------------|
| Interaction data source | RxNav API (structured, severity, no auth) | OpenFDA Drug Label API (text-based, keyword severity) |
| Query method | RxCUI pair → structured interaction | Drug name → FDA label text → regex/keyword severity |
| Severity classification | RxNav returns `"severe"/"moderate"/"mild"` | Keyword inference: "contraindicated" → SEVERE, "avoid" → SEVERE, "monitor" → MODERATE, "caution" → MILD |
| interactions_cache source | `source = 'rxnav'` | `source = 'openfda'` |
| Schema changes | None | None — schema already has `source` field |

**Schema impact: ZERO.** The `interactions_cache` and `checked_pairs` tables are unchanged. The change is purely in the service layer.

---

## Validation Results — OpenFDA Text Mining Approach

### Detection Method

For each pair (Drug A, Drug B):
1. Fetch Drug A's FDA label: `GET /drug/label.json?search=openfda.generic_name:"{name}"&limit=1`
2. Extract `drug_interactions` text field (full interaction section from FDA label)
3. Check if Drug B's name appears in Drug A's interaction text (case-insensitive)
4. Repeat in reverse: Drug B's label → search for Drug A's name
5. If either direction finds a match → interaction DETECTED

### Known Interaction Pairs (10 tests — target: ≥ 7/10)

| # | Drug A | Drug B | Expected | A→B | B→A | Detected | Latency | Reason if Missed |
|---|--------|--------|----------|-----|-----|----------|---------|-----------------|
| 01 | Warfarin | Aspirin | SEVERE bleeding | ✅ | ✗ | ✅ | 2295ms | — |
| 02 | Warfarin | Ibuprofen | MOD bleeding | ✅ | ✗ | ✅ | 1068ms | — |
| 03 | Warfarin | Ciprofloxacin | Potentiation | ✅ | ✅ | ✅ | 894ms | — |
| 04 | Warfarin | Tramadol | Potentiation | ✗ | ✅ | ✅ | 1144ms | Tramadol label lists warfarin |
| 05 | Fluoxetine | Tramadol | Serotonin SEVERE | ✗ | ✅ | ✅ | 1147ms | Tramadol label lists fluoxetine |
| 06 | Sertraline | Tramadol | Serotonin | ✗ | ✗ | ✗ | 1141ms | Labels use class term "SSRIs", not "sertraline" |
| 07 | Alprazolam | Codeine | CNS dep SEVERE | ✅ | ✗ | ✅ | 1013ms | — |
| 08 | Diazepam | Codeine | CNS dep | ✗ | ✗ | ✗ | 1018ms | Labels say "opioids", not "codeine" by name |
| 09 | Losartan | Spironolactone | Hyperkalemia | ✗ | ✗ | ✗ | 893ms | Class-level (ARB + K-sparing) — no cross-name mention |
| 10 | Digoxin | Spironolactone | Digoxin tox | ✅ | ✅ | ✅ | 870ms | — |

**Detected: 7/10 — EXACTLY AT THRESHOLD (target: ≥ 7)**

### False Positive Check (5 tests — target: 0/5)

| # | Drug A | Drug B | Flagged? | Latency |
|---|--------|--------|----------|---------|
| 01 | Metformin | Omeprazole | ✗ CLEAN | 2568ms |
| 02 | Amlodipine | Cetirizine | ✗ CLEAN | 850ms |
| 03 | Pantoprazole | Metformin | ✗ CLEAN | 1186ms |
| 04 | Atenolol | Cetirizine | ✗ CLEAN | 816ms |
| 05 | Rosuvastatin | Pantoprazole | ✗ CLEAN | 1072ms |

**False positives: 0/5 — PASS (target: 0)**

---

## Analysis of the 3 Missed Interactions

All 3 misses are **class-based interactions** — FDA labels use drug class terms rather than specific drug names.

### Miss 1: Sertraline + Tramadol (Serotonin Syndrome)
- Tramadol's label uses "SSRIs" and "serotonergic drugs" — not "sertraline" specifically
- **Phase 3 fix:** Drug class synonym mapping. If drug B is an SSRI (class from RxClass API), and drug A's label mentions "SSRIs" → DETECTED.

### Miss 2: Diazepam + Codeine (CNS Depression)
- Diazepam's label warns about "CNS depressants", "opioids" — not "codeine" specifically
- **Phase 3 fix:** Drug class mapping. If drug B is an opioid, and drug A's label mentions "opioid" → DETECTED.

### Miss 3: Losartan + Spironolactone (Hyperkalemia)
- Neither label mentions the other by name; interaction is via shared mechanism (both raise potassium)
- **Phase 3 fix:** Drug class pair rules. If one drug is ARB/ACE inhibitor AND other is K-sparing diuretic → DETECTED as rule-based (no FDA label text needed).

**Estimated detection rate with Phase 3 class-based enhancements: 9-10/10**

---

## OpenFDA API — Latency Profile

| Metric | Value | Notes |
|--------|-------|-------|
| Per-call latency range | 816ms – 2568ms | Cold calls; 2 calls per pair |
| Typical pair check (2 calls) | ~1.5–2.5s | Acceptable if cached |
| Rate limiting | None observed | Free tier, no auth needed |

**Caching strategy is mandatory:** The first time a drug is resolved, fetch and cache its FDA label interaction text. Subsequent checks use the cached text (sub-millisecond). The `interactions_cache` table handles this.

---

## Revised Architecture Decision

### Original
```
POST /api/interactions/check-batch
  → for each (rxcui_a, rxcui_b) pair
    → check checked_pairs (negative cache)
    → if not cached: GET rxnav.nlm.nih.gov/interaction/list?rxcuis={a}+{b}
    → parse severity from response
    → store in interactions_cache, checked_pairs
```

### Revised (OpenFDA)
```
POST /api/interactions/check-batch
  → for each (drug_a_name, drug_b_name) pair
    → check checked_pairs by rxcui pair (negative cache — unchanged)
    → if not cached:
        → fetch drug_a FDA label (or use cached label text)
        → search label text for drug_b name + drug class synonyms
        → repeat in reverse
        → classify severity from keywords
    → store in interactions_cache (source='openfda'), checked_pairs
```

**Schema unchanged. Service logic updated. `rxcui` still stored (from RxNorm resolution) for deduplication.**

---

## Severity Classification Algorithm (Phase 3 Implementation)

Scan the matched interaction text (± 300 char context around the drug name mention):

| Keyword(s) | Severity | Severity Ordinal |
|------------|----------|-----------------|
| contraindicated, avoid concomitant | SEVERE | 3 |
| serious, fatal, risk of death, life-threatening | SEVERE | 3 |
| significant bleeding, hemorrhage | SEVERE | 3 |
| serotonin syndrome | SEVERE | 3 |
| monitor closely, additive effect, can increase | MODERATE | 2 |
| may increase, caution when, concomitant use | MILD | 1 |
| Default (name mentioned, no severity keyword) | MILD | 1 |

---

## Implications for Lock Checklist

- **A-3:** ✅ CONDITIONAL GO — 7/10 detection (at threshold), 0/5 false positives. Architecture change: OpenFDA replaces RxNav.
- **Architecture baseline:** Requires update — RxNav decommissioned, OpenFDA is the new source.
- **defects.md:** Add entry — "RxNav interaction API is decommissioned. Do not use `/REST/interaction/` path."

---

## Deliverables

- [x] Validation report: this file
- [ ] Architecture baseline update (document OpenFDA approach)
- [ ] defects.md entry for RxNav decommission
- [ ] Phase 3 implementation note: drug class synonym table needed for 9-10/10 detection

---

*P0-T4 complete. RxNav decommissioned — OpenFDA validated as replacement. Thresholds met.*
