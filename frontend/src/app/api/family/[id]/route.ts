import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FamilyMemberSchema } from "@/lib/validators/family";

async function verifyOwnership(memberId: string, userId: string) {
  return prisma.family_members.findFirst({
    where: { id: memberId, user_id: userId },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const member = await verifyOwnership(params.id, user.id);
  if (!member) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (member.is_self) {
    return NextResponse.json(
      { success: false, error: "The self member cannot be edited" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = FamilyMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const updated = await prisma.family_members.update({
    where: { id: params.id },
    data: { name: parsed.data.name, relationship: parsed.data.relationship },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const member = await verifyOwnership(params.id, user.id);
  if (!member) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (member.is_self) {
    return NextResponse.json(
      { success: false, error: "The self member cannot be deleted" },
      { status: 400 }
    );
  }

  await prisma.family_members.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
