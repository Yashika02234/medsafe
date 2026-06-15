import { Pill } from "lucide-react";

export default function MedicinesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <Pill className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">Medicine Cabinet</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Add and track your medicines here. Coming in Phase 2.
      </p>
    </div>
  );
}
