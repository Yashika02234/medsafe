import { prisma } from "@/lib/prisma";
import { sendExpiryAlert, type ExpiryAlertType } from "@/lib/clients/resend";

interface ExpiringItem {
  medicineId: string;
  medicineName: string;
  expiryDate: Date;
  userId: string;
  email: string;
  notificationPreference: string;
  alertType: ExpiryAlertType;
}

// Range-based tiers, not exact-day: a medicine stays in a tier across multiple cron runs
// until notification_log records a 'sent' row for that (medicine, tier) — that's what
// prevents daily re-sends, not the date match itself.
function classifyTier(daysLeft: number): ExpiryAlertType | null {
  if (daysLeft <= 1) return "expiry_1";
  if (daysLeft <= 7) return "expiry_7";
  if (daysLeft <= 30) return "expiry_30";
  return null;
}

export async function findExpiringMedicines(): Promise<ExpiringItem[]> {
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const medicines = await prisma.medicines.findMany({
    where: { is_active: true, expiry_date: { lte: in30Days } },
    include: { family_member: { include: { user: true } } },
  });

  const items: ExpiringItem[] = [];
  for (const med of medicines) {
    const daysLeft = Math.ceil(
      (med.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const tier = classifyTier(daysLeft);
    if (!tier) continue;

    // A 'sent' row means this (medicine, tier) is fully done — never re-notify.
    // (Partial unique index on notification_log enforces this at the DB level too.)
    const alreadySent = await prisma.notification_log.findFirst({
      where: { medicine_id: med.id, notification_type: tier, status: "sent" },
    });
    if (alreadySent) continue;

    items.push({
      medicineId: med.id,
      medicineName: med.brand_name,
      expiryDate: med.expiry_date,
      userId: med.family_member.user_id,
      email: med.family_member.user.email,
      notificationPreference: med.family_member.user.notification_preference,
      alertType: tier,
    });
  }
  return items;
}

export async function processExpiryAlerts(): Promise<{
  sent: number;
  skipped: number;
  failed: number;
}> {
  const items = await findExpiringMedicines();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    if (item.notificationPreference === "none") {
      await prisma.notification_log.create({
        data: {
          user_id: item.userId,
          medicine_id: item.medicineId,
          notification_type: item.alertType,
          status: "skipped_preference",
        },
      });
      skipped++;
      continue;
    }

    const result = await sendExpiryAlert({
      to: item.email,
      medicineName: item.medicineName,
      expiryDate: item.expiryDate,
      alertType: item.alertType,
    });

    await prisma.notification_log.create({
      data: {
        user_id: item.userId,
        medicine_id: item.medicineId,
        notification_type: item.alertType,
        status: result.success ? "sent" : "failed",
        error_message: result.success ? null : result.error,
      },
    });

    if (result.success) sent++;
    else failed++;
  }

  return { sent, skipped, failed };
}
