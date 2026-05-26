"use strict";

// ==========================================================
// 🚀 ENTERPRISE PRODUCTION SERVICE WORKER (V16.1)
// ==========================================================

const CACHE_NAME = "mission-cache-v19";
const LOG_STYLE = "color: #00d4ff; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";
const WARN_STYLE = "color: #e5c158; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";

// Core application runtime paths
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

// High-frequency script assets that require absolute fresh network state
const NETWORK_FIRST_ASSETS = [
  "dashboard.js",
  "main.js",
  "Study-tracker.js",
  "study-tracker.js"
];

function toAbsolute(url) {
  return new URL(url, self.location.origin).toString();
}

// ==========================================================
// 📦 1. INSTALLATION EVENT (Pre-Caching)
// ==========================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("%c[SW] Pre-caching core application shell bundle...", LOG_STYLE);
      
      const absoluteUrls = APP_SHELL.map(resource => toAbsolute(resource));
      
      return Promise.all(
        absoluteUrls.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
            console.warn(`%c[SW] Skipping missing asset path: ${url}`, WARN_STYLE);
          }).catch(err => console.error(`[SW] Fetch failed during installation for: ${url}`, err));
        })
      ).then(() => console.log("%c[SW] Initialization complete. PWA ready for production launch.", LOG_STYLE));
    })
  );
});

// ==========================================================
// 🧹 2. ACTIVATION EVENT (Cache Management)
// ==========================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`%c[SW] Disposing legacy obsolete cache store: ${key}`, WARN_STYLE);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ==========================================================
// 📡 3. INTELLIGENT ROUTER FETCH ENGINE
// ==========================================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const workerUrl = new URL(self.location.href);
  const workerDir = "/Mission-app/";

  // Normalize directory root routing to point directly to index.html
  let cacheKey = event.request;
  if (requestUrl.origin === workerUrl.origin && requestUrl.pathname === workerDir) {
    cacheKey = toAbsolute("/Mission-app/index.html");
  }

  const isNetworkFirstAsset = NETWORK_FIRST_ASSETS.some(asset => requestUrl.pathname.endsWith(asset));

  // Strategy A: Strict Network-First Route (For calculations and active logic scripts)
  if (isNetworkFirstAsset) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(cacheKey))
    );
    return;
  }

  // Strategy B: Stale-While-Revalidate Route (For static UI templates, layout sheets, images)
  event.respondWith(
    caches.match(cacheKey).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          if (requestUrl.origin === workerUrl.origin && requestUrl.pathname.startsWith(workerDir)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
        }
        return networkResponse;
      }).catch((err) => {
        console.log("%c[SW] System offline. Relying on active cache assets.", WARN_STYLE);
        if (event.request.mode === "navigate") {
          return caches.match(toAbsolute("/Mission-app/index.html"));
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// ==========================================================
// 💬 4. IPC COMMS INTER-PROCESS CHANNEL
// ==========================================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
              
