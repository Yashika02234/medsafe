import { AlertCircle } from "lucide-react";

export default function InteractionsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">Drug Interactions</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Interaction checks across your medicine cabinet. Coming in Phase 3.
      </p>
    </div>
  );
}
