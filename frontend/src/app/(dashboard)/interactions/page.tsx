"use client";

import { useState, useEffect, useCallback } from "react";
import { InteractionWarningCard } from "@/components/interactions/InteractionWarningCard";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";
import type { InteractionWarning, InteractionSeverity } from "@/types/interaction";

type FilterKey = "all" | InteractionSeverity;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "severe", label: "Severe" },
  { key: "moderate", label: "Moderate" },
  { key: "mild", label: "Mild" },
];

export default function InteractionsPage() {
  const [warnings, setWarnings] = useState<InteractionWarning[]>([]);
  const [uncheckedCount, setUncheckedCount] = useState(0);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/interactions");
      const data = await res.json();
      if (data.success) {
        setWarnings(data.data.warnings);
        setUncheckedCount(data.data.uncheckedCount);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === "all" ? warnings : warnings.filter((w) => w.severity === filter);

  return (
    <div className="px-5 pt-6 flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px]">
          Interaction Alerts
        </h1>
        <p className="text-[13px] text-[var(--ms-txt3)] mt-1">
          Drug interaction checks across your cabinet
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-4 py-[7px] rounded-full text-[13px] font-medium border transition-colors ${
              filter === key
                ? "bg-[var(--ms-acc)] border-[var(--ms-acc)] text-white"
                : "bg-transparent border-[var(--ms-bord)] text-[var(--ms-txt3)]"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="ml-1.5 opacity-70">
                ({warnings.filter((w) => w.severity === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[88px] bg-[var(--ms-surf)] rounded-2xl animate-pulse border border-[var(--ms-bord)]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-14 gap-4">
          <p className="text-[15px] font-semibold text-[var(--ms-txt)]">
            Interaction data unavailable
          </p>
          <p className="text-[13px] text-[var(--ms-txt3)] text-center max-w-[260px]">
            We couldn&apos;t check for interactions right now. This doesn&apos;t mean your
            medicines are safe to combine — please try again later.
          </p>
          <p className="text-[11px] text-[var(--ms-txt3)] italic text-center max-w-[280px]">
            {MEDICAL_DISCLAIMER.inline}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-5">
          <div className="w-20 h-20 rounded-3xl bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--ms-grn)" opacity="0.7">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[16px] font-bold text-[var(--ms-txt)] mb-2">
              No interactions detected
            </p>
            <p className="text-[13px] text-[var(--ms-txt3)] leading-relaxed max-w-[260px] mx-auto">
              This doesn&apos;t mean all combinations are safe — always consult your doctor.
            </p>
          </div>
          <p className="text-[11px] text-[var(--ms-txt3)] italic text-center max-w-[280px]">
            {MEDICAL_DISCLAIMER.inline}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((w) => (
            <InteractionWarningCard key={`${w.rxcui_a}-${w.rxcui_b}`} warning={w} />
          ))}
        </div>
      )}

      {uncheckedCount > 0 && (
        <div className="bg-[var(--ms-surf)] rounded-2xl px-5 py-4 border border-[var(--ms-bord)] text-center">
          <p className="text-[12px] text-[var(--ms-txt3)]">
            {uncheckedCount} ingredient{uncheckedCount === 1 ? "" : "s"} couldn&apos;t be resolved
            and {uncheckedCount === 1 ? "wasn't" : "weren't"} checked for interactions.
          </p>
        </div>
      )}
    </div>
  );
}
