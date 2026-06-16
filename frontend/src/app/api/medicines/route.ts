import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveRxCUI } from "@/lib/rxnorm";
import { normalizeExpiryDate } from "@/lib/utils/expiry";

const CreateMedicineSchema = z.object({
  brand_name: z.string().min(1).max(200),
  salts: z.array(z.string().min(1).max(200)).min(1).max(20),
  expiry_month_year: z
    .string()
    .regex(/^\d{2}\/\d{4}$/, "Must be MM/YYYY format"),
  quantity: z.number().int().positive().optional(),
  dosage_schedule: z.string().max(500).optional(),
  family_member_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const familyMemberId = searchParams.get("family_member_id");

  const medicines = await prisma.medicines.findMany({
    where: {
      family_member: { user_id: user.id },
      is_active: true,
      ...(familyMemberId ? { family_member_id: familyMemberId } : {}),
    },
    include: { ingredients: true },
    orderBy: { expiry_date: "asc" },
  });

  return NextResponse.json({ success: true, data: medicines });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = CreateMedicineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { brand_name, salts, expiry_month_year, quantity, dosage_schedule } = parsed.data;

  // Resolve the family_member_id: use provided or fall back to user's self member
  let familyMemberId = parsed.data.family_member_id;
  if (!familyMemberId) {
    const selfMember = await prisma.family_members.findFirst({
      where: { user_id: user.id, is_self: true },
    });
    if (!selfMember) {
      return NextResponse.json(
        { success: false, error: "No family member found for user" },
        { status: 400 }
      );
    }
    familyMemberId = selfMember.id;
  }

  // Resolve RxCUIs for all salts concurrently (failures are non-fatal)
  const resolvedSalts = await Promise.all(
    salts.map(async (salt, ordinal) => ({
      salt,
      ordinal,
      rxcui: await resolveRxCUI(salt),
    }))
  );

  const resolvedCount = resolvedSalts.filter((s) => s.rxcui !== null).length;
  const resolutionStatus =
    resolvedCount === salts.length
      ? "resolved"
      : resolvedCount > 0
      ? "partial"
      : "unresolvable";

  const expiryDate = normalizeExpiryDate(expiry_month_year);

  const medicine = await prisma.$transaction(async (tx) => {
    const med = await tx.medicines.create({
      data: {
        family_member_id: familyMemberId!,
        brand_name,
        generic_name: salts.join(" + "),
        expiry_date: expiryDate,
        quantity: quantity ?? null,
        dosage_schedule: dosage_schedule ?? null,
        added_via: "manual",
        is_active: true,
        resolution_status: resolutionStatus,
        resolution_error:
          resolutionStatus !== "resolved" ? "rxnorm_miss" : null,
        resolution_attempt_count: 1,
        resolution_attempted_at: new Date(),
      },
    });

    await tx.medicine_ingredients.createMany({
      data: resolvedSalts.map(({ salt, ordinal, rxcui }) => ({
        medicine_id: med.id,
        salt_name: salt,
        ordinal,
        rxcui: rxcui ?? null,
        resolution_status: rxcui ? "resolved" : "unresolvable",
      })),
    });

    return tx.medicines.findUnique({
      where: { id: med.id },
      include: { ingredients: true },
    });
  });

  return NextResponse.json({ success: true, data: medicine }, { status: 201 });
}
