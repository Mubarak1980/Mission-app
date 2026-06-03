"use strict";

const CACHE_NAME = "mission-cache-v19";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./Study-tracker.js",
  "./SmartEngine.js",
  "./dashboard.js",
  "./weekly-timetable.js",
  "./top-student-mode.js",
  "./Sunnah-tracker.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// INSTALL: Force-cache the entire shell immediately.
// If any file in APP_SHELL fails to download, the service worker will not install,
// preventing the app from entering a 'broken' half-cached state.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: Immediately claim all clients and purge old cache versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// FETCH: "Offline-First" Strategy for Native Feel.
// This serves cached files instantly, bypassing the network entirely for speed.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Serve from cache if available (Native-speed performance)
      if (cachedResponse) return cachedResponse;

      // 2. Fetch from network only if not in cache
      return fetch(event.request).catch(() => {
        // 3. Fallback: If offline and navigating, serve the main entry point
        if (event.request.mode === 'navigate') {
          return caches.match("./index.html");
        }
      });
    })
  );
});
          
