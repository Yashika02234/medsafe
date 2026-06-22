"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Dev-mode registration is a known footgun: the SW intercepts navigations
    // and can interfere with Next.js's hot-reload / serve stale dev bundles,
    // making the app feel slow or frozen. Production builds only.
    if (process.env.NODE_ENV !== "production") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability degrades gracefully — the app still works as a
        // regular tab, it just won't be installable/offline-tolerant.
      });
    }
  }, []);

  return null;
}
