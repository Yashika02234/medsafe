"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--ms-bg)] flex flex-col items-center justify-center px-8 gap-5 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[var(--ms-red-bg)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--ms-red)">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>
      <div>
        <p className="text-[16px] font-bold text-[var(--ms-txt)] mb-2">Something went wrong</p>
        <p className="text-[13px] text-[var(--ms-txt3)] max-w-[260px] mx-auto leading-relaxed">
          We couldn&apos;t load this page. Please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="bg-[var(--ms-acc)] text-white rounded-2xl px-8 py-[14px] text-[15px] font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
