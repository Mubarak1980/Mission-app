"use strict";

// ======================================================
// 1. DATA SERVICE (INDEXEDDB VERSION - PERSISTENT)
// ======================================================
window.DataService = {
    DB_NAME: "StudyTrackerDB",
    STORE_NAME: "mainData",
    KEY: "study_progress",
    _cachedData: null,
    _initPromise: null,

    async _init() {
        if (this._cachedData !== null) return this._cachedData;
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

                const req = store.get(this.KEY);

                req.addEventListener("success", () => {
                    this._cachedData = req.result || this.defaultData();
                    resolve(this._cachedData);
                });

                req.addEventListener("error", () => {
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
        if (!this._cachedData) {
            this._init();
        }
        return this._cachedData || fallback || this.defaultData();
    },

    set(data) {
        this._cachedData = data;

        setTimeout(() => {
            this._init().then(() => {
                const dbReq = indexedDB.open(this.DB_NAME);

                dbReq.addEventListener("success", () => {
                    const db = dbReq.result;
                    const tx = db.transaction(this.STORE_NAME, "readwrite");
                    tx.objectStore(this.STORE_NAME).put(data, this.KEY);
                });
            });
        }, 0);
    },

    defaultData() {
        return {
            startDate: new Date().toISOString().split("T")[0],
            studyProgress: {},
            ui: { section: "study", grade: 9 }
        };
    }
};


// ======================================================
// 2. UI CONTROLLER (INDEXEDDB VERSION - PERSISTENT)
// ======================================================
window.UI = {
    DB_NAME: "UITrackerDB",
    STORE_NAME: "uiData",
    KEY: "mission_ui",
    _cachedUI: null,
    _initPromise: null,

    async _initUI() {
        if (this._cachedUI !== null) return this._cachedUI;
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

                const req = store.get(this.KEY);

                req.addEventListener("success", () => {
                    this._cachedUI = req.result || { section: "study", grade: 9 };
                    resolve(this._cachedUI);
                });

                req.addEventListener("error", () => {
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
                const dbReq = indexedDB.open(this.DB_NAME);

                dbReq.addEventListener("success", () => {
                    const db = dbReq.result;
                    const tx = db.transaction(this.STORE_NAME, "readwrite");
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
// 3. MODULE REGISTRY (UNCHANGED)
// ======================================================
window.SectionMap = {
    study: "loadStudySection",
    timetable: "loadWeeklyTimetable",
    dashboard: "loadDashboard",
    topstudent: "loadTopStudentMode",
    sunnah: "loadSunnahTracker"
};


// ======================================================
// 4. SAFE LOADER (UNCHANGED LOGIC)
// ======================================================
const MAX_RETRIES = 20;

window.loadSection = function (type, grade = 9, retry = 0) {
    const main = document.getElementById("main-content");
    if (!main) return;

    if (retry > MAX_RETRIES) {
        main.innerHTML = `
            <div style="padding:20px;color:red;">
                Failed to load module: ${type}
            </div>
        `;
        return;
    }

    if (type === "dashboard" && !window.maxPagesByGrade) {
        setTimeout(() => {
            window.loadSection(type, grade, retry + 1);
        }, 150);
        return;
    }

    const fnName = window.SectionMap[type];

    if (!fnName || typeof window[fnName] !== "function") {
        setTimeout(() => {
            window.loadSection(type, grade, retry + 1);
        }, 150);
        return;
    }

    try {
        window.UI.save(type, grade);

        if (type === "study") {
            window[fnName](grade);
        } else {
            window[fnName]();
        }

    } catch (err) {
        console.error("Module error:", err);
        main.innerHTML = `
            <div style="padding:20px;color:red;">
                ${err.message}
            </div>
        `;
    }
};


// ======================================================
// 5. SYSTEM BOOT (UNCHANGED STRUCTURE, FIXED SAFETY)
// ======================================================
function waitForSystemReady(callback) {
    const check = () => {
        const ready =
            window.DataService &&
            window.SectionMap &&
            typeof window.loadSection === "function";

        if (!ready) {
            setTimeout(check, 50);
            return;
        }

        callback();
    };

    check();
}


// ======================================================
// 6. PERSISTENT STORAGE REQUEST (UNCHANGED)
// ======================================================
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persist();
            if (isPersisted) {
                console.log("✅ PERSISTENT STORAGE GRANTED!");
            } else {
                console.log("⚠️ Persistent storage not granted");
            }
        } catch (err) {
            console.warn("Persistent storage request failed:", err);
        }
    }
}


// ======================================================
// 7. START APP (FIXED RACE CONDITION)
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {

    await window.DataService._init();
    await window.UI._initUI();

    waitForSystemReady(() => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);

        requestPersistentStorage();
    });
});


// ======================================================
// 🛡️ RELIABILITY SYSTEM (FIXED SNAPSHOT BUG ONLY)
// ======================================================
(function () {

    const SNAPSHOT_PREFIX = "study_snapshot_";
    const MAX_SNAPSHOTS = 5;
    const SNAPSHOT_DB_NAME = "SnapshotTrackerDB";
    const SNAPSHOT_STORE_NAME = "snapshots";

    async function _openSnapshotDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(SNAPSHOT_DB_NAME);

            request.addEventListener("upgradeneeded", (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(SNAPSHOT_STORE_NAME)) {
                    db.createObjectStore(SNAPSHOT_STORE_NAME);
                }
            });

            request.addEventListener("success", () => resolve(request.result));
            request.addEventListener("error", () => resolve(null));
        });
    }

    function createSnapshot() {
        const raw = window.DataService._cachedData;
        if (!raw) return;

        _openSnapshotDB().then((db) => {
            if (!db) return;

            const key = SNAPSHOT_PREFIX + Date.now();
            const tx = db.transaction(SNAPSHOT_STORE_NAME, "readwrite");
            tx.objectStore(SNAPSHOT_STORE_NAME).put(raw, key);

            cleanupSnapshots(db);
        });
    }

    function cleanupSnapshots(db) {
        const tx = db.transaction(SNAPSHOT_STORE_NAME, "readonly");
        const store = tx.objectStore(SNAPSHOT_STORE_NAME);
        const req = store.openCursor();

        const keys = [];

        req.addEventListener("success", function handler(e) {
            const cursor = e.target.result;

            if (cursor) {
                keys.push(cursor.key);
                cursor.continue();
            } else {
                keys.sort();

                while (keys.length > MAX_SNAPSHOTS) {
                    const delTx = db.transaction(SNAPSHOT_STORE_NAME, "readwrite");
                    delTx.objectStore(SNAPSHOT_STORE_NAME).delete(keys.shift());
                }
            }
        });
    }

    function recover() {
        try {
            const raw = window.DataService._cachedData;
            if (raw) JSON.parse(JSON.stringify(raw));
        } catch {
            _openSnapshotDB().then((db) => {
                if (!db) return;

                const tx = db.transaction(SNAPSHOT_STORE_NAME, "readonly");
                const store = tx.objectStore(SNAPSHOT_STORE_NAME);
                const req = store.openCursor(null, "prev");

                req.addEventListener("success", (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        window.DataService._cachedData = cursor.value;
                        window.DataService.set(cursor.value);
                    }
                });
            });
        }
    }

    function updateConnectionStatus() {
        document.body.dataset.online = navigator.onLine ? "true" : "false";
    }

    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    document.addEventListener("DOMContentLoaded", () => {
        recover();
        updateConnectionStatus();
        createSnapshot();
        setInterval(createSnapshot, 1000 * 60 * 60);
    });

})();
