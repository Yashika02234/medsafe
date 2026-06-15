import { NextResponse } from "next/server";
import { createClient } from "./supabase/server";

export async function getSession() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// Use at the top of every protected API route handler.
// Returns { user, errorResponse } — if errorResponse is non-null, return it immediately.
export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    } as const;
  }
  return { user, errorResponse: null } as const;
}
