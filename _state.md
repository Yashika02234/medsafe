# Project State — MedSafe

## Current Phase

Phase 5 — OCR Scanner

Status: 🔄 IN PROGRESS (P5-T1 through P5-T4 built and verified on Render at <https://medsafe-api-docker.onrender.com>. Real medicine strip photos still needed to validate real-world OCR accuracy. P5-T5 camera capture UI and P5-T6 frontend integration not started.)

(Phase 4 — Notifications & Expiry Alerts remains 🔄 PAUSED: code complete, deployed, live email verified — scheduler setup deliberately deferred. Will revisit later.)

---

## Completed

- [x] Project vision defined
- [x] Tech stack locked
- [x] Architecture designed
- [x] Folder structure created
- [x] .claude memory system initialized
- [x] Master roadmap finalized
- [x] Project backlog created (all phases, all tasks)
- [x] Design system placeholder created
- [x] CDSCO dataset collected and cleaned
- [x] RxNorm resolution validated
- [x] RxNav interactions validated (replaced by OpenFDA — RxNav decommissioned)
- [x] Go/no-go decision made — GO WITH MODIFICATIONS (2026-06-10)

---

## Current Sprint — Phase 0

> ⚠️ Phase 0 is gated. All items in `.claude/outputs/phase-0-lock-checklist.md` must be ✅ before Phase 1 begins.
> The Supabase region selection (C-2) is IRREVERSIBLE — triple-check before clicking Create.

### Ordered Task Sequence

## Phase 1 Sprint — Foundation

| Task ID | Task | Status |
|---------|------|--------|
| P1-T1 | Initialize Next.js Project | ✅ Complete |
| P1-T2 | Set Up Supabase & Prisma | ✅ Complete |
| P1-T3 | Build Auth API Layer | ✅ Complete |
| P1-T4 | Build Auth UI Pages | ✅ Complete |
| P1-T5 | Build Dashboard Layout Shell | ✅ Complete |
| P1-T6 | Landing Page & Deployment | ✅ Complete |
| P1-T7 | CI/CD & Cleanup | ✅ Complete |

---

## Current Task

Phase 4 backend is built, deployed to production (<https://medsafe-nine.vercel.app>), and a real email send is confirmed working end-to-end (see Session 21). The cron route is live and correctly rejects unauthenticated requests in production (verified via curl, 401).

**Deliberately paused here**: scheduler setup (cron-job.org or Vercel Cron) decided against for now — user chose to defer rather than set it up immediately. Without a scheduler, `/api/cron/check-expiry` works but nothing calls it automatically, so no real notification emails go out yet. Phase 4 is not being marked complete until this is revisited.

---

## Next Task

Either: (a) move to Phase 5 (OCR Scanner) and come back to the Phase 4 scheduler later, or (b) set up the scheduler now — options on the table: cron-job.org (free, matches the locked `tech-stack.md` decision) or Vercel's native Cron Jobs (no third-party signup, free on Hobby plan, capped at once/day — would need explicit approval to change the locked tech-stack decision).

---

## Open Questions

- Project name: "MedSafe" is a working name. Final name TBD (see I-2 in lock checklist).
- ~~Design ideology~~ — Resolved 2026-06-17: "Midnight Safe" dark theme finalized and documented in `.claude/memory/design-system.md` (implemented Session 15, formalized with audience/personas Session 27).
- CDSCO data source: primary question for R1 research.
- RxNorm resolution rate: primary question for R4 research. Determines go/no-go.
- Gemini fallback: only relevant if R4 < 40%. See R8 in research plan.

---

## Key Documents

| Document | Location | Status | Purpose |
|----------|----------|--------|---------|
| Architecture Baseline | `.claude/outputs/architecture-baseline.md` | ✅ FINAL (v2) | **Single source of truth** — updated with DB review findings |
| DB Architecture Review | `.claude/outputs/db-architecture-review.md` | ✅ Complete | 18 schema findings, revised schema strategy |
| Phase 0 Research Plan | `.claude/outputs/phase-0-research-plan.md` | 🔄 ACTIVE | **Current work** — exact research methodology |
| Phase 0 Decision Register | `.claude/outputs/phase-0-decision-register.md` | 🔄 ACTIVE | 18 open decisions |
| Phase 0 Lock Checklist | `.claude/outputs/phase-0-lock-checklist.md` | 🔄 IN PROGRESS | Gate before Phase 1 |
| Master Roadmap | `.claude/outputs/master-roadmap.md` | ✅ Final | Phase rationale and strategic decisions |
| Project Backlog | `.claude/outputs/project-backlog.md` | ⚠️ Needs update | Phase 1 needs DPDPA tasks + medicine_ingredients tasks |
| Prompts | `.claude/workflows/prompts.md` | ✅ Ready | Copy-paste session prompts |

---

## Recent Decisions

- All APIs must be completely free (student budget)
- OCR: Tesseract only (EasyOCR REMOVED — OOM on Render 512MB free tier)
- Drug data: RxNav API + RxNorm API (NIH, free, no key needed)
- Indian brand → salt mapping: CDSCO public data (scrape target: 3,000+ entries)
- **SCHEMA: medicine_ingredients junction table replaces salts[]/rxcuis[] arrays** (DB review N-1)
- **SCHEMA: expiry_month and expiry_year REMOVED** — derive from expiry_date (DB review N-2)
- **SCHEMA: CHECK constraints on all categorical TEXT fields** (DB review N-3)
- **SCHEMA: Partial unique index on family_members for is_self** (DB review R-2)
- **SCHEMA: notification_log gains status + error_message fields** (DB review A-1)
- **SCHEMA: checked_pairs gains needs_recheck field** (DB review I-1)
- **SCHEMA: medicine_scan_log added from Phase 1 (empty until Phase 5)** (DB review O-1)
- **SCHEMA: consent_text_version added to users** (DB review A-2)
- **SCHEMA: severity_ordinal added to interactions_cache** (DB review I-3)
- Interaction engine: two-endpoint pattern (GET=cache, POST=batch check)
- CDSCO as static JSON + client-side Fuse.js
- DPDPA 2023 compliance from Phase 1
- Supabase in ap-south-1 (Mumbai)
- FastAPI deferred to Phase 5 (OCR only)
- **INTERACTION ENGINE: RxNav Drug Interaction API DECOMMISSIONED** — OpenFDA label text mining replaces it. 7/10 detection, 0 false positives. Schema unchanged. (P0-T4, 2026-06-10)

---

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 0 | Planning & Data Validation | ✅ Complete |
| 1 | Foundation (Auth + DB + Deploy) | ✅ Complete |
| 2 | Medicine Cabinet (Core CRUD) | ✅ Complete |
| 3 | Drug Interaction Engine (KEY DIFFERENTIATOR) | ✅ Complete |
| 4 | Notifications & Expiry Alerts | 🔄 Email send verified, deploy/cron-job.org remain |
| 5 | OCR Scanner (FastAPI) | 🔄 P5-T1 through P5-T4 done; P5-T5/T6 remain |
| 6 | Family Mode, Polish & Launch | ⬜ Not Started |

---

## Session Log

### Session 26 — 2026-06-17 (P5-T4 — OCR API endpoint)

- User deleted the old non-Docker `medsafe-api` Render service; `medsafe-api-docker` is the one real backend going forward.
- Built P5-T4: `app/routes/ocr.py` (`POST /ocr/scan`) — validates content-type (JPEG/PNG only, 400), size (<5MB, 413), runs preprocess → extract → parse, returns `OCRScanResponse` (`app/models/schemas.py`); `app/services/rate_limiter.py` — simple in-memory sliding window, 10 requests/minute per client IP (429 once exceeded; acceptable to lose this state on restart at MVP scale, single free-tier instance).
- `tests/test_ocr_route.py` — 5 cases (valid scan, invalid type, oversized, corrupt image, rate-limit threshold), all passing via FastAPI's `TestClient`.
- **Found and fixed a real bug during manual curl verification** (not caught by the automated tests): `parse_medicine_name`'s line-grouping used `line_num` alone, but Tesseract's `line_num` resets per `block_num` — so two unrelated lines from different blocks can share `line_num=1` and get merged. A real two-line test image returned the brand name and expiry date concatenated together. Fixed by grouping on the composite `(block_num, par_num, line_num)` key in both `ocr_service.py` (now captures block_num/par_num) and `text_parser.py`. Also tightened the existing pytest assertion, which was too loose (substring check) to have caught this on its own. Logged in `defects.md`.
- Also hit and worked around an MSYS2/git-bash quirk: absolute POSIX paths (`/tmp/notes.txt`) passed to `curl -F file=@path` get mangled by git-bash's automatic path translation and silently fail (`curl: (26)`) — relative paths work fine. Not a project bug, just an environment gotcha for future manual curl testing.
- P5-T1 through P5-T4 all done and verified (locally + manual curl + automated tests). Remaining: P5-T5 (camera capture UI), P5-T6 (post-scan review + cabinet integration), and real medicine strip photos to validate actual OCR accuracy (everything tested so far is synthetic).

### Session 25 — 2026-06-17 (P5-T3 + Tesseract on Render — and a real process failure)

- Installed Tesseract locally via Chocolatey (elevated PowerShell, user-run) at `C:\Program Files\Tesseract-OCR\tesseract.exe`, for local OCR testing alongside Render.
- Built P5-T3: `app/services/ocr_service.py` (Tesseract extraction via `pytesseract.image_to_data`, mean confidence + per-word data; `TESSERACT_CMD` env override for local dev) and `app/services/text_parser.py` (expiry regex preferring labeled "EXP"/"EXPIRY" dates over a bare MM/YYYY fallback; medicine-name heuristic = tallest-average-word-height OCR line, since strips print the brand name largest). `tests/test_ocr_pipeline.py` — 6 cases, all passing against the real local Tesseract install on synthetic strip images.
- **Process failure, logged in `defects.md`**: created `backend/Dockerfile` (needed since Render's native Python runtime can't `apt-get install tesseract-ocr`) but never committed/pushed it, then spent several rounds with the user guessing at Render UI field semantics (Dockerfile Path / Docker Build Context / Root Directory interactions) and even creating a second fresh Render service — all while the actual cause was that the file simply didn't exist in the repo Render was cloning. Caught by finally running `git log --oneline -- backend/Dockerfile` and seeing zero commits. Lesson logged: verify a file is actually pushed before sending the user to debug it in an external dashboard.
- Once actually pushed, the Docker deploy on the new `medsafe-api-docker` Render service succeeded. Verified Tesseract is genuinely present by extending `GET /health` to report `tesseract_version` (avoids needing Render's Shell feature, which is a paid add-on) — confirmed locally (`5.5.0.20241111`) and live on Render (`5.5.0`).
- User is deleting the old non-Docker `medsafe-api` service to avoid confusion; `https://medsafe-api-docker.onrender.com` is the one real backend URL going forward — needs to replace the old URL in Vercel's `FASTAPI_BACKEND_URL` if that was already set.
- P5-T1, P5-T2, P5-T3 all done. Remaining: P5-T4 (OCR API endpoint), P5-T5 (camera capture UI), P5-T6 (post-scan review + integration), and real medicine strip photos to validate actual OCR accuracy (everything tested so far is synthetic text images).

### Session 24 — 2026-06-17 (P5-T2 — image preprocessing pipeline)

- Built `backend/app/services/image_preprocessor.py`: load (Pillow) → resize if >2000px wide → grayscale → deskew (OpenCV `minAreaRect`) → adaptive threshold. Returns a PIL `Image` (mode "L"), not a file — caller's choice what to do with it.
- No real medicine strip photos available yet, so verified against synthetic test images (rendered text, deliberately rotated) instead — real photos are still needed before P5-T2 can be considered fully done per its own acceptance criteria ("text visually clearer" needs real strips, not synthetic ones).
- **Found and fixed a real deskew bug via this testing**: a wide, single-line, *already-upright* synthetic image (the realistic case — most phone photos of a strip are roughly straight) came out completely blank after preprocessing. Root cause: `cv2.minAreaRect`'s angle convention (OpenCV 4.5+) reports near-90° for already-horizontal text, not near-0°; the deskew correction formula was copied from a pre-4.5-convention tutorial and never normalized that case, so it applied a spurious ~90° rotation that pushed the text out of frame entirely. Fixed by normalizing the raw angle into (-45°,45°] before negating. Logged in `defects.md` — the general lesson: deskew bugs often only surface on the "no correction needed" case, so that case must be tested explicitly, not just a rotated one.
- Converted the ad-hoc verification into a proper test suite per `coding-rules.md` (pytest for all backend services): `backend/tests/test_image_preprocessor.py` — 6 cases covering rotated/upright/wide/PNG/JPEG inputs (including the bug above as a permanent regression case), a max-width cap check, and an invalid-input error case. All 6 pass.
- Remaining for P5-T2: get ~10 real medicine strip photos from the user to do the actual required visual-quality check and confirm real-world performance (lighting, glare, real fonts, foil backgrounds — none of which a synthetic rendered-text image can represent).

### Session 23 — 2026-06-17 (P5-T1 — Render deployment verified)

- User created a free Render account and deployed `backend/` as a Python web service at `https://medsafe-api.onrender.com`.
- Verified live: `GET /health` → `200 {"status":"ok"}`; CORS preflight from `https://medsafe-nine.vercel.app` → correct `access-control-allow-origin` header.
- **P5-T1 is functionally done** except one acceptance criterion: Tesseract itself (the OCR binary `pytesseract` wraps, not yet installed) isn't on the Render service. Render's standard Python runtime doesn't expose apt-get for system packages — getting Tesseract on there will need a Dockerfile-based deploy instead of the native Python runtime used for this first deploy. Doesn't block anything yet (`/health` doesn't need it) but is a known next step before P5-T2/T3 (image preprocessing + OCR extraction) can run on Render.
- Still need to add `FASTAPI_BACKEND_URL=https://medsafe-api.onrender.com` to Vercel env vars (not yet consumed by any frontend code — nothing calls it until P5-T6's proxy route).

### Session 22 — 2026-06-17 (Phase 5 kickoff — FastAPI scaffold)

- User chose to defer the Phase 4 scheduler (cron-job.org/Vercel Cron) for now and move to Phase 5. Phase 4 stays marked PAUSED, not complete — the code works but nothing triggers it automatically yet.
- **Found a stale-backlog conflict before writing any code**: `project-backlog.md`'s Phase 5 tasks (P5-T1, P5-T3) call for an EasyOCR fallback when Tesseract confidence is low, and list `easyocr` in `requirements.txt`. But `tech-stack.md` has a **locked decision removing EasyOCR entirely** (needs 1.5-2GB RAM, Render free tier is 512MB, hard OOM crash) — low-confidence results are meant to be handled by a user-correction UI, not a second OCR engine. Followed the locked decision: Tesseract only, no EasyOCR anywhere in `requirements.txt` or the pipeline design.
- P5-T1 (Initialize FastAPI Project) built and verified locally — Render deploy itself is pending (needs the user's free Render account, requested):
  - `backend/requirements.txt` — fastapi, uvicorn, python-multipart, pillow, opencv-python-headless, pytesseract (no easyocr)
  - `backend/app/config.py` — `ALLOWED_ORIGINS` from env, defaults to `localhost:3000`
  - `backend/app/main.py` — FastAPI app, CORS middleware, `GET /health`
  - `backend/.env.example`
  - Created a local `.venv`, installed dependencies, ran `uvicorn app.main:app --port 8000` — confirmed `GET /health` returns `{"status":"ok"}` and a CORS preflight from `http://localhost:3000` returns the correct `access-control-allow-origin` header.
- Remaining for P5-T1: user creates a free Render account, connects the GitHub repo, configures build/start commands + the Tesseract apt-get build step, deploys, and confirms `/health` responds on the live Render URL. Then add `FASTAPI_BACKEND_URL` to Vercel env vars.

### Session 21 — 2026-06-17 (Phase 4 — live Resend email verified)

- User created a free Resend account and provided an API key. Added `RESEND_API_KEY`/`RESEND_FROM_EMAIL` to `frontend/.env.local`; restarted the dev server (Next.js doesn't hot-reload `.env.local`).
- **Discovered a Resend sandbox constraint during testing**: unverified accounts (no custom domain) can only send to the email address the Resend account itself was signed up with, not arbitrary recipients — Resend returns a 403 explaining this, which is exactly what the first test attempt hit (tried sending to a different address than the Resend account's own email). Not a bug in our code — `sendExpiryAlert` correctly surfaced the 403 as a `'failed'` log entry with the real error message, exactly as designed.
- Re-ran the test against the correct address (the email the Resend account was actually signed up with) — **`processExpiryAlerts()` returned `sent: 1`, confirming a real email was delivered** end-to-end: medicine expiring today → tiered as `expiry_1` → sent via Resend → logged `status: 'sent'` in `notification_log`.
- Test account and all data deleted afterward.
- Remaining for Phase 4: deploy to Vercel (add `RESEND_API_KEY`/`RESEND_FROM_EMAIL` to Vercel env vars), set up cron-job.org (free) to hit `/api/cron/check-expiry` daily, then mark Phase 4 complete.

### Session 20 — 2026-06-17 (Phase 4 kickoff — Notifications & Expiry Alerts)

- Scoped against the actual schema: `notification_log` table + `users.notification_preference` already existed from the Phase 1 migration, no new tables needed.
- Found the Settings page showed 4 separate notification toggles (30-day/7-day/1-day/interactions) with no real state behind them, but the schema only has one binary flag and the backlog spec calls for a single toggle — user confirmed collapsing to 1 real toggle rather than migrating the schema to support 4.
- Built:
  - `src/lib/clients/resend.ts` — `sendExpiryAlert()`, HTML email with branding + footer disclaimer
  - `src/lib/services/expiryChecker.ts` — range-based tiers (≤1/≤7/≤30 days), dedup via `notification_log` (a `'sent'` row permanently retires that medicine+tier; `'failed'` rows don't block retry, matching the schema's documented intent; preference='none' logs `'skipped_preference'` without attempting a send)
  - `POST /api/cron/check-expiry` — `X-Cron-Secret` header check against the `CRON_SECRET` already generated in Phase 1
  - `PUT /api/users/preferences` + `NotificationToggle.tsx` — real single toggle wired to `users.notification_preference`, replacing the static 4-toggle stub
- **Live-verified the full logic with two temp test accounts** (created and deleted afterward): medicine expiring in 25 days correctly tiered as `expiry_30`; medicine expiring in 5 days under a `preference='none'` user correctly logged `skipped_preference` with no send attempt; cron's secret check correctly rejected missing/wrong secrets (401) and accepted the right one; manually marking a row `'sent'` and re-running cron correctly excluded that medicine+tier while the preference-skip repeated (as designed); preferences API correctly validated/rejected bad input and unauthenticated calls.
- **Blocked**: actually sending a real email needs a live `RESEND_API_KEY` (free tier, no card) — `sendExpiryAlert` already handles the missing-key case gracefully (`status: "failed"`, `error_message: "RESEND_API_KEY not configured"`, confirmed in the test above). User is getting a key; once added to `.env.local` we can verify a real send and move to P4-T4 wrap-up (production deploy + cron-job.org setup).
- `tsc --noEmit` and `eslint` both clean throughout.

### Session 19 — 2026-06-17 (Phase 3 wrap-up: drug-class detection + stale UI text)

- Fixed stale "Phase 2"/"Phase 1" copy found by the user in the `/family` page (Family Mode banner + "Add Member" stub both said "Phase 2" — actual roadmap has Family Mode in Phase 6) and `/settings` (footer said "Phase 1 Build"). Leftover from early placeholder text never updated as phases got re-scoped.
- Built the drug-class detection enhancement (the last open Phase 3 item) to fix the 3 known misses from `.claude/outputs/phase-00/interaction-validation-report.md`:
  - `src/lib/data/drugClasses.ts` — static table (SSRI, opioid, ARB, ACE inhibitor, K-sparing diuretic; ~25 well-established drugs). Not RxClass API — avoids another external dependency for something this small and fixed.
  - `interactionEngine.ts`: class-term fallback matching (if a label doesn't name the other drug, fall back to its class terms like "SSRI"/"opioid") fixes misses #1/#2; a small rule-based class-pair table (ARB/ACE inhibitor + K-sparing diuretic → hyperkalemia) fixes miss #3, which is undetectable by text-mining since neither label names the other drug — checked before any OpenFDA call, so it's also faster.
  - DB migration: `interactions_cache.source` constraint extended to `('openfda', 'gemini', 'class_rule')` so rule-based (non-FDA-text) results aren't mislabeled as `'openfda'`.
- **Live-verified all 3 fixes** with a temp test account (created and fully deleted afterward): Sertraline+Tramadol → correctly detected SEVERE (serotonin syndrome, via SSRI class term); Losartan+Spironolactone → correctly detected MODERATE (hyperkalemia, rule-based, sub-second since it skips OpenFDA entirely).
- **Found and fixed another severity-classification bug during that test**: Diazepam+Codeine (expected "CNS dep SEVERE" per the validation report) initially classified as MILD — matched FDA text said "respiratory depression," which wasn't in the keyword list. Added `"respiratory depression"` and `"coma"` to `SEVERE_KEYWORDS`; re-verified as SEVERE. Logged in `defects.md` — same root cause pattern as the earlier Warfarin+Aspirin bug (keyword list built from spec examples, not validated against real text).
- **Phase 3 — Drug Interaction Engine marked COMPLETE.** Phase 4 (Notifications & Expiry Alerts) is next.

### Session 18 — 2026-06-17 (Phase 3 UI polish + Phase 2/3 completeness audit)

- Built `InteractionBanner.tsx` (dismissible, shown on `/medicines` when severe interactions exist, links to `/interactions`) and a ⚠️ badge + "view details" link on `MedicineCard` for medicines involved in an interaction. Wired `medicines/page.tsx` to fetch `/api/interactions` alongside medicines and refresh both after add/edit/delete.
- **Visual verification in a real browser** (no headless-browser tooling available in this environment — user ran the click-through manually): signed up a test account, added Uniwarfin (Warfarin) + Ecosprin (Aspirin) via the CDSCO search, confirmed the severe banner appeared and dismissed correctly, the ⚠️ badge showed on both cards, the Edit sheet pre-filled correctly, the two-step delete confirm worked, and `/interactions` rendered the real SEVERE warning with FDA text + disclaimer. All matched expectations, no console errors reported.
- **Re-audited full Phase 2 completeness and found a real gap**: `src/app/(dashboard)/dashboard/page.tsx` (the actual visible Dashboard) had its own duplicated Prisma queries and a **hardcoded `"—"` Alerts stat** — it never called the interaction engine, despite all of Phase 3's work. The `/api/dashboard/summary` route (Phase 2) was dead code with zero call sites, which masked this. Fixed: dashboard page now calls `checkAllInteractions` directly; deleted the dead route. User confirmed the fix in-browser. Logged in `defects.md`.
- Phase 2 confirmed fully complete (P2-T1 through P2-T7, including this session's fix). Phase 3 MVP gate confirmed met end-to-end, including on the page a user actually sees.

### Session 17 — 2026-06-17 (Phase 3 kickoff)

- Re-scoped Phase 3 against the actual codebase before implementing: backlog's P3-T1/T2 (RxNorm resolution) were already shipped in Phase 2 (`src/lib/rxnorm.ts`, synchronous resolution on medicine add); backlog's P3-T3/T4 describe a decommissioned RxNav interaction client — followed `architecture.md`'s OpenFDA label-text-mining approach instead.
- **Found and fixed a real DB blocker**: `interactions_cache.source` had a CHECK constraint of `IN ('rxnav', 'gemini')` — would have rejected every Phase 3 write. Migrated to `IN ('openfda', 'gemini')` directly against the live DB; updated `post-migration.sql` and `schema.prisma` comments to match.
- **Found and fixed a compliance-text accuracy issue**: the locked medical disclaimer (`legal.ts`) said interaction data is "sourced from the NIH database" — factually wrong now that OpenFDA (FDA) is the source. Updated `MEDICAL_DISCLAIMER.inline`, `.full.source`, and `CONSENT_SCREEN.howWeUseIt` to accurately disclose both NIH RxNorm (name resolution) and OpenFDA (interaction lookup) as third-party recipients of medicine names. Bumped `CONSENT_TEXT_VERSION` to `v1.1-2026-06` per the file's own versioning rule (third-party disclosure changed). Also fixed `signup/route.ts`, which was hardcoding `"v1.0"` instead of importing the constant — the version bump would have been silently ignored otherwise.
- Built the interaction engine:
  - `src/lib/clients/openfda.ts` — fetches/caches FDA label `drug_interactions` text per generic name (module-level cache, 5s timeout)
  - `src/lib/services/interactionEngine.ts` — generates unique rxcui pairs per family member, checks `checked_pairs`/`interactions_cache` first, else queries OpenFDA both directions, classifies severity, caches result
  - `src/app/api/interactions/route.ts` — GET endpoint, same ownership-verification pattern as `/api/medicines`
  - `src/app/api/dashboard/summary/route.ts` — real interaction count (was hardcoded 0)
  - `src/components/interactions/InteractionWarningCard.tsx` + rewired `/interactions` page to real data (filter tabs, loading skeleton, "no interactions" and "data unavailable" states both carry the inline disclaimer per `design-system.md`'s non-negotiable rule)
- **Live end-to-end verification** (temp test account, created and fully deleted afterward): added Warfarin + Aspirin → correctly detected and classified SEVERE (matches the Phase 0 validation report's expected result) → second call hit cache (no repeat OpenFDA call) → dashboard showed `interactions: 1` → deleted Aspirin → warning disappeared, dashboard showed `interactions: 0`.
- **Found and fixed a classification bug during that test**: first keyword set used exact bigrams (`"significant bleeding"`, `"monitor closely"`) which didn't match real FDA text (`"closely monitor"`, `"risk of Bleeding"` — different word order/phrasing). Under-classified a textbook-severe anticoagulant+antiplatelet interaction as MODERATE. Fixed to match on single significant terms instead. Logged in `defects.md` along with a string-vs-numeric rxcui ordering gotcha hit while debugging.
- MVP gate ("interactions detected, cached, displayed") is met. Not yet done: per-medicine interaction badge on `MedicineCard`, `InteractionBanner` for severe warnings, drug-class-based detection enhancements for the 3 known class-based misses (SSRI/opioid/ARB class terms) documented in the Phase 0 report. Production smoke test not run (same reasoning as P2-T7 — same code, same Supabase project as dev).

### Session 16 — 2026-06-17

- P2-T5 completed: Edit & Delete Medicine
  - `src/components/medicines/EditMedicineSheet.tsx` (new): edits expiry/quantity/dosage via existing `PUT /api/medicines/[id]`, brand/salts shown read-only
  - `MedicineCard.tsx`: added Edit button; Remove now requires a two-step inline confirm before the DELETE call fires (previously fired immediately)
  - `medicines/page.tsx`: wired `editingMedicine` state, renders `EditMedicineSheet`, refreshes list on save
- P2-T7 completed: RLS/isolation verification & Phase 2 wrap-up
  - Code audit of all medicine/dashboard routes for ownership checks
  - **Found and fixed an IDOR**: `POST /api/medicines` accepted an optional `family_member_id` from the request body without verifying it belonged to the caller. Fixed to verify ownership before use, 404 otherwise. Not exploitable via current UI (Family Mode is Phase 6) but was live in the API. Logged in `defects.md`.
  - **Confirmed Prisma bypasses RLS entirely** — it connects via `DATABASE_URL`/`DIRECT_URL` (direct Postgres connection), not the Supabase client, so `rls-policies.sql` policies never apply to Next.js API routes. All isolation is enforced by `user_id`/`family_member` filters in application code. Logged in `defects.md` as a standing audit note for future routes.
  - Live two-account isolation test: created two temporary Supabase test accounts, ran real HTTP requests against the dev server — confirmed User B cannot list, edit (`PUT` → 404), or delete (`DELETE` → 404) User A's medicine; confirmed the IDOR fix blocks cross-account `family_member_id` injection (404); confirmed dashboard summary counts are per-user. All test accounts and data deleted afterward (verified zero leftover rows).
  - Production (Vercel) smoke test skipped by user decision — dev-server test already exercised the same code against the same Supabase project.
- **Phase 2 — Medicine Cabinet (Core CRUD) marked COMPLETE.** Phase 3 (Drug Interaction Engine) is next.

### Session 1 — 2026-06-08
- Created project engineering system (.claude folder, all memory files)
- Designed initial architecture
- Created implementation roadmap

### Session 4 — 2026-06-09
- DB Architecture Review by Principal DB Engineer (18 findings)
- CRITICAL: medicine_ingredients junction table replaces salts[]/rxcuis[] parallel arrays
- HIGH: expiry_month/expiry_year dropped (derived from expiry_date)
- HIGH: CHECK constraints added to all categorical TEXT fields
- HIGH: Partial unique index added for is_self
- HIGH: notification_log gains status/error_message fields
- HIGH: resolution_error + resolution_attempt_count added to medicines
- NEW TABLES: medicine_scan_log (empty until Phase 5)
- Architecture baseline updated with revised schema
- ND-5 revised: junction table replaces array approach
- ND-13, ND-14 added

### Session 5 — 2026-06-10

- BOOTSTRAP complete: .gitattributes, .gitignore, .nvmrc, README.md, .vscode/launch.json, .github/pull_request_template.md, prisma/README.md all added at root
- Removed spurious nested medsafe/ subdirectory (4 files misplaced during initial bootstrap)
- P0-T0 complete: wrote prisma/schema.prisma (8 models), post-migration.sql (10 CHECK constraints, 2 partial unique indexes, 2 performance indexes), rls-policies.sql (RLS on 6 tables)
- All 6 P0-T0 cross-checks passed
- Lock checklist updated: D-1 through D-6 marked addressed, D-3 text corrected (junction table replaces arrays), C-1/H-1/H-3 marked complete
- P1-T1 complete (Next.js 14 initialized) — CSS conflict fixed: removed @import "shadcn/tailwind.css" from globals.css, removed outline-ring/50 (v4-only), expanded tailwind.config.ts with all shadcn color tokens + darkMode + borderRadius + fontFamily + ringWidth
- Dev server running at localhost:3001, HTTP 200 confirmed
- P0-T0b complete: wrote frontend/.env.example (Supabase, Prisma dual-URL, FastAPI, Resend, CRON_SECRET, SENTRY_DSN)
- P0-T0d complete: consent screen text + medical disclaimer — .claude/outputs/phase-00/consent-screen-text.md, design-system.md compliance section, frontend/src/lib/legal.ts
- Lock checklist updated: F-2, F-3, H-4 marked complete
- P0-T1 complete: sourced junioralive/Indian-Medicine-Dataset (253,973 entries, 44% combo drugs, 0% missing salt, 8/8 categories) — downloaded to backend/data/cdsco_raw.csv (31MB, git-ignored)
- Lock checklist B-1, B-2 marked complete

---

### Session 15 — 2026-06-16

- Midnight Safe dark theme implemented across all screens
  - globals.css: full `--ms-*` token set, body font, animations (fadeUp, pulseAlert, scanLine, shimmer)
  - landing page, auth layout, login, signup — all rewritten with native HTML + Tailwind arbitrary values (no shadcn)
  - BottomNav: 5-tab layout (Home | Cabinet | + FAB | Alerts | Family), no inline styles, TypeScript clean
  - Dashboard home: greeting, family chips, 3-col stats grid, expiring soon empty state
  - /medicines: search bar, filter chips, empty state
  - /interactions: filter tabs, empty state, preview alert cards (variant-based Tailwind, no inline styles)
  - /family: self card, add member card, settings gear → /settings
  - /settings: profile card, notification toggles, sign out button (client component)
- P1-T7 complete: CI/CD & Cleanup
  - .github/workflows/ci.yml: type check → lint → build on push/PR to main
  - Node 20, npm ci, dummy env vars for compilation-only CI
  - .github/workflows/.gitkeep placeholder deleted
- Phase 1 marked COMPLETE. Phase 2 begins next.

### Session 14 — 2026-06-15

- P1-T6 complete: Landing Page & Deployment
  - src/app/page.tsx: hero + 4 feature cards + 3-step how-it-works + footer with MEDICAL_DISCLAIMER.footer
  - src/app/disclaimer/page.tsx: full MEDICAL_DISCLAIMER.full content, back link to /
  - Fixed: Base UI Button doesn't support asChild — replaced with buttonVariants applied directly to Link
  - Deleted spurious root package.json + node_modules (Prisma artifact from first generate run)
  - Committed 51 files (Phase 1 complete), pushed to GitHub
  - Vercel auto-deploy triggered on push to main

### Session 13 — 2026-06-15

- P1-T5 complete: Dashboard Layout Shell
  - src/components/shared/BottomNav.tsx: 5-tab fixed bottom nav (Home, Medicines, Interactions, Family, Settings), active state via usePathname, 44px touch targets, aria-current
  - src/app/(dashboard)/layout.tsx: max-w-lg centered, pb-24 clears nav, MEDICAL_DISCLAIMER.footer on every page
  - src/app/(dashboard)/dashboard/page.tsx: server component, fetches user via Supabase, greeting with first name, 3 summary cards (—/placeholder), disabled Add medicine CTA
  - Stub pages: /medicines, /interactions, /family, /settings — "Coming in Phase X" with icon
  - TypeScript: zero errors

### Session 12 — 2026-06-15

- P1-T4 complete: Auth UI Pages
  - Installed shadcn components: button, input, label, card, checkbox
  - src/lib/utils.ts: cn() utility auto-created by shadcn CLI
  - src/app/(auth)/layout.tsx: centered card layout, MEDICAL_DISCLAIMER.footer in footer
  - src/app/(auth)/login/page.tsx: email + password form, Zod client validation, generic error message, redirect to /dashboard on success
  - src/app/(auth)/signup/page.tsx: name + email + password + CONSENT_SCREEN terms checkbox (required) + notifications checkbox (optional), DPDPA-compliant, handles email confirmation pending state
  - Zod v4 fix: errorMap → error in literal schema
  - TypeScript: zero errors

### Session 11 — 2026-06-15

- P1-T3 complete: Auth API Layer
  - Installed zod v4 for request validation
  - src/middleware.ts: session refresh on every request, redirect unauthenticated → /login, redirect authenticated away from /login /signup
  - src/lib/auth.ts: getSession() + requireAuth() helpers for all protected API routes
  - POST /api/auth/signup: validates email/password/name/consent, calls supabase.auth.signUp(), creates users + family_members (self) in Prisma transaction
  - POST /api/auth/login: validates credentials, generic error message (no email enumeration)
  - POST /api/auth/logout: calls supabase.auth.signOut()
  - GET /api/auth/callback: exchanges Supabase email confirmation code for session, redirects to /dashboard
  - TypeScript: zero errors (npx tsc --noEmit clean)
- NOTE for user: add /api/auth/callback to Supabase Dashboard → Auth → URL Configuration → Redirect URLs

### Session 10 — 2026-06-15

- C-2 complete: Supabase project created in ap-south-1 (Mumbai), project ref: paekzsfilthxwoedllyq
- C-3 complete: Vercel connected to GitHub repo
- C-6 complete: CRON_SECRET generated and stored in frontend/.env.local
- P1-T2 complete: Supabase & Prisma set up
  - Installed @supabase/supabase-js, @supabase/ssr, prisma@5, @prisma/client@5 (v7 downgraded — breaking change in datasource config)
  - prisma/schema.prisma: generator output set to ../frontend/node_modules/.prisma/client
  - prisma/.env created (git-ignored) for Prisma CLI env var loading
  - package.json: postinstall + db:migrate scripts added; prisma.schema path configured
  - Migration 20260615105343_init applied — all 8 tables created in Supabase
  - post-migration.sql applied: 10 CHECK constraints + 2 partial unique indexes + 2 perf indexes
  - rls-policies.sql applied: RLS enabled on 6 user-data tables, verified via pg_tables SELECT
  - frontend/src/lib/prisma.ts: singleton Prisma client created
  - frontend/src/lib/supabase/client.ts: browser Supabase client created
  - frontend/src/lib/supabase/server.ts: server-side Supabase client created (SSR-safe)
- Phase 1 status updated to IN PROGRESS

### Session 9 — 2026-06-10 (continued)
- P0-T5 complete: Phase 0 Lock Checklist reviewed, go/no-go signed off
- Decision: GO WITH MODIFICATIONS
- Modification 1: OpenFDA label text mining replaces decommissioned RxNav interaction API
- Modification 2: Synonym table downgraded to optional (RxNorm search=2 handles all Indian variants)
- Phase 0 status updated to COMPLETE in _state.md
- Blockers before Phase 1: User must complete C-2 (Supabase Mumbai), C-3 (Vercel), C-6 (CRON_SECRET)

### Session 8 — 2026-06-10 (continued)
- P0-T4 complete: RxNav Drug Interaction API DECOMMISSIONED — all /REST/interaction/ paths return 404
- Validated OpenFDA label text mining as replacement: 7/10 known pairs detected (threshold), 0/5 false positives
- 3 misses are class-based interactions (SSRI/opioid/ARB class — Phase 3 fix via drug class synonyms)
- OpenFDA latency: ~850-2500ms per pair, but must cache label text — subsequent checks sub-ms
- Architecture change documented: architecture.md updated, defects.md entry added
- Report: .claude/outputs/phase-00/interaction-validation-report.md

### Session 7 — 2026-06-10 (continued)
- P0-T3 complete: RxNorm API validated — 50 sequential calls from India
- Resolution rate: 49/50 = 98% (threshold was ≥ 40%)
- Latency: p50=303ms, p95=370ms, p99=961ms cold start (threshold was p95 < 800ms)
- All Indian spelling variants (Amoxycillin, Salbutamol, Thyroxine, etc.) resolve via search=2
- Only failure: Doxofylline (niche theophylline analogue, not FDA-approved, no RxCUI)
- Gemini fallback NOT needed (rate >> 40%)
- Synonym table (B-3) now optional safety net, not critical
- Report: .claude/outputs/phase-00/api-latency.md

### Session 6 — 2026-06-10 (continued)
- P0-T2 complete: wrote backend/scripts/clean_cdsco.js, ran cleaning pipeline
- Input: 253,973 rows → Output: 242,145 entries (7,905 discontinued + 4 non-allopathy + 3,919 exact dupes removed)
- frontend/public/data/cdsco.json: 22.17 MB uncompressed, ~5.54 MB gzip — committed to git
- Spot-checks passed: Dolo 650, Crocin, Thyronorm, Combiflam, Glycomet-GP, Ecosprin all correct
- Phase 2 Fuse.js note added: pre-built index + minMatchCharLength:3 + threshold:0.35

---

*Last updated: 2026-06-17*
