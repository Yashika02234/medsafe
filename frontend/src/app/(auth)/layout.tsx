import { MEDICAL_DISCLAIMER } from "@/lib/legal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">{MEDICAL_DISCLAIMER.footer}</p>
      </footer>
    </div>
  );
}
