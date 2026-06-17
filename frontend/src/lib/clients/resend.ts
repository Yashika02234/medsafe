const RESEND_API_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10000;

export type ExpiryAlertType = "expiry_30" | "expiry_7" | "expiry_1";

const URGENCY: Record<ExpiryAlertType, { days: string; tone: string }> = {
  expiry_30: { days: "30 days", tone: "Heads up" },
  expiry_7: { days: "7 days", tone: "Reminder" },
  expiry_1: { days: "1 day", tone: "Urgent" },
};

interface SendExpiryAlertParams {
  to: string;
  medicineName: string;
  expiryDate: Date;
  alertType: ExpiryAlertType;
}

export async function sendExpiryAlert({
  to,
  medicineName,
  expiryDate,
  alertType,
}: SendExpiryAlertParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  if (!apiKey) return { success: false, error: "RESEND_API_KEY not configured" };

  const { days, tone } = URGENCY[alertType];
  const expiryLabel = expiryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e; margin-bottom: 4px;">${tone}: ${medicineName} expires soon</h2>
      <p style="color: #555; font-size: 14px; line-height: 1.5;">
        Your medicine <strong>${medicineName}</strong> expires in <strong>${days}</strong>
        (on ${expiryLabel}). Check your MedSafe cabinet to plan a refill if needed.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
        MedSafe is for informational purposes only. Not a medical device.
        Consult your doctor before changing any medicine.
      </p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `MedSafe <${from}>`,
        to: [to],
        subject: `${tone}: ${medicineName} expires in ${days}`,
        html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Resend ${res.status}: ${body}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
