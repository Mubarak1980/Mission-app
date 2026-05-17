const CACHE_NAME = 'mission-cache-v195';

// ============================
// CORE APP SHELL
// ============================
const APP_SHELL = [
  './index.html',
  './styles.css',
  './main.js',
  './Study-tracker.js',
  './Sunnah-tracker.js',
  './dashboard.js',
  './weekly-timetable.js',
  './top-student-mode.js',
  './manifest.json',
  './icon-192.png'
];

// ============================
// INSTALL (CHROME SAFE)
// ============================
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);

      await Promise.allSettled(
        APP_SHELL.map(async (file) => {
          try {
            const res = await fetch(file, {
              cache: "reload",
              credentials: "same-origin"
            });

            // IMPORTANT FIX: ensure valid response before caching
            if (!res || !res.ok) return;

            await cache.put(file, res.clone());

          } catch (err) {
            // silent fail is OK for install phase
          }
        })
      );

    } catch (e) {
      console.error("Install failed:", e);
    }

    self.skipWaiting();
  })());
});

// ============================
// ACTIVATE
// ============================
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();

      const clients = await self.clients.matchAll();
      clients.forEach(client =>
        client.postMessage({ type: "SW_READY" })
      );

    } catch (err) {
      console.error("Activate error:", err);
    }
  })());
});

// ============================
// FETCH (CHROME SAFE + STABLE)
// ============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;

  // ============================
  // NAVIGATION (PWA FIX CRITICAL)
  // ============================
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(request);
        return network;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match('./index.html') ||
          new Response("<h1>Offline</h1>", {
            headers: { "Content-Type": "text/html" }
          });
      }
    })());

    return;
  }

  // ============================
  // CACHE FIRST (SAFE FALLBACK)
  // ============================
  event.respondWith((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      try {
        const network = await fetch(request);

        if (network && network.ok) {
          cache.put(request, network.clone());
          return network;
        }

        return cached || network;

      } catch {
        return cached;
      }

    } catch {
      return fetch(request);
    }
  })());
});

// ============================
// UPDATE CONTROL
// ============================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
