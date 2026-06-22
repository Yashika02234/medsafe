// Minimal app-shell service worker — hand-rolled rather than next-pwa/Workbox,
// since this app's PWA needs are just "installable + opens offline-tolerant",
// not full runtime caching of API responses or hashed JS chunks.
const CACHE_NAME = "medsafe-shell-v1";
const SHELL_ASSETS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Pages that hold personal health data — never cached or served from a stale
// fallback, since a cache fallback bypasses the server's own auth redirect
// and could leak one user's cached page to whoever uses the device next.
const PROTECTED_PREFIXES = ["/dashboard", "/medicines", "/interactions", "/family", "/settings", "/scan"];

// Network-first for public-page navigations, falling back to the last cached
// version if the network is briefly unavailable. Protected pages and API
// calls always go straight to the network — never cached.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  const path = new URL(event.request.url).pathname;
  if (PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
