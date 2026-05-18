const CACHE_NAME = 'mission-cache-v169';

// ============================
// APP SHELL (UNCHANGED)
/// ============================
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
  './icon-192.png',
  './icon-512.png'
];

// ============================
// INSTALL (FIXED PROPERLY)
// ============================
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.allSettled(
        APP_SHELL.map(async (file) => {
          try {
            const res = await fetch(file, { cache: "reload" });

            if (res && res.ok) {
              await cache.put(file, res.clone());
            }
          } catch (e) {
            console.warn("Install skipped:", file);
          }
        })
      );

      // ✅ move skipWaiting INSIDE
      await self.skipWaiting();
    })()
  );
});

// ============================
// ACTIVATE (STRONG CONTROL)
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

      // ✅ CRITICAL: take control immediately
      await self.clients.claim();
    })()
  );
});

// ============================
// FETCH (IMPROVED NAVIGATION)
// ============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;

  // ============================
  // NAVIGATION (CRITICAL FIX)
  // ============================
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);

          if (network && network.ok) {
            const cache = await caches.open(CACHE_NAME);

            // ✅ keep index always fresh
            cache.put('./index.html', network.clone());

            return network;
          }

          throw new Error("Bad response");
        } catch (err) {
          return (
            (await caches.match('./index.html')) ||
            new Response("<h1>Offline</h1>", {
              headers: { "Content-Type": "text/html" }
            })
          );
        }
      })()
    );
    return;
  }

  // ============================
  // STATIC FILES (UNCHANGED)
  // ============================
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);

      try {
        const network = await fetch(request);

        if (network && network.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, network.clone());
          return network;
        }

        return cached || network;
      } catch {
        return cached;
      }
    })()
  );
});

// ============================
// UPDATE CONTROL (UNCHANGED)
// ============================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
