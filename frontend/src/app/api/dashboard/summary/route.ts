import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const [total, expiring_soon] = await Promise.all([
    prisma.medicines.count({
      where: {
        family_member: { user_id: user.id },
        is_active: true,
      },
    }),
    prisma.medicines.count({
      where: {
        family_member: { user_id: user.id },
        is_active: true,
        expiry_date: { gte: now, lte: in30Days },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { total, expiring_soon, interactions: 0 },
  });
}
