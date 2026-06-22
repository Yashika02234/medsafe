# MedSafe

> Free medicine expiry tracker and drug interaction checker, built for Indian households.

[![Status](https://img.shields.io/badge/status-Phase%206-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

**Live demo:** [medsafe-nine.vercel.app](https://medsafe-nine.vercel.app)

## What It Does

Every Indian household has a drawer of medicine strips with no expiry tracking, and
polypharmacy (diabetes + BP + thyroid patients on 3–5 daily medicines) makes dangerous
drug interactions easy to miss. MedSafe solves both, for free:

- **Medicine Cabinet** — add medicines by searching 240,000+ Indian brand names (CDSCO
  data), or scan a strip with your camera and let OCR read the name and expiry for you.
- **Drug Interaction Checker** — every medicine in your cabinet is cross-checked against
  every other, flagged severe / moderate / mild, sourced from the FDA's OpenFDA drug
  label database plus a small drug-class rule set for interactions text-mining alone
  can't catch (e.g. SSRI + opioid serotonin syndrome).
- **Expiry Alerts** — email reminders at 30, 7, and 1 day before a medicine expires.
- **Family Mode** — one account, multiple people. Switch between family members'
  cabinets, and interactions are checked per-person (never cross-contaminated between
  family members who happen to take the same drug).
- **Doctor Visit Export** — a printable medication list per family member to bring to an
  appointment.
- **Installable PWA** — add it to your home screen on Android or iOS.

> [!NOTE]
> Screenshots of the live app are not yet included here — add them under
> `docs/screenshots/` and link them in this section once available.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI (OCR + image preprocessing only) |
| Database | Supabase PostgreSQL (Mumbai region) + Prisma ORM |
| Auth | Supabase Auth |
| Drug data | CDSCO (Indian brand → salt mapping), NIH RxNorm (name resolution), FDA OpenFDA (interactions) |
| Email | Resend |
| Hosting | Vercel (frontend) + Render (backend), both free tier |

Every service used is on a permanently-free tier — see
[`.claude/memory/tech-stack.md`](./.claude/memory/tech-stack.md) for the full
rationale and what was deliberately avoided (e.g. EasyOCR, which OOMs on Render's
512MB free tier).

## Project Status

See [`_state.md`](./_state.md) for the authoritative, session-by-session log of what's
built, what's pending, and why. Short version: Phases 0–3 (planning, auth, medicine
CRUD, interaction engine) and Phase 6 (family mode, dashboard, export, PWA, polish) are
complete. Phase 4 (notification scheduler) and Phase 5 (real-strip-photo OCR accuracy)
have working code with one deployment step each still open — see `_state.md` for specifics.

## Development

### Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project (Mumbai/`ap-south-1` region)
- Python 3.11+ (only if working on the OCR backend)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in your Supabase/Resend/cron values
npm run db:migrate           # applies prisma/schema.prisma to your Supabase DB
npm run dev                  # http://localhost:3000
```

See [`frontend/.env.example`](./frontend/.env.example) for every required variable and
where to find it.

### Backend (OCR service — optional for frontend-only work)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Requires a local [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) install;
see `backend/app/services/ocr_service.py` for the `TESSERACT_CMD` override used in dev.

## Architecture

See [`.claude/outputs/architecture-baseline.md`](./.claude/outputs/architecture-baseline.md)
for the full technical design, and [`.claude/memory/architecture.md`](./.claude/memory/architecture.md)
for the as-built system overview, data flow, and key architecture decisions.

## License

MIT
