const CACHE_NAME = "kooqs-v2";
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/logo.jpeg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
  "/favicon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET" || !request.url.startsWith("http")) return;

  const url = new URL(request.url);

  // API responses — always network, never cache
  if (url.pathname.startsWith("/api/")) return;

  // Immutable static assets — cache first, then network
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|woff2?|ico)$/)
  ) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
            return res;
          })
      )
    );
    return;
  }

  // Cloudinary images — stale-while-revalidate
  if (url.hostname === "res.cloudinary.com") {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request).then((res) => {
          cache.put(request, res.clone());
          return res;
        });
        return cached ?? fresh;
      })
    );
    return;
  }

  // HTML navigation — network first, fall back to cached shell
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match("/"))
    );
  }
});
