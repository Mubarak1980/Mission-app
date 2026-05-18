const CACHE_NAME = "mission-cache-v174";

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

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        APP_SHELL.map(async (file) => {
          const res = await fetch(file, { cache: "reload" });
          if (res && res.ok) {
            await cache.put(file, res.clone());
          }
        })
      );
      return results;
    })
  );
});

// ACTIVATE
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

// FETCH (SAFE + SIMPLE + RELIABLE)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const network = await fetch(event.request);
        return network;
      } catch {
        const cached = await caches.match(event.request);
        return cached || caches.match(BASE + "index.html");
      }
    })()
  );
});

// UPDATE CONTROL
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
