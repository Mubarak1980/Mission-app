"use strict";

// ==========================================
// SERVICE WORKER (ULTRA-STABLE PWA ENGINE V42)
// ==========================================

const CACHE_NAME = "mission-cache-v45";

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

// Clean path resolution helper targeting the exact subfolder
function toAbsolute(url) {
  return new URL(url, self.location.href).toString();
}

// ==========================================
// INSTALLATION (PRE-CACHE INSTANT SHELL)
// ==========================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 SW: Pre-caching Core Application Shell Bundle...");
      
      // Use Promise.allSettled to guarantee that one minor asset failing 
      // does not crash the entire PWA install engine lifecycle
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
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        // Optimized Scope Bound Verification Engine
        const requestUrl = new URL(event.request.url);
        const workerUrl = new URL(self.location.href);
        
        // Remove file names to establish exact structural directory boundary path rule mappings
        const workerDir = workerUrl.pathname.substring(0, workerUrl.pathname.lastIndexOf("/") + 1);

        if (requestUrl.origin === workerUrl.origin && requestUrl.pathname.startsWith(workerDir)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
        console.log("🌐 SW: Fetch fallback routing triggered ->", err);

        // Serve index.html as fallback asset for missing app shell parts
        if (event.request.mode === "navigate") {
          return caches.match(toAbsolute("index.html"));
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
  
