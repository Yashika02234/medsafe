/** Parse "MM/YYYY" → last calendar day of that month as a Date. */
export function normalizeExpiryDate(monthYear: string): Date {
  const [mm, yyyy] = monthYear.split("/").map(Number);
  // Day 0 of the next month = last day of the current month
  return new Date(yyyy, mm, 0);
}

/** Format a Date as "MMM YYYY" for display (e.g. "Jun 2025"). */
export function formatExpiryDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** Returns 'expired' | 'expiring_soon' | 'safe' based on today's date. */
export function getExpiryStatus(date: Date | string): "expired" | "expiring_soon" | "safe" {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);

  if (d < now) return "expired";
  if (d <= in30) return "expiring_soon";
  return "safe";
}
