"use strict";

// ==========================================
// SERVICE WORKER (GITHUB PAGES & PWA OPTIMIZED)
// ==========================================

// FIX: ensure scope-safe path resolution on GitHub Pages
const BASE_PATH = self.registration?.scope || "./";

// Increment this version string whenever you change files
const CACHE_NAME = "mission-cache-v28";

// ==========================================
// STATIC APP SHELL
// ==========================================
const APP_SHELL = [
  "index.html",
  "styles.css",
  "main.js",
  "data.js",
  "Study-tracker.js",
  "Sunnah-tracker.js",
  "dashboard.js",
  "weekly-timetable.js",
  "top-student-mode.js",
  "manifest.json",
  "icon-192.png"
];

// ==========================================
// HELPER: normalize paths for GitHub Pages
// ==========================================
function toAbsolute(url) {
  return new URL(url, self.registration.scope).toString();
}

// ==========================================
// INSTALLATION
// ==========================================
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Activate worker immediately

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log("📦 Pre-caching application shell...");

      for (const resource of APP_SHELL) {
        try {
          await cache.add(toAbsolute(resource));
        } catch (error) {
          console.warn("⚠️ Cache failed:", resource, error);
        }
      }
    })()
  );
});

// ==========================================
// ACTIVATION
// ==========================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();
      // Notify clients that service worker is active and ready
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'SW_ACTIVATED' });
      }
    })()
  );
});

// ==========================================
// FETCH STRATEGY (IMPROVED SAFE OFFLINE)
// ==========================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        // 1. CACHE FIRST
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // 2. NETWORK
        const response = await fetch(event.request);

        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }

        return response;

      } catch (error) {
        console.log("🌐 Offline fallback triggered");

        // 3. FALLBACK
        const fallback = await caches.match(toAbsolute("index.html"));
        return fallback || new Response("Offline", { status: 200 });
      }
    })()
  );
});

// ==========================================
// MESSAGE HANDLER - For update notifications
// ==========================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Optional: handle other message types here
});
