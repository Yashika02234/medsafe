# Project State — MedSafe

## Current Phase

Phase 1 — Foundation (Auth + DB + Deploy)

Status: 🔄 IN PROGRESS

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
| P1-T6 | Landing Page & Deployment | ⬜ |
| P1-T7 | CI/CD & Cleanup | ⬜ |

---

## Current Task

**P1-T6: Landing Page & Deployment**

---

## Next Task

P1-T7: CI/CD & Cleanup

---

## Open Questions

- Project name: "MedSafe" is a working name. Final name TBD (see I-2 in lock checklist).
- Design ideology: Awaiting design system input (Claude Design / Google Stitch / other). See I-1 in lock checklist.
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
| 1 | Foundation (Auth + DB + Deploy) | 🔄 In Progress |
| 2 | Medicine Cabinet (Core CRUD) | ⬜ Not Started |
| 3 | Drug Interaction Engine (KEY DIFFERENTIATOR) | ⬜ Not Started |
| 4 | Notifications & Expiry Alerts | ⬜ Not Started |
| 5 | OCR Scanner (FastAPI) | ⬜ Not Started |
| 6 | Family Mode, Polish & Launch | ⬜ Not Started |

---

## Session Log

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

*Last updated: 2026-06-15*
