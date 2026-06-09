# Master Implementation Roadmap — MedSafe

> Written by: Technical Architect
> Last reviewed: Session 1
> Status: APPROVED — follow this document as the single source of truth

---

## 1. PROJECT ANALYSIS

### Core Problem
Indian households accumulate medicine strips with no expiry tracking. People regularly consume expired medicines. Worse, patients on multiple medications (extremely common — diabetes + BP + thyroid) face silent drug interaction risks. Doctors warn verbally, patients forget, and no free India-focused tool bridges this gap.

### What Makes This a Real Product (Not a Demo)
A demo would be: scan medicine, show info. That's a wrapper around an API.
A product solves a workflow: "I have 7 medicine strips in my drawer. Which ones are expired? Are any of them dangerous to take together? Remind me before the next one expires."

The product value chain is:
**Add medicine → Track expiry → Check interactions → Get alerts → Manage family**

Every feature must serve this chain. Anything that doesn't is scope creep.

### Minimum Viable Product (MVP)
The smallest version that delivers real value to a real user:

**User can manually add medicines to a cabinet, see which ones are expiring, and get warned if any two medicines interact dangerously.**

That's it. No OCR. No notifications. No family mode. No PDF export.
A user who adds 5 medicines manually and discovers two of them interact — that's already more value than 90% of student projects deliver.

---

## 2. CRITICAL ARCHITECTURE CHALLENGE

Before diving into phases, there's one strategic decision that affects everything.

### The CDSCO Bridge Problem

The entire interaction engine depends on this chain:
```
Indian brand name → generic salt → RxCUI identifier → interaction data
```

RxNorm and RxNav are US-focused. They know "Acetaminophen" but not "Crocin".
CDSCO maps Indian brands to salts, but it has no API — only web pages.

**This bridge is the hardest engineering problem in the project.**
If it doesn't work reliably, the interaction engine is useless.

Recommendation: Tackle this in a dedicated data preparation sub-phase (Phase 1B) BEFORE building any medicine UI. Build it, test it with 50 common Indian medicines, and validate that the resolution chain works end-to-end. If it doesn't, you'll know early and can pivot (e.g., use a different data source, build a manual mapping for the top 200 medicines, etc.)

### The Render Cold Start Problem

Render free tier spins down after 15 minutes of inactivity. With Tesseract + OpenCV + EasyOCR loaded, cold start will take 30-60 seconds. This is acceptable for OCR (user waits once), but terrible for interaction checks (user adds a medicine and waits 45 seconds for a simple API call).

Recommendation: Split the FastAPI backend into two concerns mentally. Drug resolution and interaction checking should be FAST (lightweight code, no heavy imports). OCR is SLOW (heavy libraries). For MVP, consider running drug resolution as a Next.js API route (calling RxNorm/RxNav directly from Node.js) to avoid Render cold starts entirely. Move OCR to FastAPI only when you build the scanner feature.

This is a **significant change from the original architecture.** The original design puts everything in FastAPI. I'm recommending keeping FastAPI for OCR only, and handling drug resolution + interactions in Next.js API routes. Reason: one less service to maintain for MVP, no cold start on the critical path, and the RxNorm/RxNav APIs are simple REST calls that Node.js handles fine.

**Decision needed:** Accept this simplification for MVP, or stick with FastAPI for everything and accept the cold start. I recommend the simplification.

---

## 3. MAJOR SYSTEM COMPONENTS

| Component | What It Does | Where It Lives | When To Build |
|-----------|-------------|---------------|---------------|
| Auth System | Signup, login, sessions | Supabase Auth + Next.js middleware | Phase 1 |
| Medicine Cabinet | CRUD for medicines | Supabase DB + Next.js API routes | Phase 2 |
| Drug Data Layer | CDSCO brand→salt mapping | Local JSON + Next.js API route | Phase 1B |
| Drug Resolution | Brand → salt → RxCUI | Next.js API route (calls RxNorm) | Phase 3 |
| Interaction Engine | Check drug pairs for conflicts | Next.js API route (calls RxNav) | Phase 3 |
| Expiry Tracker | Status badges + dashboard | Frontend logic (client-side) | Phase 2 |
| Notification System | Email alerts for expiring meds | Next.js API route + Resend + cron | Phase 4 |
| OCR Scanner | Camera scan → extract name/expiry | FastAPI (Python) on Render | Phase 5 |
| Family Management | Multi-person medicine cabinets | Supabase DB + Next.js | Phase 6 |
| PWA Shell | Installable mobile experience | Next.js PWA config | Phase 6 |

---

## 4. PHASE-BY-PHASE ROADMAP

---

### PHASE 0 — Planning & Data Validation
**"Validate before you build"**

#### Objective
Lock architecture, prepare CDSCO dataset, and validate that the drug resolution chain (Indian brand → salt → RxCUI → interactions) actually works before writing any application code.

#### Why This Phase Comes First
The entire product hinges on whether Indian brand names can be resolved to interaction data. If this chain is broken, you're building on sand. Spending 2-3 days validating this saves potentially weeks of wasted effort.

#### Features Included
- Finalize project engineering system (done)
- Prepare CDSCO brand→salt dataset
- Test RxNorm API with 50 common Indian generic drug names
- Test RxNav Interaction API with 10 known interacting pairs
- Measure resolution success rate
- Document which drugs resolve and which don't
- Build fallback strategy for unresolvable drugs

#### Database Requirements
None yet.

#### Backend Requirements
- Python script (standalone, not FastAPI yet) to:
  - Load CDSCO data
  - Call RxNorm API to get RxCUI for each salt
  - Call RxNav to check interactions
  - Report success/failure rates

#### Frontend Requirements
None.

#### APIs Required
- RxNorm: `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=DRUG_NAME`
- RxNav Interaction: `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=RXCUI`

#### Testing Requirements
- [ ] Prepare list of 50 most common Indian medicines (Crocin, Dolo, Thyronorm, etc.)
- [ ] Map each to its salt composition using CDSCO data
- [ ] Attempt RxCUI resolution for each salt
- [ ] Document: X out of 50 resolved successfully
- [ ] Test 10 known interacting pairs through RxNav
- [ ] Document: X out of 10 interactions detected correctly

#### Risks
- CDSCO website structure may change (scraping is fragile)
- Some Indian generic names may not match RxNorm naming conventions (e.g., "Paracetamol" vs "Acetaminophen" — these are the same drug but different names in US vs India)
- RxNav may not return interaction data for all resolved drugs

#### Definition of Done
- CDSCO dataset: 500+ brand→salt mappings in clean JSON
- Resolution success rate documented (target: 70%+ of common medicines)
- At least 5 known interaction pairs verified working end-to-end
- Fallback strategy documented for unresolvable drugs
- Go/no-go decision made: proceed as planned or adjust approach

#### Estimated Time: 3-4 days

---

### PHASE 1 — Foundation
**"Auth, database, deployment — boring but essential"**

#### Objective
User can sign up, log in, see a protected dashboard, and the app is deployed and accessible.

#### Why This Phase Comes Now
Every subsequent phase depends on: authenticated users, a running database, and a deployed frontend. Getting deployment working early means every future phase is immediately testable in production.

#### Features Included
- Next.js 14 project scaffold (App Router, TypeScript, Tailwind, shadcn/ui)
- Supabase project creation (database + auth)
- Prisma schema: users, medicines, family_members, interactions_cache, notification_log tables
- Auth flow: signup with email → login → logout → protected route middleware
- Empty dashboard with layout shell (sidebar/nav, content area)
- Landing page (simple, explains what the app does)
- Deployment: Vercel (auto-deploy from GitHub main branch)
- Environment variable setup with .env.example

#### Why NOT FastAPI Yet
FastAPI is only needed for OCR (Phase 5). Drug resolution and interactions use simple REST API calls to RxNorm/RxNav that Node.js handles perfectly in Next.js API routes. Deploying and maintaining a second service from Day 1 is premature. Add it only when you need Python-specific libraries.

#### Database Requirements

```sql
-- Design schema with family_member_id from Day 1
-- Even though family mode UI comes in Phase 6
-- This avoids a painful migration later

users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  notification_preference TEXT DEFAULT 'email', -- email | none
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT, -- self | parent | spouse | child | other
  created_at TIMESTAMPTZ DEFAULT now()
)
-- On user signup, auto-create a family_member with relationship='self'

medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  generic_name TEXT,
  salt_composition TEXT,
  rxcui TEXT, -- nullable, filled by drug resolution
  expiry_date DATE NOT NULL,
  quantity INTEGER,
  dosage_schedule TEXT, -- free text for MVP: "1 tablet after breakfast"
  is_active BOOLEAN DEFAULT true,
  added_via TEXT DEFAULT 'manual', -- manual | scan
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

interactions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rxcui_a TEXT NOT NULL,
  rxcui_b TEXT NOT NULL,
  severity TEXT NOT NULL, -- severe | moderate | mild
  description TEXT NOT NULL,
  source TEXT DEFAULT 'rxnav',
  cached_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rxcui_a, rxcui_b)
)

notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- expiry_30 | expiry_7 | expiry_1
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medicine_id, notification_type)
  -- This UNIQUE constraint prevents duplicate alerts
)
```

#### Backend Requirements
- Next.js API routes only (no FastAPI yet)
- Supabase client initialized (server-side with service role key)
- Prisma client configured and connected
- Auth middleware: verify Supabase session token on all /api/* routes
- Health check endpoint: GET /api/health

#### Frontend Requirements
- App Router layout with auth protection
- Login page, signup page, forgot password page
- Dashboard layout shell (will be populated in Phase 2)
- Landing page (public, explains the product)
- Responsive mobile-first design
- Loading and error boundary components

#### APIs Required
- Supabase Auth API (built into client library)

#### Testing Requirements
- [ ] User can sign up with email and password
- [ ] User can log in with correct credentials
- [ ] User gets error with wrong credentials
- [ ] Unauthenticated user redirected to login
- [ ] Dashboard loads for authenticated user
- [ ] Logout works and clears session
- [ ] Auto-creates "self" family member on signup
- [ ] App deploys to Vercel and is accessible via URL
- [ ] Prisma migrations run successfully

#### Risks
- Supabase email verification may have deliverability issues with some email providers — consider making email verification optional for MVP
- Prisma + Supabase connection string sometimes needs `?pgbouncer=true` for pooling — test this early

#### Definition of Done
- Auth works end-to-end (signup → login → protected dashboard → logout)
- Database schema deployed with all tables
- RLS policies enabled (users can only access their own data)
- App accessible via Vercel URL
- CI: GitHub Actions runs TypeScript type checking on push

#### Estimated Time: 5-7 days

---

### PHASE 2 — Medicine Cabinet
**"The core loop: add medicines, see expiry status"**

#### Objective
User can add medicines to their cabinet, see them in a list with expiry status badges, edit and delete them. The medicine name autocomplete uses the CDSCO dataset to help users find medicines quickly and auto-fill salt composition.

#### Why This Phase Comes Now
This is the foundation every other feature builds on. Interactions need medicines to check. Notifications need medicines with expiry dates. OCR needs a cabinet to save into. Without this, nothing else works.

#### Features Included
- Add Medicine page/modal with form
  - Brand name (with CDSCO autocomplete)
  - Auto-filled: generic name, salt composition (from CDSCO match)
  - Expiry date (month/year picker — medicines don't have day-level expiry)
  - Quantity (optional)
  - Dosage schedule (free text, optional)
- Medicine list view
  - Cards showing: brand name, salt, expiry date, status badge
  - Status badges: Safe (green), Expiring Soon (amber, <30 days), Expired (red)
  - Sort: by expiry date (soonest first) by default
- Medicine detail view (tap to expand)
- Edit medicine
- Delete medicine (with confirmation)
- Empty state: "Your medicine cabinet is empty. Add your first medicine."
- Dashboard summary: total medicines, expiring soon count, expired count

#### Database Requirements
- CDSCO JSON dataset loaded and served via API route
- Medicines CRUD via Prisma
- RLS: users can only read/write their own medicines

#### Backend Requirements (Next.js API Routes)
- GET /api/medicines — list user's medicines
- POST /api/medicines — add medicine
- PUT /api/medicines/[id] — update medicine
- DELETE /api/medicines/[id] — delete medicine
- GET /api/drugs/search?q=crocin — search CDSCO dataset, return matches

#### Frontend Requirements
- Medicine list page with status badges
- Add/Edit medicine form with Zod validation
- CDSCO autocomplete component (debounced search, 300ms)
- Month/Year date picker for expiry (not a full date picker)
- Delete confirmation dialog
- React Query hooks: useMedicines, useAddMedicine, useUpdateMedicine, useDeleteMedicine
- Loading skeletons for medicine list
- Empty state illustration/message

#### APIs Required
- None external. All CDSCO data is local.

#### Testing Requirements
- [ ] Add medicine with all fields → appears in list
- [ ] Add medicine with only required fields (name + expiry) → works
- [ ] CDSCO autocomplete: type "Cro" → shows "Crocin" → select → salt auto-fills
- [ ] Medicine not in CDSCO → user types manually → still saves
- [ ] Expiry badge: medicine expiring in 60 days → green
- [ ] Expiry badge: medicine expiring in 15 days → amber
- [ ] Expiry badge: medicine expired yesterday → red
- [ ] Edit medicine → changes reflected
- [ ] Delete medicine → confirmation → removed from list
- [ ] Dashboard summary numbers match actual medicine count
- [ ] User A cannot see User B's medicines (RLS)

#### Risks
- CDSCO dataset may have inconsistent naming (same medicine, different spellings)
- Autocomplete with 5000+ entries needs client-side filtering or server-side search — test performance
- Month/year picker UX: ensure it's mobile-friendly

#### Definition of Done
- Full medicine CRUD working
- CDSCO autocomplete functioning for common medicines
- Expiry status badges visually clear and accurate
- Dashboard shows summary counts
- RLS verified (multi-user isolation)
- Mobile-responsive

#### Estimated Time: 7-10 days

---

### PHASE 3 — Drug Interaction Engine
**"The killer feature — this is what makes it a product, not a list app"**

#### Objective
When a user has 2+ medicines, the system checks for dangerous drug interactions and displays severity-coded warnings. This is the core differentiator and the hardest engineering challenge in the project (after the CDSCO bridge validated in Phase 0).

#### Why This Phase Comes Now
Without interactions, MedSafe is a glorified to-do list with dates. Interactions are what make this a product worth using, worth talking about in interviews, and worth putting on a resume. Building this before OCR and notifications is strategic: interactions are the highest-impact feature, and they work with manually-entered medicines (no OCR dependency).

This also validates your Phase 0 research in a real product context.

#### Features Included
- Drug resolution service: brand name → CDSCO lookup → RxNorm API → RxCUI
- Interaction checking: for each medicine pair, query RxNav Interaction API
- Interaction results cached in database (interactions_cache table) to avoid redundant API calls
- Interaction warning cards in the medicine cabinet UI
  - Severity-coded: Severe (red border + icon), Moderate (amber), Mild (yellow)
  - Shows: Drug A name, Drug B name, severity, plain-English description
  - "Consult your doctor" disclaimer on every warning
- Interaction check triggered automatically when a medicine is added or edited
- "Checking interactions..." loading state
- "No interactions found" success state
- "Interaction data unavailable for [medicine] — consult your doctor" for unresolvable drugs
- Interaction summary on dashboard: "2 warnings found"

#### Database Requirements
- interactions_cache table (already in schema)
- rxcui field on medicines table populated during resolution
- Index on interactions_cache(rxcui_a, rxcui_b) for fast lookups

#### Backend Requirements (Next.js API Routes)
- POST /api/drugs/resolve — takes brand_name, returns { generic_name, salt, rxcui }
  - Step 1: CDSCO lookup (brand → salt)
  - Step 2: RxNorm API call (salt → rxcui)
  - Caching: once resolved, store rxcui on the medicine record
- GET /api/interactions?family_member_id=X — returns all interaction warnings for a member's medicines
  - Step 1: Get all active medicines with rxcui for the family member
  - Step 2: For each pair, check interactions_cache first
  - Step 3: If not cached, call RxNav API, cache result
  - Step 4: Return list of warnings
- Internal helper: resolveAndCheckInteractions(medicine_id) — called after add/edit

#### Frontend Requirements
- Interaction warning banner at top of medicine cabinet (if any severe interactions exist)
- Interaction warning cards (expandable for details)
- Per-medicine interaction indicator (small icon on medicine card if it's involved in an interaction)
- Loading state during interaction check
- Empty state: "No interactions detected among your medicines"
- Unresolvable state: "We couldn't find interaction data for [medicine]. This doesn't mean it's safe — please consult your doctor."
- Dashboard: interaction warning count

#### APIs Required
- RxNorm: GET `https://rxnav.nlm.nih.gov/REST/rxcui.json?name={salt_name}&search=2`
  - search=2 enables approximate matching (important for name variations)
- RxNav Interaction: GET `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui={rxcui}`

#### Testing Requirements
- [ ] Add Warfarin + Aspirin → severe interaction warning appears
- [ ] Add Paracetamol + Ibuprofen → check if interaction detected (moderate)
- [ ] Add two non-interacting medicines → no warning
- [ ] Add medicine not in CDSCO → "data unavailable" message, not crash
- [ ] Add medicine in CDSCO but RxNorm can't resolve → "data unavailable"
- [ ] Second request for same pair → served from cache (verify no API call)
- [ ] Remove one of an interacting pair → warning disappears
- [ ] Edit medicine to a different drug → interactions rechecked
- [ ] Dashboard shows correct interaction count
- [ ] Medical disclaimer visible on every warning

#### Risks

**HIGH — Name Resolution Mismatch**
RxNorm uses US drug naming conventions. "Paracetamol" (Indian/UK name) maps to "Acetaminophen" (US name). Your CDSCO-to-RxNorm bridge MUST handle these synonym mappings. Build a small manual synonym table for the top 50 most common discrepancies.

**MEDIUM — API Latency**
RxNorm and RxNav are hosted in the US. From India, expect 200-500ms per call. For a cabinet with 10 medicines (45 pairs), that's 45 API calls if none are cached. Mitigation: aggressive caching in database. First load is slow, subsequent loads are instant.

**MEDIUM — Rate Limiting**
RxNorm docs say "no hard limit" but excessive concurrent requests may get throttled. Add a simple serial queue (one request at a time) rather than parallel calls.

**LOW — Interaction Data Quality**
Some interactions may be trivially mild (e.g., grapefruit juice warnings). Consider filtering to show only moderate and severe by default, with a "show all" toggle.

#### Definition of Done
- Drug resolution works for 70%+ of medicines in CDSCO dataset
- Known interaction pairs correctly detected and displayed
- Unresolvable drugs handled gracefully with disclaimer
- Cache prevents redundant API calls
- Medical disclaimers on all warnings
- No false sense of safety: "no interactions found" ≠ "definitely safe" (messaging must be clear)

#### Estimated Time: 10-14 days

---

### PHASE 4 — Notifications & Expiry Alerts
**"The product works while you're not using it"**

#### Objective
Users receive email alerts 30 days, 7 days, and 1 day before a medicine expires. This transforms MedSafe from an app you check manually into a product that proactively protects you.

#### Why This Phase Comes Now
With a working medicine cabinet (Phase 2) and interactions (Phase 3), the product already delivers value. Notifications add "set it and forget it" value — users add their medicines once and get protected automatically. This is also a strong resume signal: it shows you understand background jobs, scheduling, email delivery, and idempotency — concepts most student projects never touch.

#### Features Included
- Cron endpoint: POST /api/cron/check-expiry (triggered daily by cron-job.org)
- Expiry check logic: find medicines expiring within 30/7/1 days
- Email composition: clear, friendly email with medicine name, expiry date, and action
- Notification deduplication: don't send the same alert twice (unique constraint on medicine_id + notification_type)
- Notification log in database
- User settings page: email notification toggle (on/off)
- Cron security: verify X-Cron-Secret header

#### Why NOT Push Notifications
Push notifications require a service worker, a notification permission prompt, and platform-specific handling. Email is simpler, more reliable, works on every device, and is free (Resend gives 3,000/month). Add push in a future version if needed.

#### Database Requirements
- notification_log table (already in schema)
- notification_preference on users table (already in schema)
- Query: SELECT medicines WHERE expiry_date BETWEEN today AND today+30 AND no existing notification_log for this medicine+type

#### Backend Requirements
- POST /api/cron/check-expiry
  - Validate X-Cron-Secret header
  - Query all medicines across all users expiring in 30/7/1 days
  - Filter out medicines that already have a notification_log entry for that tier
  - Send email via Resend API for each
  - Log each sent notification
- PUT /api/users/preferences — update notification preference
- Resend API client (simple fetch call, no SDK needed)

#### Frontend Requirements
- Settings page with notification toggle
- Notification history view (optional, nice-to-have)

#### APIs Required
- Resend: POST `https://api.resend.com/emails` (API key in env)
- cron-job.org: configured to hit the endpoint daily at 8 AM IST

#### Testing Requirements
- [ ] Medicine expiring in 25 days → 30-day alert email sent
- [ ] Medicine expiring in 5 days → 7-day alert email sent
- [ ] Medicine expiring tomorrow → 1-day alert email sent
- [ ] Same medicine, same tier → second alert NOT sent (deduplication)
- [ ] User with notifications disabled → no email sent
- [ ] Cron endpoint without secret header → 401 rejected
- [ ] Email contains correct medicine name and expiry date
- [ ] Cron processes 20 medicines in one run without timeout

#### Risks
- Resend free tier: 3,000 emails/month. With 50 users averaging 5 medicines each, that's ~250 emails/month (well within limit). But if a user adds 100 medicines, plan for it.
- Render free tier cold start: cron hitting a cold endpoint means ~30s before processing starts. Acceptable for a daily job.
- Email deliverability: Resend's shared IP may land in spam for some providers. Add SPF/DKIM if custom domain is used.

#### Definition of Done
- Daily cron runs and sends correct alerts
- Deduplication verified (no double emails)
- Cron endpoint secured with secret token
- User can toggle notifications on/off
- Emails are clear, friendly, and include all necessary info

#### Estimated Time: 4-5 days

---

### PHASE 5 — OCR Scanner
**"The wow feature — but only build it after the product works without it"**

#### Objective
User can photograph a medicine strip and have the app extract the medicine name and expiry date automatically. This reduces friction for adding medicines but is NOT required for the core value proposition.

#### Why This Phase Comes NOW (Not Earlier)
This is deliberately placed after interactions and notifications because:

1. **OCR is the highest-risk feature.** Indian medicine strips have inconsistent fonts, layouts, colors, and printing quality. Accuracy will be imperfect regardless of how good the preprocessing is. Building this first and getting stuck would block the entire project.

2. **The product is already useful without OCR.** By Phase 4, users can manually add medicines, get interaction warnings, and receive expiry alerts. OCR is convenience, not core value.

3. **OCR requires the FastAPI service.** This is the first phase that actually needs Python-specific libraries (Tesseract, OpenCV, EasyOCR). Up until now, everything runs on Next.js + Supabase. Adding a second deployment target (Render) adds operational complexity — do it only when you need it.

4. **OCR is the best demo feature.** Saving it for later means you have a working product to demo even if OCR isn't ready. And when OCR IS ready, it becomes the cherry on top.

#### Features Included
- FastAPI project setup (finally — this is when you need it)
- Image preprocessing pipeline:
  - Client-side: compress to <1MB, convert to JPEG
  - Server-side: grayscale → adaptive thresholding → deskewing → border cropping
- Tesseract OCR (primary engine)
- EasyOCR (fallback when Tesseract confidence < 60%)
- Post-OCR text parsing:
  - Medicine name extraction (largest text, brand-name patterns)
  - Expiry date extraction (regex for MFG/EXP, MM/YYYY, MM-YYYY, Month YYYY patterns)
- Post-scan review screen: user sees extracted data and can correct before saving
- Camera capture UI (mobile-optimized, landscape guide overlay)
- Image upload fallback (desktop)
- "Scan" button on medicine cabinet that opens camera
- Connect to existing Add Medicine flow (pre-fill form with OCR results)

#### Database Requirements
- No new tables needed
- medicines.added_via field set to 'scan' for OCR-added medicines

#### Backend Requirements (FastAPI on Render)
- POST /ocr/scan
  - Accept: multipart/form-data (image file)
  - Response: { medicine_name, expiry_date, confidence_score }
  - Max file size: 5MB
  - Rate limit: 10 requests/minute per user (implemented with simple in-memory counter)
- CORS: allow only Vercel frontend domain
- Health check: GET /health

#### Frontend Requirements
- Camera capture component using navigator.mediaDevices.getUserMedia
- Landscape guide overlay (rectangle showing where to position the strip)
- Image preview before sending
- Client-side image compression (canvas resize to max 1200px width)
- Loading state during OCR processing (with "This may take 10-15 seconds" message)
- Post-scan review form (pre-filled, editable)
- Error state: "Couldn't read this strip. Try a clearer photo or add manually."
- Next.js API route: POST /api/ocr/scan (proxies to FastAPI, adds auth)

#### APIs Required
- None external. Tesseract and EasyOCR run locally on Render.

#### Testing Requirements
- [ ] Scan clear Crocin strip → name and expiry extracted correctly
- [ ] Scan clear Dolo-650 strip → name and expiry extracted correctly
- [ ] Scan blurry image → EasyOCR fallback triggered → best-effort result shown
- [ ] Scan non-medicine image (book, hand) → graceful error
- [ ] User edits extracted name → corrected version saved
- [ ] User edits extracted expiry → corrected version saved
- [ ] Image >5MB → rejected with error message
- [ ] Camera works on Chrome Android, Safari iOS, Chrome Desktop
- [ ] Render cold start: first request takes 30-60s → UI shows appropriate loading
- [ ] Subsequent requests respond within 5-10s

#### Risks

**HIGH — OCR Accuracy**
Indian medicine strips are printed on foil with metallic backgrounds, embossed text, and varying fonts. Realistic accuracy target: 60-70% on clear, well-lit photos. The user correction step is mandatory — this is not a "set it and forget it" feature.

**HIGH — Tesseract on Render**
Tesseract needs system-level installation (apt-get install tesseract-ocr). Render's free tier supports this via a custom build script, but it's finicky. Test deployment early. Have a backup plan (use EasyOCR only, which is pure Python and needs no system package).

**MEDIUM — Camera API Cross-Browser**
getUserMedia behaves differently across browsers and devices. Test on Chrome Android, Safari iOS, and desktop Chrome early. Have the file upload fallback ready.

**LOW — Processing Time**
OCR with preprocessing takes 5-15 seconds per image. Combined with Render cold start (30-60s), first-time users may wait over a minute. Set expectations in the UI.

#### Definition of Done
- OCR extracts correct name from 70%+ of clear, well-lit medicine strip photos
- Expiry date extraction works for common Indian date formats
- User can always correct extracted data before saving
- Graceful fallback to manual entry on failure
- FastAPI deployed and accessible from frontend
- Camera works on mobile Chrome and Safari

#### Estimated Time: 10-14 days

---

### PHASE 6 — Family Mode, Polish & Launch
**"From project to product"**

#### Objective
One user can manage medicine cabinets for multiple family members. Polish the entire experience for real users. Make it PWA-installable. Prepare for launch.

#### Why This Phase Comes Last
Family mode is a UX expansion, not core functionality. The schema already supports it (family_member_id is on medicines from Day 1), so it's just UI work. Polish should come last because you need a working product to polish — premature polish wastes time on features that might change.

#### Features Included
- Family member management: add/edit/remove family members
- Cabinet switcher: dropdown/tab to switch between family members
- Per-member interaction checking (interactions checked within a member's medicines, not across members)
- Per-member expiry alerts
- Dashboard redesign:
  - Summary across all family members
  - Per-member breakdown
  - "Most urgent" widget (nearest expiring medicine across all members)
- Doctor visit summary: export current medications as PDF (using browser print or a simple PDF library)
- PWA manifest + service worker + install prompt
- Onboarding flow: first-time user guide (3-4 screens explaining the app)
- Loading states, empty states, error states audit (every page, every component)
- Accessibility audit (keyboard nav, screen reader, contrast)
- Performance audit (bundle size, image optimization, lazy loading)
- Final design pass based on design-system.md

#### Database Requirements
- No schema changes (family_member_id already exists on medicines table)
- RLS update: ensure family member operations scoped to owning user

#### Backend Requirements
- GET /api/family — list user's family members
- POST /api/family — add family member
- PUT /api/family/[id] — edit family member
- DELETE /api/family/[id] — delete family member (cascade deletes their medicines)
- GET /api/dashboard/summary — summary stats across all family members
- GET /api/export/medications?family_member_id=X — generate medication list for export

#### Frontend Requirements
- Family member management page
- Cabinet switcher component (persistent across navigation)
- Updated medicine list: filtered by selected family member
- Updated interactions: scoped to selected family member
- Dashboard with per-member and aggregate views
- PDF export (client-side generation using browser print or jsPDF)
- PWA: manifest.json, service worker, "Add to Home Screen" prompt
- Onboarding: 3-4 intro slides on first login
- Comprehensive empty states
- Comprehensive error states
- Loading skeletons everywhere

#### Testing Requirements
- [ ] Add family member (parent, spouse, child)
- [ ] Switch between family members → medicine list updates
- [ ] Add medicine for family member → shows in their cabinet only
- [ ] Interactions checked per member, not across members
- [ ] Delete family member → their medicines deleted too
- [ ] Dashboard shows aggregate and per-member stats
- [ ] PDF export contains all active medicines for selected member
- [ ] PWA installable on Android Chrome
- [ ] PWA installable on iOS Safari (Add to Home Screen)
- [ ] Onboarding shows on first login only
- [ ] All pages have loading skeletons
- [ ] All pages have meaningful empty states
- [ ] All pages handle errors gracefully
- [ ] Accessibility: all pages keyboard-navigable

#### Risks
- PWA install prompt behavior varies by browser — may not show on iOS
- PDF generation client-side can be finicky with styling — keep it simple
- Family member deletion cascade: test thoroughly to avoid data loss bugs

#### Definition of Done
- Family mode works end-to-end
- Dashboard shows meaningful stats
- App installable as PWA
- No page without loading/error/empty states
- Onboarding guides new users
- App feels polished and ready for real users
- Accessibility audit passed (AA contrast, keyboard nav)
- Performance audit passed (<3s initial load)

#### Estimated Time: 10-14 days

---

## 5. ARCHITECTURE EVOLUTION

### Phase 0-2: Monolith
```
Next.js (Vercel) ←→ Supabase
```
One service. Frontend + API routes + database. Simple, fast to iterate, easy to debug.

### Phase 3-4: Monolith + External APIs
```
Next.js (Vercel) ←→ Supabase
      ↓
RxNorm/RxNav APIs (NIH)
Resend API
cron-job.org
```
Still one service, but now calling external APIs. The Next.js API routes act as the orchestration layer.

### Phase 5: Monolith + Microservice
```
Next.js (Vercel) ←→ Supabase
      ↓                  
FastAPI (Render) ← OCR only
      ↓
RxNorm/RxNav APIs
Resend API
cron-job.org
```
Second service added, but ONLY for OCR. This is the minimum viable microservice — justified by the need for Python libraries, not by premature architecture astronautics.

### Phase 6: Same as Phase 5 + PWA
No architecture changes. Just polish.

---

## 6. TECHNICAL RISKS (Ranked by Severity)

### 1. CDSCO-to-RxNorm Name Bridge (CRITICAL)
**When to tackle:** Phase 0 (before any code)
Indian drug names vs US drug names is the single biggest risk. "Paracetamol" vs "Acetaminophen", "Diclofenac Sodium" vs "Diclofenac" — small naming differences break the resolution chain. Build a manual synonym table for the top 50 common discrepancies. Test with real medicines your family actually uses.

### 2. OCR Accuracy on Indian Medicine Strips (HIGH)
**When to tackle:** Phase 5 (deliberately late)
Metallic foil backgrounds, embossed text, tiny fonts, inconsistent layouts. Realistic accuracy: 60-70% on well-lit, clear photos. Accept this and design around it (user correction is mandatory, not optional). Don't invest more than 2-3 days optimizing the preprocessing pipeline — diminishing returns set in fast.

### 3. Render Free Tier Cold Starts (MEDIUM)
**When to tackle:** Phase 5 (when FastAPI is deployed)
30-60 second cold start with heavy Python libraries. Mitigation: add a "warming" cron that hits the /health endpoint every 14 minutes (cron-job.org supports this). This keeps the service warm during active hours. Accept cold starts during off-hours.

### 4. RxNav API Availability from India (MEDIUM)
**When to tackle:** Phase 0 (validate immediately)
NIH APIs are US-hosted. Latency from India: 200-500ms per call. If the API is slow or occasionally unavailable, your interaction checks will feel broken. Mitigation: aggressive database caching. Once an interaction pair is checked, cache it forever (interactions don't change). First-time checks are slow; repeat checks are instant.

### 5. Supabase Free Tier Limits (LOW)
**When to tackle:** Monitor from Phase 1 onward
500MB database, 50K monthly active users, 1GB file storage. For a project with <100 users, this is more than enough. But if OCR images are stored in Supabase Storage, the 1GB limit could be reached. Solution: don't store images — process and discard.

---

## 7. SCOPE CONTROL

### Build Later (NOT in MVP)
| Feature | Why Delay |
|---------|-----------|
| OCR Scanner | High risk, high complexity. Product works without it. |
| Family Mode UI | Schema supports it from Day 1, UI can wait. |
| PDF Export | Nice-to-have. Users can screenshot for now. |
| Push Notifications | Email is simpler, more reliable, and free. |
| Medicine reminders ("Take your medicine at 8 AM") | Different product category — this is adherence, not safety. |
| Barcode scanning | Different from strip scanning. Would need a barcode database. Different product. |
| Pharmacy price comparison | Requires scraping e-commerce sites. Legal gray area. Different product. |
| AI-powered health insights | Tempting but premature. Focus on the interaction engine — that IS the AI. |
| Social features (share cabinet with doctor) | Requires complex access control. Not needed for MVP. |
| Multi-language support | Build in English first. Hindi/regional languages can come later. |

### Build Never (Scope Traps)
| Feature | Why Never |
|---------|-----------|
| Telemedicine integration | Completely different product. |
| Prescription upload + OCR | Medical liability. Don't go there. |
| Drug recommendation engine | Never recommend drugs. Legal and ethical minefield. |
| Symptom checker | You are not building WebMD. |
| Community forums | Social features are a product in themselves. |

---

## 8. DEVELOPMENT TIMELINE

### MVP (Phases 0-3): ~25-35 days
User can add medicines, see expiry status, and get drug interaction warnings.
This is deployable, demoable, and resume-ready.

### Beta (Phases 0-4): ~30-40 days
Add email notifications. Product now works in the background.
Ready for 10-20 beta testers (family, friends, hostel mates).

### Production-Ready (Phases 0-6): ~55-75 days
Full feature set: OCR, family mode, PWA, polish.
Ready for 50-100 real users. Ready for resume and interview demos.

### Reality Check
These are estimates for a solo student developer spending 3-5 hours/day.
If you're doing this alongside coursework, double the calendar time.
Phases don't need to be done consecutively — take breaks, come back, read _state.md, continue.

---

## 9. RESUME IMPACT

### Phase 1 (Foundation): LOW resume impact
Auth + CRUD is table stakes. Every student project has this. Don't spend time polishing this phase.

### Phase 2 (Medicine Cabinet): LOW-MEDIUM resume impact
A well-built CRUD app with good UX and autocomplete is slightly above average but not a differentiator.

### Phase 3 (Drug Interaction Engine): HIGHEST resume impact
This is the phase that makes interviewers pay attention. Talking points:
- "I built a drug name resolution pipeline bridging Indian pharmaceutical naming to the US NIH drug database"
- "I modeled drug interactions as a graph problem with pairwise checking and database-level caching"
- "I handled real-world data quality issues: name mismatches, synonym resolution, graceful degradation for unresolvable drugs"
- System design signals: caching strategy, external API orchestration, data normalization

**This phase alone is worth more than the rest of the project combined on a resume.**

### Phase 4 (Notifications): MEDIUM resume impact
Shows production thinking: background jobs, idempotency, email delivery, cron scheduling. Interviewers at product companies value this because most students never build anything that runs without a user present.

### Phase 5 (OCR Scanner): HIGH resume impact
Computer vision, image preprocessing pipeline, dual-engine OCR with fallback strategy, cross-browser camera API. Great talking point — but only if the accuracy is decent. If it barely works, it hurts more than it helps. Be honest about accuracy numbers.

### Phase 6 (Family Mode + Polish): MEDIUM resume impact
Shows you can ship a complete product, not just a feature. PWA configuration, accessibility, and comprehensive error handling signal maturity. The "50+ real users" metric (if you get there) is the strongest signal in this phase.

### Overall Resume Bullet (After Full Build)
"Built MedSafe — a free medicine expiry tracker and drug interaction checker serving 50+ users. Engineered a drug name resolution pipeline bridging Indian pharmaceuticals to NIH databases, with pairwise interaction detection and severity classification. Implemented OCR for medicine strip scanning with dual-engine fallback. Full-stack: Next.js, TypeScript, FastAPI, PostgreSQL, deployed on Vercel + Render."

---

## 10. FINAL RECOMMENDED ORDER

Day-by-day execution order from project start to deployment:

```
DAY 1-3    Phase 0    Prepare CDSCO dataset, validate RxNorm/RxNav pipeline
DAY 4      Phase 0    Go/no-go decision on drug resolution approach
DAY 5-7    Phase 1    Next.js scaffold, Supabase setup, Prisma schema
DAY 8-9    Phase 1    Auth flow (signup, login, protected routes)
DAY 10-11  Phase 1    Dashboard shell, landing page, deploy to Vercel
DAY 12-14  Phase 2    Medicine CRUD API routes + Prisma queries
DAY 15-17  Phase 2    Medicine UI (list, add form, edit, delete)
DAY 18-19  Phase 2    CDSCO autocomplete, expiry badges, dashboard summary
DAY 20     Phase 2    RLS policies, testing, bug fixes
DAY 21-24  Phase 3    Drug resolution service (CDSCO → RxNorm → RxCUI)
DAY 25-27  Phase 3    Interaction engine (RxNav API + caching)
DAY 28-30  Phase 3    Interaction warning UI, medical disclaimers, testing
           ─── MVP COMPLETE. DEPLOY. DEMO. ───
DAY 31-33  Phase 4    Notification system (cron + Resend + deduplication)
DAY 34-35  Phase 4    User preferences, testing
           ─── BETA COMPLETE. SHARE WITH TESTERS. ───
DAY 36-38  Phase 5    FastAPI setup, deploy to Render, OCR pipeline
DAY 39-42  Phase 5    Tesseract + EasyOCR, preprocessing, testing
DAY 43-46  Phase 5    Camera UI, post-scan review, integration
DAY 47-50  Phase 6    Family mode (CRUD + cabinet switcher)
DAY 51-53  Phase 6    Dashboard redesign, PDF export
DAY 54-56  Phase 6    PWA, onboarding, polish pass
DAY 57-60  Phase 6    Accessibility audit, performance audit, final testing
           ─── PRODUCTION READY. LAUNCH. ───
```

---

## 11. GOLDEN RULES FOR THE ENTIRE BUILD

1. **Ship Phase 3 before anything else feels "done."** Interactions are the product.
2. **Never let OCR block progress.** If it's hard, skip it and come back.
3. **Test with your own family's medicines.** Real data reveals real bugs.
4. **Don't polish before Phase 3 is done.** Resist the urge to make the login page pixel-perfect when the interaction engine doesn't exist yet.
5. **Cache everything from external APIs.** Your app should work even if RxNav is temporarily down (serve from cache).
6. **Medical disclaimers everywhere.** This is non-negotiable. Every interaction warning, every "no interactions found" message, every unresolvable drug.
7. **Get 10 real users before calling it done.** Ship it to your family first. Their confusion is your UX bug report.
8. **Update _state.md religiously.** Future you (and future Claude) will thank present you.
