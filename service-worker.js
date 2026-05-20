// =========================
// SERVICE WORKER (CHROME STABLE FINAL)
// =========================

const CACHE_NAME = "mission-cache-v5";

// ✅ FIX: lock base path (do NOT use scope dynamically)
const BASE = "/Mission-app/";

const APP_SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "styles.css",
  BASE + "main.js",
  BASE + "Study-tracker.js",
  BASE + "Sunnah-tracker.js",
  BASE + "dashboard.js",
  BASE + "weekly-timetable.js",
  BASE + "top-student-mode.js",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png"
];

// =========================
// INSTALL
// =========================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.allSettled(
        APP_SHELL.map(async (file) => {
          try {
            const res = await fetch(file, { cache: "reload" });
            if (res && res.ok) {
              await cache.put(file, res.clone());
            }
          } catch (e) {}
        })
      );
    })()
  );
});

// =========================
// ACTIVATE
// =========================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();
    })()
  );
});

// =========================
// FETCH (PWA SAFE)
// =========================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  // =========================
  // NAVIGATION FIX (CRITICAL)
  // =========================
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(event.request);
          if (network && network.ok) return network;
        } catch {}

        return caches.match(BASE + "index.html");
      })()
    );
    return;
  }

  // =========================
  // CACHE STRATEGY
  // =========================
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);

      try {
        const network = await fetch(event.request);

        if (network && network.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, network.clone());
        }

        return network;
      } catch {
        return cached;
      }
    })()
  );
});

// =========================
// FORCE UPDATE
// =========================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
