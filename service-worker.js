"use strict";

const CACHE_NAME = "mission-cache-v20";
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

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll, but ensure the paths are relative to the service worker location
      return cache.addAll(APP_SHELL).catch(err => {
        console.error("Failed to cache shell:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version or fetch from network
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match("./index.html");
        }
      });
    })
  );
});
                       
