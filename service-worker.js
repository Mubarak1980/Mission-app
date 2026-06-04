"use strict";

const CACHE_NAME = "mission-cache-v26";
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
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Adding all assets. We do not use catch here because we want 
      // the installation to fail if the network is so bad the app is broken.
      return cache.addAll(APP_SHELL);
    })
  );
});

// ACTIVATE: Purge old caches to keep the app clean.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// FETCH: Serve from cache, fallback to network, fallback to index.html for navigation
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Return cached version immediately if found
      if (cachedResponse) return cachedResponse;

      // 2. Otherwise, fetch from network
      return fetch(event.request).catch(() => {
        // 3. If offline and navigating, return the shell
        if (event.request.mode === 'navigate') {
          return caches.match("./index.html");
        }
      });
    })
  );
});
                                     
