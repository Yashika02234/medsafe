import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  Bell,
  Users,
  Pill,
  Search,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <header className="border-b px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="font-semibold text-lg tracking-tight">MedSafe</span>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-16 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance leading-tight">
            Track your medicines.{" "}
            <span className="text-muted-foreground">
              Avoid dangerous interactions.
            </span>
          </h1>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg text-balance">
            Free for Indian households. Works with Indian brand names like
            Crocin, Dolo, and Thyronorm.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Get started free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Sign in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-12 bg-muted/40">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">
              Everything your family medicine cabinet needs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard
                icon={Clock}
                title="Expiry tracking"
                description="Add medicines once. We track expiry dates so you never consume an expired medicine again."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Drug interaction checker"
                description="Checks all medicines in your cabinet against each other. Flags severe, moderate, and mild interactions."
              />
              <FeatureCard
                icon={Bell}
                title="Expiry alerts"
                description="Email reminders at 30 days, 7 days, and on expiry day — so you can restock in time."
              />
              <FeatureCard
                icon={Users}
                title="Family mode"
                description="One account for your whole family. Manage separate medicine cabinets for parents, spouse, and children."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-8">
            How it works
          </h2>
          <ol className="space-y-6">
            <Step
              number={1}
              icon={Pill}
              title="Add your medicines"
              description="Type the name of any Indian brand (Glycomet, Thyronorm, Ecosprin) and MedSafe looks up the generic salt and RxCUI automatically."
            />
            <Step
              number={2}
              icon={Search}
              title="Get an instant interaction check"
              description="Every time you add a medicine, MedSafe checks it against everything else in your cabinet using the NIH drug database."
            />
            <Step
              number={3}
              icon={Bell}
              title="Receive expiry alerts"
              description="We send you email reminders before your medicines expire — no app required, no login needed to act on them."
            />
          </ol>
          <div className="mt-10 text-center">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Start for free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-3 text-center">
          <p className="text-xs text-muted-foreground">
            {MEDICAL_DISCLAIMER.footer}
          </p>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link href="/signup" className="hover:underline">
              Sign up
            </Link>
            <Link href="/login" className="hover:underline">
              Sign in
            </Link>
            <Link href="/disclaimer" className="hover:underline">
              Medical disclaimer
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MedSafe — built for Indian households
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex-none flex flex-col items-center">
        <div className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold">
          {number}
        </div>
      </div>
      <div className="space-y-1 pt-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </li>
  );
}
