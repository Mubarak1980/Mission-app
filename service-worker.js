"use strict";

const CACHE_NAME = "mission-cache-v12";
const BASE_URL = self.location.origin + self.location.pathname.replace(/\/[^\/]*$/, "/");

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

// INSTALL: Using addAll is safer for atomicity
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll is cleaner; if one fails, the installation fails (prevents partial broken state)
      return cache.addAll(APP_SHELL);
    })
  );
});

// ACTIVATE: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// FETCH: Strategy - Cache First, Network Fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Return cached if found
      if (cachedResponse) return cachedResponse;

      // 2. Otherwise, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache new successful requests
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // 3. Fallback to index.html for navigation requests (SPA)
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
              
