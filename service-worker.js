// ==========================================
// SERVICE WORKER (GITHUB PAGES & PWA OPTIMIZED)
// ==========================================

"use strict";

// Increment this version string whenever you change your HTML, CSS, or JS files
const CACHE_NAME = "mission-cache-v18";

// ==========================================
// STATIC APP SHELL (Cleaned for subfolders)
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
  "icon-192.png"
];

// ==========================================
// SERVICE WORKER INSTALLATION
// ==========================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log("📦 Pre-caching application shell...");
      
      // Resilient caching loop so a missing icon doesn't crash the entire installation
      for (const resource of APP_SHELL) {
        try {
          await cache.add(resource);
        } catch (error) {
          console.warn(`⚠️ Failed to cache asset: ${resource}. Check if file exists in repo.`, error);
        }
      }
    })()
  );
});

// ==========================================
// LIFECYCLE ACTIVATION (CACHE PURGE)
// ==========================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`🧹 Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// ==========================================
// DYNAMIC NETWORK/CACHE STRATEGY
// ==========================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      // 1. Check cache for matching resource
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Fallback to network fetch if not cached
      try {
        const networkResponse = await fetch(event.request);

        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          // Safely store new assets dynamically as they are discovered
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        console.log("🌐 Network request failed, attempting offline fallback...", error);
        
        // 3. Complete offline structural fallback
        return caches.match("index.html");
      }
    })()
  );
});

// ==========================================
// REVOLVING COMPATIBILITY LIFE CYCLE MESSAGES
// ==========================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
