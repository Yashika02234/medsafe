import { redirect } from "next/navigation";
import { Pill, AlertCircle, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const firstName = (user.user_metadata?.name as string | undefined)
    ?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your medicine cabinet at a glance
        </p>
      </div>

      {/* Summary cards — populated in Phase 2 */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          title="In cabinet"
          value="—"
          icon={Pill}
          description="medicines tracked"
        />
        <SummaryCard
          title="Expiring soon"
          value="—"
          icon={Clock}
          description="within 30 days"
        />
        <SummaryCard
          title="Interactions"
          value="—"
          icon={AlertCircle}
          description="flagged pairs"
          className="col-span-2"
        />
      </div>

      {/* Primary CTA */}
      <Button className="w-full gap-2" disabled>
        <Plus className="h-4 w-4" aria-hidden />
        Add medicine
        <span className="text-xs opacity-60 ml-1">(Phase 2)</span>
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Medicine tracking and interaction checks are coming in the next phase.
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </CardContent>
    </Card>
  );
}
