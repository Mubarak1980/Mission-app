"use strict";

// ==========================================================
// SERVICE WORKER (ULTRA-RESILIENT CHROME PRODUCTION ENGINE V65)
// ==========================================================

const CACHE_NAME = "mission-cache-v14";

const APP_SHELL = [
  "/Mission-app/",
  "/Mission-app/index.html",
  "/Mission-app/styles.css",
  "/Mission-app/main.js",
  "/Mission-app/data.js",
  "/Mission-app/Study-tracker.js",
  "/Mission-app/study-tracker.js", // Added lowercase fallback mapping
  "/Mission-app/Sunnah-tracker.js",
  "/Mission-app/sunnah-tracker.js", // Added lowercase fallback mapping
  "/Mission-app/dashboard.js",
  "/Mission-app/weekly-timetable.js",
  "/Mission-app/top-student-mode.js",
  "/Mission-app/manifest.json",
  "/Mission-app/icon-192.png"
];

function toAbsolute(url) {
  return new URL(url, self.location.origin).toString();
}

// ==========================================================
// INSTALLATION (FAIL-SAFE OFFLINE VERIFICATION)
// ==========================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 SW: Pre-caching Core Application Shell Bundle...");
      
      const absoluteUrls = APP_SHELL.map(resource => toAbsolute(resource));
      
      // Use a resilient mapping technique to guarantee that a 404 filename typo 
      // does NOT block the rest of the PWA install criteria from qualifying
      return Promise.all(
        absoluteUrls.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
            console.warn(`⚠️ SW: Skipping missing asset path: ${url}`);
          }).catch(err => console.error(`❌ SW: Fetch failed for: ${url}`, err));
        })
      ).then(() => console.log("✅ SW: Production assets analyzed. PWA install ready."));
    })
  );
});

// ==========================================================
// ACTIVATION (CLEAN EXPIRED METRICS)
// ==========================================================
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

// ==========================================================
// FETCH REVENUE STRATEGY (CACHE-FIRST WITH NETWORK BACKUP)
// ==========================================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const workerUrl = new URL(self.location.href);
  const workerDir = "/Mission-app/";

  let cacheKey = event.request;
  if (requestUrl.origin === workerUrl.origin && requestUrl.pathname === workerDir) {
    cacheKey = toAbsolute("/Mission-app/index.html");
  }

  event.respondWith(
    caches.match(cacheKey).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        if (requestUrl.origin === workerUrl.origin && requestUrl.pathname.startsWith(workerDir)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
        console.log("🌐 SW: Fetch fallback triggered ->", err);

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
