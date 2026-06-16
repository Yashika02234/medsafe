"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="w-full bg-[var(--ms-red-bg)] border border-[var(--ms-red)] text-[var(--ms-red)] rounded-2xl py-[15px] text-[15px] font-semibold disabled:opacity-50 mb-4"
    >
      {loading ? "Signing out…" : "Sign Out"}
    </button>
  );
}
