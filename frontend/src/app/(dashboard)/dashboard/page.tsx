import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const firstName = (user.user_metadata?.name as string | undefined)
    ?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-5 pt-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[var(--ms-txt3)] font-medium uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="text-[26px] font-extrabold text-[var(--ms-txt)] tracking-[-0.7px] leading-tight">
            {firstName} 👋
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--ms-acc-bg)] flex items-center justify-center">
          <span className="text-[var(--ms-acc)] font-bold text-[15px]">
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Family member scroll row */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--ms-txt3)] uppercase tracking-widest mb-3">
          Viewing cabinet for
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FamilyChip name={firstName} active />
          <FamilyChip name="Add member" isAdd />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Medicines" value="—" variant="acc" />
        <StatCard label="Expiring" value="—" variant="amb" />
        <StatCard label="Alerts" value="—" variant="red" />
      </div>

      {/* Severe interaction banner — hidden until Phase 3 */}
      <div
        aria-live="polite"
        className="hidden bg-[var(--ms-red-bg)] border border-[var(--ms-red)] rounded-2xl px-4 py-4 flex items-start gap-3 animate-pulse-alert"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--ms-red)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--ms-red)] mb-0.5">Severe Interaction Detected</p>
          <p className="text-xs text-[var(--ms-txt2)] leading-relaxed">
            Interaction checks will be available in Phase 3.
          </p>
        </div>
      </div>

      {/* Expiring soon section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[var(--ms-txt)]">Expiring Soon</h2>
          <span className="text-[12px] text-[var(--ms-acc)] font-semibold cursor-pointer">See all</span>
        </div>

        {/* Empty state */}
        <div className="bg-[var(--ms-surf)] rounded-2xl px-5 py-8 flex flex-col items-center gap-3 border border-[var(--ms-bord)]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--ms-acc-bg)] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--ms-acc)">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h10v2H7v-2zm0 4h7v2H7v-2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-[var(--ms-txt)] mb-1">No medicines yet</p>
            <p className="text-[12px] text-[var(--ms-txt3)] leading-relaxed max-w-[220px]">
              Add your first medicine using the + button below
            </p>
          </div>
        </div>
      </div>

      {/* Recent activity section */}
      <div>
        <h2 className="text-[15px] font-bold text-[var(--ms-txt)] mb-3">Recent Activity</h2>
        <div className="bg-[var(--ms-surf)] rounded-2xl px-5 py-5 border border-[var(--ms-bord)]">
          <p className="text-[13px] text-[var(--ms-txt3)] text-center">
            Activity feed will appear here as you track medicines.
          </p>
        </div>
      </div>
    </div>
  );
}

const STAT_COLOR = {
  acc: "text-[var(--ms-acc)]",
  amb: "text-[var(--ms-amb)]",
  red: "text-[var(--ms-red)]",
} as const;

function StatCard({ label, value, variant }: { label: string; value: string; variant: keyof typeof STAT_COLOR }) {
  return (
    <div className="bg-[var(--ms-surf)] rounded-2xl px-3 py-4 flex flex-col gap-1.5 border border-[var(--ms-bord)]">
      <p className={`text-[22px] font-extrabold leading-none ${STAT_COLOR[variant]}`}>
        {value}
      </p>
      <p className="text-[11px] text-[var(--ms-txt3)] font-medium">{label}</p>
    </div>
  );
}

function FamilyChip({ name, active, isAdd }: { name: string; active?: boolean; isAdd?: boolean }) {
  return (
    <button
      type="button"
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-[7px] rounded-full border text-[13px] font-medium transition-colors ${
        isAdd
          ? "border-dashed border-[var(--ms-bord)] text-[var(--ms-txt3)] bg-transparent"
          : active
          ? "bg-[var(--ms-acc)] border-[var(--ms-acc)] text-white"
          : "bg-[var(--ms-surf)] border-[var(--ms-bord)] text-[var(--ms-txt2)]"
      }`}
    >
      {isAdd ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          {name}
        </>
      ) : (
        <>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
          {name}
        </>
      )}
    </button>
  );
}
