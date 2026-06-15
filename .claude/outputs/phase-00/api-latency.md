# P0-T3: RxNorm API Validation Report

**Date:** 2026-06-10
**Test:** 50 sequential calls from India (Jaipur/New Delhi network) to `rxnav.nlm.nih.gov`
**Endpoint:** `GET /REST/rxcui.json?name={name}&search=2`
**Tool:** PowerShell `Invoke-WebRequest` (Node.js Bash sandbox had no route to NIH — IPv6 routing issue on that interface)

---

## Key Results

| Metric | Value | Threshold | Verdict |
|--------|-------|-----------|---------|
| Total calls | 50 | — | — |
| Resolved | 49 / 50 | — | — |
| **Resolution rate** | **98.0%** | ≥ 40% (blocker) / ≥ 60% (acceptable) | ✅ **EXCELLENT** |
| Latency min | 294 ms | — | — |
| **Latency p50** | **303 ms** | — | ✅ |
| **Latency p95** | **370 ms** | < 800 ms | ✅ **PASS** |
| **Latency p99** | **961 ms** | — | ✅ (cold start only) |
| Latency max | 961 ms | — | Cold start — call #1 |

**P0-T3 Verdict: STRONG GO**

---

## Per-Call Results

### Group A — Common Salts (25 calls, expected: resolve all)

| # | Name | RxCUI | Latency |
|---|------|-------|---------|
| 01 | Paracetamol | 161 | 961 ms (cold start) |
| 02 | Ibuprofen | 5640 | 307 ms |
| 03 | Aspirin | 1191 | 308 ms |
| 04 | Metformin | 6809 | 298 ms |
| 05 | Glimepiride | 25789 | 302 ms |
| 06 | Atorvastatin | 83367 | 308 ms |
| 07 | Amlodipine | 17767 | 304 ms |
| 08 | Telmisartan | 73494 | 334 ms |
| 09 | Pantoprazole | 40790 | 309 ms |
| 10 | Omeprazole | 7646 | 298 ms |
| 11 | Azithromycin | 18631 | 295 ms |
| 12 | Ciprofloxacin | 2551 | 296 ms |
| 13 | Cephalexin | 2231 | 304 ms |
| 14 | Cetirizine | 20610 | 298 ms |
| 15 | Montelukast | 88249 | 320 ms |
| 16 | Fexofenadine | 87636 | 301 ms |
| 17 | Alprazolam | 596 | 308 ms |
| 18 | Diazepam | 3322 | 302 ms |
| 19 | Atenolol | 1202 | 302 ms |
| 20 | Metoprolol | 6918 | 306 ms |
| 21 | Rosuvastatin | 301542 | 298 ms |
| 22 | Clopidogrel | 32968 | 304 ms |
| 23 | Losartan | 52175 | 341 ms |
| 24 | Hydrochlorothiazide | 5487 | 327 ms |
| 25 | Ranitidine | 9143 | 424 ms |

**Group A: 25/25 resolved (100%)**

### Group B — Indian Spelling Variants (10 calls)

> search=2 (approximate matching) handles all INN ↔ USP name variants directly.
> No synonym table required for any of these.

| # | Indian Name | RxCUI | US Equivalent | Latency |
|---|-------------|-------|---------------|---------|
| 26 | Amoxycillin | 723 | Amoxicillin | 370 ms |
| 27 | Salbutamol | 435 | Albuterol | 297 ms |
| 28 | Levosalbutamol | 237159 | Levalbuterol | 303 ms |
| 29 | Thyroxine | 10582 | Levothyroxine | 294 ms |
| 30 | Lignocaine | 6387 | Lidocaine | 302 ms |
| 31 | Adrenaline | 3992 | Epinephrine | 302 ms |
| 32 | Noradrenaline | 7512 | Norepinephrine | 301 ms |
| 33 | Pethidine | 6754 | Meperidine | 301 ms |
| 34 | Frusemide | 4603 | Furosemide | 302 ms |
| 35 | Clonazepam | 2598 | same | 299 ms |

**Group B: 10/10 resolved (100%) — ALL Indian spelling variants resolve via approximate search**

### Group C — India-Specific Drugs (5 calls)

| # | Name | RxCUI | Latency | Notes |
|---|------|-------|---------|-------|
| 36 | Aceclofenac | 16689 | 309 ms | ✅ In RxNorm |
| 37 | Nimesulide | 53694 | 356 ms | ✅ In RxNorm |
| 38 | Doxofylline | — | 354 ms | ✗ NOT in RxNorm |
| 39 | Etoricoxib | 307296 | 304 ms | ✅ In RxNorm |
| 40 | Torsemide | 38413 | 315 ms | ✅ In RxNorm |

**Group C: 4/5 resolved (80%) — Only Doxofylline failed**

Doxofylline is a theophylline analogue used in India/Asia but not FDA-approved in the US. It has no RxCUI. For app purposes: if resolution fails, show "data unavailable — consult doctor."

### Group D — Additional Common Salts (10 calls)

| # | Name | RxCUI | Latency |
|---|------|-------|---------|
| 41 | Sertraline | 36437 | 296 ms |
| 42 | Fluoxetine | 4493 | 301 ms |
| 43 | Amitriptyline | 704 | 297 ms |
| 44 | Tramadol | 10689 | 306 ms |
| 45 | Codeine | 2670 | 307 ms |
| 46 | Warfarin | 11289 | 298 ms |
| 47 | Digoxin | 3407 | 297 ms |
| 48 | Lisinopril | 29046 | 309 ms |
| 49 | Ramipril | 35296 | 317 ms |
| 50 | Spironolactone | 9997 | 302 ms |

**Group D: 10/10 resolved (100%)**

---

## Latency Distribution

| Percentile | Value |
|------------|-------|
| min | 294 ms |
| p50 | 303 ms |
| p95 | 370 ms |
| p99 | 961 ms |
| max | 961 ms |

**Note on p99 (961ms):** This is the cold-start call (call #1 — Paracetamol). Subsequent calls settled at 294–424ms. In production, the Node.js → FastAPI server will warm connections after the first request in a session. The steady-state max observed (excluding cold start) was 424ms (Ranitidine, call #25).

**Safe batch ceiling:** At p95 = 370ms, a single sequential drug resolution call has no latency concern. For the interaction engine (Phase 3), RxNorm is only called once per *new medicine added* — not per interaction check. The interaction check uses stored RxCUIs, not live RxNorm calls.

---

## Key Findings

### 1. Synonym table scope dramatically reduced

The `search=2` (approximate) endpoint handles ALL Indian spelling variants tested:
- Amoxycillin → resolves to Amoxicillin's RxCUI (723)
- Salbutamol → resolves to Albuterol's RxCUI (435)
- Thyroxine → resolves to Levothyroxine's RxCUI (10582)
- All 9 Indian INN variants in Group B: 100% resolved

**Decision:** Synonym table (B-3) is still worth building for robustness, but it's a safety net, not a critical dependency. Can be deferred to Phase 2 if needed.

### 2. India-specific drugs mostly in RxNorm

Contrary to expectations:
- Aceclofenac: IN RxNorm (rxcui=16689)
- Nimesulide: IN RxNorm (rxcui=53694)
- Etoricoxib: IN RxNorm (rxcui=307296)
- Torsemide: IN RxNorm (rxcui=38413)
- Doxofylline: NOT in RxNorm (niche bronchodilator, no FDA approval)

Only 1 failure among all 50 calls, and it's a very niche drug.

### 3. No rate limiting encountered

50 sequential calls with 200ms delays: no 429 errors, no degradation in response time over the run. NIH confirms "no hard rate limit" — validated.

---

## Impact on Architecture

| Decision | Old Assumption | Validated Finding |
|----------|---------------|-------------------|
| Synonym table (B-3) | Required for common Indian names | Optional — search=2 handles them |
| Resolution error handling | Fallback to Gemini if rate < 40% | Rate is 98% — Gemini fallback not needed |
| RxNorm call per medicine add | Concern about latency | 303ms p50 is fully acceptable |
| Doxofylline + similar | Unknown | Show "data unavailable" message |

---

## Implications for Lock Checklist

- **R3 (Latency):** ✅ p95 = 370ms < 800ms threshold. PASS.
- **R4 (Resolution Rate):** ✅ 98% >> 60% threshold. PASS.
- **R6 (No-key needed):** ✅ Confirmed — zero auth required, no API key, no headers.
- **R8 (Gemini fallback):** ✅ Not needed. Rate > 40%, no fallback required.

---

*P0-T3 complete.*
*Raw results: `backend/scripts/rxnorm-results.json`*
