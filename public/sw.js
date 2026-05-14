self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Network-first, no caching for v1 — only needed to satisfy installability
self.addEventListener("fetch", () => {});
