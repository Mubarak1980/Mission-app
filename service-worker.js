"use strict";

const CACHE_NAME = "mission-v46"; // Increment this whenever you update your code!

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
  "./icon-192.png"
];

// Install: Cache shell
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

// Activate: Cleanup old versions
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate strategy
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(e.request);
      
      // Fetch fresh version in background
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          cache.put(e.request, networkResponse.clone());
        }
        return networkResponse;
      });

      // Return cache immediately (fast), or wait for network (if offline)
      return cachedResponse || fetchPromise;
    })
  );
});
                                 
