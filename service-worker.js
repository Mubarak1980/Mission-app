const CACHE_NAME = 'mission-cache-v172';

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
  './icon-192.png',
  './icon-512.png'
];

// INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      for (const file of APP_SHELL) {
        try {
          const res = await fetch(file, { cache: "reload" });
          if (res.ok) await cache.put(file, res);
        } catch {}
      }

      await self.skipWaiting();
    })()
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// FETCH
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // skip chrome extension / external
  if (!url.origin.includes(self.location.origin)) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);

      try {
        const network = await fetch(event.request);
        if (network.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, network.clone());
        }
        return network;
      } catch {
        return cached || caches.match('./index.html');
      }
    })()
  );
});

// FORCE UPDATE
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
