"use strict";

// ==========================================================
// 🚀 ENTERPRISE PRODUCTION SERVICE WORKER (V21.2 - STABILITY UPGRADE)
// ==========================================================

const CACHE_NAME = "mission-cache-v2";

const LOG_STYLE =
  "color: #00d4ff; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";
const WARN_STYLE =
  "color: #e5c158; font-weight: bold; background: #0b0f14; padding: 2px 6px; border-radius: 4px;";

// Includes every file needed to ensure the app works offline
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./data.js",
  "./Storage-bridge.js",
  "./Study-tracker.js",
  "./Sunnah-tracker.js",
  "./dashboard.js",
  "./weekly-timetable.js",
  "./top-student-mode.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

const BASE_URL_STR = new URL("./", self.location.href).toString();

// ==========================================================
// 📦 1. INSTALLATION EVENT (Pre-Caching - SAFE VERSION)
// ==========================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        console.log("%c[SW] Pre-caching core application shell...", LOG_STYLE);

        for (const resource of APP_SHELL) {
          try {
            const url = new URL(resource, BASE_URL_STR).toString();
            const response = await fetch(url, { cache: "reload" });

            if (response && response.ok) {
              await cache.put(url, response.clone());
            } else {
              console.warn(`%c[SW] Missing asset skipped: ${url}`, WARN_STYLE);
            }
          } catch (err) {
            console.warn(`%c[SW] Failed to cache: ${resource}`, WARN_STYLE);
          }
        }
      } catch (e) {
        console.error("[SW] Install failed:", e);
      }
    })()
  );
});

// ==========================================================
// 🧹 2. ACTIVATION EVENT (CACHE CLEANUP)
// ==========================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`%c[SW] Removing old cache: ${key}`, WARN_STYLE);
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();
      console.log("%c[SW] Activated successfully", LOG_STYLE);
    })()
  );
});

// ==========================================================
// 📡 3. FETCH STRATEGY (CACHE FIRST + NETWORK FALLBACK)
// ==========================================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  let lookupUrl = event.request.url;

  // GitHub / subfolder support
  if (requestUrl.pathname.includes("/Mission-app")) {
    lookupUrl = new URL("./index.html", BASE_URL_STR).toString();
  }

  event.respondWith(
    (async () => {
      try {
        const cached = await caches.match(lookupUrl, { ignoreSearch: true });
        if (cached) return cached;

        const networkResponse = await fetch(event.request);

        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (err) {
        console.log("%c[SW] Offline fallback activated", WARN_STYLE);

        return caches.match(
          new URL("./index.html", BASE_URL_STR).toString(),
          { ignoreSearch: true }
        );
      }
    })()
  );
});
