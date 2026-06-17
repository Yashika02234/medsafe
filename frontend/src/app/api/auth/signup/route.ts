import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CONSENT_TEXT_VERSION } from "@/lib/legal";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  consent_given: z.literal(true),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message, code: "AUTH_ERROR" },
      { status: 400 }
    );
  }

  if (!data.user) {
    return NextResponse.json(
      { success: false, error: "Signup failed", code: "AUTH_ERROR" },
      { status: 500 }
    );
  }

  // Create user profile + self family member in a transaction
  try {
    await prisma.$transaction([
      prisma.users.create({
        data: {
          id: data.user.id,
          email,
          name,
          consent_given: true,
          consent_given_at: new Date(),
          consent_text_version: CONSENT_TEXT_VERSION,
        },
      }),
      prisma.family_members.create({
        data: {
          user_id: data.user.id,
          name,
          relationship: "self",
          is_self: true,
        },
      }),
    ]);
  } catch (dbError) {
    // Auth user was created but DB insert failed — log and surface as error
    console.error("[signup] DB insert failed after auth signup:", dbError);
    return NextResponse.json(
      { success: false, error: "Account setup failed", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  // If email confirmation is disabled in Supabase, session is already active.
  // If enabled, user must confirm before they can log in.
  const requiresConfirmation = !data.session;

  return NextResponse.json({
    success: true,
    data: {
      requiresConfirmation,
      message: requiresConfirmation
        ? "Check your email to confirm your account."
        : "Account created successfully.",
    },
  });
}
