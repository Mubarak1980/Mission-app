// =========================
// SERVICE WORKER (PRODUCTION SAFE)
// =========================

const CACHE_NAME = "mission-cache-v209";

// Use scope correctly
const BASE = self.registration.scope;

// Normalize app paths safely
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
  BASE + "icon-192.png",
  BASE + "icon-512.png",
  BASE + "manifest.json"
];

// =========================
// INSTALL
// =========================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.allSettled(
      APP_SHELL.map(async (file) => {
        try {
          const res = await fetch(file, { cache: "reload" });
          if (res && res.ok) {
            await cache.put(file, res.clone());
          }
        } catch (e) {
          // silent fail
        }
      })
    );
  })());
});

// =========================
// ACTIVATE
// =========================
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    );

    await self.clients.claim();
  })());
});

// =========================
// FETCH STRATEGY (SAFE SPA)
// =========================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  // =========================
  // NAVIGATION (FIXED)
  // =========================
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const network = await fetch(event.request);
        if (network && network.ok) return network;
      } catch (e) {}

      // FIX: always use scope-based index fallback
      const cached = await caches.match(BASE + "index.html");

      return cached || new Response(
        `<!DOCTYPE html><html><body><h3>Offline</h3></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    })());

    return;
  }

  // =========================
  // CACHE FIRST + UPDATE
  // =========================
  event.respondWith((async () => {
    const cached = await caches.match(event.request);

    try {
      const network = await fetch(event.request);

      if (network && network.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, network.clone());
      }

      return network;
    } catch (e) {
      return cached;
    }
  })());
});

// =========================
// UPDATE CONTROL
// =========================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
