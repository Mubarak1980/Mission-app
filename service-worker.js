// =========================
// SERVICE WORKER (FINAL - CHROME FRIENDLY)
// =========================

const CACHE_NAME = "mission-cache-v2";

// ✅ Always match actual deployed scope (GitHub Pages safe)
const BASE = self.registration.scope;

// ✅ App shell (core files)
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
          } catch (e) {
            // silent fail (safe)
          }
        })
      );

      // ✅ Proper lifecycle control
      await self.skipWaiting();
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

      // ✅ Take control immediately
      await self.clients.claim();
    })()
  );
});

// =========================
// FETCH (PWA SAFE STRATEGY)
// =========================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // ✅ Only handle same-origin
  if (url.origin !== location.origin) return;

  // =========================
  // NAVIGATION (CRITICAL FOR INSTALL)
  // =========================
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(event.request);

          if (network && network.ok) {
            return network;
          }
        } catch (e) {
          // ignore
        }

        // ✅ Always fallback to index (required for installability)
        const cached = await caches.match(BASE + "index.html");

        return (
          cached ||
          new Response(
            "<h1>Offline</h1>",
            { headers: { "Content-Type": "text/html" } }
          )
        );
      })()
    );
    return;
  }

  // =========================
  // STATIC FILES (CACHE FIRST + UPDATE)
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

        return network || cached;
      } catch (e) {
        return cached;
      }
    })()
  );
});

// =========================
// FORCE UPDATE CONTROL
// =========================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
