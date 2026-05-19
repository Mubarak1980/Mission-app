// =========================
// SERVICE WORKER (STABLE VERSION)
// =========================

const CACHE_NAME = "mission-cache-v204";

// safer BASE handling (works even if hosted at root)
const BASE = self.registration.scope;

const APP_SHELL = [
  "./",
  "index.html",
  "styles.css",
  "main.js",
  "Study-tracker.js",
  "Sunnah-tracker.js",
  "dashboard.js",
  "weekly-timetable.js",
  "top-student-mode.js",
  "icon-192.png",
  "icon-512.png",
  "manifest.json"
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
          // offline-safe silent fail
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
// FETCH STRATEGY
// =========================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  // =========================
  // NAVIGATION (APP SHELL)
  // =========================
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const network = await fetch(event.request);
        if (network && network.ok) return network;
      } catch (e) {}

      const cached = await caches.match("index.html");
      return cached || new Response("Offline", { status: 200 });
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
