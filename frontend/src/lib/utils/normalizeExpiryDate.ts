const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

const NUMERIC = /^(\d{2})[/-](\d{4})$/;
const MONTH_NAME = /^([A-Za-z]{3})[/-](\d{4})$/;

/** Converts OCR-extracted expiry strings (e.g. "12-2025", "DEC/2025") into the
 * form's required "MM/YYYY" digit format. Returns null if it can't confidently parse. */
export function normalizeExpiryDate(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  const numericMatch = trimmed.match(NUMERIC);
  if (numericMatch) {
    const [, month, year] = numericMatch;
    return Number(month) >= 1 && Number(month) <= 12 ? `${month}/${year}` : null;
  }

  const monthNameMatch = trimmed.match(MONTH_NAME);
  if (monthNameMatch) {
    const [, monthName, year] = monthNameMatch;
    const month = MONTHS[monthName.toUpperCase()];
    return month ? `${month}/${year}` : null;
  }

  return null;
}
