import { BottomNav } from "@/components/shared/BottomNav";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* pb-16 = clear the fixed bottom nav (h-16) */}
      <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {children}

        <footer className="mt-12 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {MEDICAL_DISCLAIMER.footer}
          </p>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}
