export default function InteractionsPage() {
  return (
    <div className="px-5 pt-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px]">
          Interaction Alerts
        </h1>
        <p className="text-[13px] text-[var(--ms-txt3)] mt-1">
          Drug interaction checks across your cabinet
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", "Severe", "Moderate", "Mild"].map((label, i) => (
          <button
            key={label}
            type="button"
            disabled
            className={`flex-shrink-0 px-4 py-[7px] rounded-full text-[13px] font-medium border transition-colors disabled:opacity-60 ${
              i === 0
                ? "bg-[var(--ms-acc)] border-[var(--ms-acc)] text-white"
                : "bg-transparent border-[var(--ms-bord)] text-[var(--ms-txt3)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-14 gap-5">
        <div className="w-20 h-20 rounded-3xl bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--ms-grn)" opacity="0.7">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-bold text-[var(--ms-txt)] mb-2">No interactions detected</p>
          <p className="text-[13px] text-[var(--ms-txt3)] leading-relaxed max-w-[260px] mx-auto">
            Add medicines to your cabinet and the interaction engine will automatically check for dangerous combinations.
          </p>
        </div>
      </div>

      {/* Sample severe card (shown as preview) */}
      <div className="opacity-40 pointer-events-none">
        <p className="text-[11px] font-semibold text-[var(--ms-txt3)] uppercase tracking-widest mb-3">
          Preview — how alerts will look
        </p>
        <SampleAlertCard
          drugA="Warfarin"
          drugB="Aspirin"
          severity="SEVERE"
          variant="red"
          description="Concurrent use significantly increases risk of bleeding. Avoid unless under close medical supervision."
        />
        <div className="mt-3">
          <SampleAlertCard
            drugA="Metformin"
            drugB="Ibuprofen"
            severity="MODERATE"
            variant="amb"
            description="NSAIDs may reduce the effectiveness of Metformin. Monitor blood glucose levels closely."
          />
        </div>
      </div>

      {/* Phase callout */}
      <div className="bg-[var(--ms-surf)] rounded-2xl px-5 py-4 border border-[var(--ms-bord)] text-center">
        <p className="text-[12px] text-[var(--ms-txt3)]">
          Interaction engine is coming in <span className="text-[var(--ms-acc)] font-semibold">Phase 3</span>
        </p>
      </div>
    </div>
  );
}

const ALERT_VARIANTS = {
  red: {
    border: "border-l-[3px] border-l-[var(--ms-red)]",
    text: "text-[var(--ms-red)]",
    badge: "text-[var(--ms-red)] bg-[var(--ms-red-bg)]",
  },
  amb: {
    border: "border-l-[3px] border-l-[var(--ms-amb)]",
    text: "text-[var(--ms-amb)]",
    badge: "text-[var(--ms-amb)] bg-[var(--ms-amb-bg)]",
  },
  grn: {
    border: "border-l-[3px] border-l-[var(--ms-grn)]",
    text: "text-[var(--ms-grn)]",
    badge: "text-[var(--ms-grn)] bg-[var(--ms-grn-bg)]",
  },
} as const;

function SampleAlertCard({
  drugA,
  drugB,
  severity,
  variant,
  description,
}: {
  drugA: string;
  drugB: string;
  severity: string;
  variant: keyof typeof ALERT_VARIANTS;
  description: string;
}) {
  const v = ALERT_VARIANTS[variant];
  return (
    <div className={`bg-[var(--ms-surf)] rounded-2xl p-4 border border-[var(--ms-bord)] ${v.border}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-[14px] font-bold text-[var(--ms-txt)]">
          {drugA} <span className="text-[var(--ms-txt3)]">↔</span> {drugB}
        </p>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${v.badge}`}>
          {severity}
        </span>
      </div>
      <p className="text-[12px] text-[var(--ms-txt2)] leading-relaxed">{description}</p>
      <p className="mt-2 text-[11px] text-[var(--ms-txt3)] italic">
        Drug interaction information is sourced from NIH. Consult your doctor before making any decision.
      </p>
    </div>
  );
}
