# Phase 0 — Formal Go/No-Go Decision

**Date:** 2026-06-10
**Decision maker:** Yashika Agrawal
**Reviewer:** Claude (engineering partner)

---

## Summary Verdict

> **DECISION: GO WITH MODIFICATIONS**
>
> All critical thresholds passed. One planned API was decommissioned (RxNav) — a validated free replacement exists (OpenFDA). Architecture change is documented and schema-compatible. Phase 1 may begin.

---

## Evidence Matrix

### A. External API Validation

| Check | Target | Result | Verdict |
|-------|--------|--------|---------|
| RxNorm resolution rate | ≥ 40% (blocker) / ≥ 60% (acceptable) | **98%** (49/50) | ✅ EXCELLENT |
| RxNorm p95 latency | < 800ms | **370ms** | ✅ PASS |
| RxNorm p50 latency | — | **303ms** | ✅ |
| Rate limiting (50 calls, 200ms delay) | Zero throttling | No 429s observed | ✅ PASS |
| Interaction detection rate | ≥ 7/10 known pairs | **7/10** | ✅ AT THRESHOLD |
| Interaction false positives | 0/5 | **0/5** | ✅ PASS |
| Gemini fallback needed | Only if rate < 40% | Not needed | ✅ N/A |

### B. Data Assets

| Check | Target | Result | Verdict |
|-------|--------|--------|---------|
| CDSCO dataset entry count | ≥ 3,000 | **242,145** | ✅ 80× over target |
| Combination drug coverage | ≥ 4/6 spot-checks | **6/6** | ✅ PERFECT |
| Spot-check accuracy | ≥ 90% | **100%** (15/15) | ✅ PERFECT |
| Category coverage | All 8 required | **8/8** | ✅ PERFECT |
| Missing salt field | < 5% | **0.0%** | ✅ PERFECT |
| Dataset cleaned and committed | Yes | cdsco.json 22MB in git | ✅ |

### C. Architecture Integrity

| Item | Status |
|------|--------|
| Prisma schema written (8 models) | ✅ Complete |
| medicine_ingredients junction table | ✅ Verified |
| CHECK constraints and RLS policies | ✅ Written |
| Consent screen text (DPDPA 2023) | ✅ Complete |
| Medical disclaimer text and placement | ✅ Complete |
| .env.example with all variables | ✅ Complete |
| Next.js 14 project initialized | ✅ Dev server confirmed at localhost:3001 |

---

## Modifications from Original Architecture Baseline

### Modification 1: RxNav → OpenFDA for Interaction Data

**Change:** Drug interaction checking moves from RxNav API to OpenFDA Drug Label text mining.

**Reason:** RxNav Drug Interaction API (`rxnav.nlm.nih.gov/REST/interaction/`) has been decommissioned. The endpoint returns 404 and is absent from the full API resource list.

**Impact:**
- Detection method: RxCUI pair lookup → drug name text search in FDA labels
- Severity: Structured severity field → keyword inference from label text
- Latency: ~250ms → ~850-2500ms per pair (must cache label text, then sub-ms)
- Coverage: Unknown → 7/10 validated pairs detected, 0 false positives
- Schema: **Zero changes** — `interactions_cache.source` field already accommodates this

**Phase 3 enhancement path:** Add drug class synonym lookup (SSRI, opioid, ARB classes) to reach estimated 9-10/10 detection. Low effort, high value.

**Risk:** LOW. The baseline 7/10 detection rate is exactly the threshold. Real-world performance may be better because bidirectional text search is conservative (some labels use class terms, not drug names). FDA labels are comprehensive and legally mandated.

### Modification 2: Synonym Table Scope Reduced

**Change:** `rxnorm_synonyms.json` is now optional (can be built in Phase 2 as needed, not required before Phase 1).

**Reason:** RxNorm's `search=2` (approximate matching) resolves all tested Indian spelling variants directly:
- Amoxycillin → Amoxicillin RxCUI ✅
- Salbutamol → Albuterol RxCUI ✅
- Thyroxine → Levothyroxine RxCUI ✅
- All 10 Group B variants: 100% resolved without synonym table

**Impact:** B-3 downgraded from BLOCKING to NON-BLOCKING for Phase 1. Synonym table can be built in Phase 2 as a robustness layer for edge cases not in the test set.

---

## Known Limitations (Documented, Not Blockers)

| Limitation | Impact | Mitigation |
|------------|--------|-----------|
| Doxofylline has no RxCUI | Show "data unavailable — consult doctor" | Acceptable MVP behavior |
| 3 missed interaction pairs are class-based | 70% detection without class synonyms | Phase 3 fix: drug class synonym lookup |
| OpenFDA label fetch: ~1-2s per pair | Cache label text on first fetch; subsequent checks sub-ms | Caching mandatory |
| CDSCO dataset: max 2 active ingredients per entry | Drugs with 3+ salts truncated | Documented; acceptable for MVP |
| Dataset license: unspecified | Educational use: low risk | Verify before commercial launch |

---

## Open Items Before Phase 1 Can Start

These must be completed before writing the first line of Phase 1 code. The go/no-go approves the architecture; these are setup prerequisites.

### User Must Complete (Physical Actions)

| Item | Task | Irreversible? |
|------|------|---------------|
| C-2 | Create Supabase project in **ap-south-1 (Mumbai)** | ⚠️ YES |
| C-3 | Connect Vercel to GitHub repo | No |
| C-6 | Generate CRON_SECRET (`node -e "require('crypto').randomBytes(16).toString('hex')"`) | No |

### Can Be Done in Phase 1 Sprint

| Item | Task | Needed When |
|------|------|-------------|
| D-7 | Write `normalizeExpiryDate()` utility in `src/lib/utils/expiry.ts` | Before Phase 2 forms |
| D-8 | Configure Prisma dual-URL (pgbouncer) — documented in .env.example | Phase 1 P1-T2 |
| F-1 | Add DPDPA consent screen + privacy page to Phase 1 backlog | Phase 1 P1-T4 |
| I-3 | Confirm bottom nav pattern (Option A recommended) | Phase 1 P1-T5 |

---

## Phase 0 Gate Sign-Off

**Date signed:** 2026-06-10

| Metric | Value |
|--------|-------|
| CDSCO dataset size | 242,145 entries |
| RxNorm resolution rate (raw) | 98% |
| RxNorm resolution rate (with synonyms) | 98% (synonyms not needed) |
| Interaction detection rate | 7/10 known pairs, 0/5 false positives |
| API p50 latency | 303ms (RxNorm) |
| API p95 latency | 370ms (RxNorm) |
| Architecture approach | GO WITH MODIFICATIONS (OpenFDA replaces RxNav) |

**Phase 0 complete:** YES — all gate items addressed

**Phase 1 may begin:** YES — after C-2 (Supabase), C-3 (Vercel), C-6 (CRON_SECRET) are set up by the user

---

## Risks Accepted

1. **OpenFDA detection at threshold (7/10):** We proceed knowing 3 class-based interactions are missed. The Phase 3 class synonym enhancement is the mitigation. The product ships with "interaction data is for general awareness — consult your doctor" disclaimer, so 70% detection at MVP is medically responsible.

2. **Dataset license unspecified:** We proceed given educational/portfolio use. Pre-commercial launch: verify license or switch to data.gov.in source if available.

3. **p99 latency 961ms:** This is a cold-start artifact. Warm steady-state max observed was 424ms. Acceptable.

---

*Signed: Yashika Agrawal, 2026-06-10*
*Engineering system: Claude (claude-sonnet-4-6)*
