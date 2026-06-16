import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FamilyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const firstName = (user.user_metadata?.name as string | undefined)
    ?.split(" ")[0] ?? "You";

  return (
    <div className="px-5 pt-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px]">
            Family
          </h1>
          <p className="text-[13px] text-[var(--ms-txt3)] mt-1">
            Manage medicine cabinets for everyone
          </p>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="w-9 h-9 rounded-full bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center no-underline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--ms-txt2)">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </Link>
      </div>

      {/* Member grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Self card */}
        <div className="bg-[var(--ms-surf)] rounded-2xl p-4 border border-[var(--ms-acc)] flex flex-col gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--ms-acc-bg)] flex items-center justify-center">
            <span className="text-[var(--ms-acc)] font-extrabold text-[20px]">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--ms-txt)] leading-tight">{firstName}</p>
            <p className="text-[11px] text-[var(--ms-acc)] font-medium mt-0.5">You (primary)</p>
          </div>
          <div className="flex gap-2">
            <MiniStat label="Meds" value="—" />
            <MiniStat label="Expiring" value="—" />
          </div>
        </div>

        {/* Add member card */}
        <button
          type="button"
          disabled
          className="bg-transparent rounded-2xl p-4 border border-dashed border-[var(--ms-bord)] flex flex-col items-center justify-center gap-3 text-center min-h-[140px] disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--ms-txt3)">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--ms-txt3)]">Add Member</p>
            <p className="text-[11px] text-[var(--ms-txt3)] mt-0.5 opacity-70">Phase 2</p>
          </div>
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-[var(--ms-acc-bg)] rounded-2xl px-4 py-4 border border-[var(--ms-acc)] flex items-start gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--ms-acc)" className="flex-shrink-0 mt-0.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
        <p className="text-[12px] text-[var(--ms-txt2)] leading-relaxed">
          Family Mode lets you track medicines for parents, children, and other household members — all from one account.{" "}
          <span className="text-[var(--ms-acc)] font-semibold">Coming in Phase 2.</span>
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-[var(--ms-surf2)] rounded-xl px-2 py-1.5 text-center">
      <p className="text-[13px] font-bold text-[var(--ms-txt)]">{value}</p>
      <p className="text-[10px] text-[var(--ms-txt3)]">{label}</p>
    </div>
  );
}
