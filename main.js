"use strict";

// ======================================================
// 1. DATA SERVICE (INDEXEDDB VERSION - PERSISTENT)
// ======================================================
window.DataService = {
    DB_NAME: "StudyTrackerDB",
    STORE_NAME: "mainData",
    KEY: "study_progress",
    _cachedData: null,

    async _init() {
        if (this._cachedData !== null) return this._cachedData;
        
        return new Promise((resolve) => {
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
                const cursor = tx.objectStore(this.STORE_NAME).get(this.KEY);
                
                cursor.addEventListener("success", () => {
                    if (cursor.result) {
                        this._cachedData = cursor.result;
                        resolve(cursor.result);
                    } else {
                        this._cachedData = this.defaultData();
                        resolve(this.defaultData());
                    }
                });
                
                cursor.addEventListener("error", () => {
                    this._cachedData = this.defaultData();
                    resolve(this.defaultData());
                });
            });
            
            request.addEventListener("error", () => {
                this._cachedData = this.defaultData();
                resolve(this.defaultData());
            });
        });
    },

    get(fallback) {
        this._init();
        return this._cachedData || fallback || this.defaultData();
    },

    set(data) {
        this._cachedData = data;
        setTimeout(() => {
            this._init().then(() => {
                const db = indexedDB.open(this.DB_NAME);
                db.addEventListener("success", () => {
                    const transaction = db.result.transaction(this.STORE_NAME, "readwrite");
                    transaction.objectStore(this.STORE_NAME).put(data, this.KEY);
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

    async _initUI() {
        if (this._cachedUI !== null) return this._cachedUI;
        
        return new Promise((resolve) => {
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
                const cursor = tx.objectStore(this.STORE_NAME).get(this.KEY);
                
                cursor.addEventListener("success", () => {
                    if (cursor.result) {
                        this._cachedUI = cursor.result;
                        resolve(cursor.result);
                    } else {
                        this._cachedUI = { section: "study", grade: 9 };
                        resolve({ section: "study", grade: 9 });
                    }
                });
                
                cursor.addEventListener("error", () => {
                    this._cachedUI = { section: "study", grade: 9 };
                    resolve({ section: "study", grade: 9 });
                });
            });
            
            request.addEventListener("error", () => {
                this._cachedUI = { section: "study", grade: 9 };
                resolve({ section: "study", grade: 9 });
            });
        });
    },

    save(section, grade) {
        const uiData = { section, grade };
        this._cachedUI = uiData;
        setTimeout(() => {
            this._initUI().then(() => {
                const db = indexedDB.open(this.DB_NAME);
                db.addEventListener("success", () => {
                    const transaction = db.result.transaction(this.STORE_NAME, "readwrite");
                    transaction.objectStore(this.STORE_NAME).put(uiData, this.KEY);
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
// 3. MODULE REGISTRY
// ======================================================
window.SectionMap = {
    study: "loadStudySection",
    timetable: "loadWeeklyTimetable",
    dashboard: "loadDashboard",
    topstudent: "loadTopStudentMode",
    sunnah: "loadSunnahTracker"
};

// ======================================================
// 4. SAFE LOADER (FIXED - NO INFINITE LOOP)
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

    // dashboard safety check
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
// 5. SYSTEM BOOT (SAFE INITIALIZATION)
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
// 6. PERSISTENT STORAGE REQUEST (BROWSER PERMISSION)
// ======================================================
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persist();
            if (isPersisted) {
                console.log("✅ PERSISTENT STORAGE GRANTED! Data will survive Chrome cleanup.");
            } else {
                console.log("⚠️ Persistent storage not granted (but IndexedDB still protects data)");
            }
        } catch (err) {
            console.warn("Persistent storage request failed:", err);
        }
    } else {
        console.log("ℹ️ Persistent storage not available in this browser");
    }
}

// ======================================================
// 7. START APP
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    waitForSystemReady(() => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
        
        // Request persistent storage after app boots
        requestPersistentStorage();
    });
});

// ======================================================
// 🛡️ RELIABILITY SYSTEM (INDEXEDDB VERSION)
// ======================================================
(function () {

    const SNAPSHOT_PREFIX = "study_snapshot_";
    const MAX_SNAPSHOTS = 5;
    const SNAPSHOT_DB_NAME = "SnapshotTrackerDB";
    const SNAPSHOT_STORE_NAME = "snapshots";

    // -------------------------------
    // STORAGE HEALTH
    // -------------------------------
    async function checkStorageHealth() {
        if (!navigator.storage?.estimate) return;

        try {
            const estimate = await navigator.storage.estimate();
            console.log("Storage KB:", Math.round(estimate.usage / 1024));
        } catch {}
    }

    // -------------------------------
    // SNAPSHOT SYSTEM (INDEXEDDB)
    // -------------------------------
    async function _openSnapshotDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(SNAPSHOT_DB_NAME);
            
            request.addEventListener("upgradeneeded", (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(SNAPSHOT_STORE_NAME)) {
                    db.createObjectStore(SNAPSHOT_STORE_NAME);
                }
            });
            
            request.addEventListener("success", () => {
                resolve(request.result);
            });
            
            request.addEventListener("error", () => {
                resolve(null);
            });
        });
    }

    function createSnapshot() {
        const raw = window.DataService._cachedData;
        if (!raw) return;

        _openSnapshotDB().then((db) => {
            if (!db) return;
            
            const key = SNAPSHOT_PREFIX + Date.now();
            const transaction = db.transaction(SNAPSHOT_STORE_NAME, "readwrite");
            transaction.objectStore(SNAPSHOT_STORE_NAME).put(raw, key);
            
            cleanupSnapshots(db);
        });
    }

    function cleanupSnapshots(db) {
        const transaction = db.transaction(SNAPSHOT_STORE_NAME, "readonly");
        const cursor = transaction.objectStore(SNAPSHOT_STORE_NAME).openCursor();
        
        const snapshots = [];
        
        cursor.addEventListener("success", () => {
            if (cursor.result) {
                snapshots.push(cursor.result.key);
                cursor.result.continue();
            } else {
                snapshots.sort();
                while (snapshots.length > MAX_SNAPSHOTS) {
                    const deleteTx = db.transaction(SNAPSHOT_STORE_NAME, "readwrite");
                    deleteTx.objectStore(SNAPSHOT_STORE_NAME).delete(snapshots.shift());
                }
            }
        });
    }

    // -------------------------------
    // RECOVERY (INDEXEDDB)
    // -------------------------------
    function recover() {
        try {
            const raw = window.DataService._cachedData;
            if (raw) JSON.parse(JSON.stringify(raw));
        } catch {
            _openSnapshotDB().then((db) => {
                if (!db) return;
                
                const transaction = db.transaction(SNAPSHOT_STORE_NAME, "readonly");
                const cursor = transaction.objectStore(SNAPSHOT_STORE_NAME).openCursor(null, "prev");
                
                cursor.addEventListener("success", () => {
                    if (cursor.result) {
                        window.DataService._cachedData = cursor.result.value;
                        window.DataService.set(cursor.result.value);
                    }
                });
            });
        }
    }

    // -------------------------------
    // ONLINE/OFFLINE STATUS
    // -------------------------------
    function updateConnectionStatus() {
        document.body.dataset.online = navigator.onLine ? "true" : "false";
    }

    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    // -------------------------------
    // BOOT
    // -------------------------------
    document.addEventListener("DOMContentLoaded", () => {
        recover();
        updateConnectionStatus();
        checkStorageHealth();
        createSnapshot();
        setInterval(createSnapshot, 1000 * 60 * 60); // 1 hour (optimized)
    });

})();
