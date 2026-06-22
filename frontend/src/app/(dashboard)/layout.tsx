import { BottomNav } from "@/components/shared/BottomNav";
import { OnboardingFlow } from "@/components/shared/OnboardingFlow";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ms-bg)]">
      {/* pb-[82px] clears the fixed 82px bottom nav */}
      <main className="max-w-lg mx-auto pb-[82px] print:pb-0">
        {children}

        <footer className="print:hidden px-5 py-4 mt-4 border-t border-[var(--ms-bord)]">
          <p className="text-[11px] text-[var(--ms-txt3)] text-center leading-relaxed">
            {MEDICAL_DISCLAIMER.footer}
          </p>
        </footer>
      </main>

      <BottomNav />
      <OnboardingFlow />
    </div>
  );
}
