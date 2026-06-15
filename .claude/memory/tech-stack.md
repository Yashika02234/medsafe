# Tech Stack — MedSafe

> ⚠️ LOCKED. Do not change without explicit approval.

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js 14 | App Router | Framework, SSR, routing |
| TypeScript | Latest | Type safety |
| Tailwind CSS | v3 | Styling |
| shadcn/ui | Latest | Component library (customized) |
| Framer Motion | Latest | Animations |
| React Query | v5 | Server state management |

## Backend (OCR + Interaction Engine)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Backend language |
| FastAPI | Latest | REST API framework |
| Tesseract OCR | v5 | OCR engine (only engine — EasyOCR removed, see below) |
| OpenCV (cv2 headless) | Latest | Image preprocessing — MUST use opencv-python-headless, not opencv-python |
| Pillow | Latest | Image handling |

> ⚠️ EasyOCR REMOVED: requires 1.5-2GB RAM. Render free tier = 512MB. Hard OOM crash.
> Low-confidence OCR results handled by user correction UI, not a fallback OCR engine.

## Database & Auth

| Technology | Purpose |
|-----------|---------|
| Supabase PostgreSQL | Primary database |
| Supabase Auth | Authentication |
| Prisma ORM | Database access from Next.js |

## Free External APIs

| API | Provider | Purpose | Rate Limit | Auth |
|-----|----------|---------|------------|------|
| ~~RxNav Interaction API~~ | ~~NIH~~ | ~~DECOMMISSIONED — do not use~~ | — | — |
| RxNorm API | NIH | Drug name normalization → RxCUI | No hard limit | None needed |
| OpenFDA Drug Label API | FDA | **Primary interaction source** — label text mining | 240 req/min | None needed |

## Local Data

| Dataset | Source | Purpose |
|---------|--------|---------|
| Indian brand → salt mapping | CDSCO (scraped once) | Resolve Indian brand names to generic salts |
| Common interaction cache | Built from RxNav queries | In-memory cache for frequent lookups |

## Deployment (All Free Tier)

| Service | Purpose | Free Tier Limit |
|---------|---------|-----------------|
| Vercel | Frontend hosting | 100GB bandwidth/mo |
| Render | FastAPI backend hosting | 750 hrs/mo (spins down on idle) |
| Supabase | Database + Auth | 500MB DB, 50K MAU |
| cron-job.org | Daily expiry check trigger | Free |
| Resend | Email notifications | 3,000 emails/mo |

## Dev Tools

| Tool | Purpose |
|------|---------|
| Git + GitHub | Version control |
| GitHub Actions | CI/CD |
| Postman | API testing |
| pytest | Backend tests |
| Vitest | Frontend tests |

## Explicitly NOT Using (and why)

| Technology | Reason |
|-----------|--------|
| Google Cloud Vision API | Paid after free trial |
| Firebase | Supabase chosen instead |
| Redis (hosted) | Using checked_pairs table + negative caching instead |
| Any paid OCR API | Budget constraint |
| Docker | Not needed for MVP deployment |
| EasyOCR | **REMOVED — requires 1.5-2GB RAM, Render free tier is 512MB. Will OOM crash the service. Use Tesseract only. Low-confidence results handled by user correction UI, not a second OCR engine.** |
