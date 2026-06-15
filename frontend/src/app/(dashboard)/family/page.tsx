import { Users } from "lucide-react";

export default function FamilyPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <Users className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">Family Mode</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Manage medicine cabinets for your whole family. Coming in Phase 6.
      </p>
    </div>
  );
}
