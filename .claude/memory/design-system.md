# Design System — MedSafe

## STATUS: PLACEHOLDER

> ⚠️ This file awaits final design ideology input.
> Source will be: Claude Design / Google Stitch / Figma / other AI design tool.
> Once finalized, this file becomes the **single source of truth** for all UI decisions.
> **No UI implementation may contradict this file.**

---

## Design Philosophy (Draft — To Be Replaced)

MedSafe should feel:
- **Trustworthy** — People are putting health data here. It must feel reliable, not flashy.
- **Simple** — A 55-year-old parent must be able to use it without help.
- **Warm but professional** — Not cold-clinical, not overly playful. Think "family doctor's office."
- **Clean** — Generous whitespace, clear hierarchy, no clutter.

---

## Color Palette (Placeholder)

| Token | Value | Usage |
|-------|-------|-------|
| --primary | TBD | Main actions, headers |
| --success | Green family | Safe / no interactions |
| --warning | Amber family | Moderate interactions, nearing expiry |
| --danger | Red family | Severe interactions, expired |
| --neutral | Slate/Gray family | Text, borders, backgrounds |

> Severity colors (success/warning/danger) are critical — they directly map to
> interaction severity levels and expiry status. These must be accessible (AA contrast).

---

## Typography (Placeholder)

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Heading 1 | TBD | TBD | Bold |
| Heading 2 | TBD | TBD | Semibold |
| Body | TBD | TBD | Regular |
| Caption | TBD | TBD | Regular |
| Label | TBD | TBD | Medium |

---

## Spacing System (Placeholder)

Using Tailwind's default scale unless design input overrides.

---

## Component Patterns (Placeholder)

### Medicine Card
- Shows: name, salt, expiry date, status badge (safe/warning/expired)
- Action: tap to expand details, edit, delete

### Interaction Warning Card
- Shows: Drug A ↔ Drug B, severity badge, description
- Severity visuals: color-coded border + icon

### Scanner Interface
- Camera viewfinder with guide overlay
- Post-scan: editable fields for name + expiry with confidence indicator

### Family Switcher
- Simple tab/dropdown to switch between family members' cabinets

---

## Animation Principles (Placeholder)

- Subtle, purposeful animations only
- No animation for animation's sake
- Page transitions: gentle fade
- Card interactions: small scale on tap
- Loading: skeleton screens, not spinners
- Severity warnings: gentle pulse on severe interactions (attention without anxiety)

---

## Mobile-First

- Primary experience is mobile (PWA)
- All layouts designed mobile-first, then adapted to desktop
- Touch targets: minimum 44x44px
- Bottom navigation for primary actions

---

## Compliance — Medical Disclaimer

> **LOCKED** — F-3 complete (2026-06-10). These texts are the single source of truth.
> Source of truth for code: `frontend/src/lib/legal.ts` → `MEDICAL_DISCLAIMER`

### Disclaimer Text Variants

**Footer variant** (one line — appears on every page):
> "MedSafe is for informational purposes only. Not a medical device. Consult your doctor before changing any medicine."

**Inline variant** (two sentences — appears below every interaction card and result):
> "Drug interaction information is sourced from the NIH database and is for general awareness only. Consult your doctor or pharmacist before making any decision about your medicines."

**Full variant** — see `MEDICAL_DISCLAIMER.full` in `frontend/src/lib/legal.ts`

### Required Disclaimer Placements

| Location | Variant |
|----------|---------|
| Landing page footer | footer |
| Login page footer | footer |
| Dashboard footer (every page) | footer |
| Every interaction warning card | inline |
| "No interactions found" result | inline |
| "Interaction data unavailable" result | inline |
| `/disclaimer` page | full |
| Interaction results expandable section | full |

> **Rule:** No interaction result (positive, negative, or unavailable) may be shown to the user without the `inline` disclaimer visible on the same screen. This is non-negotiable.

---

## Where To Put Final Design Input

When the design ideology is ready:
1. Replace the "Placeholder" sections above with final values
2. Update color tokens in `tailwind.config.ts`
3. Update typography in global CSS
4. Update component patterns with final specs
5. Mark STATUS as FINALIZED at the top of this file
