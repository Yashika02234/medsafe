import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";

export const metadata = {
  title: "Medical Disclaimer — MedSafe",
};

export default function DisclaimerPage() {
  const { title, intro, source, limits, whatToDo, footer } =
    MEDICAL_DISCLAIMER.full;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 gap-1")}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{intro}</p>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold">Source of information</h2>
          <p className="text-sm text-muted-foreground">{source}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Limitations</h2>
          <ul className="space-y-2">
            {limits.map((limit, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span aria-hidden className="mt-0.5 flex-none">
                  •
                </span>
                {limit}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">What to do</h2>
          <ul className="space-y-2">
            {whatToDo.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span aria-hidden className="mt-0.5 flex-none">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-muted-foreground border-t pt-6">{footer}</p>
      </div>
    </div>
  );
}
