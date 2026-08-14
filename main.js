"use strict";

// ======================================================
// 1. DATA SERVICE
//    INDEXEDDB VERSION - OFFLINE SAFE
// ======================================================

window.DataService = {

    DB_NAME: "StudyTrackerDB",
    STORE_NAME: "mainData",
    KEY: "study_progress",

    _cachedData: null,
    _initPromise: null,
    _db: null,

    // Prevents overlapping writes.
    _saveQueue: Promise.resolve(),

    // Allows other modules to wait for the latest save.
    _lastSavePromise: Promise.resolve(),

    defaultData() {
        return {
            startDate:
                new Date()
                    .toISOString()
                    .split("T")[0],

            studyProgress: {},

            studyLog: {},

            ui: {
                section: "study",
                grade: 9
            }
        };
    },

    _isObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    },

    _clone(value) {
        try {
            if (
                typeof structuredClone ===
                "function"
            ) {
                return structuredClone(value);
            }

            return JSON.parse(
                JSON.stringify(value)
            );
        } catch (error) {
            console.warn(
                "Data clone failed:",
                error
            );

            return {};
        }
    },

    _merge(previous, incoming) {
        const result = {
            ...(this._isObject(previous)
                ? previous
                : {})
        };

        if (
            !this._isObject(incoming)
        ) {
            return result;
        }

        Object.keys(incoming).forEach(key => {
            const oldValue =
                result[key];

            const newValue =
                incoming[key];

            if (
                this._isObject(oldValue) &&
                this._isObject(newValue)
            ) {
                result[key] =
                    this._merge(
                        oldValue,
                        newValue
                    );
            } else {
                result[key] =
                    newValue;
            }
        });

        return result;
    },

    _normalize(data) {
        const defaults =
            this.defaultData();

        const normalized =
            this._merge(
                defaults,
                this._isObject(data)
                    ? data
                    : {}
            );

        if (
            !this._isObject(
                normalized.studyProgress
            )
        ) {
            normalized.studyProgress = {};
        }

        if (
            !this._isObject(
                normalized.studyLog
            )
        ) {
            normalized.studyLog = {};
        }

        if (
            !this._isObject(
                normalized.ui
            )
        ) {
            normalized.ui = {
                ...defaults.ui
            };
        }

        if (
            !normalized.startDate
        ) {
            normalized.startDate =
                defaults.startDate;
        }

        return normalized;
    },

    async _openDB() {
        if (this._db) {
            return this._db;
        }

        return new Promise(resolve => {
            let finished = false;

            const finish = db => {
                if (finished) return;

                finished = true;
                resolve(db);
            };

            try {
                const request =
                    indexedDB.open(
                        this.DB_NAME
                    );

                request.addEventListener(
                    "upgradeneeded",
                    event => {
                        const db =
                            event.target.result;

                        if (
                            !db.objectStoreNames
                                .contains(
                                    this.STORE_NAME
                                )
                        ) {
                            db.createObjectStore(
                                this.STORE_NAME
                            );
                        }
                    }
                );

                request.addEventListener(
                    "success",
                    () => {
                        this._db =
                            request.result;

                        this._db.addEventListener(
                            "versionchange",
                            () => {
                                this._db.close();
                                this._db = null;
                            }
                        );

                        finish(this._db);
                    }
                );

                request.addEventListener(
                    "error",
                    () => {
                        console.warn(
                            "IndexedDB unavailable:",
                            request.error
                        );

                        finish(null);
                    }
                );

                request.addEventListener(
                    "blocked",
                    () => {
                        console.warn(
                            "IndexedDB request blocked."
                        );
                    }
                );
            } catch (error) {
                console.warn(
                    "Database open failed:",
                    error
                );

                finish(null);
            }
        });
    },

    async _read(db) {
        if (!db) {
            return null;
        }

        return new Promise(resolve => {
            try {
                const transaction =
                    db.transaction(
                        this.STORE_NAME,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        this.STORE_NAME
                    );

                const request =
                    store.get(this.KEY);

                request.addEventListener(
                    "success",
                    () => {
                        resolve(
                            request.result ||
                            null
                        );
                    }
                );

                request.addEventListener(
                    "error",
                    () => {
                        console.warn(
                            "Data read failed:",
                            request.error
                        );

                        resolve(null);
                    }
                );
            } catch (error) {
                console.warn(
                    "Data read error:",
                    error
                );

                resolve(null);
            }
        });
    },

    async _write(db, data) {
        if (!db) {
            return false;
        }

        return new Promise(resolve => {
            try {
                const transaction =
                    db.transaction(
                        this.STORE_NAME,
                        "readwrite"
                    );

                transaction
                    .objectStore(
                        this.STORE_NAME
                    )
                    .put(
                        data,
                        this.KEY
                    );

                transaction.addEventListener(
                    "complete",
                    () => {
                        resolve(true);
                    }
                );

                transaction.addEventListener(
                    "error",
                    () => {
                        console.warn(
                            "Data write failed:",
                            transaction.error
                        );

                        resolve(false);
                    }
                );

                transaction.addEventListener(
                    "abort",
                    () => {
                        console.warn(
                            "Data write aborted."
                        );

                        resolve(false);
                    }
                );
            } catch (error) {
                console.warn(
                    "Data write error:",
                    error
                );

                resolve(false);
            }
        });
    },

    async _init() {
        if (
            this._cachedData !== null
        ) {
            return this._cachedData;
        }

        if (this._initPromise) {
            return this._initPromise;
        }

        this._initPromise =
            (async () => {
                const db =
                    await this._openDB();

                if (!db) {
                    /*
                        The app can still open offline.
                        Data remains in memory for this
                        session if IndexedDB is unavailable.
                    */
                    this._cachedData =
                        this.defaultData();

                    return this._cachedData;
                }

                const stored =
                    await this._read(db);

                this._cachedData =
                    this._normalize(
                        stored
                    );

                /*
                    This only normalizes existing data.
                    It does not clear studyProgress.
                */
                await this._write(
                    db,
                    this._cachedData
                );

                return this._cachedData;
            })();

        try {
            return await this._initPromise;
        } finally {
            this._initPromise = null;
        }
    },

    get(fallback) {
        if (
            this._cachedData !== null
        ) {
            return this._cachedData;
        }

        if (
            this._isObject(fallback)
        ) {
            return fallback;
        }

        return this.defaultData();
    },

    async set(data) {
        const operation =
            this._saveQueue.then(
                async () => {
                    try {
                        if (
                            this._cachedData ===
                            null
                        ) {
                            await this._init();
                        }

                        const previous =
                            this._normalize(
                                this._cachedData
                            );

                        const incoming =
                            this._isObject(data)
                                ? data
                                : {};

                        const merged =
                            this._normalize(
                                this._merge(
                                    previous,
                                    incoming
                                )
                            );

                        this._cachedData =
                            merged;

                        const db =
                            await this._openDB();

                        if (!db) {
                            console.warn(
                                "IndexedDB unavailable; " +
                                "data remains in memory."
                            );

                            return false;
                        }

                        const saved =
                            await this._write(
                                db,
                                merged
                            );

                        if (saved) {
                            window.dispatchEvent(
                                new CustomEvent(
                                    "data-service-updated",
                                    {
                                        detail: {
                                            data:
                                                this._clone(
                                                    merged
                                                )
                                        }
                                    }
                                )
                            );
                        }

                        return saved;
                    } catch (error) {
                        console.warn(
                            "Data save failed:",
                            error
                        );

                        return false;
                    }
                }
            );

        this._saveQueue =
            operation.catch(() => {});

        this._lastSavePromise =
            operation;

        return operation;
    },

    async update(updater) {
        if (
            typeof updater !==
            "function"
        ) {
            return false;
        }

        const operation =
            this._saveQueue.then(
                async () => {
                    try {
                        if (
                            this._cachedData ===
                            null
                        ) {
                            await this._init();
                        }

                        const current =
                            this._normalize(
                                this._cachedData
                            );

                        const editable =
                            this._clone(
                                current
                            );

                        const result =
                            await updater(
                                editable
                            );

                        const updated =
                            result === undefined
                                ? editable
                                : result;

                        if (
                            !this._isObject(
                                updated
                            )
                        ) {
                            console.warn(
                                "Updater must return " +
                                "an object."
                            );

                            return false;
                        }

                        const normalized =
                            this._normalize(
                                updated
                            );

                        this._cachedData =
                            normalized;

                        const db =
                            await this._openDB();

                        if (!db) {
                            return false;
                        }

                        const saved =
                            await this._write(
                                db,
                                normalized
                            );

                        if (saved) {
                            window.dispatchEvent(
                                new CustomEvent(
                                    "data-service-updated",
                                    {
                                        detail: {
                                            data:
                                                this._clone(
                                                    normalized
                                                )
                                        }
                                    }
                                )
                            );
                        }

                        return saved;
                    } catch (error) {
                        console.warn(
                            "Data update failed:",
                            error
                        );

                        return false;
                    }
                }
            );

        this._saveQueue =
            operation.catch(() => {});

        this._lastSavePromise =
            operation;

        return operation;
    },

    async forceSave() {
        try {
            if (
                this._cachedData ===
                null
            ) {
                await this._init();
            }

            return await this.set(
                this._cachedData
            );
        } catch (error) {
            console.warn(
                "Force save failed:",
                error
            );

            return false;
        }
    },

    async waitForSave() {
        return this._lastSavePromise;
    }
};


// ======================================================
// 2. UI CONTROLLER
//    INDEXEDDB VERSION - OFFLINE SAFE
// ======================================================

window.UI = {

    DB_NAME: "UITrackerDB",
    STORE_NAME: "uiData",
    KEY: "mission_ui",

    _cachedUI: null,
    _initPromise: null,
    _db: null,
    _saveQueue: Promise.resolve(),

    defaultUI() {
        return {
            section: "study",
            grade: 9
        };
    },

    async _openDB() {
        if (this._db) {
            return this._db;
        }

        return new Promise(resolve => {
            let finished = false;

            const finish = db => {
                if (finished) return;

                finished = true;
                resolve(db);
            };

            try {
                const request =
                    indexedDB.open(
                        this.DB_NAME
                    );

                request.addEventListener(
                    "upgradeneeded",
                    event => {
                        const db =
                            event.target.result;

                        if (
                            !db.objectStoreNames
                                .contains(
                                    this.STORE_NAME
                                )
                        ) {
                            db.createObjectStore(
                                this.STORE_NAME
                            );
                        }
                    }
                );

                request.addEventListener(
                    "success",
                    () => {
                        this._db =
                            request.result;

                        this._db.addEventListener(
                            "versionchange",
                            () => {
                                this._db.close();
                                this._db = null;
                            }
                        );

                        finish(this._db);
                    }
                );

                request.addEventListener(
                    "error",
                    () => {
                        console.warn(
                            "UI database unavailable."
                        );

                        finish(null);
                    }
                );
            } catch (error) {
                console.warn(
                    "UI database open failed:",
                    error
                );

                finish(null);
            }
        });
    },

    async _read(db) {
        if (!db) {
            return null;
        }

        return new Promise(resolve => {
            try {
                const transaction =
                    db.transaction(
                        this.STORE_NAME,
                        "readonly"
                    );

                const request =
                    transaction
                        .objectStore(
                            this.STORE_NAME
                        )
                        .get(this.KEY);

                request.addEventListener(
                    "success",
                    () => {
                        resolve(
                            request.result ||
                            null
                        );
                    }
                );

                request.addEventListener(
                    "error",
                    () => resolve(null)
                );
            } catch {
                resolve(null);
            }
        });
    },

    async _write(db, data) {
        if (!db) {
            return false;
        }

        return new Promise(resolve => {
            try {
                const transaction =
                    db.transaction(
                        this.STORE_NAME,
                        "readwrite"
                    );

                transaction
                    .objectStore(
                        this.STORE_NAME
                    )
                    .put(
                        data,
                        this.KEY
                    );

                transaction.addEventListener(
                    "complete",
                    () => resolve(true)
                );

                transaction.addEventListener(
                    "error",
                    () => resolve(false)
                );

                transaction.addEventListener(
                    "abort",
                    () => resolve(false)
                );
            } catch {
                resolve(false);
            }
        });
    },

    async _initUI() {
        if (
            this._cachedUI !== null
        ) {
            return this._cachedUI;
        }

        if (this._initPromise) {
            return this._initPromise;
        }

        this._initPromise =
            (async () => {
                const db =
                    await this._openDB();

                if (!db) {
                    this._cachedUI =
                        this.defaultUI();

                    return this._cachedUI;
                }

                const stored =
                    await this._read(db);

                this._cachedUI = {
                    ...this.defaultUI(),
                    ...(stored &&
                    typeof stored ===
                    "object"
                        ? stored
                        : {})
                };

                await this._write(
                    db,
                    this._cachedUI
                );

                return this._cachedUI;
            })();

        try {
            return await this._initPromise;
        } finally {
            this._initPromise = null;
        }
    },

    async save(section, grade) {
        const uiData = {
            section:
                section || "study",

            grade:
                Number(grade) || 9
        };

        const operation =
            this._saveQueue.then(
                async () => {
                    this._cachedUI =
                        uiData;

                    const db =
                        await this._openDB();

                    if (!db) {
                        return false;
                    }

                    return this._write(
                        db,
                        uiData
                    );
                }
            );

        this._saveQueue =
            operation.catch(() => {});

        return operation;
    },

    load() {
        return (
            this._cachedUI ||
            this.defaultUI()
        );
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
// 4. SAFE LOADER
// ======================================================

const MAX_RETRIES = 20;

window.loadSection = function (
    type,
    grade = 9,
    retry = 0
) {
    const main =
        document.getElementById(
            "main-content"
        );

    if (!main) {
        console.warn(
            "Main content missing"
        );

        return;
    }

    if (
        retry > MAX_RETRIES
    ) {
        main.innerHTML = `
            <div style="
                padding:20px;
                color:#ff4757;
            ">
                Failed to load module:
                ${type}
            </div>
        `;

        return;
    }

    if (
        type === "dashboard" &&
        !window.maxPagesByGrade
    ) {
        setTimeout(() => {
            window.loadSection(
                type,
                grade,
                retry + 1
            );
        }, 150);

        return;
    }

    const fnName =
        window.SectionMap[type];

    if (
        !fnName ||
        typeof window[fnName] !==
        "function"
    ) {
        setTimeout(() => {
            window.loadSection(
                type,
                grade,
                retry + 1
            );
        }, 150);

        return;
    }

    try {
        Promise.resolve(
            window.UI.save(
                type,
                grade
            )
        ).catch(error => {
            console.warn(
                "UI save failed:",
                error
            );
        });

        requestAnimationFrame(() => {
            try {
                if (
                    type === "study"
                ) {
                    window[fnName](grade);
                } else {
                    window[fnName]();
                }
            } catch (error) {
                console.error(
                    "Module render error:",
                    error
                );

                main.innerHTML = `
                    <div style="
                        padding:20px;
                        color:#ff4757;
                    ">
                        ${
                            error.message ||
                            "Module failed."
                        }
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error(
            "Module error:",
            error
        );

        main.innerHTML = `
            <div style="
                padding:20px;
                color:#ff4757;
            ">
                ${
                    error.message ||
                    "Module failed."
                }
            </div>
        `;
    }
};


// ======================================================
// 5. SYSTEM BOOT
// ======================================================

function waitForSystemReady(
    callback
) {
    let attempts = 0;

    const check = () => {
        attempts++;

        const ready =
            window.DataService &&
            window.SectionMap &&
            typeof window.loadSection ===
                "function";

        if (ready) {
            callback();
            return;
        }

        if (
            attempts > 100
        ) {
            console.error(
                "System boot timeout"
            );

            return;
        }

        setTimeout(
            check,
            50
        );
    };

    check();
}

window.waitForSystemReady =
    waitForSystemReady;


// ======================================================
// 6. PERSISTENT STORAGE REQUEST
// ======================================================

async function requestPersistentStorage() {
    try {
        if (
            navigator.storage &&
            typeof navigator.storage
                .persist ===
                "function"
        ) {
            const result =
                await navigator.storage
                    .persist();

            console.log(
                result
                    ? "✅ PERSISTENT STORAGE GRANTED"
                    : "⚠️ Persistent storage unavailable"
            );

            return result;
        }
    } catch (error) {
        console.warn(
            "Persistent storage error:",
            error
        );
    }

    return false;
}

window.requestPersistentStorage =
    requestPersistentStorage;


// ======================================================
// 7. START APP
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        try {
            await window.DataService
                ._init();

            await window.UI
                ._initUI();

            waitForSystemReady(() => {
                const lastUI =
                    window.UI.load();

                window.loadSection(
                    lastUI.section ||
                    "study",

                    lastUI.grade ||
                    9
                );

                requestPersistentStorage();
            });
        } catch (error) {
            console.error(
                "Application startup failed:",
                error
            );

            const main =
                document.getElementById(
                    "main-content"
                );

            if (main) {
                main.innerHTML = `
                    <div style="
                        padding:20px;
                        color:#ff4757;
                    ">
                        Application failed
                        to start.
                    </div>
                `;
            }
        }
    }
);


// ======================================================
// 8. RELIABILITY SYSTEM
//    OFFLINE SNAPSHOT ENGINE
// ======================================================

(function () {
    const SNAPSHOT_PREFIX =
        "study_snapshot_";

    const MAX_SNAPSHOTS = 5;

    const SNAPSHOT_DB_NAME =
        "SnapshotTrackerDB";

    const SNAPSHOT_STORE_NAME =
        "snapshots";

    let snapshotDBPromise = null;

    async function _openSnapshotDB() {
        if (snapshotDBPromise) {
            return snapshotDBPromise;
        }

        snapshotDBPromise =
            new Promise(resolve => {
                let finished = false;

                const finish = db => {
                    if (finished) return;

                    finished = true;
                    resolve(db);
                };

                try {
                    const request =
                        indexedDB.open(
                            SNAPSHOT_DB_NAME
                        );

                    request.addEventListener(
                        "upgradeneeded",
                        event => {
                            const db =
                                event.target
                                    .result;

                            if (
                                !db.objectStoreNames
                                    .contains(
                                        SNAPSHOT_STORE_NAME
                                    )
                            ) {
                                db.createObjectStore(
                                    SNAPSHOT_STORE_NAME
                                );
                            }
                        }
                    );

                    request.addEventListener(
                        "success",
                        () => {
                            const db =
                                request.result;

                            db.addEventListener(
                                "versionchange",
                                () => {
                                    db.close();
                                    snapshotDBPromise =
                                        null;
                                }
                            );

                            finish(db);
                        }
                    );

                    request.addEventListener(
                        "error",
                        () => {
                            console.warn(
                                "Snapshot DB unavailable."
                            );

                            finish(null);
                        }
                    );
                } catch (error) {
                    console.warn(
                        "Snapshot DB open failed:",
                        error
                    );

                    finish(null);
                }
            });

        return snapshotDBPromise;
    }

    async function _writeSnapshot(
        db,
        key,
        snapshot
    ) {
        if (!db) {
            return false;
        }

        return new Promise(resolve => {
            try {
                const transaction =
                    db.transaction(
                        SNAPSHOT_STORE_NAME,
                        "readwrite"
                    );

                transaction
                    .objectStore(
                        SNAPSHOT_STORE_NAME
                    )
                    .put(
                        snapshot,
                        key
                    );

                transaction.addEventListener(
                    "complete",
                    () => resolve(true)
                );

                transaction.addEventListener(
                    "error",
                    () => resolve(false)
                );

                transaction.addEventListener(
                    "abort",
                    () => resolve(false)
                );
            } catch {
                resolve(false);
            }
        });
    }

    async function createSnapshot() {
        try {
            await window.DataService
                .waitForSave();

            const raw =
                window.DataService
                    ._cachedData;

            if (
                !raw ||
                typeof raw !==
                "object"
            ) {
                return false;
            }

            const db =
                await _openSnapshotDB();

            if (!db) {
                return false;
            }

            const snapshot =
                typeof structuredClone ===
                "function"
                    ? structuredClone(raw)
                    : JSON.parse(
                        JSON.stringify(raw)
                    );

            const key =
                SNAPSHOT_PREFIX +
                Date.now();

            const saved =
                await _writeSnapshot(
                    db,
                    key,
                    snapshot
                );

            if (saved) {
                await cleanupSnapshots(
                    db
                );
            }

            return saved;
        } catch (error) {
            console.warn(
                "Snapshot creation failed:",
                error
            );

            return false;
        }
    }

    async function cleanupSnapshots(db) {
        if (!db) {
            return false;
        }

        return new Promise(resolve => {
            try {
                const readTransaction =
                    db.transaction(
                        SNAPSHOT_STORE_NAME,
                        "readonly"
                    );

                const request =
                    readTransaction
                        .objectStore(
                            SNAPSHOT_STORE_NAME
                        )
                        .getAllKeys();

                request.addEventListener(
                    "success",
                    () => {
                        const keys =
                            request.result
                                .sort();

                        const removeCount =
                            keys.length -
                            MAX_SNAPSHOTS;

                        if (
                            removeCount <= 0
                        ) {
                            resolve(true);
                            return;
                        }

                        try {
                            const deleteTransaction =
                                db.transaction(
                                    SNAPSHOT_STORE_NAME,
                                    "readwrite"
                                );

                            const store =
                                deleteTransaction
                                    .objectStore(
                                        SNAPSHOT_STORE_NAME
                                    );

                            keys
                                .slice(
                                    0,
                                    removeCount
                                )
                                .forEach(
                                    key => {
                                        store.delete(
                                            key
                                        );
                                    }
                                );

                            deleteTransaction
                                .addEventListener(
                                    "complete",
                                    () => resolve(
                                        true
                                    )
                                );

                            deleteTransaction
                                .addEventListener(
                                    "error",
                                    () => resolve(
                                        false
                                    )
                                );
                        } catch {
                            resolve(false);
                        }
                    }
                );

                request.addEventListener(
                    "error",
                    () => resolve(false)
                );
            } catch {
                resolve(false);
            }
        });
    }

    async function _getLatestSnapshot() {
        const db =
            await _openSnapshotDB();

        if (!db) {
            return null;
        }

        return new Promise(resolve => {
            try {
                const transaction =
                    db.transaction(
                        SNAPSHOT_STORE_NAME,
                        "readonly"
                    );

                const request =
                    transaction
                        .objectStore(
                            SNAPSHOT_STORE_NAME
                        )
                        .openCursor(
                            null,
                            "prev"
                        );

                request.addEventListener(
                    "success",
                    event => {
                        const cursor =
                            event.target
                                .result;

                        resolve(
                            cursor
                                ? cursor.value
                                : null
                        );
                    }
                );

                request.addEventListener(
                    "error",
                    () => resolve(null)
                );
            } catch {
                resolve(null);
            }
        });
    }

    async function recover() {
        try {
            await window.DataService
                ._init();

            const current =
                window.DataService
                    ._cachedData;

            const hasCurrentProgress =
                current &&
                current.studyProgress &&
                Object.keys(
                    current.studyProgress
                ).length > 0;

            if (hasCurrentProgress) {
                return false;
            }

            const snapshot =
                await _getLatestSnapshot();

            const hasSnapshotProgress =
                snapshot &&
                snapshot.studyProgress &&
                Object.keys(
                    snapshot.studyProgress
                ).length > 0;

            if (!hasSnapshotProgress) {
                return false;
            }

            const latest =
                window.DataService
                    ._cachedData;

            const stillEmpty =
                !latest ||
                !latest.studyProgress ||
                Object.keys(
                    latest.studyProgress
                ).length === 0;

            if (!stillEmpty) {
                return false;
            }

            await window.DataService
                .set(snapshot);

            console.log(
                "✅ Latest study snapshot recovered"
            );

            return true;
        } catch (error) {
            console.warn(
                "Recovery failed:",
                error
            );

            return false;
        }
    }

    function updateConnectionStatus() {
        document.body.dataset.online =
            navigator.onLine
                ? "true"
                : "false";
    }

    window.createStudySnapshot =
        createSnapshot;

    window.recoverStudySnapshot =
        recover;

    window.addEventListener(
        "online",
        updateConnectionStatus
    );

    window.addEventListener(
        "offline",
        updateConnectionStatus
    );

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            updateConnectionStatus();

            setTimeout(() => {
                recover();
            }, 500);

            setTimeout(() => {
                createSnapshot();
            }, 3000);

            setInterval(
                createSnapshot,
                1000 * 60 * 60
            );
        }
    );
})();
