# Defects — MedSafe

> This file logs repeated mistakes and their fixes.
> Claude reads this to avoid making the same mistake twice.
> Update after ANY repeated error pattern.

---

## Format

### [DATE]

**Problem:** What went wrong

**Cause:** Why it happened

**Rule:** What to do instead, going forward

---

## Logged Defects

### 2026-06-10

**Problem:** RxNav Drug Interaction API (`rxnav.nlm.nih.gov/REST/interaction/`) returns 404 for all endpoints.

**Cause:** The interaction service has been decommissioned from rxnav.nlm.nih.gov. The base API (RxNorm name resolution) still works, but the interaction subpath no longer exists — it is absent from the full resource list returned by `GET /REST/`.

**Rule:** Never use `rxnav.nlm.nih.gov/REST/interaction/` — it does not exist. Use `api.fda.gov/drug/label.json` for drug interaction data instead (text mining approach, validated 7/10 detection, 0 false positives). See: `.claude/outputs/phase-00/interaction-validation-report.md`.

---

## Common Pitfalls to Watch For

### 1. Supabase Auth Token Mistakes
Do NOT generate custom JWTs. Use Supabase's built-in session token verification.
(Learned from SOLACE project — caused 401 Unauthorized errors.)

### 2. Duplicated Validation Logic
Validation must live in a shared schema layer (Zod for frontend, Pydantic for backend).
Never duplicate validation in components AND API routes.

### 3. Premature Abstraction
Do not create abstract base classes, factory patterns, or generics until
the same pattern appears 3+ times in actual code.

### 4. Adding Packages Without Justification
Every new npm/pip package must be justified. Check if the functionality
can be achieved with existing dependencies first.

### 5. Overengineering Error Handling
Simple try/catch with user-friendly messages. No custom error class hierarchies at MVP stage.
