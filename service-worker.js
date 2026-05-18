const CACHE_NAME = "mission-cache-v180";
const BASE = "/Mission-app/";

const APP_SHELL = [
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
// INSTALL (FIXED)
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
          } catch (err) {
            console.warn("Cache skip:", file);
          }
        })
      );

      // ✅ FIX: proper lifecycle control
      await self.skipWaiting();
    })()
  );
});

// =========================
// ACTIVATE (FIXED)
// =========================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      );

      await self.clients.claim();
    })()
  );
});

// =========================
// FETCH (ROBUST PWA STRATEGY)
// =========================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  // =========================
  // NAVIGATION (CRITICAL FIX)
  // =========================
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(event.request);
          if (network && network.ok) return network;
        } catch (e) {}

        const cached = await caches.match(BASE + "index.html");
        return cached || new Response("Offline", { status: 200 });
      })()
    );
    return;
  }

  // =========================
  // CACHE FIRST + UPDATE
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
// UPDATE CONTROL
// =========================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
