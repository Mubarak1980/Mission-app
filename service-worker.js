"use strict";

// ==========================================================
// 🚀 ENTERPRISE PRODUCTION SERVICE WORKER (V21.1 - MOBILITY LOCKED)
// ==========================================================

const CACHE_NAME = "mission-cache-v52"; 
const LOG_STYLE = "color: #00d4ff; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";
const WARN_STYLE = "color: #e5c158; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";

// Includes every file needed to ensure the app works offline
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./data.js",
  "./Storage-bridge.js", 
  "./Study-tracker.js", 
  "./Sunnah-tracker.js", 
  "./dashboard.js",
  "./weekly-timetable.js",
  "./top-student-mode.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

const BASE_URL_STR = new URL("./", self.location.href).toString();

// ==========================================================
// 📦 1. INSTALLATION EVENT (Pre-Caching)
// ==========================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("%c[SW] Pre-caching core application shell bundle...", LOG_STYLE);
      return Promise.all(
        APP_SHELL.map(resource => {
          const url = new URL(resource, BASE_URL_STR).toString();
          return fetch(url).then(response => {
            if (response.ok) return cache.put(url, response);
            console.warn(`%c[SW] Skipping missing asset: ${url}`, WARN_STYLE);
          });
        })
      );
    })
  );
});

// ==========================================================
// 🧹 2. ACTIVATION EVENT (Cleanup Old Versions)
// ==========================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`%c[SW] Disposing legacy cache: ${key}`, WARN_STYLE);
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
  let lookupUrl = event.request.url;

  // GitHub subfolder path normalization
  if (requestUrl.pathname.includes("/Mission-app")) {
    lookupUrl = new URL("./index.html", BASE_URL_STR).toString();
  }

  event.respondWith(
    caches.match(lookupUrl, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log("%c[SW] Offline mode: Falling back to index.html", WARN_STYLE);
          return caches.match(new URL("./index.html", BASE_URL_STR).toString(), { ignoreSearch: true });
        });
    })
  );
});
          
