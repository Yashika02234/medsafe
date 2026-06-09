# Coding Rules — MedSafe

## General

- TypeScript strict mode everywhere (frontend)
- Python type hints everywhere (backend)
- No `any` types in TypeScript unless absolutely unavoidable (document why)
- No unused imports, variables, or dead code
- Every function has a single responsibility
- Max file length: ~300 lines. If longer, split.
- Prefer composition over inheritance

## Naming Conventions

### Frontend (TypeScript/React)
- Components: PascalCase (`MedicineCabinet.tsx`)
- Hooks: camelCase with `use` prefix (`useMedicines.ts`)
- Utils: camelCase (`formatExpiryDate.ts`)
- Types/Interfaces: PascalCase (`Medicine`, `InteractionWarning`)
- Constants: UPPER_SNAKE_CASE (`MAX_SCAN_RETRIES`)
- Files: kebab-case for routes, PascalCase for components

### Backend (Python/FastAPI)
- Files: snake_case (`ocr_service.py`)
- Functions: snake_case (`resolve_drug_name()`)
- Classes: PascalCase (`DrugResolver`)
- Constants: UPPER_SNAKE_CASE (`CDSCO_DATA_PATH`)
- API routes: kebab-case (`/drug/resolve`)

## Project Structure Rules

### Frontend
- All API calls go through dedicated service files in `lib/api/`
- All types/interfaces in `types/` directory
- All reusable components in `components/ui/` (shadcn) or `components/shared/`
- Page-specific components stay in their route folder
- No business logic in components — extract to hooks or utils
- React Query for all server state. No raw `fetch` in components.

### Backend
- All routes in `routes/` directory
- All business logic in `services/` directory
- Routes are thin — they validate input and call services
- All external API calls in `clients/` directory
- All data models in `models/` directory
- Config in `config.py` — all env vars read in one place

## Validation

- Frontend: Zod schemas for all form validation
- Backend: Pydantic models for all request/response validation
- Shared validation logic lives in schema layer, not duplicated

## Error Handling

- Frontend: React Query error boundaries + toast notifications
- Backend: FastAPI exception handlers, never expose stack traces
- All API responses follow consistent format:
  ```json
  { "success": true, "data": {...} }
  { "success": false, "error": "message", "code": "ERROR_CODE" }
  ```

## Testing

- Backend: pytest for all services. Minimum: happy path + one error case per function.
- Frontend: Vitest for utils and hooks. Component tests only for complex interactions.
- No test for the sake of testing. Test logic, not boilerplate.

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- One feature per branch
- PR description must include: what, why, how tested
- Never commit `.env`, API keys, or secrets

## Performance

- Images: Compress before sending to OCR endpoint
- API calls: Debounce search inputs (300ms)
- Caching: LRU cache on drug resolution and interaction lookups
- Bundle: Lazy load routes, no unnecessary dependencies

## Accessibility

- All interactive elements keyboard accessible
- Alt text on images
- Semantic HTML
- Color contrast AA minimum
- Form labels on all inputs

## Medical/Ethical

- Never use language like "diagnosis", "treatment", or "prescription"
- Always include "consult your doctor" disclaimers on interaction warnings
- Severity labels must match source data exactly — never upgrade or downgrade
- If interaction data unavailable for a drug, show "data unavailable — consult doctor"
- Never suggest stopping a medication
