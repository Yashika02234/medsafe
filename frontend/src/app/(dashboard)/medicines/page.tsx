export default function MedicinesPage() {
  return (
    <div className="px-5 pt-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px]">
          Medicine Cabinet
        </h1>
        <div className="w-8 h-8 rounded-full bg-[var(--ms-acc-bg)] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--ms-acc)">
            <path d="M16.5 3C14.76 3 13.09 3.81 12 5.09 10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
          </svg>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="var(--ms-txt3)"
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="search"
          placeholder="Search medicines…"
          disabled
          className="w-full bg-[var(--ms-surf)] border border-[var(--ms-bord)] rounded-2xl pl-11 pr-4 py-[13px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none disabled:opacity-60"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", "Expiring", "Expired", "Low Stock"].map((label, i) => (
          <button
            key={label}
            type="button"
            disabled
            className={`flex-shrink-0 px-4 py-[7px] rounded-full border text-[13px] font-medium transition-colors disabled:opacity-60 ${
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
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div className="w-20 h-20 rounded-3xl bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--ms-acc)" opacity="0.6">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-bold text-[var(--ms-txt)] mb-2">Your cabinet is empty</p>
          <p className="text-[13px] text-[var(--ms-txt3)] leading-relaxed max-w-[240px] mx-auto">
            Tap the + button to add your first medicine and start tracking expiry dates.
          </p>
        </div>
        <div className="bg-[var(--ms-surf)] rounded-2xl px-5 py-4 border border-[var(--ms-bord)] w-full max-w-[280px] text-center">
          <p className="text-[12px] text-[var(--ms-txt3)]">
            Medicine CRUD is coming in <span className="text-[var(--ms-acc)] font-semibold">Phase 2</span>
          </p>
        </div>
      </div>
    </div>
  );
}
