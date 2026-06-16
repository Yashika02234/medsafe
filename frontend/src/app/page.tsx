import Link from "next/link";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--ms-page-bg)] text-[var(--ms-txt)] flex flex-col">

      {/* Nav */}
      <header className="border-b border-[var(--ms-bord)] px-6 py-4 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[var(--ms-acc)] flex items-center justify-center flex-shrink-0">
            <ShieldIcon />
          </div>
          <span className="font-bold text-[17px] tracking-[-0.3px]">MedSafe</span>
        </div>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="px-4 py-2 rounded-[10px] text-sm font-medium text-[var(--ms-txt2)] bg-white/[0.06] border border-[rgba(100,140,255,0.15)] no-underline"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-[10px] text-sm font-semibold text-white bg-[var(--ms-acc)] no-underline"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-lg mx-auto px-6 pt-16 pb-12 text-center">
          <div className="w-24 h-24 rounded-[28px] bg-[var(--ms-acc-bg)] border border-[rgba(79,142,255,0.2)] flex items-center justify-center mx-auto mb-7">
            <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
              <path d="M28 5L8 14v17c0 13.5 8.3 26 20 29 11.7-3 20-15.5 20-29V14L28 5z" fill="#4F8EFF" opacity="0.9" />
              <path d="M21 28l5.5 5.5 10.5-10.5" stroke="#091628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="text-[40px] font-extrabold tracking-[-1.5px] leading-[1.05] text-[var(--ms-txt)] mb-3">
            MedSafe
          </h1>
          <p className="text-lg text-[var(--ms-txt2)] mb-2 leading-relaxed">
            Your family&apos;s medicine guardian
          </p>
          <p className="text-sm text-[var(--ms-txt3)] mb-10 leading-relaxed">
            Track expiry dates. Catch dangerous drug interactions.
            <br />
            Free for Indian households.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="block w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[17px] text-[17px] font-semibold no-underline tracking-[-0.3px] text-center"
            >
              Get Started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="block w-full bg-[var(--ms-acc-bg)] text-[var(--ms-acc)] rounded-2xl py-[17px] text-[17px] font-medium no-underline text-center"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-lg mx-auto px-5 pb-12">
          <p className="text-[11px] font-semibold text-[var(--ms-txt3)] uppercase tracking-[0.9px] mb-4">
            Why MedSafe
          </p>
          <div className="flex flex-col gap-[10px]">
            <FeatureRow color="#2ECC8F" icon="🛡️" title="Expiry tracking" desc="Alerts at 30, 7 and 1 day before your medicines expire." />
            <FeatureRow color="#F4645E" icon="⚠️" title="Interaction checker" desc="Flags severe, moderate, and mild drug interactions instantly." />
            <FeatureRow color="#4F8EFF" icon="👨‍👩‍👧" title="Family mode" desc="One account for your entire family. Indian brand names work out of the box." />
            <FeatureRow color="#C084FC" icon="📷" title="OCR scanner" desc="Point your camera at any medicine strip to add it in seconds." />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--ms-bord)] py-5 px-6 max-w-lg mx-auto w-full text-center">
        <p className="text-[11px] text-[var(--ms-txt3)] leading-relaxed mb-2">
          {MEDICAL_DISCLAIMER.footer}
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/disclaimer" className="text-xs text-[var(--ms-txt3)] underline">Medical disclaimer</Link>
          <Link href="/signup" className="text-xs text-[var(--ms-txt3)] underline">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 6v7c0 5.5 3.7 10.7 9 12 5.3-1.3 9-6.5 9-12V6L12 2z" fill="white" opacity="0.95" />
      <path d="M9 12l2.5 2.5 4.5-4.5" stroke="#4F8EFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureRow({ color, icon, title, desc }: { color: string; icon: string; title: string; desc: string }) {
  return (
    <div
      className="bg-[var(--ms-surf)] rounded-2xl p-[18px] border border-[var(--ms-bord)] flex items-start gap-[14px]"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <span className="text-[20px] leading-none flex-shrink-0">{icon}</span>
      <div>
        <div className="text-[15px] font-semibold text-[var(--ms-txt)] mb-[3px]">{title}</div>
        <div className="text-[13px] text-[var(--ms-txt2)] leading-[1.5]">{desc}</div>
      </div>
    </div>
  );
}
