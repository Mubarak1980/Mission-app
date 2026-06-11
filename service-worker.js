"use strict";

/* ==========================================================
🚀 MISSION APP SERVICE WORKER v2.1 (IMPROVED)
OFFLINE-FIRST + ROBUST INSTALL + SAFE NAVIGATION
========================================================== */

const CACHE_NAME = "mission-v88";

const APP_SHELL = [
    "./",
    "./index.html",
    "./styles.css",

    "./main.js",
    "./Study-tracker.js",
    "./SmartEngine.js",
    "./dashboard.js",
    "./weekly-timetable.js",
    "./top-student-mode.js",
    "./Sunnah-tracker.js",

    "./manifest.json",

    "./icon-192.png",
    "./icon-512.png"
];

/* ==========================================================
📦 INSTALL (ROBUST VERSION)
========================================================== */

self.addEventListener("install", (event) => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {

            // Safer than addAll (prevents full failure)
            for (const file of APP_SHELL) {
                try {
                    await cache.add(file);
                } catch (err) {
                    console.warn("Cache failed:", file, err);
                }
            }
        })
    );
});

/* ==========================================================
🔄 ACTIVATE
========================================================== */

self.addEventListener("activate", (event) => {

    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

/* ==========================================================
🌐 FETCH HANDLER (IMPROVED OFFLINE RESILIENCE)
========================================================== */

self.addEventListener("fetch", (event) => {

    const request = event.request;

    /* ------------------------------------------
       NAVIGATION REQUESTS
       (FULL OFFLINE SAFE FALLBACK CHAIN)
    ------------------------------------------ */

    if (request.mode === "navigate") {

        event.respondWith(
            caches.match("./index.html")
                .then((cached) => {

                    return cached || fetch(request).catch(() => {
                        return cached || caches.match("./index.html");
                    });

                })
        );

        return;
    }

    /* ------------------------------------------
       CACHE-FIRST WITH NETWORK UPDATE
    ------------------------------------------ */

    event.respondWith(

        caches.match(request).then((cached) => {

            const networkFetch = fetch(request)
                .then((networkResponse) => {

                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, networkResponse.clone());
                        });
                    }

                    return networkResponse;
                })
                .catch(() => null);

            // Return cache immediately if exists
            return cached || networkFetch;

        }).catch(() => {

            if (request.destination === "document") {
                return caches.match("./index.html");
            }

            return new Response("", {
                status: 408,
                statusText: "Offline"
            });

        })
    );
});

/* ==========================================================
📩 FORCE UPDATE SUPPORT
========================================================== */

self.addEventListener("message", (event) => {

    if (event.data === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
