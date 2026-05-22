"use strict";

// ==========================================
// SERVICE WORKER (GITHUB PAGES & PWA OPTIMIZED)
// ==========================================

const CACHE_NAME = "mission-cache-v29"; // 🔥 bumped for update safety

const BASE_PATH = self.registration?.scope || "./";

// ==========================================
// STATIC APP SHELL
// ==========================================
const APP_SHELL = [
  "index.html",
  "styles.css",
  "main.js",
  "data.js",
  "Study-tracker.js",
  "Sunnah-tracker.js",
  "dashboard.js",
  "weekly-timetable.js",
  "top-student-mode.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png" // 🔥 added (important for install validation)
];

// ==========================================
// HELPER
// ==========================================
function toAbsolute(url) {
  return new URL(url, self.registration.scope).toString();
}

// ==========================================
// INSTALL
// ==========================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log("📦 Pre-caching application shell...");

      for (const resource of APP_SHELL) {
        try {
          await cache.add(toAbsolute(resource));
        } catch (error) {
          console.warn("⚠️ Cache failed:", resource, error);
        }
      }
    })()
  );
});

// ==========================================
// ACTIVATE
// ==========================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();

      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "SW_ACTIVATED" });
      }
    })()
  );
});

// ==========================================
// FETCH
// ==========================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);

        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }

        return response;
      } catch (error) {
        console.log("🌐 Offline fallback triggered");

        return (
          (await caches.match(toAbsolute("index.html"))) ||
          new Response("Offline", { status: 200 })
        );
      }
    })()
  );
});

// ==========================================
// MESSAGE
// ==========================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
