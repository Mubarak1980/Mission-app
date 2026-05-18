const CACHE_NAME = "mission-cache-v177";
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
// INSTALL
// =========================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL.map(async (file) => {
          try {
            const res = await fetch(file, { cache: "reload" });
            if (res.ok) {
              await cache.put(file, res.clone());
            }
          } catch (err) {
            console.warn("Cache skip:", file);
          }
        })
      );
    })
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
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      );

      await self.clients.claim();
    })()
  );
});

// =========================
// FETCH (PRODUCTION STRATEGY)
// =========================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ignore external requests
  if (url.origin !== location.origin) return;

  // NAVIGATION FIX (VERY IMPORTANT FOR PWA)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(BASE + "index.html");
      })
    );
    return;
  }

  // CACHE FIRST STRATEGY (STABLE)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((network) => {
          if (network && network.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, network.clone());
            });
          }
          return network;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
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
