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

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// "OFFLINE-FIRST" Strategy:
// This forces the app to look in the cache first, ensuring it works 
// instantly without an internet connection.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. If it's in the cache, serve it immediately
      if (cachedResponse) return cachedResponse;

      // 2. Otherwise, try the network
      return fetch(event.request).catch(() => {
        // 3. If network fails (offline), serve index.html for any navigation
        if (event.request.mode === 'navigate') {
          return caches.match("./index.html");
        }
      });
    })
  );
});
  
