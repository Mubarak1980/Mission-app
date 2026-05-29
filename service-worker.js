"use strict";

// ==========================================================
// 🚀 ENTERPRISE PRODUCTION SERVICE WORKER (V21.0 - GITHUB FIXED)
// ==========================================================

const CACHE_NAME = "mission-cache-v64"; // Bumped version to force cache overwrite
const LOG_STYLE = "color: #00d4ff; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";
const WARN_STYLE = "color: #e5c158; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";

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

// Helper to reliably create absolute URLs matching how caches store them
function toAbsolute(url) {
  return new URL(url, self.location.origin + self.location.pathname).toString().replace(/\/index\.html$/, "/");
}

// ==========================================================
// 📦 1. INSTALLATION EVENT (Pre-Caching)
// ==========================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("%c[SW] Pre-caching core application shell bundle...", LOG_STYLE);
      
      // Map everything safely using our base pathname strategy
      const absoluteUrls = APP_SHELL.map(resource => {
        return new URL(resource, self.location.href).toString();
      });
      
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
// 📡 3. CACHE-FIRST ROUTER FETCH ENGINE
// ==========================================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  
  // Create a clean lookup URL path
  let lookupUrl = event.request.url;

  // 🎯 GITHUB SUBFOLDER MATCHING GUARANTEE
  // If the app is requesting the root domain, the folder path, or index.html, match it directly to our cached base index
  if (
    requestUrl.pathname === "/Mission-app" || 
    requestUrl.pathname === "/Mission-app/" || 
    requestUrl.pathname === "/Mission-app/index.html"
  ) {
    lookupUrl = new URL("./index.html", self.location.href).toString();
  }

  event.respondWith(
    caches.match(lookupUrl, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Instant load out of local hardware memory!
      }

      // If it isn't in the cache shell, try to pull it from the network dynamically
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch((err) => {
          console.log("%c[SW] System offline. Invoking clean structural fallbacks.", WARN_STYLE);
          
          // Absolute fallback rule: if everything else fails, return the index file directly to avoid the browser error screen
          return caches.match(new URL("./index.html", self.location.href).toString(), { ignoreSearch: true });
        });
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
            
