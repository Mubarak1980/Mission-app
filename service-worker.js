"use strict";

// ==========================================================
// SERVICE WORKER (FINAL STRUCTURAL SUBFOLDER RECTIFICATION)
// ==========================================================

const CACHE_NAME = "mission-cache-v57";

const APP_SHELL = [
  "/Mission-app/index.html",
  "/Mission-app/styles.css",
  "/Mission-app/main.js",
  "/Mission-app/data.js",
  "/Mission-app/Study-tracker.js",
  "/Mission-app/Sunnah-tracker.js",
  "/Mission-app/dashboard.js",
  "/Mission-app/weekly-timetable.js",
  "/Mission-app/top-student-mode.js",
  "/Mission-app/manifest.json",
  "/Mission-app/icon-192.png"
];

// Clean path resolution to match self.location.origin directly
function toAbsolute(url) {
  return new URL(url, self.location.origin).toString();
}

// ==========================================
// INSTALLATION (PRE-CACHE INSTANT SHELL)
// ==========================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 SW: Pre-caching Core Application Shell Bundle...");
      
      return Promise.allSettled(
        APP_SHELL.map((resource) => {
          const absoluteUrl = toAbsolute(resource);
          return cache.add(absoluteUrl)
            .then(() => console.log(`✅ SW: Cached asset successfully: ${resource}`))
            .catch((err) => console.warn(`⚠️ SW: Cache failed for asset: ${resource} [Resolved: ${absoluteUrl}] ->`, err));
        })
      );
    })
  );
});

// ==========================================
// ACTIVATION (CLEAN EXPIRED ENTRIES)
// ==========================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 SW: Disposing old obsolete cache store:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ==========================================
// FETCH REVENUE STRATEGY (CACHE FIRST)
// ==========================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const requestUrl = new URL(event.request.url);
        const workerUrl = new URL(self.location.href);
        const workerDir = "/Mission-app/";

        // Explicitly isolate caching to matching origins and directory subfolders
        if (requestUrl.origin === workerUrl.origin && requestUrl.pathname.startsWith(workerDir)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
        console.log("🌐 SW: Fetch fallback routing triggered ->", err);

        // Fix: Ensure the string parsed into caches.match completely mirrors your APP_SHELL item
        if (event.request.mode === "navigate") {
          return caches.match(toAbsolute("/Mission-app/index.html"));
        }
        
        return new Response("Offline Content Unavailable", {
          status: 503,
          headers: { "Content-Type": "text/plain" }
        });
      });
    })
  );
});

// ==========================================
// INTER-PROCESS COMMUNICATION CORRIDOR
// ==========================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
    
