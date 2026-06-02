"use strict";

// ==========================================================
// 🚀 MISSION APP PWA SERVICE WORKER (v69)
// ==========================================================

const CACHE_NAME = "mission-cache-v7";
const BASE_URL = new URL("./", self.location.href).toString();

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

// ===============================
// INSTALL (PRE-CACHE CORE APP)
// ===============================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const file of APP_SHELL) {
        try {
          const url = new URL(file, BASE_URL).toString();
          const res = await fetch(url, { cache: "reload" });

          if (res.ok) {
            await cache.put(url, res.clone());
          }
        } catch (e) {
          console.warn("SW: Failed to cache", file);
        }
      }
    })
  );
});

// ===============================
// ACTIVATE (CLEAN OLD CACHE)
// ===============================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ===============================
// FETCH STRATEGY (OFFLINE-FIRST)
// ===============================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(new URL("./index.html", BASE_URL).toString());
        });
    })
  );
});
