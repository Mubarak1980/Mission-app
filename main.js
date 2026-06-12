"use strict";

// ======================================================
// 1. DATA SERVICE (INDEXEDDB VERSION - STABILIZED)
// ======================================================
window.DataService = {
    DB_NAME: "StudyTrackerDB",
    STORE_NAME: "mainData",
    KEY: "study_progress",
    _cachedData: null,
    _initPromise: null,

    async _init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve) => {
            const request = indexedDB.open(this.DB_NAME);

            request.addEventListener("upgradeneeded", (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            });

            request.addEventListener("success", () => {
                const db = request.result;
                const tx = db.transaction(this.STORE_NAME, "readonly");
                const store = tx.objectStore(this.STORE_NAME);
                const cursor = store.get(this.KEY);

                cursor.addEventListener("success", () => {
                    this._cachedData = cursor.result || this.defaultData();
                    resolve(this._cachedData);
                });

                cursor.addEventListener("error", () => {
                    this._cachedData = this.defaultData();
                    resolve(this._cachedData);
                });
            });

            request.addEventListener("error", () => {
                this._cachedData = this.defaultData();
                resolve(this._cachedData);
            });
        });

        return this._initPromise;
    },

    get(fallback) {
        // FIX: ensure async init starts once
        if (!this._cachedData) {
            this._init();
        }

        return this._cachedData || fallback || this.defaultData();
    },

    set(data) {

        // FIX: preserve startDate permanently
        if (!data.startDate) {
            data.startDate =
                this._cachedData?.startDate ||
                new Date().toISOString().split("T")[0];
        }

        this._cachedData = data;

        setTimeout(() => {
            this._init().then(() => {
                const db = indexedDB.open(this.DB_NAME);
                db.addEventListener("success", () => {
                    const tx = db.result.transaction(this.STORE_NAME, "readwrite");
                    tx.objectStore(this.STORE_NAME).put(data, this.KEY);
                });
            });
        }, 0);
    },

    defaultData() {
        return {
            // FIX: DO NOT auto-reset learning timeline
            startDate: null,
            studyProgress: {},
            ui: { section: "study", grade: 9 }
        };
    }
};

// ======================================================
// 2. UI CONTROLLER (STABILIZED)
// ======================================================
window.UI = {
    DB_NAME: "UITrackerDB",
    STORE_NAME: "uiData",
    KEY: "mission_ui",
    _cachedUI: null,
    _initPromise: null,

    async _initUI() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve) => {
            const request = indexedDB.open(this.DB_NAME);

            request.addEventListener("upgradeneeded", (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            });

            request.addEventListener("success", () => {
                const db = request.result;
                const tx = db.transaction(this.STORE_NAME, "readonly");
                const store = tx.objectStore(this.STORE_NAME);
                const cursor = store.get(this.KEY);

                cursor.addEventListener("success", () => {
                    this._cachedUI = cursor.result || { section: "study", grade: 9 };
                    resolve(this._cachedUI);
                });

                cursor.addEventListener("error", () => {
                    this._cachedUI = { section: "study", grade: 9 };
                    resolve(this._cachedUI);
                });
            });

            request.addEventListener("error", () => {
                this._cachedUI = { section: "study", grade: 9 };
                resolve(this._cachedUI);
            });
        });

        return this._initPromise;
    },

    save(section, grade) {
        const uiData = { section, grade };
        this._cachedUI = uiData;

        setTimeout(() => {
            this._initUI().then(() => {
                const db = indexedDB.open(this.DB_NAME);
                db.addEventListener("success", () => {
                    const tx = db.result.transaction(this.STORE_NAME, "readwrite");
                    tx.objectStore(this.STORE_NAME).put(uiData, this.KEY);
                });
            });
        }, 0);
    },

    load() {
        this._initUI();
        return this._cachedUI || { section: "study", grade: 9 };
    }
};

// ======================================================
// 4. SAFE LOADER (UNCHANGED LOGIC, FIXED STABILITY)
// ======================================================
const MAX_RETRIES = 20;

window.loadSection = function (type, grade = 9, retry = 0) {
    const main = document.getElementById("main-content");
    if (!main) return;

    if (retry > MAX_RETRIES) {
        main.innerHTML = `<div style="padding:20px;color:red;">Failed to load module: ${type}</div>`;
        return;
    }

    if (type === "dashboard" && !window.maxPagesByGrade) {
        setTimeout(() => window.loadSection(type, grade, retry + 1), 150);
        return;
    }

    const fnName = window.SectionMap[type];

    if (!fnName || typeof window[fnName] !== "function") {
        setTimeout(() => window.loadSection(type, grade, retry + 1), 150);
        return;
    }

    try {
        window.UI.save(type, grade);

        if (type === "study") window[fnName](grade);
        else window[fnName]();

    } catch (err) {
        console.error("Module error:", err);
        main.innerHTML = `<div style="padding:20px;color:red;">${err.message}</div>`;
    }
};

// ======================================================
// 7. START APP (🔥 IMPORTANT FIX)
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {

    // FIX: ensure IndexedDB is loaded BEFORE engine runs
    await window.DataService._init();
    await window.UI._initUI();

    waitForSystemReady(() => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);

        requestPersistentStorage();
    });
});
