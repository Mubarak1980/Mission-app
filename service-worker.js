"use strict";

const CACHE_NAME = "mission-cache-v17";
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

// INSTALL: Force immediate registration and caching of all shell assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// ACTIVATE: Clean up any old caches to prevent conflicts and ensure version control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// FETCH: Logic-aware request handling
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. NETWORK-FIRST for JS: Guarantees your latest logic/safety gates are always pulled from GitHub
  if (url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // 2. CACHE-FIRST for Assets: Faster loading for CSS, icons, and static images
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
