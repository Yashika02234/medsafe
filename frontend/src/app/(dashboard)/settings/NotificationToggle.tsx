"use client";

import { useState } from "react";

export function NotificationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const res = await fetch("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_preference: next ? "email" : "none" }),
      });
      const data = await res.json();
      if (!data.success) setEnabled(!next);
    } catch {
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-[14px] text-[var(--ms-txt)]">Email notifications</p>
        <p className="text-[12px] text-[var(--ms-txt3)] mt-0.5">
          Expiry reminders at 30, 7, and 1 day(s) before
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        aria-pressed={enabled}
        aria-label="Toggle email notifications"
        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors disabled:opacity-50 ${
          enabled ? "bg-[var(--ms-acc)]" : "bg-[var(--ms-surf2)]"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
