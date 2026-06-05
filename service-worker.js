"use strict";

const CACHE_NAME = "mission-v47";

const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/main.js",
  "/Study-tracker.js",
  "/SmartEngine.js",
  "/dashboard.js",
  "/weekly-timetable.js",
  "/top-student-mode.js",
  "/Sunnah-tracker.js",
  "/manifest.json",
  "/icon-192.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // 1. Navigation fallback for SPA
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match("/"));
    return;
  }

  // 2. Network-first strategy for dynamic performance
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        return networkResponse;
      })
      .catch(() => caches.match(e.request)) // Fallback to cache if offline
  );
});
        
