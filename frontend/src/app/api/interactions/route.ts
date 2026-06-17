import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAllInteractions } from "@/lib/services/interactionEngine";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get("family_member_id");

  let familyMemberId = requestedId;
  if (familyMemberId) {
    const owned = await prisma.family_members.findFirst({
      where: { id: familyMemberId, user_id: user.id },
    });
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "Family member not found" },
        { status: 404 }
      );
    }
  } else {
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

  const result = await checkAllInteractions(familyMemberId);
  return NextResponse.json({ success: true, data: result });
}
