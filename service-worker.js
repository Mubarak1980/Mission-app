"use strict";

// ==========================================================
// SERVICE WORKER (NETWORK-FIRST ENGINE FOR FREQUENT UPDATES)
// ==========================================================

const CACHE_NAME = "mission-cache-v16";

const APP_SHELL = [
  "/Mission-app/",
  "/Mission-app/index.html",
  "/Mission-app/styles.css",
  "/Mission-app/main.js",
  "/Mission-app/data.js",
  "/Mission-app/Study-tracker.js",
  "/Mission-app/study-tracker.js", 
  "/Mission-app/Sunnah-tracker.js",
  "/Mission-app/sunnah-tracker.js", 
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
// FETCH STRATEGY: DYNAMIC NETWORK-FIRST WITH CACHE FALLBACK
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

  // FORCE NETWORK-FIRST: Always check for fresh live changes first!
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, update our persistent cache store dynamically
        if (networkResponse && networkResponse.status === 200) {
          if (requestUrl.origin === workerUrl.origin && requestUrl.pathname.startsWith(workerDir)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return networkResponse;
      })
      .catch((err) => {
        console.log("🌐 SW: Network down or checking updates, querying local system repository storage ->", err);
        
        // Offline Fallback: If network is broken, look up the cache key
        return caches.match(cacheKey).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // If the resource isn't cached and we are navigating, fall back cleanly to index.html
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
    
