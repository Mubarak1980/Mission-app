const CACHE_NAME = 'mission-cache-v201';

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
// INSTALL
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

            // FIX: strict validation for Chrome cache safety
            if (!res || res.status !== 200) return;

            await cache.put(file, res.clone());

          } catch {}
        })
      );

    } catch (err) {
      console.error("SW install error:", err);
    }

    // IMPORTANT: immediate activation
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
      clients.forEach(client => {
        client.postMessage({ type: "SW_READY" });
      });

    } catch (err) {
      console.error("SW activate error:", err);
    }
  })());
});

// ============================
// FETCH
// ============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;

  // ============================
  // NAVIGATION (CRITICAL FIX)
  // ============================
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(request);
        return network;
      } catch {
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
  // CACHE FIRST STRATEGY
  // ============================
  event.respondWith((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      const network = await fetch(request);

      if (network && network.status === 200) {
        cache.put(request, network.clone());
        return network;
      }

      return cached;

    } catch {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(request) || fetch(request);
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
