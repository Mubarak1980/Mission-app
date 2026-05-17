const CACHE_NAME = 'mission-cache-v154';

// ============================
// APP SHELL (FIXED FOR GITHUB PAGES)
// ============================
const APP_SHELL = [
  './',
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
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      for (const file of APP_SHELL) {
        try {
          const res = await fetch(file, { cache: "reload" });

          if (res && res.status === 200) {
            await cache.put(file, res.clone());
          }
        } catch (e) {
          console.warn("Install skipped:", file);
        }
      }
    })()
  );
});

// ============================
// ACTIVATE
// ============================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();
    })()
  );
});

// ============================
// FETCH
// ============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;

  // ---------------------------
  // NAVIGATION (CRITICAL FIX FOR GITHUB PAGES)
  // ---------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);

          if (network && network.ok) {
            const cache = await caches.open(CACHE_NAME);

            // FIX: MUST be relative path (NOT /index.html)
            cache.put('./index.html', network.clone());

            return network;
          }

          throw new Error("Bad response");
        } catch (err) {
          return (
            (await caches.match('./index.html')) ||
            (await caches.match('index.html')) ||
            new Response("<h1>Offline</h1>", {
              headers: { "Content-Type": "text/html" }
            })
          );
        }
      })()
    );

    return;
  }

  // ---------------------------
  // STATIC FILES (CACHE STRATEGY)
  // ---------------------------
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);

      try {
        const network = await fetch(request);

        if (network && network.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, network.clone());
          return network;
        }

        return cached || network;
      } catch (err) {
        return cached;
      }
    })()
  );
});

// ============================
// UPDATE CONTROL
// ============================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
