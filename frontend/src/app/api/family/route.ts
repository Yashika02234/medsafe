import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FamilyMemberSchema } from "@/lib/validators/family";

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const members = await prisma.family_members.findMany({
    where: { user_id: user.id },
    orderBy: [{ is_self: "desc" }, { created_at: "asc" }],
  });

  return NextResponse.json({ success: true, data: members });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = FamilyMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const member = await prisma.family_members.create({
    data: {
      user_id: user.id,
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      is_self: false,
    },
  });

  return NextResponse.json({ success: true, data: member }, { status: 201 });
}
