import Link from "next/link";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ms-bg)] flex flex-col">
      {/* Logo strip */}
      <div className="pt-12 pb-6 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-[18px] bg-[var(--ms-acc-bg)] border border-[rgba(79,142,255,0.2)] flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <path d="M28 5L8 14v17c0 13.5 8.3 26 20 29 11.7-3 20-15.5 20-29V14L28 5z" fill="#4F8EFF" opacity="0.9" />
            <path d="M21 28l5.5 5.5 10.5-10.5" stroke="#091628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <Link href="/" className="text-[17px] font-bold text-[var(--ms-txt)] no-underline tracking-[-0.3px]">
          MedSafe
        </Link>
      </div>

      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="py-5 px-5 text-center">
        <p className="text-[11px] text-[var(--ms-txt3)] leading-relaxed">
          {MEDICAL_DISCLAIMER.footer}
        </p>
      </footer>
    </div>
  );
}
