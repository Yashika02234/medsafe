/**
 * Canonical legal copy for MedSafe.
 * Single source of truth for consent screen text, disclaimer text, and version tracking.
 *
 * BUMP CONSENT_TEXT_VERSION whenever data collection scope, storage location,
 * or third-party disclosure changes — users on older versions re-consent on login.
 */

// Must match users.consent_text_version in the DB schema.
export const CONSENT_TEXT_VERSION = "v1.0-2026-06";

export const CONSENT_SCREEN = {
  version: CONSENT_TEXT_VERSION,
  title: "Before you begin",
  intro:
    "MedSafe helps you track your medicines and checks if any of them might interact with each other. Before you continue, here is what you should know.",
  dataCollected: [
    "Your email address — to create your account and send you reminders when medicines are about to expire.",
    "The names and expiry dates of your medicines — to track your medicine cabinet.",
    "Family member names (optional) — only if you choose to manage medicines for other people.",
  ],
  howWeUseIt: [
    "Medicine names are sent to the US National Institutes of Health (NIH) free database to look up known drug interactions. No other personal information is sent.",
    "Email reminders are sent to your address only. Your email is not shared with advertisers or third parties.",
    "All your data is stored on Supabase servers located in Mumbai, India.",
  ],
  yourRights: [
    "You can delete all your data at any time from Settings → Delete Account.",
    "You can turn off email reminders at any time from Settings → Notifications.",
    "We do not sell or share your personal information for commercial purposes.",
  ],
  medicalNotice:
    "MedSafe is not a medical device and does not provide medical advice, diagnosis, or prescriptions. Always consult your doctor or pharmacist before making any decision about your medicines.",
  checkboxes: {
    // Required. Controls consent_given field.
    terms:
      "I have read and agree to MedSafe's Terms of Service and Privacy Policy, and I understand that MedSafe is not a substitute for professional medical advice.",
    // Optional. Controls notification_preference field. Default: false.
    notifications:
      "Send me email reminders when my medicines are about to expire. (I can turn this off anytime in Settings.)",
  },
} as const;

export const MEDICAL_DISCLAIMER = {
  /**
   * One line. Used in page footers (landing, login, every dashboard page).
   */
  footer:
    "MedSafe is for informational purposes only. Not a medical device. Consult your doctor before changing any medicine.",

  /**
   * Two sentences. Shown below every interaction warning card and below
   * "no interactions found" and "interaction data unavailable" results.
   */
  inline:
    "Drug interaction information is sourced from the NIH database and is for general awareness only. Consult your doctor or pharmacist before making any decision about your medicines.",

  /**
   * Full text. Used in an expandable "About this information" section and
   * on the /disclaimer page (linked from the footer).
   */
  full: {
    title: "About this information",
    intro:
      "MedSafe is an informational tool, not a medical device, diagnostic service, or substitute for professional medical advice.",
    source:
      "Drug interaction information shown in this app is sourced from the US National Institutes of Health (NIH) RxNav database and is provided for general awareness only.",
    limits: [
      "An interaction warning does not mean you should stop taking a medicine. Many interactions listed are rare or minor, or are already managed by your doctor based on your situation.",
      "MedSafe cannot know your complete health history, current dosages, or individual factors that affect how medicines interact.",
      "Not all medicines have interaction data. If data is unavailable for a medicine, this does not mean it is safe — it means the data could not be checked.",
    ],
    whatToDo: [
      "If you see a severe interaction warning, bring it up with your doctor or pharmacist at your next appointment.",
      "Do not stop, reduce, or change any medicine without first consulting a qualified healthcare provider.",
      "If you experience unexpected symptoms after taking medicines together, contact a doctor. In a medical emergency, call 112 or go to the nearest hospital.",
    ],
    footer:
      "MedSafe does not provide medical advice, diagnosis, or prescriptions. Use of this app does not create a doctor-patient relationship.",
  },
} as const;

/**
 * All locations where MEDICAL_DISCLAIMER.footer or MEDICAL_DISCLAIMER.inline must appear.
 * Documented here so checklist reviews can confirm coverage.
 *
 * footer  → Landing page footer, login page footer, every dashboard page footer
 * inline  → Every interaction warning card, "no interactions found" result, "data unavailable" result
 * full    → /disclaimer page, expandable section on interaction results page
 */
export const DISCLAIMER_PLACEMENTS = {
  footer: ["landing-page-footer", "login-page-footer", "dashboard-footer"],
  inline: [
    "interaction-warning-card",
    "no-interactions-result",
    "data-unavailable-result",
  ],
  full: ["disclaimer-page", "interaction-results-expandable"],
} as const;
