const CACHE_NAME = "mission-cache-v188";
const BASE = "/Mission-app/";

const APP_SHELL = [
BASE,
BASE + "index.html",
BASE + "styles.css",
BASE + "main.js",
BASE + "Study-tracker.js",
BASE + "Sunnah-tracker.js",
BASE + "dashboard.js",
BASE + "weekly-timetable.js",
BASE + "top-student-mode.js",
BASE + "icon-192.png",
BASE + "icon-512.png",
BASE + "manifest.json"
];

// =========================
// INSTALL
// =========================
self.addEventListener("install", (event) => {
self.skipWaiting(); // 🔥 move earlier for faster activation

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
        // silent fail (offline safe)  
      }  
    })  
  );  
})()

);
});

// =========================
// ACTIVATE
// =========================
self.addEventListener("activate", (event) => {
event.waitUntil(
(async () => {
const keys = await caches.keys();

await Promise.all(  
    keys.map((k) => {  
      if (k !== CACHE_NAME) return caches.delete(k);  
    })  
  );  

  await self.clients.claim();  

  // 🔥 force refresh clients so new SW takes control immediately  
  const clients = await self.clients.matchAll({ type: "window" });  
  clients.forEach((client) => {  
    if (client.url && "navigate" in client) {  
      client.navigate(client.url);  
    }  
  });  
})()

);
});

// =========================
// FETCH (SMART STRATEGY)
// =========================
self.addEventListener("fetch", (event) => {
if (event.request.method !== "GET") return;

const url = new URL(event.request.url);

if (url.origin !== location.origin) return;

// =========================
// NAVIGATION (APP SHELL FIX)
// =========================
if (event.request.mode === "navigate") {
event.respondWith(
(async () => {
try {
const network = await fetch(event.request);
if (network && network.ok) return network;
} catch (e) {}

const cached = await caches.match(BASE + "index.html");  
    return cached || caches.match(BASE);  
  })()  
);  
return;

}

// =========================
// CACHE FIRST + NETWORK UPDATE
// =========================
event.respondWith(
(async () => {
const cached = await caches.match(event.request);

try {  
    const network = await fetch(event.request);  

    if (network && network.status === 200) {  
      const cache = await caches.open(CACHE_NAME);  
      cache.put(event.request, network.clone());  
    }  

    return network;  
  } catch (e) {  
    return cached;  
  }  
})()

);
});

// =========================
// UPDATE CONTROL
// =========================
self.addEventListener("message", (event) => {
if (event.data?.type === "SKIP_WAITING") {
self.skipWaiting();
}
});
