import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PreferencesSchema = z.object({
  notification_preference: z.enum(["email", "none"]),
});

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const parsed = PreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const updated = await prisma.users.update({
    where: { id: user.id },
    data: { notification_preference: parsed.data.notification_preference },
  });

  return NextResponse.json({
    success: true,
    data: { notification_preference: updated.notification_preference },
  });
}
