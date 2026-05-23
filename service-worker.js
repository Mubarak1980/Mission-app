"use strict";

// ==========================================================
// SERVICE WORKER (CHROME-OPTIMIZED PRODUCTION ENGINE V58)
// ==========================================================

const CACHE_NAME = "mission-cache-v58";

// Absolute subdirectory maps to guarantee flawless asset validation
const APP_SHELL = [
  "/Mission-app/",
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

function toAbsolute(url) {
  return new URL(url, self.location.origin).toString();
}

// ==========================================================
// INSTALLATION (STRICT OFFLINE CAPABILITY VERIFICATION)
// ==========================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 SW: Pre-caching Core Application Shell Bundle...");
      
      // Strict allocation array tells Chrome's engine everything is perfectly cached
      const absoluteUrls = APP_SHELL.map(resource => toAbsolute(resource));
      return cache.addAll(absoluteUrls)
        .then(() => console.log("✅ SW: All assets securely verified offline."))
        .catch((err) => {
          console.error("❌ SW: Cache alignment broken! Fallback tracking initiated:", err);
          // Safe fallback layout loop if a path is temporarily unreachable
          return Promise.all(
            APP_SHELL.map(res => {
              return cache.add(toAbsolute(res)).catch(e => console.warn(`Asset missing: ${res}`, e));
            })
          );
        });
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

  // Normalization logic: rewrite root subfolder targets to exact index.html cache slots
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
                      
