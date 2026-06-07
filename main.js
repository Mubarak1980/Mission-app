"use strict";

// 1. DATA SERVICE
window.DataService = {
    STORAGE_KEY: "study_progress",
    get(fallback) {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : (fallback || { 
            startDate: new Date().toISOString().split("T")[0], 
            studyProgress: {},
            ui: { section: "study", grade: 9 }
        });
    },
    set(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
};

// 2. UI CONTROLLER
window.UI = {
    save(section, grade) { 
        const s = window.DataService.get(); 
        s.ui = { section, grade }; 
        window.DataService.set(s); 
    },
    load() { 
        return window.DataService.get().ui || { section: "study", grade: 9 }; 
    }
};



// 3. MODULE REGISTRY
window.SectionMap = { 
    study: "loadStudySection", 
    timetable: "loadWeeklyTimetable", 
    dashboard: "loadDashboard",
    topstudent: "loadTopStudentMode",
    sunnah: "loadSunnahTracker"
};

// 4. SAFE INITIALIZATION GATE (PWA FIX)
function waitForSystemReady(callback) {
    const check = () => {
        const ready =
            window.DataService &&
            typeof window.SectionMap !== "undefined" &&
            typeof window.loadSection === "function";

        if (!ready) {
            setTimeout(check, 50);
            return;
        }

        callback();
    };

    check();
}

// 5. CENTRAL LOADER (WITH SAFETY GUARD)
window.loadSection = (type, grade = 9) => {
    const main = document.getElementById("main-content");
    if (!main) return;

    // SAFETY GUARD: Check if config exists for the dashboard
    if (type === 'dashboard' && !window.maxPagesByGrade) {
        console.warn("Config not loaded, retrying...");
        setTimeout(() => window.loadSection(type, grade), 100);
        return;
    }

    const fnName = window.SectionMap[type];

    // STABILITY CHECK: Ensure module function is defined
    if (typeof window[fnName] !== 'function') {
        console.warn(`Module ${fnName} not yet ready, retrying...`);
        setTimeout(() => window.loadSection(type, grade), 150);
        return;
    }

    if (typeof window[fnName] === 'function') {
        try {
            window.UI.save(type, grade);

            if (type === 'study') {
                window[fnName](grade); 
            } else {
                window[fnName](); 
            }

        } catch (err) {
            console.error(`Runtime Error in ${fnName}:`, err);
            main.innerHTML = `<div style="padding:20px; color:red;">Module load error: ${err.message}</div>`;
        }
    } else {
        console.error(`Missing function: ${fnName}`);
        main.innerHTML = `<div style="padding:20px; color:red;">Module '${type}' not found.</div>`;
    }
};

// 6. INITIALIZATION (PWA SAFE BOOT)
document.addEventListener("DOMContentLoaded", () => {

    waitForSystemReady(() => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });

});
    
// ======================================================
// 🛡️ RELIABILITY LAYER v1.0
// ======================================================

(function () {

    const SNAPSHOT_PREFIX = "study_snapshot_";
    const MAX_SNAPSHOTS = 5;

    // ==================================================
    // 💾 PERSISTENT STORAGE
    // ==================================================
    async function enablePersistentStorage() {

        if (!navigator.storage?.persist) return;

        try {

            const granted =
                await navigator.storage.persist();

            console.log(
                granted
                    ? "✅ Persistent Storage Enabled"
                    : "⚠️ Persistent Storage Not Granted"
            );

        } catch (err) {

            console.warn(
                "Persistent storage failed:",
                err
            );

        }
    }

    // ==================================================
    // 📸 SNAPSHOT SYSTEM
    // ==================================================
    function createSnapshot() {

        try {

            const raw =
                localStorage.getItem(
                    window.DataService.STORAGE_KEY
                );

            if (!raw) return;

            const key =
                SNAPSHOT_PREFIX +
                Date.now();

            localStorage.setItem(
                key,
                raw
            );

            cleanupSnapshots();

        } catch (err) {

            console.warn(
                "Snapshot creation failed:",
                err
            );

        }
    }

    function cleanupSnapshots() {

        const snapshots =
            Object.keys(localStorage)
                .filter(k =>
                    k.startsWith(
                        SNAPSHOT_PREFIX
                    )
                )
                .sort();

        while (
            snapshots.length >
            MAX_SNAPSHOTS
        ) {

            const oldest =
                snapshots.shift();

            localStorage.removeItem(
                oldest
            );
        }
    }

    // ==================================================
    // 🚑 RECOVERY SYSTEM
    // ==================================================
    function recoverCorruptedData() {

        try {

            const raw =
                localStorage.getItem(
                    window.DataService.STORAGE_KEY
                );

            if (!raw) return;

            JSON.parse(raw);

        } catch (err) {

            console.warn(
                "Corrupted data detected"
            );

            const snapshots =
                Object.keys(localStorage)
                    .filter(k =>
                        k.startsWith(
                            SNAPSHOT_PREFIX
                        )
                    )
                    .sort();

            const latest =
                snapshots.pop();

            if (!latest) return;

            const backup =
                localStorage.getItem(
                    latest
                );

            if (backup) {

                localStorage.setItem(
                    window.DataService.STORAGE_KEY,
                    backup
                );

                console.log(
                    "✅ Restored latest snapshot"
                );
            }
        }
    }

    // ==================================================
    // 📅 DATE CHANGE DETECTOR
    // ==================================================
    function detectDateChange() {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        const previous =
            localStorage.getItem(
                "mission_last_date"
            );

        if (
            previous &&
            previous !== today
        ) {

            console.log(
                "📅 New Day Detected"
            );

            window.dispatchEvent(
                new CustomEvent(
                    "mission:newday",
                    {
                        detail: {
                            oldDate: previous,
                            newDate: today
                        }
                    }
                )
            );
        }

        localStorage.setItem(
            "mission_last_date",
            today
        );
    }

    // ==================================================
    // 📡 OFFLINE MONITOR
    // ==================================================
    function updateConnectionStatus() {

        const online =
            navigator.onLine;

        console.log(
            online
                ? "🟢 Online"
                : "🔴 Offline"
        );

        document.body.dataset.online =
            online
                ? "true"
                : "false";
    }

    window.addEventListener(
        "online",
        updateConnectionStatus
    );

    window.addEventListener(
        "offline",
        updateConnectionStatus
    );

    // ==================================================
    // 🔍 STORAGE HEALTH CHECK
    // ==================================================
    async function checkStorageHealth() {

        if (
            !navigator.storage?.estimate
        ) return;

        try {

            const estimate =
                await navigator.storage
                    .estimate();

            console.log(
                "Storage Usage:",
                Math.round(
                    estimate.usage / 1024
                ),
                "KB"
            );

        } catch (err) {

            console.warn(
                "Storage estimate failed",
                err
            );

        }
    }

    // ==================================================
    // 🚀 BOOT
    // ==================================================
    document.addEventListener(
        "DOMContentLoaded",
        () => {

            enablePersistentStorage();

            recoverCorruptedData();

            detectDateChange();

            updateConnectionStatus();

            checkStorageHealth();

            createSnapshot();

            setInterval(
                createSnapshot,
                1000 * 60 * 30
            ); // every 30 minutes
        }
    );

})();
