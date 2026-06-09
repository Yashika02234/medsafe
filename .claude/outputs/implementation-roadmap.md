# Implementation Roadmap — MedSafe

---

## Phase 0 — Planning & Architecture ← CURRENT

### Goals
Set up engineering system, lock architecture, prepare for development.

### Deliverables
- [x] Project vision documented
- [x] Tech stack locked
- [x] Architecture designed
- [x] .claude memory system initialized
- [x] Implementation roadmap written
- [ ] Design system finalized (awaiting design input)
- [ ] Database schema finalized in Prisma

### Definition of Done
- All memory files populated
- No major architectural unknowns remain
- Design system placeholder ready for input

### Risks
- Design ideology not yet decided → blocks UI work in Phase 2+

---

## Phase 1 — Foundation

### Goals
Project scaffolding. User can sign up, log in, and see an empty dashboard.

### Deliverables
- Next.js 14 project initialized (App Router, TypeScript, Tailwind, shadcn/ui)
- FastAPI project initialized (Python, project structure, CORS config)
- Supabase project created (database, auth configured)
- Prisma schema: `users`, `medicines`, `family_members` tables
- Auth flow: signup → email verification → login → protected routes
- Empty dashboard page (authenticated only)
- Environment variables configured (.env.example files)
- CI/CD: GitHub Actions for linting + type checking
- Deploy: Frontend on Vercel, Backend on Render

### Architecture Decisions
- Next.js API routes act as BFF (Backend for Frontend)
- Supabase Auth handles all auth — no custom JWT generation
- Prisma Client used in Next.js API routes only (server-side)
- FastAPI does not handle auth — it trusts requests from Next.js BFF

### Dependencies
- Supabase account (free tier)
- Vercel account (free tier)
- Render account (free tier)
- GitHub repo created

### Testing
- [ ] User can sign up with email
- [ ] User can log in
- [ ] Unauthenticated user redirected to login
- [ ] Dashboard loads for authenticated user
- [ ] FastAPI health check endpoint responds
- [ ] Frontend deploys to Vercel
- [ ] Backend deploys to Render

### Definition of Done
- Auth works end to end
- Both services deployed and accessible
- CI/CD pipeline runs on push

### Risks
- Render free tier cold starts (10-30s) — acceptable for MVP
- Supabase free tier limits — fine for <50 users

### Recommended Order
1. Create GitHub repo
2. Initialize Next.js project with Tailwind + shadcn/ui
3. Initialize FastAPI project with folder structure
4. Create Supabase project, enable auth
5. Write Prisma schema, run migration
6. Build auth pages (signup, login)
7. Build protected dashboard layout
8. Configure deployment (Vercel + Render)
9. Set up GitHub Actions

---

## Phase 2 — Medicine Cabinet (MVP Core)

### Goals
User can manually add, view, edit, and delete medicines. Expiry status visible.

### Deliverables
- Add Medicine form (name, expiry date, quantity, dosage, family member)
- Medicine list view with expiry status badges (safe/warning/expired)
- Edit and delete medicine
- Medicine detail view
- Next.js API routes for CRUD operations
- Supabase RLS policies on medicines table
- Medicine name autocomplete (local CDSCO dataset search)

### Architecture Decisions
- CDSCO brand→salt JSON loaded once on server start, searched in-memory
- Expiry status calculated client-side from expiry_date (no backend call needed)
- React Query for all medicine data fetching/mutation

### Dependencies
- Phase 1 complete (auth + database + deployment)
- CDSCO dataset scraped and formatted as JSON

### Testing
- [ ] Add medicine with all fields
- [ ] View medicine list
- [ ] Edit medicine name and expiry
- [ ] Delete medicine
- [ ] Expiry badge shows correct status (green/amber/red)
- [ ] Cannot access other user's medicines
- [ ] Medicine name autocomplete works

### Definition of Done
- Full CRUD working
- RLS verified (user isolation)
- Expiry status visually clear

### Risks
- CDSCO data quality — may need manual cleanup
- Autocomplete performance with 5000+ entries — test and optimize

### Recommended Order
1. Scrape/prepare CDSCO dataset
2. Build Prisma queries for medicine CRUD
3. Build Next.js API routes
4. Build Add Medicine form with Zod validation
5. Build Medicine list page
6. Add expiry status logic and badges
7. Add edit/delete functionality
8. Implement RLS policies
9. Add autocomplete

---

## Phase 3 — OCR Scanner

### Goals
User can scan a medicine strip photo and auto-extract name + expiry date.

### Deliverables
- Camera capture UI (mobile-optimized)
- Image upload fallback (desktop)
- Image preprocessing pipeline (OpenCV)
- Tesseract OCR extraction
- EasyOCR fallback for low-confidence results
- Post-scan editable fields (user corrects if OCR was wrong)
- FastAPI endpoint: POST /ocr/scan

### Architecture Decisions
- Image compressed on client before upload (max 1MB)
- Preprocessing: grayscale → adaptive threshold → deskew → crop
- If Tesseract confidence < 60%, auto-retry with EasyOCR
- Expiry date extracted via regex patterns for common Indian formats
- User ALWAYS sees extracted data and can edit before saving

### Dependencies
- Phase 2 complete (medicine cabinet exists to save scanned medicines into)
- Tesseract installed on Render instance
- Sample medicine strip images for testing

### Testing
- [ ] Scan clear strip → correct name + expiry extracted
- [ ] Scan blurry strip → EasyOCR fallback triggered
- [ ] Scan non-medicine image → graceful error message
- [ ] User can edit extracted fields before saving
- [ ] Image compression works on mobile
- [ ] Endpoint handles concurrent requests without crashing

### Definition of Done
- OCR works on 70%+ of clear medicine strips
- Graceful degradation for unreadable strips
- User always has edit control

### Risks
- OCR accuracy on Indian medicine strips is unpredictable
- Tesseract installation on Render may need custom build pack
- Camera API differences across mobile browsers

### Recommended Order
1. Set up Tesseract + EasyOCR in FastAPI
2. Build image preprocessing pipeline
3. Build POST /ocr/scan endpoint
4. Build camera capture UI (mobile)
5. Build image upload fallback (desktop)
6. Build post-scan review/edit UI
7. Connect to medicine cabinet (save scanned medicine)
8. Test with 20+ real medicine strip photos

---

## Phase 4 — Drug Interaction Engine

### Goals
When a user has 2+ medicines, check for dangerous drug interactions.

### Deliverables
- Drug resolution service (brand → salt → RxCUI)
- RxNav interaction API integration
- Interaction warning cards (severity-coded)
- Interaction check triggered on medicine add/edit
- In-memory LRU cache for resolved drugs and interaction pairs
- "Data unavailable" message for unresolvable medicines

### Architecture Decisions
- Resolution chain: CDSCO JSON → RxNorm API → RxCUI
- Interaction pairs cached with `functools.lru_cache`
- Interactions stored in database as cache (not recomputed every page load)
- Severity levels: Severe (red), Moderate (amber), Mild (yellow)
- If a drug can't be resolved to RxCUI → skip interaction check, show disclaimer

### Dependencies
- Phase 2 complete (medicines exist in database)
- RxNorm API accessible from Render
- RxNav Interaction API accessible from Render

### Testing
- [ ] Known interacting pair (e.g., Warfarin + Aspirin) → warning shown
- [ ] Non-interacting pair → no warning
- [ ] Unknown drug → "data unavailable" message, not crash
- [ ] Cache hit on repeated lookups (verify no redundant API calls)
- [ ] Removing a medicine clears its interaction warnings

### Definition of Done
- Interactions detected and displayed correctly
- Cache working (verified via logs)
- Medical disclaimers present on all warnings

### Risks
- RxNorm may not resolve all Indian generic names
- API latency from India to NIH servers — cache mitigates this
- Edge case: same salt, different brand names (deduplication needed)

### Recommended Order
1. Build drug resolution service (CDSCO → RxNorm → RxCUI)
2. Build RxNav interaction client
3. Build interaction engine (check all pairs)
4. Add LRU caching layer
5. Build interaction warning UI cards
6. Integrate: trigger check on medicine add/edit
7. Handle edge cases (unresolvable drugs, duplicates)
8. Add medical disclaimers

---

## Phase 5 — Notifications & Alerts

### Goals
Users receive email alerts before medicines expire.

### Deliverables
- Daily cron job (via cron-job.org) hitting backend endpoint
- Expiry check logic: 30-day, 7-day, 1-day warnings
- Email sending via Resend API (free tier)
- Notification deduplication (don't send same alert twice)
- Notification log in database
- User email preferences (opt-in/opt-out)

### Dependencies
- Phase 2 complete (medicines with expiry dates exist)
- Resend account (free tier)
- cron-job.org account (free)

### Testing
- [ ] Cron triggers daily
- [ ] Correct medicines identified for each alert tier
- [ ] Email delivered via Resend
- [ ] No duplicate emails for same medicine + same tier
- [ ] User can opt out of emails

### Definition of Done
- Expiry emails work end-to-end
- Deduplication verified
- Cron secured with secret token

### Recommended Order
1. Build expiry check logic
2. Set up Resend integration
3. Build cron endpoint with secret token auth
4. Build notification log table
5. Add deduplication logic
6. Configure cron-job.org
7. Add user email preference toggle

---

## Phase 6 — Family Mode & Polish

### Goals
One user manages medicine cabinets for multiple family members. Polish UX.

### Deliverables
- Add/edit/remove family members
- Switch between family member cabinets
- Per-member interaction checking
- Doctor visit summary PDF (export current medications)
- Dashboard with summary stats (total medicines, expiring soon, active warnings)
- Loading states, empty states, error states everywhere
- Mobile PWA configuration (manifest, service worker, install prompt)
- Final design polish based on design-system.md

### Dependencies
- Phase 1-5 complete
- Design system finalized

### Testing
- [ ] Add family member
- [ ] Switch cabinets
- [ ] Interactions checked per family member, not across members
- [ ] PDF export generates correctly
- [ ] PWA installable on mobile
- [ ] All empty states have helpful messaging

### Definition of Done
- Family mode works end-to-end
- App installable as PWA
- No missing loading/error/empty states
- Feels polished and ready for real users

### Recommended Order
1. Build family member CRUD
2. Build cabinet switcher UI
3. Update interaction engine for per-member scope
4. Build dashboard summary
5. Build PDF export
6. Add PWA manifest + service worker
7. Polish loading/error/empty states
8. Final design pass

---

## Post-Launch

- Share with IIIT Vadodara hostel for real user testing
- Collect feedback, iterate
- Track: medicines added, interactions caught, alerts sent
- Write case study for resume/portfolio
