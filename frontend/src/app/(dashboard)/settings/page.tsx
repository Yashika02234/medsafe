import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <Settings className="h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Notifications, account, and data preferences. Coming in Phase 6.
      </p>
    </div>
  );
}
