"use strict";

// ==========================================================
// 🚀 ENTERPRISE PRODUCTION SERVICE WORKER (V16.8 - PARAMETER LOCK)
// ==========================================================

const CACHE_NAME = "mission-cache-v40";
const LOG_STYLE = "color: #00d4ff; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";
const WARN_STYLE = "color: #e5c158; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";

// 📘 HARMONIZED RELATIVE PATH MATRIX
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

const NETWORK_FIRST_ASSETS = [
  "dashboard.js",
  "main.js",
  "data.js",
  "Study-tracker.js",
  "weekly-timetable.js",
  "top-student-mode.js",
  "Sunnah-tracker.js"
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
  
  let cacheKey = event.request;
  const currentPath = requestUrl.pathname;
  
  // ⚡ FIX: Matches the root structure and forces the cache lookup to ignore query strings completely
  if (requestUrl.origin === workerUrl.origin) {
    if (
      currentPath.endsWith("/Mission-app/") || 
      currentPath.endsWith("/Mission-app/index.html") || 
      currentPath === "/" || 
      currentPath === "/index.html"
    ) {
      cacheKey = toAbsolute("./index.html");
    }
  }

  const isNetworkFirstAsset = NETWORK_FIRST_ASSETS.some(asset => requestUrl.pathname.endsWith(asset));

  // Strategy A: Robust Network-First with Direct Self-Fallback
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
        .catch(() => {
          // Fall back gracefully to cache, explicitly ignoring the search parameters
          return caches.match(cacheKey, { ignoreSearch: true }).then((matchedResponse) => {
            return matchedResponse || caches.match(event.request, { ignoreSearch: true });
          });
        })
    );
    return;
  }

  // Strategy B: Stale-While-Revalidate Route with Search Parameter Safeguards
  event.respondWith(
    caches.match(cacheKey, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          if (requestUrl.origin === workerUrl.origin) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
        }
        return networkResponse;
      }).catch((err) => {
        console.log("%c[SW] System offline. Relying on active cache assets.", WARN_STYLE);
        if (event.request.mode === "navigate") {
          return caches.match(toAbsolute("./index.html"), { ignoreSearch: true });
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
        
