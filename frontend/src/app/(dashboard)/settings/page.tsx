import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = (user.user_metadata?.name as string | undefined) ?? "Unknown";
  const email = user.email ?? "";
  const initials = name
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="px-5 pt-6 flex flex-col gap-6">
      {/* Header */}
      <h1 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px]">
        Settings
      </h1>

      {/* Profile card */}
      <div className="bg-[var(--ms-surf)] rounded-2xl px-5 py-5 border border-[var(--ms-bord)] flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--ms-acc-bg)] flex items-center justify-center flex-shrink-0">
          <span className="text-[var(--ms-acc)] font-extrabold text-[20px]">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[16px] font-bold text-[var(--ms-txt)] truncate">{name}</p>
          <p className="text-[13px] text-[var(--ms-txt3)] truncate">{email}</p>
        </div>
      </div>

      {/* Notifications section */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--ms-txt3)] uppercase tracking-widest mb-3">
          Notifications
        </p>
        <div className="bg-[var(--ms-surf)] rounded-2xl border border-[var(--ms-bord)] overflow-hidden">
          <ToggleRow label="Expiry alerts (30 days)" enabled />
          <ToggleRow label="Expiry alerts (7 days)" enabled />
          <ToggleRow label="Expiry alerts (on day)" enabled />
          <ToggleRow label="Interaction warnings" enabled last />
        </div>
        <p className="text-[11px] text-[var(--ms-txt3)] mt-2 px-1">
          Notification preferences saved to your account. Email delivery via Resend.
        </p>
      </div>

      {/* App section */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--ms-txt3)] uppercase tracking-widest mb-3">
          App
        </p>
        <div className="bg-[var(--ms-surf)] rounded-2xl border border-[var(--ms-bord)] overflow-hidden">
          <LinkRow label="Privacy Policy" href="/disclaimer" />
          <LinkRow label="Medical Disclaimer" href="/disclaimer" last />
        </div>
      </div>

      {/* Version */}
      <p className="text-[12px] text-[var(--ms-txt3)] text-center">
        MedSafe v0.1.0 — Phase 1 Build
      </p>

      {/* Sign out */}
      <SignOutButton />
    </div>
  );
}

function ToggleRow({ label, enabled, last }: { label: string; enabled: boolean; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 ${!last ? "border-b border-[var(--ms-bord)]" : ""}`}>
      <p className="text-[14px] text-[var(--ms-txt)]">{label}</p>
      <div
        aria-hidden
        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${
          enabled ? "bg-[var(--ms-acc)]" : "bg-[var(--ms-surf2)]"
        }`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

function LinkRow({ label, href, last }: { label: string; href: string; last?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center justify-between px-5 py-4 no-underline ${!last ? "border-b border-[var(--ms-bord)]" : ""}`}
    >
      <p className="text-[14px] text-[var(--ms-txt)]">{label}</p>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--ms-txt3)">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
    </a>
  );
}
