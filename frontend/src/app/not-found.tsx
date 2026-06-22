import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--ms-bg)] flex flex-col items-center justify-center px-8 gap-5 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--ms-acc)" opacity="0.6">
          <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      </div>
      <div>
        <p className="text-[16px] font-bold text-[var(--ms-txt)] mb-2">Page not found</p>
        <p className="text-[13px] text-[var(--ms-txt3)] max-w-[260px] mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="bg-[var(--ms-acc)] text-white rounded-2xl px-8 py-[14px] text-[15px] font-semibold no-underline"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
