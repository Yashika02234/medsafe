# Design System — MedSafe

## STATUS: FINALIZED (Midnight Safe)

> This replaces the earlier placeholder. The visual direction below ("Midnight Safe") is
> already live across every screen (implemented Session 15, 2026-06-16). This file now
> documents it as the binding source of truth — any new screen or component should match
> what's described here, not introduce a new look.

---

## Who This Is For

MedSafe isn't designed for "users." It's designed for three specific people, and every
screen should be checked against whether it would actually work for them — not just
whether it's technically correct.

### 1. The household manager
A parent, usually 40s-60s, who has quietly become the person responsible for everyone
else's health — kids' fever medicine, a spouse's BP tablets, a parent's diabetes strips.
They're not technical. They're not patient with apps that make them think. They're
already mentally tracking five people's medicine cabinets in their head and they're
tired. What they need from this app is relief, not features — open it, see what's
expiring, see what's dangerous, close it. If a screen requires a manual, it has failed
this person.

### 2. The juggler
Someone managing their own chronic condition — diabetes, thyroid, blood pressure — on
3-5 daily medicines, often prescribed by different doctors who don't talk to each other.
They've had a doctor warn them once, verbally, about a combination, and they've
forgotten the specifics. This person doesn't want to be lectured or alarmed
unnecessarily; they want a quiet, competent second pair of eyes that flags real danger
without crying wolf, and that they can trust enough to actually act on a warning when
one appears.

### 3. The person living alone
A hosteller or someone self-medicating without a household member checking in on them.
Younger, more comfortable with apps generally, but with the least safety net if
something goes wrong — no one else is going to notice the expired strip or the bad
combination for them. This person needs the app to feel like it's actually paying
attention on their behalf, because no one else is.

**The common thread:** none of these three people opened this app because they wanted
to use an app. They opened it because they're tired, worried, or alone with a decision
that has real consequences. The design's job is to make that moment feel calmer, not to
impress them.

---

## How It Should Feel

- **Like a quiet, competent second opinion** — not a clinical chart, not a cheerful
  consumer app. The tone is closer to a calm pharmacist than a fitness tracker.
- **Trustworthy before anything else.** This app holds health information about people
  who can't always advocate for themselves (kids, elderly parents). Every visual choice
  should reinforce "this is being handled carefully," never "this is flashy."
- **Low-effort to read at a glance.** A worried parent checking this at 11pm with one
  eye open should be able to tell "everything's fine" or "something needs attention"
  in under two seconds, without reading a sentence.
- **Color carries the truth, not just decoration.** Green/amber/red aren't a style
  choice — they are the actual safety signal in this app (expiry status, interaction
  severity). They must never be applied decoratively or inconsistently, or the system
  stops being trustworthy.
- **Urgency without alarm.** A severe interaction warning should feel serious and get
  noticed — not feel like a malware popup. A gentle pulse, not a flashing siren.
- **Generous breathing room.** Nothing crammed. A 60-year-old reading this on a small
  phone screen, possibly without reading glasses nearby, needs space and size on their
  side, not density.

---

## How It Looks — "Midnight Safe"

Picture a phone dimmed for nighttime use, the kind of screen you'd check for a sick
family member without waking anyone else up. Deep navy, almost black, never pure
black — there's a subtle blue undertone to everything, like moonlight rather than a
power-off screen. Nothing is harsh white; text is a soft, warm-tinted off-white.

Cards float gently above the background — not boxed in with hard lines, just barely
lifted, like cards laid out on a dark table, each with a faint glow of a border rather
than a stroke. Corners are soft and rounded throughout, never sharp — softness reads
as "this won't hurt you," which matters for a health app.

One confident blue runs through every primary action and accent — calm, a little
electric, never aggressive. It's the color of "this is fine, follow this." Against the
navy backdrop, it reads like a single steady light in a dark room.

Status uses three colors and only three, applied consistently everywhere they appear,
in cabinet cards, interaction warnings, and expiry badges alike:
- **Green** — safe, no action needed. A quiet reassurance, not a celebration.
- **Amber** — getting close, pay attention soon. A nudge, not a warning klaxon.
- **Red** — needs action now (expired, severe interaction). The one color allowed to
  feel urgent — a slow pulse around a severe warning card, like a heartbeat, draws the
  eye without panicking the person looking at it.

Typography is bold where it counts and quiet everywhere else: big, confident,
slightly-tightened numbers for things like "3 medicines expiring" so the headline fact
is unmissable at a glance, paired with small, muted, all-caps labels underneath that
fade into the background until you look for them. The whole system uses the device's
own native system font (SF Pro on iOS, the Android equivalent elsewhere) — nothing
custom — so it always feels like it belongs on the user's phone rather than like a
website pretending to be an app.

Motion is minimal and purposeful: content gently fades and rises into place rather than
popping in, loading states use soft skeleton shimmers instead of spinners (less
"buffering," more "almost there"), and the one animated alert — the pulsing glow on a
severe warning — is the single place motion is used to mean something rather than just
to look nice.

Navigation lives at the thumb, fixed to the bottom of the screen, with the primary "add
a medicine" action raised slightly above the rest as a glowing circular button — the
one element on the screen allowed to visually pop, because it's the one action this
whole app exists to make easy.

Every interaction result — positive, negative, or "we don't know" — carries the same
quiet disclaimer line reminding the person this isn't a substitute for their doctor.
It's small and unobtrusive by design, but it is never, ever absent.

---

## Color Reference

| Token | Value | Meaning |
|-------|-------|---------|
| `--ms-page-bg` / `--ms-bg` | `#060F1C` / `#091628` | Base background — the "dimmed phone at night" navy |
| `--ms-surf` | `#122040` | Card surfaces — sit just above the background |
| `--ms-surf2` | `#1B3060` | Secondary surfaces (inputs, muted fills) |
| `--ms-bord` | `rgba(100,140,255,0.1)` | Faint card borders — barely-there, not boxed-in |
| `--ms-txt` | `#EEF2FF` | Primary text — soft off-white, never pure white |
| `--ms-txt2` / `--ms-txt3` | 55% / 30% opacity of `--ms-txt` | Secondary / muted text (labels, captions) |
| `--ms-acc` | `#4F8EFF` | The one accent blue — primary actions, links, focus |
| `--ms-grn` | `#2ECC8F` | Safe / no interaction / not expiring soon |
| `--ms-amb` | `#F5A623` | Caution / expiring soon / moderate interaction |
| `--ms-red` | `#F4645E` | Urgent / expired / severe interaction |
| `--ms-purp` | `#C084FC` | Reserved accent (currently unused — keep for future category, e.g. Family Mode) |

Each color above ships with a low-opacity `-bg` variant (e.g. `--ms-grn-bg`) used as a
soft tinted background behind icons/badges of that color — never a solid fill, always a
faint wash.

> **Rule:** green/amber/red are reserved exclusively for the three real status meanings
> above. Never repurpose them for unrelated UI decoration (e.g. a "new feature" badge
> should not be amber just because amber is available).

---

## Typography

- **Font:** native system font stack only (`-apple-system, ... system-ui`) — no custom
  webfonts. Reinforces "this belongs on your phone."
- **Headlines / stat numbers:** extrabold weight, tight letter-spacing (e.g. `-0.7px`),
  large size (22-26px) — built to be read in one glance, not studied.
- **Labels / captions:** small (11-13px), muted (`--ms-txt3`), often uppercase with wide
  tracking — recede until actively looked for.
- **Body text:** regular weight, `--ms-txt` or `--ms-txt2`, sized for comfortable
  reading without zooming (14px minimum on mobile).

---

## Component Patterns

### Medicine Card
- Shows: name, salt composition, expiry status as a colored left-edge bar + label
  (matches the green/amber/red system above)
- Action: tap to expand, edit, two-step delete confirm (never an instant, accidental
  delete for something this consequential)

### Interaction Warning Card
- Shows: Drug A ↔ Drug B, severity badge, plain-language description
- Severe cards get the gentle pulse animation; moderate/mild do not
- The inline medical disclaimer is always visible on the same card — non-negotiable

### Stat Cards (Dashboard)
- Three-up grid, one number each, color-coded by meaning (medicines=accent blue,
  expiring=amber, alerts=red)
- Empty state shows "—", never a misleading "0" when data hasn't loaded vs. is
  genuinely zero

### Scanner Interface
- Camera viewfinder with a guide overlay and an animated scan-line, signaling "actively
  reading" rather than a static, ambiguous camera frame
- Post-scan: editable fields for name + expiry with a visible confidence indicator —
  the user should always feel like they have the final say over what OCR guessed

### Family Switcher
- Simple tab/chip switcher between family members' cabinets — kept lightweight since
  this is the household manager persona's primary navigation pattern

---

## Animation Principles

- Subtle and purposeful only — every animation should be answerable with "why," not
  "because it looked nice"
- Content fade + rise on load (`fadeUp`), never slide-from-nowhere or bounce
- Loading: skeleton shimmer, never a spinner — implies "content is already here, just
  rendering," not "wait, unknown duration"
- The severe-interaction pulse (`pulseAlert`) is the only attention-grabbing animation
  in the whole system — reserving it for one single, very deliberate use is what makes
  it effective. Do not add more pulsing/flashing elements elsewhere.

---

## Mobile-First

- Primary experience is mobile (PWA), max-width centered container on larger screens
- Touch targets: minimum 44x44px throughout
- Fixed bottom navigation (5 tabs: Home, Cabinet, + Add, Alerts, Family) with the Add
  action raised as a glowing FAB — the one action the whole app is built around

---

## Compliance — Medical Disclaimer

> **LOCKED.** Source of truth for code: `frontend/src/lib/legal.ts` → `MEDICAL_DISCLAIMER`

### Disclaimer Text Variants

**Footer variant** (one line — appears on every page):
> "MedSafe is for informational purposes only. Not a medical device. Consult your doctor before changing any medicine."

**Inline variant** (two sentences — appears below every interaction card and result):
> "Drug interaction information is sourced from RxNorm (NIH) and the FDA drug label database, and is for general awareness only. Consult your doctor or pharmacist before making any decision about your medicines."

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
| Doctor-visit medication list export (print/PDF) | export |

> **Rule:** No interaction result (positive, negative, or unavailable) may be shown to
> the user without the `inline` disclaimer visible on the same screen. This is
> non-negotiable.

---

## Print Output (Doctor Visit Export)

Midnight Safe's dark theme is for screens only. The doctor-visit medication list
(`/medicines/export`) is the one screen meant to be printed, and printing the dark
theme as-is would waste ink and be unreadable on paper. `globals.css` flips the
`--ms-*` tokens to light/ink-friendly values inside `@media print` only — `--ms-bg`/
`--ms-surf` become white, `--ms-txt*` become dark grays. `BottomNav` and the global
footer disclaimer carry `print:hidden`; the export page renders its own minimal
header, table, and `MEDICAL_DISCLAIMER.export` line instead, so what prints is just
the medication list, not the app chrome around it.

## Onboarding Flow

A 4-slide first-login overlay (`OnboardingFlow.tsx`), gated on a `localStorage` flag
so it only ever shows once. Uses plain CSS `transform: translateX()` transitions
between slides, not Framer Motion — despite `tech-stack.md` listing Framer Motion as
available, every animation actually shipped in this app (fadeUp, pulseAlert, scanLine,
shimmer, and now this) has been a native CSS transition/keyframe, and onboarding follows
that established precedent rather than introducing the first real usage of an
otherwise-unused dependency.
