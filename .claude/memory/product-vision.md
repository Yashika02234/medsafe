# Product Vision — MedSafe

## One-Liner

A free app that helps Indian households track medicine expiry dates and warns about dangerous drug interactions before they happen.

## Problem

1. Every Indian household hoards medicine strips with no expiry tracking. People consume expired medicines regularly — reduced efficacy, sometimes toxic.
2. Polypharmacy is extremely common (diabetes + BP + thyroid patients on 3-5 daily medicines). Dangerous drug interactions happen silently. Doctors warn verbally, patients forget.
3. No free, India-focused product solves both problems together.

## Target Users

- **Primary:** Parents managing family health, elderly on multiple daily medications, chronic patients (diabetes, thyroid, BP) juggling 3-5 medicines daily
- **Secondary:** Hostellers and people living alone who self-medicate frequently

## Core Product Areas

1. **Medicine Cabinet** — Add medicines manually or via scan. Track name, salt, expiry, quantity, dosage.
2. **OCR Scanner** — Point camera at medicine strip, auto-extract name + expiry date.
3. **Drug Interaction Checker** — Cross-reference all active medicines, flag dangerous interactions with severity levels (severe/moderate/mild).
4. **Expiry Alerts** — Notifications at 30 days, 7 days, and on expiry day.
5. **Family Mode** — One account manages cabinets for multiple family members.
6. **Doctor Visit Summary** — Auto-generate "current medications" PDF for doctor visits.

## Core Philosophy

- **Free forever** — No paywalls. Student-built, community-serving.
- **India-first** — Indian brand names (Crocin, Dolo, Thyronorm) work out of the box.
- **Medically responsible** — "Patterns not prescriptions." Always recommend consulting a doctor. Never diagnose.
- **Privacy-first** — Health data stays with the user. Minimal data collection.
- **Simple enough for parents** — If a 55-year-old parent can't use it without help, the UX has failed.

## What This Is NOT

- Not a telemedicine app
- Not a pharmacy/e-commerce platform
- Not a diagnostic tool
- Not a replacement for medical advice

## Success Metrics

- Real users (target: 50+ from campus/family network)
- Medicines tracked per user
- Interaction warnings surfaced
- Expiry alerts acted upon

## Differentiators for Resume/Interviews

- OCR pipeline (computer vision / image preprocessing)
- Graph-based drug interaction modeling (DSA signal)
- Free API orchestration (RxNav + RxNorm + CDSCO mapping)
- In-memory caching strategy for interaction lookups
- Production deployment with real users
- Social impact angle
