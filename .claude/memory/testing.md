# Testing — MedSafe

## Philosophy

- Test logic, not boilerplate
- Every service function: happy path + one error case minimum
- No 100% coverage target — aim for meaningful coverage on critical paths
- Critical paths = OCR accuracy, drug resolution, interaction detection, auth

## Backend (pytest)

### Must Test
- OCR text extraction accuracy on sample images
- Drug name fuzzy matching (CDSCO lookup)
- RxNorm API response parsing
- Interaction severity classification
- Expiry date calculation logic
- Cron endpoint auth validation

### Test Structure
```
backend/
  tests/
    test_ocr_service.py
    test_drug_resolver.py
    test_interaction_engine.py
    test_expiry_checker.py
    conftest.py          # shared fixtures
    fixtures/
      sample_strip_1.jpg
      sample_strip_2.jpg
```

### Running
```bash
cd backend
pytest -v
pytest --cov=services  # coverage report
```

## Frontend (Vitest)

### Must Test
- Utility functions (date formatting, expiry status calculation)
- React Query hooks (mock API responses)
- Zod validation schemas

### Don't Test
- Simple presentational components
- shadcn/ui components (already tested by library)
- Page layouts

### Running
```bash
cd frontend
npx vitest run
```

## Manual Testing Checklist (Per Phase)

### Phase 2 — Medicine Cabinet
- [ ] Add medicine manually
- [ ] Edit medicine
- [ ] Delete medicine
- [ ] View medicine list
- [ ] Expiry status shows correct color

### Phase 3 — OCR Scanner
- [ ] Scan clear medicine strip
- [ ] Scan blurry strip (verify fallback)
- [ ] Scan non-medicine image (verify graceful failure)
- [ ] Edit extracted fields before saving

### Phase 4 — Interaction Engine
- [ ] Add two interacting medicines (verify warning appears)
- [ ] Add non-interacting medicines (verify no false alarm)
- [ ] Remove one interacting medicine (verify warning clears)
- [ ] Unresolvable medicine shows "data unavailable" message

### Phase 5 — Notifications
- [ ] Receive 30-day expiry email
- [ ] Receive 7-day expiry email
- [ ] Receive expiry-day email
- [ ] No duplicate emails for same medicine
