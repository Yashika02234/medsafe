import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeExpiryDate } from "@/lib/utils/expiry";

const UpdateMedicineSchema = z.object({
  expiry_month_year: z
    .string()
    .regex(/^\d{2}\/\d{4}$/)
    .optional(),
  quantity: z.number().int().positive().nullable().optional(),
  dosage_schedule: z.string().max(500).nullable().optional(),
});

async function verifyOwnership(medicineId: string, userId: string) {
  return prisma.medicines.findFirst({
    where: {
      id: medicineId,
      family_member: { user_id: userId },
      is_active: true,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const medicine = await verifyOwnership(params.id, user.id);
  if (!medicine) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateMedicineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const updated = await prisma.medicines.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.expiry_month_year
        ? { expiry_date: normalizeExpiryDate(parsed.data.expiry_month_year) }
        : {}),
      ...(parsed.data.quantity !== undefined
        ? { quantity: parsed.data.quantity }
        : {}),
      ...(parsed.data.dosage_schedule !== undefined
        ? { dosage_schedule: parsed.data.dosage_schedule }
        : {}),
    },
    include: { ingredients: true },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const medicine = await verifyOwnership(params.id, user.id);
  if (!medicine) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  await prisma.medicines.update({
    where: { id: params.id },
    data: {
      is_active: false,
      deactivated_at: new Date(),
      deactivation_reason: "user_deleted",
    },
  });

  return NextResponse.json({ success: true });
}
