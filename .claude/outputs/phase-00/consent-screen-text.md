# Consent Screen Text — MedSafe

**Version:** v1.0-2026-06
**Stored in DB as:** `users.consent_text_version`
**When to bump version:** Any time the data collection scope, storage location, or third-party disclosure changes. Users who consented to an older version must re-consent on next login.

---

## Title

"Before you begin"

---

## Body Text

"MedSafe helps you track your medicines and checks if any of them might interact with each other. Before you continue, here is what you should know."

---

## Data Collection Section

**Heading:** "What we collect"

- Your **email address** — to create your account and send you reminders when medicines are about to expire.
- The **names and expiry dates of your medicines** — to track your medicine cabinet.
- **Family member names** (optional) — only if you choose to manage medicines for other people.

---

## How We Use It Section

**Heading:** "How we use your information"

- Medicine names are sent to the **US National Institutes of Health (NIH) free database** to look up known drug interactions. No other personal information is sent. This service is operated by the US government and is free to use.
- Email reminders are sent to your address only. **Your email is not shared with advertisers or third parties.**
- All your data is stored on **Supabase servers located in Mumbai, India.**

---

## Your Rights Section

**Heading:** "Your rights"

- You can **delete all your data** at any time from Settings → Delete Account. This is permanent and immediate.
- You can **turn off email reminders** at any time from Settings → Notifications.
- We do **not sell or share** your personal information for commercial purposes.

---

## Important Notice

"MedSafe is **not a medical device** and does not provide medical advice, diagnosis, or prescriptions. Always consult your doctor or pharmacist before making any decision about your medicines."

---

## Consent Checkboxes

Both checkboxes must be checked to continue. Neither is pre-checked.

**Checkbox 1 (required — terms + medical understanding):**
> "I have read and agree to MedSafe's Terms of Service and Privacy Policy, and I understand that MedSafe is not a substitute for professional medical advice."

**Checkbox 2 (optional — email notifications):**
> "Send me email reminders when my medicines are about to expire. (I can turn this off anytime in Settings.)"

*Note: Checkbox 2 controls the `notification_preference` field in the users table. Defaults to false. Users can always update this in Settings.*

---

## Legal Basis (DPDPA 2023)

| Requirement | How MedSafe satisfies it |
|------------|--------------------------|
| Free consent | No service is withheld if Checkbox 2 is declined |
| Specific consent | Each category of data use is described separately |
| Informed consent | Purpose, storage location, and third-party disclosure are explicit |
| Unconditional consent | No conditions placed on data deletion right |
| Unambiguous | Explicit checkboxes, not implied by account creation |
| Right to withdraw | Deletion available from Settings at all times |
| Data localisation | Supabase Mumbai (ap-south-1) for primary data |

---

## Implementation Notes (Phase 1)

- Screen appears after Supabase Auth signup email confirmation, before dashboard access
- Route: `/onboarding/consent` — cannot be bypassed (middleware check for `consent_given`)
- On save: `prisma.users.update({ consent_given: true, consent_given_at: new Date(), consent_text_version: CONSENT_TEXT_VERSION })`
- Source of truth for `CONSENT_TEXT_VERSION` constant: `frontend/src/lib/legal.ts`
- Privacy Policy page: `/privacy` — must exist before any external users (Phase 1 deliverable)

---

*Consent text reviewed: 2026-06-10. Next review required if data collection scope changes.*
