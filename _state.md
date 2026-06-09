# Project State — MedSafe

## Current Phase

Phase 0 — Planning & Data Validation

Status: IN PROGRESS

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
- [ ] CDSCO dataset collected and cleaned
- [ ] RxNorm resolution validated
- [ ] RxNav interactions validated
- [ ] Go/no-go decision made

---

## Current Sprint — Phase 0

> ⚠️ Phase 0 is gated. All items in `.claude/outputs/phase-0-lock-checklist.md` must be ✅ before Phase 1 begins.
> The Supabase region selection (C-2) is IRREVERSIBLE — triple-check before clicking Create.

### Ordered Task Sequence

| Order | Task ID | Task | Status | Blockers |
|-------|---------|------|--------|----------|
| 0 | BOOTSTRAP | Create GitHub repo + project structure + VS Code setup | ⬜ | None — do this first |
| 1 | P0-T0 | Write final prisma/schema.prisma per architecture baseline | ⬜ | Bootstrap |
| 2 | P0-T0b | Write .env.example with all required vars + comments | ⬜ | P0-T0 |
| 3 | P0-T0c | ~~Create GitHub repo~~ (moved into Bootstrap above) | ✅ | — |
| 4 | P0-T0d | Write consent screen text and medical disclaimer text | ⬜ | None |
| 5 | P0-T1 | Research + source CDSCO dataset (3,000+ entries target) | ⬜ | None |
| 6 | P0-T2 | Clean + structure CDSCO dataset | ⬜ | P0-T1 |
| 7 | P0-T3 | Validate RxNorm API: resolution rate + latency measurement | ⬜ | P0-T2 |
| 8 | P0-T4 | Validate RxNav API: known interaction pairs end-to-end | ⬜ | P0-T3 |
| 9 | P0-T5 | Complete Phase 0 Lock Checklist + formal go/no-go decision | ⬜ | All above |
| 10 | C-2 | ⚠️ Create Supabase project in ap-south-1 (Mumbai) — IRREVERSIBLE | ⬜ | P0-T5 go=GO |

**Gate G0:** All checklist items in `phase-0-lock-checklist.md` checked, go/no-go signed off → Phase 1 unlocked

---

## Next Phase Preview — Phase 1 (Foundation)

| Task ID | Task | Effort |
|---------|------|--------|
| P1-T1 | Initialize Next.js Project | 1 session |
| P1-T2 | Set Up Supabase & Prisma | 1 session |
| P1-T3 | Build Auth API Layer | 1 session |
| P1-T4 | Build Auth UI Pages | 1 session |
| P1-T5 | Build Dashboard Layout Shell | 1 session |
| P1-T6 | Landing Page & Deployment | 1 session |
| P1-T7 | CI/CD & Cleanup | 1 session |

---

## Current Task

**BOOTSTRAP: Create GitHub Repository and Project Structure**

Execution plan: `.claude/outputs/phase-00/bootstrap-plan.md`

Execute Phases A through L in the bootstrap plan (in order):
- A: Machine setup (git global config, Node.js 20)
- B: Create GitHub repository (public, no auto-init)
- C: Clone locally
- D: Root config files (.gitattributes first, then .gitignore, .nvmrc, README)
- E: Directory structure
- F: CLAUDE.md and _state.md at root
- G: Copy .claude/ memory system (all 28 files)
- H: Supporting files (prisma/README, .github/, .vscode/)
- I: Initial commit and push
- J: Connect Vercel (root dir = 'frontend')
- K: Post-bootstrap verification
- L: Update _state.md

Critical: `.gitattributes` must be created BEFORE any other files (line ending policy).

---

## Next Task

P0-T0: Write final database schema files (prisma/schema.prisma, post-migration.sql, rls-policies.sql)

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

---

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 0 | Planning & Data Validation | 🟡 In Progress |
| 1 | Foundation (Auth + DB + Deploy) | ⬜ Not Started |
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

---

*Last updated: 2026-06-09*
