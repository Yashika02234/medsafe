# Architecture — MedSafe

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER (Browser/PWA)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │   Next.js 14 Frontend     │
         │   (Vercel)                │
         │                           │
         │   - Medicine Cabinet UI   │
         │   - Scanner UI            │
         │   - Dashboard             │
         │   - Family Management     │
         │   - Auth (Supabase)       │
         └──────┬────────────┬───────┘
                │            │
    ┌───────────▼──┐    ┌────▼──────────────┐
    │  Supabase    │    │  FastAPI Backend   │
    │              │    │  (Render)          │
    │  - Auth      │    │                    │
    │  - PostgreSQL│    │  - OCR Service     │
    │  - User data │    │  - Drug Resolution │
    │  - Medicines │    │  - Interaction     │
    │  - Families  │    │    Engine          │
    │              │    │  - CDSCO Lookup    │
    └──────────────┘    └───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Free External    │
                    │  APIs             │
                    │                   │
                    │  - RxNorm (NIH)   │
                    │  - RxNav (NIH)    │
                    │  - OpenFDA        │
                    └───────────────────┘
```

## Core Services (FastAPI Backend)

### 1. OCR Service
- Input: Medicine strip image (base64 or file upload)
- Pipeline: Grayscale → Contrast enhancement → Deskew → Crop → Tesseract OCR → (fallback: EasyOCR)
- Output: { medicine_name, expiry_date, confidence_score }
- Post-processing: Regex patterns to extract dates (MM/YYYY, MM-YYYY, Month YYYY)

### 2. Drug Resolution Service
- Input: Raw medicine name (from OCR or manual entry)
- Step 1: Fuzzy match against local CDSCO JSON (Indian brand → salt)
- Step 2: Query RxNorm API to get RxCUI (canonical drug identifier)
- Step 3: Return { brand_name, generic_name, salt_composition, rxcui }
- Caching: LRU cache on resolved names (same brand always maps to same salt)

### 3. Interaction Engine
- Input: List of RxCUI identifiers (all medicines in a user's cabinet)
- For each new medicine added: check all pairs against RxNav Interaction API
- Severity classification: Severe / Moderate / Mild
- Output: List of { drug_a, drug_b, severity, description }
- Caching: LRU cache on (rxcui_a, rxcui_b) pairs — interactions don't change

### 4. Notification Service
- Triggered by: cron-job.org hitting a `/cron/check-expiry` endpoint daily
- Logic: Query DB for medicines expiring within 30/7/1 days
- Delivery: Resend email API (free tier)
- Security: Cron endpoint protected by a secret token in env var

## Database Schema (High-Level)

### users
- id, email, name, created_at

### family_members
- id, user_id (FK), name, relationship, created_at

### medicines
- id, user_id (FK), family_member_id (FK, nullable)
- brand_name, generic_name, salt_composition, rxcui
- expiry_date, quantity, dosage_schedule
- is_active, added_via (manual/scan)
- created_at, updated_at

### interactions (cached)
- id, rxcui_a, rxcui_b, severity, description
- cached_at

### notification_log
- id, user_id, medicine_id, type (expiry_30/expiry_7/expiry_1), sent_at

## API Routes

### Next.js API Routes (Frontend BFF)
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/medicines
- POST /api/medicines
- PUT /api/medicines/[id]
- DELETE /api/medicines/[id]
- GET /api/family
- POST /api/family
- GET /api/interactions
- GET /api/dashboard/summary

### FastAPI Endpoints (Backend)
- POST /ocr/scan — Upload image, get medicine name + expiry
- POST /drug/resolve — Raw name → canonical drug info
- POST /interactions/check — List of RxCUIs → interaction warnings
- POST /cron/check-expiry — Triggered by cron, sends email alerts

## Data Flow: Adding a Medicine via Scan

1. User takes photo of medicine strip
2. Frontend sends image to FastAPI `/ocr/scan`
3. OCR Service preprocesses image, runs Tesseract
4. If confidence < threshold, retries with EasyOCR
5. Returns extracted name + expiry to frontend
6. Frontend sends name to FastAPI `/drug/resolve`
7. Drug Resolution matches against CDSCO → gets salt → queries RxNorm → gets RxCUI
8. Frontend saves medicine to Supabase via Next.js API route
9. Frontend calls `/interactions/check` with all active RxCUIs
10. If interactions found → display warning immediately
11. Expiry date stored → cron will check daily

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js API routes as BFF | Frontend talks to Supabase via BFF, keeps Supabase keys server-side |
| Separate FastAPI service | OCR requires Python libraries (Tesseract, OpenCV). Node.js can't do this efficiently. |
| Local CDSCO JSON, not API | CDSCO has no public API. Scrape once, store as JSON. Faster lookups. |
| In-memory LRU cache | Drug interactions rarely change. No need for Redis. `functools.lru_cache` is sufficient at this scale. |
| Cron-job.org for scheduling | Render free tier doesn't support cron. External cron service triggers our endpoint. |
| PWA, not native app | Reach more users without Play Store overhead. Camera access works via browser. |
