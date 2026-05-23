"use strict";

// ==========================================
// SERVICE WORKER (PWA STRUCTURAL REFACTOR V39)
// ==========================================

const CACHE_NAME = "mission-cache-v42";

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
  "icon-192.png" // Cleaned up to match your repository's exact files
];

// ==========================================
// HELPER (DYNAMIC PATH SAFE RESOLUTION)
// ==========================================
function toAbsolute(url) {
  // Use self.location.href to guarantee precise subfolder inheritance under GitHub Pages
  return new URL(url, self.location.href).toString();
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

      // Execute cache allocations sequentially to trace exact files
      for (const resource of APP_SHELL) {
        const targetUrl = toAbsolute(resource);
        try {
          await cache.add(targetUrl);
          console.log(`✅ Cached: ${resource}`);
        } catch (error) {
          console.warn(`⚠️ Cache failed for asset: ${resource} [Resolved: ${targetUrl}] ->`, error.message || error);
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

      // Notify window frames safely
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "SW_ACTIVATED" });
      }
    })()
  );
});

// ==========================================
// FETCH STRATEGY
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
          const requestUrl = new URL(event.request.url);
          const workerLocation = new URL(self.location.href);

          // Restrict mapping exclusively to our subfolder space
          if (requestUrl.origin === workerLocation.origin && requestUrl.pathname.startsWith(workerLocation.pathname.replace(/[^\/]*$/, ""))) {
            cache.put(event.request, response.clone());
          }
        }

        return response;
      } catch (error) {
        console.log("🌐 Offline fallback triggered");

        const fallbackTarget = toAbsolute("index.html");
        const match = await caches.match(fallbackTarget);
        if (match) return match;

        return new Response("Offline Mode Active", {
          status: 200,
          headers: { "Content-Type": "text/plain" }
        });
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
      
