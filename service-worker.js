// =========================
// SERVICE WORKER (FINAL PWA SAFE)
// =========================

"use strict";

const CACHE_NAME = "mission-cache-v13";

// =========================
// APP SHELL
// =========================
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",

  "./main.js",
  "./data.js",

  "./Study-tracker.js",
  "./Sunnah-tracker.js",
  "./dashboard.js",
  "./weekly-timetable.js",
  "./top-student-mode.js",

  "./manifest.json",

  "./icon-192.png",
  "./icon-512.png"
];

// =========================
// INSTALL
// =========================
self.addEventListener("install", (event) => {

  self.skipWaiting();

  event.waitUntil(
    (async () => {

      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(APP_SHELL);

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
// FETCH
// =========================
self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {

      const cached = await caches.match(event.request);

      if (cached) {
        return cached;
      }

      try {

        const network = await fetch(event.request);

        if (network && network.ok) {

          const cache = await caches.open(CACHE_NAME);

          cache.put(event.request, network.clone());
        }

        return network;

      } catch {

        // Offline fallback
        return caches.match("./index.html");
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
