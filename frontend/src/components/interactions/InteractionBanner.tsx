"use client";

import { useState } from "react";
import Link from "next/link";

export function InteractionBanner({ severeCount }: { severeCount: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (severeCount === 0 || dismissed) return null;

  return (
    <div className="bg-[var(--ms-red-bg)] border border-[var(--ms-red)] rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-[18px] flex-shrink-0">⚠️</span>
      <p className="flex-1 text-[13px] text-[var(--ms-red)] font-medium leading-snug">
        {severeCount} severe interaction warning{severeCount === 1 ? "" : "s"} found.{" "}
        <Link href="/interactions" className="underline font-semibold">
          Review now
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex-shrink-0 text-[var(--ms-red)] opacity-70"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}
