import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return a generic message — never reveal whether email exists
    return NextResponse.json(
      { success: false, error: "Invalid email or password", code: "INVALID_CREDENTIALS" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { userId: data.user.id },
  });
}
