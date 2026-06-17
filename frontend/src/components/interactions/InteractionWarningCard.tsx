import { MEDICAL_DISCLAIMER } from "@/lib/legal";
import type { InteractionWarning } from "@/types/interaction";

const VARIANTS: Record<InteractionWarning["severity"], { border: string; badge: string; label: string }> = {
  severe: {
    border: "border-l-[3px] border-l-[var(--ms-red)]",
    badge: "text-[var(--ms-red)] bg-[var(--ms-red-bg)]",
    label: "SEVERE",
  },
  moderate: {
    border: "border-l-[3px] border-l-[var(--ms-amb)]",
    badge: "text-[var(--ms-amb)] bg-[var(--ms-amb-bg)]",
    label: "MODERATE",
  },
  mild: {
    border: "border-l-[3px] border-l-[var(--ms-amb)]",
    badge: "text-[var(--ms-amb)] bg-[var(--ms-amb-bg)]",
    label: "MILD",
  },
  unknown: {
    border: "border-l-[3px] border-l-[var(--ms-txt3)]",
    badge: "text-[var(--ms-txt3)] bg-[var(--ms-surf2)]",
    label: "UNKNOWN",
  },
};

export function InteractionWarningCard({ warning }: { warning: InteractionWarning }) {
  const v = VARIANTS[warning.severity];
  return (
    <div className={`bg-[var(--ms-surf)] rounded-2xl p-4 border border-[var(--ms-bord)] ${v.border}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-[14px] font-bold text-[var(--ms-txt)]">
          {warning.drug_a} <span className="text-[var(--ms-txt3)]">↔</span> {warning.drug_b}
        </p>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${v.badge}`}>
          {v.label}
        </span>
      </div>
      <p className="text-[12px] text-[var(--ms-txt2)] leading-relaxed">{warning.description}</p>
      <p className="mt-2 text-[11px] text-[var(--ms-txt3)] italic">{MEDICAL_DISCLAIMER.inline}</p>
    </div>
  );
}
