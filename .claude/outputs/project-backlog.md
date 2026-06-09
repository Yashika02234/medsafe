# Project Backlog — MedSafe

> Single source of truth for all tasks.
> Each task is sized for ONE focused development session (2-4 hours).
> Update status after every session. Mark ✅ when done, 🔄 when in progress.
> Reference: `.claude/outputs/master-roadmap.md` for strategic context.

---

## Status Legend

- ⬜ Not started
- 🔄 In progress
- ✅ Complete
- 🚫 Blocked
- ⏭️ Skipped (documented why)

---

# ═══════════════════════════════════════════
# PHASE 0 — Planning & Data Validation
# Target: 3-4 sessions | Priority: CRITICAL
# Gate: Go/no-go on drug resolution approach
# ═══════════════════════════════════════════

## Milestone 0.1 — CDSCO Dataset Preparation

### P0-T1: Research & Collect CDSCO Data ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Research CDSCO website structure, identify where brand→salt data lives
- [ ] Identify scraping approach (manual copy, Python script, or existing datasets on GitHub/Kaggle)
- [ ] Search GitHub/Kaggle for pre-existing Indian medicine brand→salt datasets
- [ ] If pre-existing dataset found: download, evaluate quality, assess coverage
- [ ] If no dataset found: write Python script to scrape CDSCO pages for top medicine categories
- [ ] Collect raw data for minimum 200 brands

**Acceptance Criteria:**
- Raw dataset exists (CSV or JSON) with at least 200 brand→salt mappings
- Source documented (where did the data come from)
- Known gaps documented (categories missing, incomplete data)

**Deliverables:**
- `backend/data/cdsco_raw.json` or `.csv`
- `.claude/outputs/phase-00/cdsco-data-source.md` (source, method, known gaps)

---

### P0-T2: Clean & Structure CDSCO Dataset ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Normalize brand names (consistent casing, remove extra whitespace, trim)
- [ ] Normalize salt/generic names (consistent casing, standardize separators)
- [ ] Remove duplicate entries
- [ ] Handle multi-salt combinations (e.g., "Paracetamol 325mg + Caffeine 30mg")
- [ ] Structure as JSON array: `[{ "brand": "Crocin", "generic": "Paracetamol", "salts": ["Paracetamol"], "strength": "500mg" }]`
- [ ] Validate: spot-check 20 random entries for correctness
- [ ] Count total entries, document coverage

**Acceptance Criteria:**
- Clean JSON file with 500+ entries (or documented reason if fewer)
- No duplicate brand names
- Salt names normalized and consistent
- Spot-check: 20/20 entries verified correct

**Deliverables:**
- `backend/data/cdsco_brands.json` (clean, structured)
- Entry count documented in `_state.md`

---

## Milestone 0.2 — Drug Resolution Pipeline Validation

### P0-T3: Test RxNorm API with Indian Drug Names ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create list of 50 most common Indian medicine salt names from CDSCO data
- [ ] Write Python test script: for each salt, call RxNorm API (`/REST/rxcui.json?name={salt}&search=2`)
- [ ] Log results: salt name → rxcui (or "NOT FOUND")
- [ ] Identify name mismatches (e.g., Paracetamol vs Acetaminophen)
- [ ] Build initial synonym mapping table for mismatched names
- [ ] Re-run with synonym substitution, measure improved resolution rate
- [ ] Calculate final resolution rate: X out of 50 resolved

**Acceptance Criteria:**
- Resolution rate documented (target: 70%+ of top 50 medicines)
- Synonym table created with at least 10 India↔US name mappings
- Every unresolved drug documented with reason

**Deliverables:**
- `backend/data/rxnorm_synonyms.json` — `{ "Paracetamol": "Acetaminophen", ... }`
- `.claude/outputs/phase-00/rxnorm-resolution-report.md` — success rate, failures, analysis

---

### P0-T4: Test RxNav Interaction API End-to-End ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Select 10 known drug interaction pairs (common, well-documented ones)
  - Warfarin + Aspirin (severe)
  - Metformin + Alcohol (moderate)
  - Ibuprofen + Aspirin (moderate)
  - Amlodipine + Simvastatin (moderate)
  - Ciprofloxacin + Antacids (moderate)
  - (research 5 more common in Indian households)
- [ ] For each pair: resolve both drugs via RxNorm → get RxCUI → call RxNav Interaction API
- [ ] Log: pair → severity → description (or "no interaction found")
- [ ] Test 5 pairs that should NOT interact — verify no false positives
- [ ] Measure API latency from India (average ms per call)
- [ ] Write go/no-go recommendation

**Acceptance Criteria:**
- At least 7 out of 10 known interaction pairs detected correctly
- Zero false positives on 5 non-interacting pairs
- API latency documented
- Go/no-go decision documented with reasoning

**Deliverables:**
- `.claude/outputs/phase-00/interaction-validation-report.md`
- `.claude/outputs/phase-00/go-no-go-decision.md`

---

# ═══════════════════════════════════════════
# PHASE 1 — Foundation
# Target: 6-7 sessions | Priority: HIGH
# Gate: Auth works, app deployed, schema live
# ═══════════════════════════════════════════

## Milestone 1.1 — Project Scaffold

### P1-T1: Initialize Next.js Project ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create GitHub repository (public, MIT license)
- [ ] `npx create-next-app@14` with App Router, TypeScript, Tailwind, ESLint
- [ ] Install core dependencies: `@supabase/supabase-js`, `@tanstack/react-query`, `framer-motion`, `zod`
- [ ] Initialize shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Add commonly used shadcn components: Button, Input, Card, Dialog, Toast, Skeleton
- [ ] Set up folder structure: `src/app/`, `src/components/ui/`, `src/components/shared/`, `src/lib/`, `src/hooks/`, `src/types/`
- [ ] Create `.env.example` with all required env vars (no values)
- [ ] Add `.gitignore` entries for `.env.local`, `node_modules`, `.next`
- [ ] Verify: `npm run dev` starts without errors
- [ ] Push to GitHub

**Acceptance Criteria:**
- Next.js dev server runs at localhost:3000
- Tailwind styling works (test with a colored div)
- shadcn Button component renders correctly
- GitHub repo has initial commit

**Deliverables:**
- GitHub repo with Next.js scaffold
- `.env.example` file

---

### P1-T2: Set Up Supabase & Prisma ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create Supabase project (free tier)
- [ ] Enable email auth in Supabase dashboard (disable email confirmation for MVP speed)
- [ ] Copy Supabase URL and keys to `.env.local`
- [ ] Install Prisma: `npm install prisma @prisma/client`
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Write full Prisma schema with ALL tables (users, family_members, medicines, interactions_cache, notification_log)
- [ ] Configure Prisma datasource for Supabase PostgreSQL connection string
- [ ] Run `npx prisma migrate dev --name init` — verify tables created in Supabase
- [ ] Create `src/lib/prisma.ts` — singleton Prisma client
- [ ] Create `src/lib/supabase/client.ts` — browser Supabase client
- [ ] Create `src/lib/supabase/server.ts` — server-side Supabase client
- [ ] Verify: Prisma Studio shows all tables (`npx prisma studio`)

**Acceptance Criteria:**
- All 5 tables visible in Supabase dashboard
- Prisma Studio connects and shows empty tables
- Supabase client initializes without errors
- Connection string uses `?pgbouncer=true` if needed

**Deliverables:**
- `prisma/schema.prisma` — complete schema
- `src/lib/prisma.ts`
- `src/lib/supabase/client.ts` and `server.ts`

---

## Milestone 1.2 — Authentication

### P1-T3: Build Auth API Layer ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create auth middleware: `src/middleware.ts` — check Supabase session, redirect unauthenticated users to `/login`
- [ ] Define protected routes (everything under `/(dashboard)/`) and public routes (`/`, `/login`, `/signup`)
- [ ] Create signup logic: Supabase `auth.signUp()` + auto-create `family_member` with relationship='self' via Prisma
- [ ] Create login logic: Supabase `auth.signInWithPassword()`
- [ ] Create logout logic: Supabase `auth.signOut()`
- [ ] Create `src/hooks/useAuth.ts` — exposes user, loading, signUp, signIn, signOut
- [ ] Create RLS policies in Supabase SQL editor:
  - Users: `SELECT/UPDATE WHERE id = auth.uid()`
  - Medicines: `ALL WHERE user_id = auth.uid()`
  - Family members: `ALL WHERE user_id = auth.uid()`

**Acceptance Criteria:**
- Middleware correctly redirects unauthenticated users
- Signup creates user + "self" family member in one flow
- Login returns valid session
- Logout clears session
- RLS: user cannot query another user's data via Supabase client

**Deliverables:**
- `src/middleware.ts`
- `src/hooks/useAuth.ts`
- RLS policies applied in Supabase

---

### P1-T4: Build Auth UI Pages ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `/signup` page — form with name, email, password fields
- [ ] Create `/login` page — form with email, password fields
- [ ] Add Zod validation schemas for both forms
- [ ] Add form error display (inline, per-field)
- [ ] Add loading state on submit button
- [ ] Add "Already have an account? Log in" / "Don't have an account? Sign up" links
- [ ] Add toast notification on success/error
- [ ] Redirect to `/dashboard` after successful login/signup
- [ ] Test: complete signup → login → see dashboard → logout → redirected to login

**Acceptance Criteria:**
- Signup flow works end-to-end
- Login flow works end-to-end
- Form validation prevents empty/invalid submissions
- User sees helpful error messages
- Mobile-responsive layout

**Deliverables:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/lib/validators/auth.ts` (Zod schemas)

---

## Milestone 1.3 — App Shell & Deployment

### P1-T5: Build Dashboard Layout Shell ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `/(dashboard)/layout.tsx` — authenticated layout wrapper
- [ ] Build responsive sidebar/navigation (mobile: bottom nav, desktop: sidebar)
- [ ] Navigation items: Dashboard (home icon), My Medicines (pill icon), Settings (gear icon)
- [ ] Show user name/email in nav header
- [ ] Add logout button in nav
- [ ] Create `/(dashboard)/page.tsx` — empty dashboard with placeholder cards:
  - "Total Medicines: 0"
  - "Expiring Soon: 0"
  - "Interactions: 0"
- [ ] Create React Query provider wrapper
- [ ] Mobile-responsive: test at 375px width

**Acceptance Criteria:**
- Authenticated user sees dashboard with navigation
- Navigation works between placeholder pages
- Logout button works
- Layout responsive on mobile and desktop
- Unauthenticated user redirected to login

**Deliverables:**
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/page.tsx`
- `src/components/shared/Sidebar.tsx` or `Navigation.tsx`

---

### P1-T6: Landing Page & Deployment ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `/` landing page — explains what MedSafe does
  - Hero section: headline, one-line description, CTA button ("Get Started")
  - 3 feature highlights (track expiry, check interactions, get alerts)
  - Footer with links
- [ ] Connect Vercel to GitHub repo
- [ ] Configure environment variables in Vercel dashboard
- [ ] Deploy to Vercel — verify everything works at production URL
- [ ] Test: signup + login + dashboard on production URL
- [ ] Fix any production-only issues (env vars, CORS, cookies)

**Acceptance Criteria:**
- Landing page loads at production URL
- Signup/login works on production
- Dashboard accessible after login on production
- No console errors in production

**Deliverables:**
- `src/app/page.tsx` (landing page)
- Live Vercel URL documented in `_state.md`

---

### P1-T7: CI/CD & Cleanup ⬜
**Effort:** 1 session (1-2 hrs)
**Subtasks:**
- [ ] Create `.github/workflows/ci.yml`:
  - Trigger on push to main and PRs
  - Steps: checkout → install deps → `npx tsc --noEmit` → `npm run lint`
- [ ] Verify CI runs on a test push
- [ ] Create `GET /api/health` endpoint — returns `{ status: "ok", timestamp: ... }`
- [ ] Update `_state.md`: mark Phase 1 complete, log session work
- [ ] Update `architecture.md` if any decisions changed during implementation
- [ ] Commit everything, push to main

**Acceptance Criteria:**
- CI pipeline runs and passes on push
- Health endpoint responds with 200
- `_state.md` reflects Phase 1 completion
- No linting or type errors

**Deliverables:**
- `.github/workflows/ci.yml`
- `src/app/api/health/route.ts`
- Updated `_state.md`

---

# ═══════════════════════════════════════════
# PHASE 2 — Medicine Cabinet
# Target: 7-8 sessions | Priority: HIGH
# Gate: Full CRUD working with expiry status
# ═══════════════════════════════════════════

## Milestone 2.1 — Medicine CRUD Backend

### P2-T1: Medicine API Routes ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `src/types/medicine.ts` — Medicine interface, CreateMedicine, UpdateMedicine types
- [ ] Create `src/lib/validators/medicine.ts` — Zod schemas for create/update
- [ ] Create `GET /api/medicines` — list all medicines for authenticated user (sorted by expiry_date ASC)
- [ ] Create `POST /api/medicines` — create medicine (validate with Zod, associate with user's "self" family_member)
- [ ] Create `PUT /api/medicines/[id]` — update medicine (verify ownership via user_id check)
- [ ] Create `DELETE /api/medicines/[id]` — delete medicine (verify ownership)
- [ ] Add error handling: 400 (validation), 401 (unauth), 403 (not owner), 404 (not found)
- [ ] Test all 4 endpoints with Postman or curl

**Acceptance Criteria:**
- All CRUD operations work correctly
- Validation rejects invalid data (missing name, missing expiry, past expiry date allowed)
- User cannot modify another user's medicines
- Consistent response format: `{ success: true, data }` / `{ success: false, error }`

**Deliverables:**
- `src/app/api/medicines/route.ts` (GET, POST)
- `src/app/api/medicines/[id]/route.ts` (PUT, DELETE)
- `src/types/medicine.ts`
- `src/lib/validators/medicine.ts`

---

### P2-T2: CDSCO Drug Search API ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Copy cleaned `cdsco_brands.json` from Phase 0 into `public/data/` or serve via API route
- [ ] Create `GET /api/drugs/search?q=crocin` — fuzzy search CDSCO dataset
  - Load JSON into memory on first request (cache in module scope)
  - Search by brand name AND generic name (case-insensitive, starts-with + includes)
  - Return top 10 matches: `{ brand, generic, salts, strength }`
- [ ] Handle edge cases: empty query, single character (return nothing), special characters
- [ ] Test with: "Cro" → Crocin, "Para" → Paracetamol-based brands, "XYZ" → no results

**Acceptance Criteria:**
- Search returns relevant results within 100ms
- Results include brand name, generic name, and salt composition
- Empty/short queries handled gracefully
- Dataset loads once and stays cached in memory

**Deliverables:**
- `src/app/api/drugs/search/route.ts`
- CDSCO data accessible to API route

---

## Milestone 2.2 — Medicine Cabinet UI

### P2-T3: Add Medicine Form ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `AddMedicineForm` component (modal or full page — decide based on design system)
- [ ] Fields: Brand Name (required), Expiry Date (required), Quantity (optional), Dosage (optional)
- [ ] Build `DrugAutocomplete` component:
  - Debounced input (300ms) → calls `/api/drugs/search`
  - Dropdown with matching results
  - On select: auto-fill generic name + salt composition (hidden fields, saved to DB)
  - On no match: allow manual entry, salt fields stay empty
- [ ] Build month/year picker for expiry date (not full calendar — medicines expire by month)
- [ ] Wire form to `POST /api/medicines` via React Query mutation
- [ ] Add loading state, success toast, error handling
- [ ] Clear form after successful submission
- [ ] Add "Add Another" option after save

**Acceptance Criteria:**
- Form submits and creates medicine in database
- Autocomplete works: type "Cro" → select Crocin → salt auto-fills
- Manual entry works when autocomplete has no match
- Expiry date picker allows only month/year selection
- Form validates required fields before submission

**Deliverables:**
- `src/components/shared/AddMedicineForm.tsx`
- `src/components/shared/DrugAutocomplete.tsx`
- `src/hooks/useAddMedicine.ts` (React Query mutation)

---

### P2-T4: Medicine List & Status Badges ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `useMedicines` React Query hook (GET /api/medicines)
- [ ] Create `MedicineCard` component:
  - Shows: brand name, generic name (if available), expiry date, status badge
  - Status badge logic:
    - 🟢 Safe: >30 days to expiry
    - 🟡 Expiring Soon: 1-30 days to expiry
    - 🔴 Expired: past expiry date
  - Tap/click to expand (show salt, quantity, dosage, edit/delete buttons)
- [ ] Create `MedicineList` component:
  - Maps medicines to MedicineCard
  - Sorted by expiry date (soonest first — most urgent at top)
  - Loading: skeleton cards (3 placeholders)
  - Empty state: illustration + "Your cabinet is empty. Add your first medicine." + CTA button
- [ ] Create `/medicines` page using MedicineList
- [ ] Create utility: `getExpiryStatus(expiryDate)` → returns { status, label, daysRemaining }

**Acceptance Criteria:**
- Medicine list loads and displays all user's medicines
- Status badges show correct color based on expiry date
- List sorted by soonest expiry first
- Loading skeleton shows while fetching
- Empty state shows when no medicines exist
- Mobile-responsive cards

**Deliverables:**
- `src/components/shared/MedicineCard.tsx`
- `src/components/shared/MedicineList.tsx`
- `src/app/(dashboard)/medicines/page.tsx`
- `src/hooks/useMedicines.ts`
- `src/lib/utils/expiry.ts`

---

### P2-T5: Edit & Delete Medicine ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `EditMedicineForm` — pre-filled version of AddMedicineForm
  - Reuse same form component with `mode: 'create' | 'edit'` prop
  - Pre-populate all fields from existing medicine data
  - On submit: call PUT /api/medicines/[id] via React Query mutation
- [ ] Create delete confirmation dialog (shadcn AlertDialog):
  - "Are you sure you want to remove [medicine name]?"
  - Confirm → DELETE /api/medicines/[id] → toast success → remove from list
  - Cancel → close dialog
- [ ] Create `useUpdateMedicine` and `useDeleteMedicine` React Query mutation hooks
- [ ] After mutation success: invalidate medicines query (auto-refresh list)
- [ ] Test full flow: add → view → edit → verify changes → delete → verify removal

**Acceptance Criteria:**
- Edit form pre-fills with correct data
- Update saves and reflects in list immediately
- Delete shows confirmation before removing
- List refreshes automatically after edit/delete
- Cannot edit/delete another user's medicines (API-level check)

**Deliverables:**
- Updated `AddMedicineForm.tsx` (now handles edit mode)
- `src/hooks/useUpdateMedicine.ts`
- `src/hooks/useDeleteMedicine.ts`

---

## Milestone 2.3 — Dashboard & Polish

### P2-T6: Dashboard Summary Cards ⬜
**Effort:** 1 session (2 hrs)
**Subtasks:**
- [ ] Create `GET /api/dashboard/summary` — returns:
  ```json
  {
    "totalMedicines": 7,
    "expiringSoon": 2,
    "expired": 1,
    "safe": 4,
    "interactions": 0
  }
  ```
- [ ] Create `DashboardSummary` component with stat cards:
  - Total Medicines (neutral color)
  - Expiring Soon (amber with count)
  - Expired (red with count)
  - Interactions placeholder (will be populated in Phase 3, show 0 for now)
- [ ] Link each card to the medicines page (filtered by status if possible, or just navigate)
- [ ] Replace placeholder dashboard content with real summary

**Acceptance Criteria:**
- Dashboard shows correct counts matching actual medicine data
- Numbers update when medicines are added/edited/deleted
- Cards are visually clear with appropriate colors
- Mobile-responsive layout (2x2 grid or stacked)

**Deliverables:**
- `src/app/api/dashboard/summary/route.ts`
- `src/components/shared/DashboardSummary.tsx`
- Updated `src/app/(dashboard)/page.tsx`

---

### P2-T7: RLS Verification & Phase 2 Wrap-up ⬜
**Effort:** 1 session (2 hrs)
**Subtasks:**
- [ ] Create second test account, add medicines
- [ ] Verify: User A cannot see User B's medicines (test via UI and direct API call)
- [ ] Verify: User A cannot edit/delete User B's medicines
- [ ] Test all CRUD operations one more time on production (Vercel)
- [ ] Fix any production-only issues
- [ ] Run through full acceptance criteria list for Phase 2
- [ ] Update `_state.md`: mark Phase 2 complete
- [ ] Update `defects.md` if any patterns emerged
- [ ] Deploy final Phase 2 to production

**Acceptance Criteria:**
- All Phase 2 acceptance criteria pass
- RLS isolation verified with 2 accounts
- Production deployment works end-to-end
- `_state.md` updated

**Deliverables:**
- Updated `_state.md`
- Updated `defects.md` (if needed)
- Production-verified Phase 2

---

# ═══════════════════════════════════════════
# PHASE 3 — Drug Interaction Engine
# Target: 8-10 sessions | Priority: CRITICAL
# Gate: Interactions detected, cached, displayed
# This is the resume-defining phase.
# ═══════════════════════════════════════════

## Milestone 3.1 — Drug Resolution Service

### P3-T1: Build RxNorm Client & Synonym Table ⬜
**Effort:** 1 session (3 hrs)
**Subtasks:**
- [ ] Create `src/lib/clients/rxnorm.ts`:
  - `resolveToRxCUI(drugName: string): Promise<string | null>`
  - Calls `https://rxnav.nlm.nih.gov/REST/rxcui.json?name={name}&search=2`
  - Parse response: extract rxcui from result
  - Return null if not found
- [ ] Load synonym table from Phase 0 (`rxnorm_synonyms.json`) into `src/lib/data/synonyms.ts`
- [ ] Before calling RxNorm, check synonym table: if "Paracetamol" → substitute "Acetaminophen"
- [ ] Add error handling: network errors, API timeouts (5s), malformed responses
- [ ] Add logging: log resolution attempts and results (for debugging, not production)
- [ ] Test with 10 drugs: 5 that should resolve, 5 that are tricky

**Acceptance Criteria:**
- RxNorm client resolves "Acetaminophen" → valid rxcui
- Synonym substitution works: "Paracetamol" → substituted → resolved
- Unresolvable drug returns null (no crash)
- Network errors handled gracefully
- Timeout at 5s prevents hanging

**Deliverables:**
- `src/lib/clients/rxnorm.ts`
- `src/lib/data/synonyms.ts`

---

### P3-T2: Build Drug Resolution API Route ⬜
**Effort:** 1 session (3 hrs)
**Subtasks:**
- [ ] Create `POST /api/drugs/resolve`:
  - Input: `{ brand_name: string }`
  - Step 1: Look up brand in CDSCO data → get salt/generic name
  - Step 2: Check synonym table → substitute if needed
  - Step 3: Call RxNorm API → get rxcui
  - Return: `{ brand_name, generic_name, salt_composition, rxcui }` or `{ resolved: false, reason }`
- [ ] After successful resolution: update the medicine record's `rxcui`, `generic_name`, `salt_composition` fields in DB
- [ ] Handle: brand not in CDSCO (skip to manual salt, try RxNorm anyway)
- [ ] Handle: salt found but RxNorm can't resolve (return partial data + null rxcui)
- [ ] Handle: complete failure (return unresolved status)
- [ ] Test end-to-end: add medicine "Crocin" → resolve → rxcui populated on medicine record

**Acceptance Criteria:**
- Resolution chain works: brand → CDSCO → salt → synonym → RxNorm → rxcui
- Medicine record updated with resolution data
- Partial resolution handled (salt found, no rxcui → still useful)
- Complete failure returns clean error, doesn't break anything

**Deliverables:**
- `src/app/api/drugs/resolve/route.ts`
- `src/lib/services/drugResolver.ts` (business logic)

---

## Milestone 3.2 — Interaction Engine

### P3-T3: Build RxNav Interaction Client ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `src/lib/clients/rxnav.ts`:
  - `checkInteractions(rxcui: string): Promise<Interaction[]>`
  - Calls `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui={rxcui}`
  - Parse response: extract interaction pairs with severity and description
  - Map severity to internal levels: severe | moderate | mild
- [ ] Create `src/types/interaction.ts`:
  - `Interaction { rxcui_a, rxcui_b, severity, description, source }`
- [ ] Add error handling: network errors, timeouts, empty responses
- [ ] Test with known interacting rxcui (e.g., Warfarin rxcui)

**Acceptance Criteria:**
- Client returns parsed interaction data for drugs with known interactions
- Returns empty array for drugs with no interactions
- Severity mapping matches RxNav categories
- Errors handled without crashing

**Deliverables:**
- `src/lib/clients/rxnav.ts`
- `src/types/interaction.ts`

---

### P3-T4: Build Interaction Engine with Caching ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `src/lib/services/interactionEngine.ts`:
  - `checkAllInteractions(familyMemberId: string): Promise<InteractionWarning[]>`
  - Step 1: Get all active medicines for family member where rxcui is not null
  - Step 2: Generate all unique pairs (n medicines = n*(n-1)/2 pairs)
  - Step 3: For each pair, check `interactions_cache` table first
  - Step 4: If not cached → call RxNav → parse → cache in DB
  - Step 5: Return all found interactions as InteractionWarning[]
- [ ] Implement serial API calls (one at a time) to avoid rate limiting
- [ ] Implement DB caching: insert into `interactions_cache` after each RxNav call
  - Normalize pair ordering: always store (smaller_rxcui, larger_rxcui) to avoid duplicate pairs
- [ ] Handle: medicine without rxcui → skip, flag as "unresolvable"
- [ ] Create `GET /api/interactions?family_member_id=X` API route

**Acceptance Criteria:**
- Correct interactions returned for known interacting medicines
- Cache hit on second request (no RxNav API call)
- Pair normalization prevents duplicate cache entries
- Unresolvable medicines flagged but don't break the check
- API route returns interactions for authenticated user only

**Deliverables:**
- `src/lib/services/interactionEngine.ts`
- `src/app/api/interactions/route.ts`

---

### P3-T5: Auto-Resolve on Medicine Add/Edit ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Modify `POST /api/medicines`: after creating medicine, trigger drug resolution in background
  - Call drug resolver → update medicine with rxcui
  - Then run interaction check for that family member
  - Don't block the response — medicine is saved immediately, resolution happens async
- [ ] Modify `PUT /api/medicines/[id]`: if brand_name changed, re-resolve and re-check
- [ ] Modify `DELETE /api/medicines/[id]`: interactions involving deleted medicine should no longer appear in results
- [ ] Create helper: `triggerResolutionAndCheck(medicineId, familyMemberId)`
- [ ] Handle edge case: resolution fails → medicine still saved, interaction check skipped for that medicine

**Acceptance Criteria:**
- Adding a medicine automatically triggers resolution
- After resolution, interactions are checked
- Editing medicine name re-triggers resolution
- Deleting a medicine updates interaction results
- Resolution failure doesn't prevent medicine from being saved

**Deliverables:**
- Updated medicine API routes
- `src/lib/services/resolveAndCheck.ts`

---

## Milestone 3.3 — Interaction UI

### P3-T6: Interaction Warning Components ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `useInteractions(familyMemberId)` React Query hook
- [ ] Create `InteractionWarningCard` component:
  - Shows: Drug A name ↔ Drug B name
  - Severity badge (Severe: red, Moderate: amber, Mild: yellow)
  - Expandable description
  - "Consult your doctor about this interaction" disclaimer text
- [ ] Create `InteractionBanner` component:
  - Appears at top of medicine list when severe interactions exist
  - "⚠️ {count} interaction warning(s) found. Review below."
  - Dismissable per session (not permanent — returns on reload)
- [ ] Create `InteractionList` section within medicines page:
  - Shows all interaction cards
  - Empty state: "No interactions detected. This doesn't mean all combinations are safe — always consult your doctor."
- [ ] Add small warning icon on `MedicineCard` for medicines involved in interactions

**Acceptance Criteria:**
- Interaction warnings render with correct severity colors
- Disclaimer present on every warning card
- Banner shows only when severe interactions exist
- Per-medicine icon shows which medicines are involved
- Empty state messaging is medically responsible (not falsely reassuring)

**Deliverables:**
- `src/components/shared/InteractionWarningCard.tsx`
- `src/components/shared/InteractionBanner.tsx`
- `src/hooks/useInteractions.ts`

---

### P3-T7: Unresolvable Drug Handling & Loading States ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create "unresolvable" indicator on MedicineCard:
  - If rxcui is null after resolution attempt → show small info icon
  - Tooltip/expandable: "We couldn't find interaction data for this medicine. This doesn't mean it's safe — please consult your doctor."
- [ ] Create "Checking interactions..." loading state:
  - Shown after adding a medicine while resolution runs
  - Skeleton interaction cards or spinner
  - Transitions to real results when check completes
- [ ] Create "Resolution in progress" indicator on medicine card (brief, during async resolution)
- [ ] Test UX flow: add medicine → see loading → see result (or "unavailable")

**Acceptance Criteria:**
- User always knows the status of interaction checking
- Unresolvable medicines clearly communicated with appropriate messaging
- No moment where user is confused about what's happening
- No false sense of safety

**Deliverables:**
- Updated `MedicineCard.tsx`
- Loading state components

---

### P3-T8: Dashboard Integration & Phase 3 Wrap-up ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Update `/api/dashboard/summary` to include interaction count
- [ ] Update `DashboardSummary` component: show interaction warning count (red if >0)
- [ ] End-to-end test the full flow:
  1. Sign up → empty dashboard
  2. Add "Warfarin" → resolves, no interactions (only one medicine)
  3. Add "Aspirin" → resolves, interaction warning appears
  4. Dashboard shows "1 interaction warning"
  5. Delete Aspirin → warning disappears
  6. Add unresolvable medicine → "data unavailable" message
- [ ] Test on production (Vercel)
- [ ] Update `_state.md`: mark Phase 3 complete
- [ ] Update `defects.md` with any patterns
- [ ] Celebrate — this is the MVP milestone 🎉

**Acceptance Criteria:**
- Dashboard reflects real-time interaction data
- Full add→resolve→check→display flow works on production
- All edge cases handled (unresolvable, no interactions, severe interactions)
- `_state.md` updated

**Deliverables:**
- Updated dashboard
- Updated `_state.md`
- **MVP COMPLETE — deployable, demoable product**

---

# ═══════════════════════════════════════════
# PHASE 4 — Notifications & Expiry Alerts
# Target: 4-5 sessions | Priority: MEDIUM
# Gate: Expiry emails delivered, deduplicated
# ═══════════════════════════════════════════

## Milestone 4.1 — Notification Backend

### P4-T1: Expiry Check Logic & Resend Integration ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create Resend account (free tier), get API key, add to `.env`
- [ ] Create `src/lib/clients/resend.ts`:
  - `sendExpiryAlert(to, medicineName, expiryDate, alertType): Promise<boolean>`
  - Compose HTML email: medicine name, expiry date, urgency message, MedSafe branding
  - Call Resend API: `POST https://api.resend.com/emails`
- [ ] Create `src/lib/services/expiryChecker.ts`:
  - `findExpiringMedicines()`:
    - Query medicines where expiry_date is within 30, 7, or 1 day(s) from today
    - Join with users to get email
    - Exclude medicines that already have a notification_log entry for that tier
    - Return list grouped by alert type
  - `processExpiryAlerts()`:
    - Call findExpiringMedicines()
    - For each: send email → log to notification_log
    - Return summary: { sent: N, skipped: N, failed: N }
- [ ] Test with manually inserted medicine (expiry = tomorrow)

**Acceptance Criteria:**
- Expiry detection correctly identifies medicines at 30/7/1 day thresholds
- Email sends via Resend and arrives in inbox
- Notification logged in DB after successful send
- Duplicate medicine+tier combo skipped (deduplication)

**Deliverables:**
- `src/lib/clients/resend.ts`
- `src/lib/services/expiryChecker.ts`

---

### P4-T2: Cron Endpoint & Security ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Generate random cron secret, add as `CRON_SECRET` in `.env` and Vercel env vars
- [ ] Create `POST /api/cron/check-expiry`:
  - Validate `X-Cron-Secret` header matches env var → 401 if not
  - Call `processExpiryAlerts()`
  - Return summary: `{ sent, skipped, failed, timestamp }`
- [ ] Create account on cron-job.org:
  - Set URL to `https://your-app.vercel.app/api/cron/check-expiry`
  - Method: POST
  - Header: `X-Cron-Secret: your-secret`
  - Schedule: daily at 8:00 AM IST (2:30 AM UTC)
- [ ] Test: trigger cron manually via Postman → verify email sent
- [ ] Test: call without secret → verify 401 rejection
- [ ] Monitor: check cron-job.org execution log after 24 hrs

**Acceptance Criteria:**
- Cron endpoint rejects unauthenticated requests
- Cron endpoint processes all users' medicines in one run
- cron-job.org successfully triggers the endpoint
- Email delivered within minutes of cron execution

**Deliverables:**
- `src/app/api/cron/check-expiry/route.ts`
- cron-job.org configured and tested

---

## Milestone 4.2 — User Preferences & Wrap-up

### P4-T3: User Settings Page ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `PUT /api/users/preferences` — update notification_preference (email | none)
- [ ] Create `GET /api/users/profile` — returns user profile + preferences
- [ ] Create `/(dashboard)/settings/page.tsx`:
  - Show user email, name
  - Toggle: "Email notifications for expiring medicines" (on/off)
  - Save button → calls API → toast confirmation
- [ ] Modify expiryChecker: skip users with notification_preference = 'none'
- [ ] Add Settings link to navigation

**Acceptance Criteria:**
- User can toggle notifications on/off
- Setting persists across sessions
- Disabled notifications → no emails sent for that user
- Settings page accessible from navigation

**Deliverables:**
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/api/users/preferences/route.ts`
- `src/app/api/users/profile/route.ts`

---

### P4-T4: Phase 4 Testing & Wrap-up ⬜
**Effort:** 1 session (2 hrs)
**Subtasks:**
- [ ] Add test medicine expiring in 25 days → verify 30-day email sent on next cron
- [ ] Add test medicine expiring in 5 days → verify 7-day email
- [ ] Add test medicine expiring tomorrow → verify 1-day email
- [ ] Trigger cron again → verify NO duplicate emails sent
- [ ] Disable notifications for test user → trigger cron → verify no email
- [ ] Check email rendering: looks good on Gmail, Outlook
- [ ] Deploy to production, verify cron works in prod
- [ ] Update `_state.md`: mark Phase 4 complete

**Acceptance Criteria:**
- All notification tiers working
- Deduplication verified
- Settings toggle working
- Production cron functional
- `_state.md` updated

**Deliverables:**
- Updated `_state.md`
- **BETA COMPLETE — share with testers**

---

# ═══════════════════════════════════════════
# PHASE 5 — OCR Scanner
# Target: 8-10 sessions | Priority: MEDIUM
# Gate: Camera scan extracts name + expiry
# First phase requiring FastAPI / Render
# ═══════════════════════════════════════════

## Milestone 5.1 — FastAPI Setup & OCR Pipeline

### P5-T1: Initialize FastAPI Project ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `backend/` folder structure:
  - `app/main.py`, `app/config.py`, `app/routes/`, `app/services/`, `app/models/`
- [ ] Create `requirements.txt`: fastapi, uvicorn, python-multipart, pillow, opencv-python-headless, pytesseract, easyocr
- [ ] Create `app/main.py`:
  - FastAPI app with CORS (allow only Vercel domain)
  - Health check: `GET /health`
- [ ] Create `app/config.py`: load env vars
- [ ] Test locally: `uvicorn app.main:app --reload`
- [ ] Create Render account, connect GitHub repo
- [ ] Configure Render:
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Add build script for Tesseract: `apt-get install -y tesseract-ocr`
- [ ] Deploy to Render, verify `/health` responds
- [ ] Add `FASTAPI_BACKEND_URL` to Vercel env vars

**Acceptance Criteria:**
- FastAPI runs locally and on Render
- CORS configured correctly (test from Vercel domain)
- Health endpoint responds on Render URL
- Tesseract installed on Render (verify with `tesseract --version` in logs)

**Deliverables:**
- `backend/` folder with FastAPI scaffold
- Live Render URL documented in `_state.md`

---

### P5-T2: Image Preprocessing Pipeline ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `app/services/image_preprocessor.py`:
  - `preprocess(image_bytes) -> PIL.Image`
  - Step 1: Load image from bytes using Pillow
  - Step 2: Resize if wider than 2000px (preserve aspect ratio)
  - Step 3: Convert to grayscale
  - Step 4: Apply adaptive thresholding (OpenCV) — makes text high-contrast
  - Step 5: Deskew if rotation detected (OpenCV minAreaRect)
  - Step 6: Optional: crop to text region (if border is large)
  - Return preprocessed image
- [ ] Collect 10 real medicine strip photos (from your own medicine drawer)
- [ ] Test preprocessor on all 10: verify text becomes clearer visually
- [ ] Save before/after images for debugging

**Acceptance Criteria:**
- Preprocessor runs without errors on 10 real photos
- Text visually clearer in preprocessed output
- Processing time <2 seconds per image
- Works with both JPEG and PNG input

**Deliverables:**
- `app/services/image_preprocessor.py`
- `backend/tests/fixtures/sample_strips/` — 10 test images

---

### P5-T3: Tesseract + EasyOCR Extraction ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `app/services/ocr_service.py`:
  - `extract_text(image) -> { raw_text, confidence }`
  - Primary: Tesseract via `pytesseract.image_to_data()` — get text + confidence
  - If average confidence < 60%: fallback to EasyOCR
  - Return raw extracted text + confidence score
- [ ] Create `app/services/text_parser.py`:
  - `parse_medicine_info(raw_text) -> { medicine_name, expiry_date }`
  - Medicine name: heuristic — largest/boldest text, common brand patterns, first line
  - Expiry date: regex patterns:
    - `EXP:? ?\d{2}[/-]\d{4}` (EXP 06/2025)
    - `EXP:? ?[A-Z]{3}[/-]?\d{4}` (EXP JUN2025)
    - `\d{2}[/-]\d{4}` near "EXP" or "EXPIRY"
  - Return parsed results (or null for fields that couldn't be parsed)
- [ ] Test with 10 sample images: log extracted name + expiry vs actual
- [ ] Document accuracy: X out of 10 names correct, Y out of 10 dates correct

**Acceptance Criteria:**
- Tesseract extracts readable text from 7/10 clear images
- EasyOCR fallback triggers and improves results on poor-quality images
- Date parser correctly extracts expiry from 6/10 images
- Name extraction gets at least partial match on 6/10 images
- Results documented with accuracy numbers

**Deliverables:**
- `app/services/ocr_service.py`
- `app/services/text_parser.py`
- `.claude/outputs/phase-05/ocr-accuracy-report.md`

---

### P5-T4: OCR API Endpoint ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `app/routes/ocr.py`:
  - `POST /ocr/scan` — accepts multipart/form-data with image file
  - Validate: file type (JPEG/PNG only), file size (<5MB)
  - Pipeline: validate → preprocess → OCR → parse → return results
  - Response: `{ medicine_name, expiry_date, confidence_score, raw_text }`
  - Error response: `{ error, message }` for invalid files or OCR failure
- [ ] Create `app/models/schemas.py`:
  - Pydantic models for OCR response and error
- [ ] Add simple rate limiting: max 10 requests per minute per IP (in-memory dict)
- [ ] Test endpoint with Postman: upload sample image → verify response
- [ ] Deploy to Render, test via Render URL

**Acceptance Criteria:**
- Endpoint accepts image upload and returns parsed results
- Invalid file types rejected (400)
- Oversized files rejected (413)
- Rate limit enforced (429 after 10 requests)
- Works on Render deployment

**Deliverables:**
- `app/routes/ocr.py`
- `app/models/schemas.py`

---

## Milestone 5.2 — Scanner Frontend

### P5-T5: Camera Capture Component ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `src/components/shared/CameraCapture.tsx`:
  - Use `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`
  - Show live camera preview in a container
  - Overlay: semi-transparent guide rectangle showing where to align medicine strip
  - Capture button: takes snapshot from video stream to canvas
  - Preview captured image before submitting
  - "Retake" and "Use this photo" buttons
- [ ] Create `src/components/shared/ImageUpload.tsx`:
  - Fallback for desktop or denied camera permission
  - File input accepting JPEG/PNG, max 5MB
  - Preview selected image
- [ ] Create `src/lib/utils/imageCompression.ts`:
  - Compress image client-side using canvas
  - Resize to max 1200px width, quality 0.8
  - Output as Blob
- [ ] Test on mobile Chrome (Android) and desktop Chrome
- [ ] Handle permission denied: show file upload fallback with message

**Acceptance Criteria:**
- Camera opens with rear-facing camera on mobile
- Guide overlay visible on camera preview
- Captured image previewed before submission
- Fallback to file upload when camera unavailable
- Image compressed to <1MB before any upload
- Works on Chrome Android and desktop Chrome

**Deliverables:**
- `src/components/shared/CameraCapture.tsx`
- `src/components/shared/ImageUpload.tsx`
- `src/lib/utils/imageCompression.ts`

---

### P5-T6: Post-Scan Review & Integration ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create Next.js proxy route `POST /api/ocr/scan`:
  - Verify auth (user must be logged in)
  - Forward image to FastAPI backend
  - Return OCR results to frontend
- [ ] Create `ScanReviewForm` component:
  - Shows extracted medicine name (editable text input)
  - Shows extracted expiry date (editable month/year picker)
  - Shows confidence score as indicator (green/yellow/red)
  - "Name not right? Edit it above or search our database:" → DrugAutocomplete
  - "Save to Cabinet" button → uses existing Add Medicine flow
  - "Try Again" button → returns to camera
  - "Add Manually Instead" link → goes to regular Add Medicine form
- [ ] Wire up full flow:
  1. User taps "Scan Medicine" on medicines page
  2. Camera opens → capture → compress → upload to API
  3. Loading state: "Analyzing your medicine strip... this may take 10-15 seconds"
  4. Results shown in ScanReviewForm
  5. User edits if needed → saves to cabinet
- [ ] Set `added_via: 'scan'` when saving scanned medicine
- [ ] Test full flow on production

**Acceptance Criteria:**
- Complete scan-to-save flow works end-to-end
- User can correct extracted data before saving
- Saved medicine appears in cabinet immediately
- Loading state manages user expectations during processing
- Error state: "Couldn't read this strip" with manual fallback option
- Works on mobile and desktop

**Deliverables:**
- `src/app/api/ocr/scan/route.ts`
- `src/components/shared/ScanReviewForm.tsx`
- Updated medicines page with "Scan Medicine" button

---

### P5-T7: Phase 5 Testing & Wrap-up ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Test with 20 medicine strips (diverse brands, conditions):
  - 10 clear, well-lit photos
  - 5 slightly blurry / angled
  - 5 poor conditions (dark, reflective)
- [ ] Document accuracy: names correct, dates correct, fallback triggered
- [ ] Test camera on Safari iOS (known quirks with getUserMedia)
- [ ] Test Render cold start: first request after idle → verify UI handles wait
- [ ] Set up Render keep-alive: cron-job.org pings `/health` every 14 minutes during 8AM-11PM IST
- [ ] Fix any critical bugs found
- [ ] Update `_state.md`: mark Phase 5 complete
- [ ] Update `defects.md` with OCR-specific patterns
- [ ] Deploy to production

**Acceptance Criteria:**
- 70%+ accuracy on clear, well-lit strips
- Graceful degradation on poor photos
- Camera works on Android Chrome and iOS Safari
- Render keep-alive prevents cold starts during active hours
- `_state.md` updated

**Deliverables:**
- `.claude/outputs/phase-05/ocr-final-accuracy-report.md`
- Updated `_state.md`

---

# ═══════════════════════════════════════════
# PHASE 6 — Family Mode, Polish & Launch
# Target: 8-10 sessions | Priority: MEDIUM
# Gate: Production-ready, real users
# ═══════════════════════════════════════════

## Milestone 6.1 — Family Mode

### P6-T1: Family Member CRUD ⬜
**Effort:** 1 session (3 hrs)
**Subtasks:**
- [ ] Create `src/types/family.ts` — FamilyMember interface
- [ ] Create `src/lib/validators/family.ts` — Zod schema
- [ ] Create API routes:
  - `GET /api/family` — list user's family members
  - `POST /api/family` — add family member (name, relationship)
  - `PUT /api/family/[id]` — edit family member
  - `DELETE /api/family/[id]` — delete (cascade deletes their medicines)
- [ ] Add RLS: family members scoped to owning user
- [ ] Create `/(dashboard)/family/page.tsx`:
  - List family members with relationship labels
  - Add member form (name + relationship dropdown)
  - Edit/delete per member
  - "Self" member cannot be deleted
- [ ] Test: add parent, add child, verify they appear in list

**Acceptance Criteria:**
- CRUD for family members works
- "Self" member auto-created and undeletable
- Deleting a member deletes their medicines (with confirmation warning)
- RLS verified

**Deliverables:**
- Family API routes
- Family management page
- React Query hooks for family data

---

### P6-T2: Cabinet Switcher & Scoped Data ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Create `FamilyMemberSwitcher` component:
  - Dropdown or tab bar showing all family members
  - Selected member persisted in URL query param or React state
  - Default: "Self" selected
- [ ] Add switcher to medicines page layout (above medicine list)
- [ ] Modify `GET /api/medicines`: accept `family_member_id` query param, filter accordingly
- [ ] Modify `POST /api/medicines`: associate new medicine with selected family member
- [ ] Modify `GET /api/interactions`: scope to selected family member only
- [ ] Verify: interactions are per-member (Dad's medicines don't interact with Mom's)
- [ ] Test: switch between members → list and interactions update correctly

**Acceptance Criteria:**
- Switching members filters medicines and interactions correctly
- New medicines added to the selected member's cabinet
- Interactions checked within a member, not across members
- Switcher visible and usable on mobile

**Deliverables:**
- `src/components/shared/FamilyMemberSwitcher.tsx`
- Updated medicine and interaction API routes

---

## Milestone 6.2 — Dashboard & Export

### P6-T3: Dashboard Redesign ⬜
**Effort:** 1 session (3 hrs)
**Subtasks:**
- [ ] Update `GET /api/dashboard/summary`: include per-member breakdown
- [ ] Redesign dashboard:
  - Aggregate stats across all family members (total medicines, total warnings)
  - Per-member summary cards (Mom: 3 medicines, 1 warning)
  - "Most urgent" widget: nearest expiring medicine across all members
  - Quick actions: "Add Medicine", "Scan Medicine"
- [ ] Add "View All" links from dashboard cards to medicines page (filtered)
- [ ] Mobile-responsive layout

**Acceptance Criteria:**
- Dashboard shows aggregate and per-member data
- Most urgent medicine highlighted
- Quick action buttons work
- Data updates when medicines change

**Deliverables:**
- Redesigned dashboard page
- Updated summary API

---

### P6-T4: Doctor Visit PDF Export ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `GET /api/export/medications?family_member_id=X`:
  - Returns JSON of all active medicines for that member
  - Includes: brand name, generic name, salt, dosage, expiry
- [ ] Create client-side PDF generation:
  - Use browser `window.print()` with a print-optimized CSS layout
  - OR use lightweight library (jsPDF) if print styling is too limited
  - Header: "Medication List — [Member Name] — Generated [Date]"
  - Table: Brand Name | Generic/Salt | Dosage | Expiry
  - Footer: "Generated by MedSafe. For informational purposes — consult your doctor."
- [ ] Add "Export for Doctor" button on medicines page (per selected member)
- [ ] Test: generate PDF with 5+ medicines → verify readability

**Acceptance Criteria:**
- PDF contains all active medicines for selected member
- Readable and professional-looking
- Includes disclaimer
- Works on mobile (download or share)

**Deliverables:**
- Export API route
- PDF generation component
- "Export" button on medicines page

---

## Milestone 6.3 — PWA & Polish

### P6-T5: PWA Configuration ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `public/manifest.json`:
  - App name, short name, description
  - Icons (generate 192x192 and 512x512 versions)
  - Theme color, background color
  - Display: "standalone"
  - Start URL: "/dashboard"
- [ ] Add manifest link to `app/layout.tsx` `<head>`
- [ ] Add meta tags: `theme-color`, `apple-mobile-web-app-capable`, viewport
- [ ] Create basic service worker (Next.js PWA plugin or `next-pwa`)
- [ ] Test: "Add to Home Screen" on Android Chrome
- [ ] Test: "Add to Home Screen" on iOS Safari
- [ ] Verify: app opens as standalone (no browser chrome)

**Acceptance Criteria:**
- "Add to Home Screen" prompt works on Android
- App installable on iOS (manual Add to Home Screen)
- Standalone mode: no browser address bar visible
- App icon shows on home screen

**Deliverables:**
- `public/manifest.json`
- PWA icons
- Service worker configuration

---

### P6-T6: Onboarding Flow ⬜
**Effort:** 1 session (2-3 hrs)
**Subtasks:**
- [ ] Create `OnboardingFlow` component — 3-4 slides:
  1. "Welcome to MedSafe" — what the app does
  2. "Add your medicines" — show how to add manually or scan
  3. "Stay safe" — interaction warnings + expiry alerts explained
  4. "Get started" → dismiss → navigate to medicines page
- [ ] Store onboarding-completed flag in localStorage
- [ ] Show only on first login (check flag)
- [ ] Add "skip" option
- [ ] Simple slide transitions with Framer Motion

**Acceptance Criteria:**
- Onboarding shows on first login only
- All slides display and navigate correctly
- Skip button works
- Doesn't show again after completion

**Deliverables:**
- `src/components/shared/OnboardingFlow.tsx`

---

### P6-T7: Error, Empty & Loading States Audit ⬜
**Effort:** 1 session (3 hrs)
**Subtasks:**
- [ ] Audit every page and component for missing states:
  - Loading: skeleton/spinner while data fetches
  - Empty: helpful message + CTA when no data
  - Error: user-friendly message + retry when API fails
- [ ] Pages to audit:
  - [ ] Dashboard
  - [ ] Medicines list
  - [ ] Add medicine form
  - [ ] Scanner (if OCR fails)
  - [ ] Interactions section
  - [ ] Family management
  - [ ] Settings
- [ ] Fix every missing state found
- [ ] Test: disable network → verify error states show
- [ ] Test: empty account → verify all empty states show

**Acceptance Criteria:**
- Every page has loading, empty, and error states
- Error states include retry button where appropriate
- Empty states include CTA to guide user
- No raw error messages exposed to user

**Deliverables:**
- Updated components across the app

---

### P6-T8: Final Polish & Launch ⬜
**Effort:** 1 session (3-4 hrs)
**Subtasks:**
- [ ] Accessibility audit:
  - All images have alt text
  - All interactive elements keyboard accessible
  - Color contrast passes AA (check with browser dev tools)
  - Form inputs have labels
- [ ] Performance check:
  - Run Lighthouse audit → target 80+ on all metrics
  - Lazy load non-critical routes
  - Verify no unnecessarily large bundle imports
- [ ] Final design pass: consistent spacing, typography, colors across all pages
- [ ] Update landing page with screenshots of actual app
- [ ] Update GitHub README with:
  - Project description, screenshots, tech stack
  - Live demo link
  - Setup instructions
- [ ] Update `_state.md`: mark Phase 6 and project as complete
- [ ] Share with family + friends for initial user testing

**Acceptance Criteria:**
- Lighthouse: 80+ Performance, 90+ Accessibility
- No visual inconsistencies across pages
- GitHub README is portfolio-ready
- At least 5 real users have signed up and added medicines
- `_state.md` final update done

**Deliverables:**
- Polished, production-ready application
- Portfolio-ready GitHub repo
- **LAUNCH COMPLETE** 🚀

---

# ═══════════════════════════════════════════
# TASK SUMMARY
# ═══════════════════════════════════════════

| Phase | Tasks | Sessions | Calendar Days (3-4 hrs/day) |
|-------|-------|----------|---------------------------|
| 0 — Data Validation | 4 | 4 | 4 days |
| 1 — Foundation | 7 | 7 | 7 days |
| 2 — Medicine Cabinet | 7 | 7-8 | 8 days |
| 3 — Interaction Engine | 8 | 8-10 | 10 days |
| **MVP TOTAL** | **26** | **26-29** | **~30 days** |
| 4 — Notifications | 4 | 4-5 | 5 days |
| **BETA TOTAL** | **30** | **30-34** | **~35 days** |
| 5 — OCR Scanner | 7 | 7-10 | 10 days |
| 6 — Polish & Launch | 8 | 8-10 | 10 days |
| **PRODUCTION TOTAL** | **45** | **45-54** | **~55 days** |

---

# ═══════════════════════════════════════════
# MILESTONE GATES
# ═══════════════════════════════════════════

Before moving to the next phase, ALL tasks in the current phase must be ✅.
If a task is 🚫 blocked, document why and decide: resolve blocker or ⏭️ skip with documented reason.

| Gate | Condition | Unlocks |
|------|-----------|---------|
| G0 | Phase 0 complete + go/no-go = GO | Phase 1 |
| G1 | Auth works + deployed to Vercel | Phase 2 |
| G2 | Medicine CRUD + expiry badges working | Phase 3 |
| G3 | Interactions detected + displayed (**MVP**) | Phase 4 or 5 |
| G4 | Expiry emails working (**Beta**) | Phase 5 |
| G5 | OCR scan-to-save flow working | Phase 6 |
| G6 | All states polished + PWA + users (**Launch**) | Post-launch |
