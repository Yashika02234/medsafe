# Security — MedSafe

## Principles

- Health data is sensitive. Treat it accordingly.
- Minimize data collection. Only store what's necessary.
- Never expose Supabase service keys to the client.
- Never log medicine names or health data in production logs.

## Authentication

- Supabase Auth handles all auth (signup, login, password reset, sessions)
- Next.js API routes verify Supabase session token on every request
- FastAPI endpoints called from Next.js API routes (server-to-server), not from client directly
- Cron endpoint (`/cron/check-expiry`) protected by secret token in `X-Cron-Secret` header

## Environment Variables

- All secrets in `.env.local` (frontend) and `.env` (backend)
- Never commit `.env` files
- Required vars documented in `.env.example` files

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FASTAPI_BACKEND_URL=
```

### Backend (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
RESEND_API_KEY=
```

## Data Access Rules

- Users can only access their own medicines and family members
- All Supabase queries filtered by `user_id` (enforced via RLS policies)
- Row Level Security (RLS) enabled on all tables
- Family member data: only the parent user can access

## Input Validation

- All image uploads: validate file type (JPEG/PNG only), max size 5MB
- All text inputs: sanitize before database storage
- Medicine names: sanitize before passing to external APIs
- Expiry dates: validate format before storage

## Rate Limiting

- FastAPI: apply rate limiting on `/ocr/scan` (expensive operation) — max 10 req/min per user
- Cron endpoint: only accepts requests from cron-job.org IP or with valid secret

## CORS

- FastAPI CORS: only allow requests from the Vercel frontend domain
- No wildcard `*` origins in production

## What We Don't Do (And Why)

| Not Doing | Reason |
|-----------|--------|
| End-to-end encryption | Overkill for MVP. Medicines aren't as sensitive as journals. |
| HIPAA compliance | Not a US medical product. Not required. |
| Audit logging | Not needed at MVP scale. Add if user base grows. |
