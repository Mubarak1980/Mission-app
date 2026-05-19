const CACHE_NAME = "mission-cache-v185";

// 🔥 AUTO BASE (works anywhere: local, GitHub, server)
const BASE = self.location.pathname.replace("service-worker.js", "");

// Core files
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
// INSTALL (FAST + SAFE)
// =========================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // fallback if some files fail
        return Promise.allSettled(
          APP_SHELL.map((file) => cache.add(file))
        );
      })
    )
  );
});

// =========================
// ACTIVATE (CLEAN + STABLE)
// =========================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );

      await self.clients.claim();
    })()
  );
});

// =========================
// FETCH STRATEGIES
// =========================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const req = event.request;
  const url = new URL(req.url);

  // Ignore external requests
  if (url.origin !== location.origin) return;

  // =========================
  // NAVIGATION → NETWORK FIRST
  // =========================
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          return res;
        })
        .catch(() => caches.match(BASE + "index.html"))
    );
    return;
  }

  // =========================
  // STATIC FILES → CACHE FIRST
  // =========================
  if (
    req.destination === "style" ||
    req.destination === "script" ||
    req.destination === "image"
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, res.clone());
              return res;
            });
          })
        );
      })
    );
    return;
  }

  // =========================
  // DEFAULT → NETWORK FALLBACK CACHE
  // =========================
  event.respondWith(
    fetch(req)
      .then((res) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, res.clone());
          return res;
        });
      })
      .catch(() => caches.match(req))
  );
});

// =========================
// MANUAL UPDATE CONTROL
// =========================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
