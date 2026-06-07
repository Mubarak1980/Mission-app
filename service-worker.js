"use strict";

/* ==========================================================
🚀 MISSION APP SERVICE WORKER v2
OFFLINE-FIRST + AUTO UPDATE + SAFE FALLBACK
========================================================== */

const CACHE_NAME = "mission-v64";

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
📦 INSTALL
========================================================== */

self.addEventListener("install", (event) => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
    );
});

/* ==========================================================
🔄 ACTIVATE
========================================================== */

self.addEventListener("activate", (event) => {

    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

/* ==========================================================
🌐 FETCH HANDLER
CACHE FIRST FOR APP FILES
NETWORK FALLBACK FOR EVERYTHING ELSE
========================================================== */

self.addEventListener("fetch", (event) => {

    const request = event.request;

    /* ------------------------------------------
       PAGE NAVIGATION
    ------------------------------------------ */

    if (request.mode === "navigate") {

        event.respondWith(
            caches.match("./index.html")
                .then(cached => {

                    if (cached) {
                        return cached;
                    }

                    return fetch(request)
                        .catch(() => caches.match("./index.html"));
                })
        );

        return;
    }

    /* ------------------------------------------
       APP SHELL FILES
       CACHE FIRST
    ------------------------------------------ */

    event.respondWith(

        caches.match(request)

            .then(cachedResponse => {

                if (cachedResponse) {

                    fetch(request)
                        .then(networkResponse => {

                            if (
                                networkResponse &&
                                networkResponse.status === 200
                            ) {

                                caches.open(CACHE_NAME)
                                    .then(cache =>
                                        cache.put(
                                            request,
                                            networkResponse.clone()
                                        )
                                    );
                            }

                        })
                        .catch(() => {});

                    return cachedResponse;
                }

                return fetch(request)

                    .then(networkResponse => {

                        if (
                            networkResponse &&
                            networkResponse.status === 200
                        ) {

                            const clone =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache =>
                                    cache.put(request, clone)
                                );
                        }

                        return networkResponse;
                    })

                    .catch(() => {

                        if (
                            request.destination === "document"
                        ) {
                            return caches.match("./index.html");
                        }

                        return new Response("", {
                            status: 404,
                            statusText: "Offline"
                        });
                    });

            })
    );
});

/* ==========================================================
📩 OPTIONAL: FORCE UPDATE SUPPORT
========================================================== */

self.addEventListener("message", (event) => {

    if (event.data === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
