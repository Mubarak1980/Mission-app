"use strict";

const CACHE_NAME = "mission-cache-v16"; // Incremented version
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./Study-tracker.js",
  "./Sunnah-tracker.js",
  "./dashboard.js",
  "./weekly-timetable.js",
  "./top-student-mode.js",
  "./SmartEngine.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// INSTALL: Force immediate registration and caching
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// ACTIVATE: Remove old caches to prevent conflicts
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// FETCH: Network-First for logic, Cache-First for static assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. NETWORK-FIRST for JS/Data: Ensures your latest logic always runs
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // 2. CACHE-FIRST for CSS/Images/Icons: Faster performance
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
