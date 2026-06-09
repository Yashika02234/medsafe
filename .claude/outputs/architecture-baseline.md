# Architecture Baseline — MedSafe

> Status: FINAL — approved for implementation
> Supersedes: all prior architecture documents
> This document is the single source of truth for all architectural decisions.
> Do not deviate without updating this document and logging the reason in `defects.md`.
> Last reviewed: Pre-Phase 1 (post architecture review)

---

## HOW TO USE THIS DOCUMENT

Every implementation session should open this document before writing code. When you are uncertain about a technical decision, this document either answers it or tells you where the gap is. If you discover a case this document does not cover, stop and document the decision here before implementing.

---

## PART 1: FINAL MVP SCOPE

### What MVP Is

A user can:
1. Create an account and explicitly consent to health data collection
2. Add medicines manually (name, expiry month/year)
3. See their medicines sorted by urgency with expiry status badges
4. Receive drug interaction warnings between any two medicines in their cabinet
5. See appropriate disclaimers on all warnings and empty states

That is the complete MVP. Nothing else is required before calling it a shippable product.

### Why This Scope

Every element of the MVP serves the core safety mission: warn users about expired medicines and dangerous drug interactions. Adding more features before this works reliably dilutes focus and delays the value delivery to real users.

A user who adds 5 medicines and discovers that two of them interact dangerously has received more value than 90% of student projects ever deliver.

### What MVP Is Not

MVP does not include OCR scanning, email notifications, family mode, PWA, or a dashboard redesign. These are Phase 2+ features that build on a working core. They are not shortcuts.

### MVP Definition of Done

- [ ] A real user who has never seen the app can sign up, consent, add 5 medicines, and see any interaction warnings without being confused or blocked
- [ ] The interaction engine correctly identifies at least 5 out of 7 known interacting pairs tested in Phase 0
- [ ] No page has a missing error state, loading state, or empty state
- [ ] Medical disclaimers are present on every interaction warning and on "no interactions found"
- [ ] The app is deployed and accessible via a public URL

### Updated MVP Scope (post architecture review)

Two additions to MVP that were missing from the original plan:

1. **Consent screen on signup** — Required by DPDPA 2023. Cannot be deferred.
2. **Privacy policy page** — Required by DPDPA 2023. Cannot be deferred.

Account deletion is deferred to Phase 4 (Settings page), not MVP, but database cascades must support it from Day 1.

---

## PART 2: FINAL DATABASE ARCHITECTURE

### Design Principles

1. Single source of truth for every piece of data — no redundant columns
2. Cascade deletes defined explicitly — no orphaned records
3. RLS policies on all user data tables from the start
4. Schema supports all planned features from Day 1, even if the UI doesn't yet
5. No application-layer joins that PostgreSQL can handle in the database

### Complete Prisma Schema

> Updated after DB architecture review (db-architecture-review.md).
> Key changes: medicine_ingredients table replaces salts[]/rxcuis[] arrays,
> expiry_month/expiry_year dropped, CHECK constraints added, notification_log
> gained status/error fields, checked_pairs gained needs_recheck,
> medicine_scan_log added (empty until Phase 5), consent_text_version added.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // must include ?pgbouncer=true&connection_limit=1
  directUrl = env("DIRECT_URL")      // without pgbouncer, for migrations only
}

model users {
  id                      String    @id @db.Uuid
  // id MUST match Supabase auth.uid() — set by signup handler, not auto-generated
  email                   String    @unique
  name                    String
  notification_preference String    @default("email")
  // CHECK: notification_preference IN ('email', 'none')
  consent_given           Boolean   @default(false)
  consent_given_at        DateTime? @db.Timestamptz
  consent_text_version    String    @default("v1.0")
  // Increment when consent screen content changes. Middleware re-prompts
  // users whose consent_text_version < current app version.
  created_at              DateTime  @default(now()) @db.Timestamptz
  updated_at              DateTime  @updatedAt @db.Timestamptz

  family_members          family_members[]
  notification_log        notification_log[]
}

model family_members {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id      String   @db.Uuid
  name         String
  relationship String   @default("self")
  // CHECK: relationship IN ('self', 'parent', 'spouse', 'child', 'sibling', 'other')
  is_self      Boolean  @default(false)
  // PARTIAL UNIQUE INDEX required (not expressible in Prisma schema DSL):
  // CREATE UNIQUE INDEX idx_one_self_per_user ON family_members (user_id) WHERE is_self = true;
  // Enforces exactly one self member per user at database level.
  created_at   DateTime @default(now()) @db.Timestamptz

  user         users       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  medicines    medicines[]
}

model medicines {
  id                       String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  family_member_id         String    @db.Uuid
  // No user_id — derive via family_member → user when needed
  brand_name               String
  generic_name             String?   // from CDSCO lookup
  // salts[] and rxcuis[] REMOVED — see medicine_ingredients table
  expiry_date              DateTime  @db.Date
  // ALWAYS last day of stated expiry month. "06/2025" → 2025-06-30.
  // Use normalizeExpiryDate(month, year) from src/lib/utils/expiry.ts EVERYWHERE.
  // expiry_month and expiry_year REMOVED — use EXTRACT() from expiry_date.
  quantity                 Int?
  dosage_schedule          String?
  is_active                Boolean   @default(true)
  deactivated_at           DateTime? @db.Timestamptz   // null if still active
  deactivation_reason      String?
  // CHECK: deactivation_reason IN ('user_deleted', 'auto_archived') when not null
  added_via                String    @default("manual")
  // CHECK: added_via IN ('manual', 'scan')
  resolution_status        String    @default("pending")
  // CHECK: resolution_status IN ('pending', 'resolved', 'partial', 'unresolvable')
  // Summary of ingredient resolution: worst status among medicine_ingredients.
  // 'resolved' = all ingredients have rxcui
  // 'partial'  = some ingredients resolved, others not
  // 'unresolvable' = no ingredients could be resolved
  resolution_error         String?   // short code: 'cdsco_miss'|'rxnorm_miss'|'network_error'
  resolution_attempt_count Int       @default(0)
  resolution_attempted_at  DateTime? @db.Timestamptz
  created_at               DateTime  @default(now()) @db.Timestamptz
  updated_at               DateTime  @updatedAt @db.Timestamptz

  family_member            family_members      @relation(fields: [family_member_id], references: [id], onDelete: Cascade)
  ingredients              medicine_ingredients[]
  notification_log         notification_log[]
  scan_log                 medicine_scan_log?
}

model medicine_ingredients {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  medicine_id       String    @db.Uuid
  ordinal           Int       @default(0)   // display order within the medicine (0-indexed)
  salt_name         String    @db.VarChar(255)   // e.g. "Ibuprofen", "Paracetamol"
  rxcui             String?   // null until resolved; null means unresolved (NOT empty string)
  resolution_status String    @default("pending")
  // CHECK: resolution_status IN ('pending', 'resolved', 'unresolvable')
  // Per-ingredient status. 'partial' does not apply here — each ingredient either resolves or not.
  created_at        DateTime  @default(now()) @db.Timestamptz

  medicine          medicines @relation(fields: [medicine_id], references: [id], onDelete: Cascade)

  @@index([medicine_id])           // fast ingredient lookup per medicine
  @@index([rxcui])                 // fast lookup of all medicines containing an rxcui
}

// Pair normalization rule (applies to ALL interactions tables):
// ALWAYS sort two RxCUIs lexicographically before storing or querying.
// const [a, b] = [rxcui_1, rxcui_2].sort()
// rxcui_a is ALWAYS the lexicographically smaller value.

model interactions_cache {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rxcui_a          String   // normalized: always smaller
  rxcui_b          String   // normalized: always larger
  severity         String
  // CHECK: severity IN ('severe', 'moderate', 'mild', 'unknown')
  severity_ordinal Int
  // 1=severe, 2=moderate, 3=mild, 99=unknown
  // Enables ORDER BY severity_ordinal ASC at database level
  description      String
  source           String   @default("rxnav")
  // CHECK: source IN ('rxnav', 'gemini')
  cached_at        DateTime @default(now()) @db.Timestamptz

  // NO UNIQUE constraint on (rxcui_a, rxcui_b) — a pair can have multiple interactions
  @@index([rxcui_a, rxcui_b])
}

model checked_pairs {
  rxcui_a          String
  rxcui_b          String
  // Same normalization rule: rxcui_a < rxcui_b lexicographically
  has_interactions Boolean
  checked_at       DateTime @default(now()) @db.Timestamptz
  needs_recheck    Boolean  @default(false)
  // Set to true by a monthly maintenance job for pairs checked > 90 days ago.
  // The interaction engine treats needs_recheck = true same as "not in table" —
  // it calls RxNav and updates the cache.

  @@id([rxcui_a, rxcui_b])
}

model notification_log {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id           String   @db.Uuid
  // Deliberate redundancy: cron needs user email without JOIN chain
  medicine_id       String   @db.Uuid
  notification_type String
  // CHECK: notification_type IN ('expiry_30', 'expiry_7', 'expiry_1')
  status            String   @default("sent")
  // CHECK: status IN ('sent', 'failed', 'skipped_preference')
  error_message     String?  // Resend error text if status = 'failed'
  sent_at           DateTime @default(now()) @db.Timestamptz

  user              users     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  medicine          medicines @relation(fields: [medicine_id], references: [id], onDelete: Cascade)

  // PARTIAL unique index replaces @@unique — allows retries after failure:
  // CREATE UNIQUE INDEX idx_one_sent_per_medicine_type
  //   ON notification_log (medicine_id, notification_type)
  //   WHERE status = 'sent';
}

model medicine_scan_log {
  // Populated in Phase 5 (OCR Scanner). Table exists from Phase 1 migration but empty.
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  medicine_id         String    @unique @db.Uuid
  // One scan log per medicine (scan-added medicines only)
  raw_ocr_text        String?   // Full Tesseract output before parsing
  confidence_score    Float?    // Mean word confidence 0.0–100.0
  parsed_brand_name   String?   // What OCR extracted as brand name
  parsed_expiry       String?   // Raw expiry string from OCR e.g. "06/2025"
  user_edited_name    Boolean   @default(false)  // User changed OCR name before saving
  user_edited_expiry  Boolean   @default(false)  // User changed OCR expiry before saving
  saved_brand_name    String?   // Final value user saved
  saved_expiry_date   DateTime? @db.Date         // Final expiry saved
  tesseract_version   String?   // e.g. "5.3.0" for model tracking
  scanned_at          DateTime  @default(now()) @db.Timestamptz

  medicine            medicines @relation(fields: [medicine_id], references: [id], onDelete: Cascade)
}
```

### RLS Policies

Run in Supabase SQL editor after schema migration:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
-- interactions_cache and checked_pairs: NO RLS (shared lookup data, no user info)

CREATE POLICY "users_self_only" ON users
  USING (auth.uid()::text = id::text);

CREATE POLICY "family_members_user_only" ON family_members
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "medicines_user_only" ON medicines
  USING (
    family_member_id IN (
      SELECT id FROM family_members WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "notification_log_user_only" ON notification_log
  USING (user_id::text = auth.uid()::text);
```

### Expiry Date Normalization — UNIVERSAL RULE

`expiry_month` and `expiry_year` columns have been dropped (DB review finding N-2). Month and year are derived from `expiry_date` using `EXTRACT()` or JavaScript's `Date` methods. Never store derived values.

```typescript
// src/lib/utils/expiry.ts

export function normalizeExpiryDate(month: number, year: number): Date {
  // Returns the last day of the given month/year
  // Use EVERYWHERE expiry dates enter the system: add form, edit form, OCR parser
  return new Date(year, month, 0)
  // new Date(2025, 6, 0) = June 30, 2025 ✓
}

// Derive month and year for display — do not store these
export function getExpiryMonth(expiryDate: Date): number {
  return expiryDate.getMonth() + 1  // 1-indexed
}

export function getExpiryYear(expiryDate: Date): number {
  return expiryDate.getFullYear()
}

export function getExpiryStatus(expiryDate: Date): 'safe' | 'expiring_soon' | 'expired' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 30) return 'expiring_soon'
  return 'safe'
}
```

---

## PART 3: FINAL SERVICE ARCHITECTURE

### Two Services, No More

```
BROWSER
├── Next.js React App
└── /public/cdsco.json (CDSCO static dataset, Fuse.js search runs here)
      ↓ HTTPS
NEXT.JS ON VERCEL (bom1 region)
├── All React pages
├── All API routes (BFF)
├── RxNorm + RxNav HTTP clients
├── Resend email client
└── Prisma client (→ Supabase Mumbai)
      ↓ Direct HTTPS (Phase 5+ only)
FASTAPI ON RENDER
└── POST /ocr/scan (Tesseract OCR only)
```

### API Route Inventory (complete)

```
Auth
  POST  /api/auth/signup                 Create user + self family_member (transaction)
  POST  /api/auth/login                  Supabase signIn
  POST  /api/auth/logout                 Supabase signOut
  POST  /api/auth/consent                Set consent_given=true

Medicines
  GET   /api/medicines                   List by family_member_id (query param)
  POST  /api/medicines                   Save only — no resolution, no external calls
  PUT   /api/medicines/[id]              Update
  DELETE /api/medicines/[id]             Delete

Drug Resolution
  POST  /api/drugs/resolve               Resolve one medicine: CDSCO→synonym→RxNorm
                                         Input: { medicine_id }
                                         Triggered client-side after POST /api/medicines

Interactions
  GET   /api/interactions                Cache read only — NEVER calls RxNav
                                         Returns: { interactions, unchecked_pairs, status }
  POST  /api/interactions/check-batch    Process ≤15 uncached pairs via RxNav
                                         Input: { pairs: [{rxcui_a, rxcui_b}] }

Family
  GET   /api/family                      List family members
  POST  /api/family                      Add member
  PUT   /api/family/[id]                 Edit member
  DELETE /api/family/[id]                Delete (cascades medicines)

Dashboard
  GET   /api/dashboard/summary           Counts across selected family member

Notifications
  POST  /api/cron/check-expiry           cron-job.org only; X-Cron-Secret required
                                         Parallel batch sends (max 10 concurrent)

User
  GET   /api/users/profile               Profile + preferences
  PUT   /api/users/preferences           Update notification_preference
  DELETE /api/users                      Delete account (all data + auth user)

Health
  GET   /api/health                      { status: 'ok', timestamp }

OCR Proxy (Phase 5+)
  POST  /api/ocr/scan                    Auth check → proxy to FastAPI
```

---

## PART 4: FINAL INTERACTION ENGINE DESIGN

### The Two-Endpoint Pattern (non-negotiable)

**GET /api/interactions — always fast, cache only**
```
1. Get active medicines for family_member where rxcuis != []
2. Generate all unique salt pairs (all rxcui_a × rxcui_b across all medicine pairs)
3. Normalize all pairs: [a, b] = [r1, r2].sort()
4. Single DB query: checked_pairs WHERE (rxcui_a, rxcui_b) IN (all pairs)
5. For checked pairs → fetch all rows from interactions_cache
6. Return:
   {
     interactions: InteractionWarning[],     // from cache
     unchecked_pairs: [rxcui_a, rxcui_b][],  // not yet in checked_pairs
     status: 'complete' | 'partial'
   }
Max execution time: ~300ms (DB queries only)
```

**POST /api/interactions/check-batch — bounded external calls**
```
Input: { pairs: [{ rxcui_a, rxcui_b }] } — max 15 items (reject 400 if more)

For each pair (serial, not parallel):
  1. Call RxNav: GET /REST/interaction/interaction.json?rxcui={rxcui_a}
  2. Filter response for interactions involving rxcui_b
  3. INSERT all found interactions into interactions_cache
  4. INSERT into checked_pairs: { rxcui_a, rxcui_b, has_interactions: count > 0 }

Return: { results: [{pair, interactions}] }
Max execution time: 15 × 500ms = 7.5s — within Vercel 10s limit
```

### Client Orchestration State Machine

```
STATE: idle

User adds medicine
  → POST /api/medicines
  → Medicine saved, resolution_status = 'pending'
  → STATE: resolving

STATE: resolving
  → UI: medicine card shows "Checking..." badge
  → Client fires: POST /api/drugs/resolve { medicine_id }
  → Resolution completes, medicine.rxcuis updated
  → STATE: checking

STATE: checking
  → UI: "Checking interactions..." spinner
  → Client fires: GET /api/interactions
  → If status: 'complete' → STATE: done
  → If status: 'partial' → CLIENT fires: POST /api/interactions/check-batch { unchecked_pairs.slice(0,15) }
  → After batch: GET /api/interactions again
  → Repeat until status: 'complete'
  → STATE: done

STATE: done
  → UI: show interaction results (or "No interactions detected")
  → Persist until next medicine add/edit/delete
```

### Pair Generation with Combination Drug Support

Pair generation now queries the `medicine_ingredients` table directly. The medicines table no longer holds rxcuis.

```typescript
// Load active ingredients for all active medicines of a family member
// SQL pattern (Prisma equivalent):
// SELECT m.id as medicine_id, i.rxcui
// FROM medicines m
// JOIN medicine_ingredients i ON i.medicine_id = m.id
// WHERE m.family_member_id = X
//   AND m.is_active = true
//   AND i.rxcui IS NOT NULL   -- only resolved ingredients participate in interaction checks
// ORDER BY m.id, i.ordinal

function generateAllPairs(
  medicineIngredients: Map<string, string[]>  // medicine_id → [rxcui, rxcui, ...]
): [string, string][] {
  const medicineIds = [...medicineIngredients.keys()]
  const pairSet = new Set<string>()

  for (let i = 0; i < medicineIds.length; i++) {
    for (let j = i + 1; j < medicineIds.length; j++) {
      const rxcuisA = medicineIngredients.get(medicineIds[i]) ?? []
      const rxcuisB = medicineIngredients.get(medicineIds[j]) ?? []

      for (const rxcui_a_raw of rxcuisA) {
        for (const rxcui_b_raw of rxcuisB) {
          const [a, b] = [rxcui_a_raw, rxcui_b_raw].sort()
          pairSet.add(`${a}|${b}`)
        }
      }
    }
  }

  return [...pairSet].map(s => s.split('|') as [string, string])
}
```

### Drug Resolution Chain

```
Input: medicine_id

1. Load medicine from DB → get brand_name
2. Load /public/cdsco.json (browser cache) → fuzzy match brand_name
   → If found: { salts: ["Ibuprofen", "Paracetamol"], generic_name: "Combiflam" }
   → If not found: salts = [brand_name], generic_name = null

3. For each salt:
   a. Check synonyms.json: "Paracetamol" → "Acetaminophen"
   b. Call RxNorm: GET /REST/rxcui.json?name={synonym}&search=2
   c. Extract rxcui from response or null

4. Update medicine:
   rxcuis = [all non-null rxcuis]
   salts = [all salt names]
   generic_name = (from CDSCO or null)
   resolution_status = resolved|partial|unresolvable
   resolution_attempted_at = now()

5. Return { resolved, rxcuis, resolution_status }
```

### Go/No-Go Scenarios (Post Phase 0)

| Resolution Rate | Action |
|----------------|--------|
| ≥ 70% | Proceed as planned. Show disclaimer for unresolvable drugs. |
| 40-69% | Extend synonym table. This is a data problem, not architecture. Do not change Phase 3 plan. |
| < 40% | Activate Gemini fallback. Display AI-generated results with stronger disclaimer: "⚠️ AI-generated result — verify with your doctor." Cache with source = 'gemini'. |

---

## PART 5: FINAL OCR STRATEGY

### Engine: Tesseract v5 Only

EasyOCR permanently removed. OOM on 512MB Render free tier. No exceptions.

### Preprocessing Pipeline (exact order)

```python
def preprocess(image_bytes: bytes) -> np.ndarray:
    img = Image.open(BytesIO(image_bytes)).convert('RGB')

    # Step 1: Scale — shorter dimension to 1800px
    w, h = img.size
    scale = 1800 / min(w, h)
    if scale > 1:
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    arr = np.array(img)

    # Step 2: Grayscale
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    # Step 3: Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # Step 4: Adaptive threshold
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    # Step 5: Deskew
    coords = np.column_stack(np.where(thresh > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45: angle += 90
    if abs(angle) > 0.5:  # only deskew if skew is meaningful
        (h, w) = thresh.shape
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        thresh = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC,
                                borderMode=cv2.BORDER_REPLICATE)

    return thresh
```

### OCR Execution and Confidence

```python
TESSERACT_CONFIG = '--oem 3 --psm 6'

data = pytesseract.image_to_data(preprocessed, config=TESSERACT_CONFIG,
                                  output_type=pytesseract.Output.DICT)

valid = [(data['text'][i], data['conf'][i])
         for i in range(len(data['text']))
         if data['conf'][i] > 0 and data['text'][i].strip()]

raw_text = ' '.join(t for t, _ in valid)
confidence = sum(c for _, c in valid) / len(valid) if valid else 0
```

### Confidence UX Rules (Non-negotiable)

| Confidence | UI |
|-----------|-----|
| > 80 | Results shown normally. Subtle note: "Please verify before saving." |
| 50-79 | Amber warning: "We're not fully confident — review carefully." |
| < 50 | Red warning: "Low confidence read — verify all fields." |
| Any | User always edits editable fields before saving. No auto-save. |

### Render Deployment Requirements

```yaml
buildCommand: "apt-get install -y tesseract-ocr tesseract-ocr-eng && pip install -r requirements.txt"
startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

Use `opencv-python-headless` in requirements.txt, NOT `opencv-python` (GUI deps crash on Render).

Keep-alive: cron-job.org pings `/health` every 14 minutes, 08:00-23:00 IST only.

---

## PART 6: FINAL DEPLOYMENT ARCHITECTURE

### Service Map

| Service | Platform | Region | Free Tier Limits | Phase |
|---------|----------|--------|-----------------|-------|
| Next.js | Vercel | bom1 (Mumbai) | 100GB bandwidth/mo | 1 |
| Database + Auth | Supabase | ap-south-1 (Mumbai) | 500MB DB, 50K MAU | 1 |
| OCR Service | Render | Oregon | 512MB RAM, sleeps at idle | 5 |
| Email | Resend | Global | 3,000 emails/mo | 4 |
| Cron | cron-job.org | — | Free | 4 |
| Error Tracking | Sentry | Global | 5,000 errors/mo | 1 |

### Vercel Configuration

```json
{
  "functions": {
    "src/app/api/**": { "maxDuration": 10 }
  },
  "regions": ["bom1"]
}
```

Environment variables:
```
NEXT_PUBLIC_SUPABASE_URL          (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (safe to expose — RLS protects data)
SUPABASE_SERVICE_ROLE_KEY         (server only — NEVER in client code)
DATABASE_URL                      (with ?pgbouncer=true&connection_limit=1)
DIRECT_URL                        (without pgbouncer — migrations only)
CRON_SECRET                       (32-char random, never regenerated)
RESEND_API_KEY
SENTRY_DSN
FASTAPI_URL                       (added Phase 5)
```

### Supabase Setup Checklist

- [ ] Project created in ap-south-1 (Mumbai) — check at creation, cannot change later
- [ ] Email auth enabled, email confirmation DISABLED for MVP
- [ ] Service role key copied (shown only once)
- [ ] RLS enabled on all 4 user data tables
- [ ] All 4 RLS policies applied
- [ ] Connection pooler URL (port 6543) used in DATABASE_URL

### cron-job.org Configuration

```
Job 1: Expiry Notifications
  URL:      https://{vercel-domain}/api/cron/check-expiry
  Method:   POST
  Header:   X-Cron-Secret: {CRON_SECRET}
  Schedule: 08:00 IST daily (02:30 UTC)

Job 2: Render Keep-Alive (Phase 5+)
  URL:      https://{render-domain}/health
  Method:   GET
  Schedule: every 14 minutes, 08:00-23:00 IST only
```

---

## PART 7: SECURITY AND COMPLIANCE

### DPDPA 2023 Requirements (all mandatory)

**Consent Screen (Phase 1)**
Shown after signup, before dashboard. User must click explicit consent button.
Content must specify: what data is collected, why, how to delete.
`users.consent_given` set to true. Middleware blocks dashboard if false.

**Privacy Policy Page (Phase 1)**
URL: /privacy. Content: what data, why, where stored (Mumbai), contact, how to delete.

**Right to Erasure (Phase 4)**
`DELETE /api/users` → Prisma transaction deletes all records → Supabase Auth deletes user.
UI: Settings → "Delete Account" → confirm by typing "DELETE".

**Data Minimization**
Every collected field has a documented purpose:
- brand_name, salts, rxcuis: interaction checking
- expiry_date, expiry_month, expiry_year: expiry tracking and notifications
- generic_name: display and resolution
- quantity, dosage_schedule: optional, for user reference only
- family_member name + relationship: multi-person management
- notification_preference: controls whether emails are sent
- consent_given: DPDPA compliance

**Medical Disclaimer (persistent)**
Footer on every dashboard page:
"MedSafe is for informational purposes only and is not a medical device or substitute for professional medical advice. Always consult your doctor or pharmacist."

Also shown on landing page, login page, every interaction warning, every "no interactions found" state.

### Authentication

- Supabase Auth, email + password only
- Sessions stored as httpOnly cookies (not localStorage)
- Middleware verifies session on every API route and dashboard page
- FastAPI verifies shared secret header from Next.js BFF (not public auth)

### API Security

```
All /api/medicines, /api/drugs, /api/interactions, /api/family routes:
  → Verify Supabase session token
  → Extract auth.uid()
  → All Prisma queries scoped to that user's data

/api/cron/check-expiry:
  → Verify X-Cron-Secret header === process.env.CRON_SECRET
  → 401 if missing or wrong

FastAPI /ocr/scan:
  → Verify X-Internal-Secret header (shared with Next.js BFF)
  → Reject all other callers

Rate limiting:
  → /api/drugs/resolve: max 30 req/user/min (in-memory Map, basic guard)
  → /api/interactions/check-batch: max 10 req/user/min
```

### Notification Cron — Batched Parallel Sends

```typescript
// Max 10 concurrent Resend calls to stay within Vercel 10s timeout

async function sendBatch(notifications: Notification[]) {
  const BATCH_SIZE = 10
  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE)
    await Promise.allSettled(batch.map(n => sendEmail(n)))
    // allSettled: one failure doesn't block the rest
  }
}
```

---

## PART 8: DEFERRED FEATURES

### Never Build

| Feature | Reason |
|---------|--------|
| Prescription OCR | Medical liability; different problem space |
| Drug recommendations | Never suggest drugs |
| Symptom checker | Not this product |
| Barcode scanning | Needs drug barcode database; different problem |
| Push notifications | Email is simpler, equally effective |

### Post-Launch Only

| Feature | Gate |
|---------|------|
| Notification history UI | After users request it |
| Interaction severity filter toggle | After seeing how users interact with mild warnings |
| Multi-language support | After validating core product in English |
| Full dashboard redesign | Based on actual usage patterns |
| Medicine reminders | Only if adherence tracking becomes a stated goal |

---

## PART 9: NON-NEGOTIABLE DECISIONS

| ID | Decision | Rationale |
|----|----------|-----------|
| ND-1 | FastAPI added only in Phase 5 | No Python-specific need until OCR |
| ND-2 | POST /api/medicines never triggers resolution | Serverless timeout; save must be instant |
| ND-3 | GET /api/interactions never calls RxNav | Deterministic fast response; batch endpoint handles external calls |
| ND-4 | No EasyOCR | OOM on 512MB Render free tier |
| ND-5 | medicine_ingredients junction table (not parallel arrays) | Parallel arrays have indefensible positional dependency; junction table enables per-ingredient resolution status, null RxCUI, and future per-ingredient fields |
| ND-6 | Supabase in ap-south-1 (Mumbai) | DPDPA 2023 |
| ND-7 | Consent screen before dashboard | DPDPA 2023; middleware-enforced |
| ND-8 | CDSCO as static file + client Fuse.js | Serverless cache unreliability |
| ND-9 | expiry_date stored as last day of month | Medicines valid through end of stated month |
| ND-10 | Prisma transaction for signup (user + family_member) | Partial failure leaves broken account |
| ND-11 | interactions_cache has no UNIQUE on pair | Multiple interactions per pair; UNIQUE causes data loss |
| ND-12 | checked_pairs table exists from Phase 1 schema | Negative caching prevents redundant RxNav calls |
| ND-13 | medicine_scan_log table in Phase 1 migration (empty) | OCR metadata schema ready before Phase 5; avoids Phase 5 migration on live data |
| ND-14 | All categorical TEXT fields have CHECK constraints | Vocabulary drift causes silent query failures; database-level enforcement is mandatory |

---

## APPENDIX: REVISION HISTORY

| Date | Change | Reason |
|------|--------|--------|
| Pre-Phase 1 | Initial baseline | Architecture review findings |
| Pre-Phase 1 | EasyOCR removed | OOM on Render 512MB |
| Pre-Phase 1 | medicines.rxcui → rxcuis TEXT[] | Combination drug support |
| Pre-Phase 1 | interactions_cache UNIQUE removed | Data loss bug |
| Pre-Phase 1 | checked_pairs table added | Negative caching |
| Pre-Phase 1 | Two-endpoint interaction pattern | Vercel timeout prevention |
| Pre-Phase 1 | CDSCO as static + Fuse.js | Serverless caching unreliability |
| Pre-Phase 1 | DPDPA compliance | Legal requirement |
| Pre-Phase 1 | Supabase → ap-south-1 | DPDPA |
| Pre-Phase 1 | medicines.user_id removed | Redundancy + data integrity |
| Pre-Phase 1 | Batched parallel cron sends | Cron timeout prevention |

When this document is updated: add a row with date, change, and reason.
