"use strict";

// ======================================================
// 1. DATA SERVICE (SAFE VERSION)
// ======================================================
window.DataService = {
    STORAGE_KEY: "study_progress",

    get(fallback) {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);

            if (!raw) return fallback || this.defaultData();

            return JSON.parse(raw);

        } catch (err) {
            console.warn("Data parse error:", err);
            return fallback || this.defaultData();
        }
    },

    set(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.warn("Storage write error:", err);
        }
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
// 2. UI CONTROLLER (FAST + SIMPLE STORAGE)
// ======================================================
window.UI = {
    save(section, grade) {
        localStorage.setItem(
            "mission_ui",
            JSON.stringify({ section, grade })
        );
    },

    load() {
        try {
            return JSON.parse(localStorage.getItem("mission_ui")) || {
                section: "study",
                grade: 9
            };
        } catch {
            return { section: "study", grade: 9 };
        }
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
// 6. START APP
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    waitForSystemReady(() => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
});

// ======================================================
// 🛡️ RELIABILITY SYSTEM (SAFE VERSION)
// ======================================================
(function () {

    const SNAPSHOT_PREFIX = "study_snapshot_";
    const MAX_SNAPSHOTS = 5;

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
    // SNAPSHOT SYSTEM
    // -------------------------------
    function createSnapshot() {
        try {
            const raw = localStorage.getItem(window.DataService.STORAGE_KEY);
            if (!raw) return;

            const key = SNAPSHOT_PREFIX + Date.now();
            localStorage.setItem(key, raw);

            cleanupSnapshots();
        } catch {}
    }

    function cleanupSnapshots() {
        const snaps = Object.keys(localStorage)
            .filter(k => k.startsWith(SNAPSHOT_PREFIX))
            .sort();

        while (snaps.length > MAX_SNAPSHOTS) {
            localStorage.removeItem(snaps.shift());
        }
    }

    // -------------------------------
    // RECOVERY
    // -------------------------------
    function recover() {
        try {
            const raw = localStorage.getItem(window.DataService.STORAGE_KEY);
            if (raw) JSON.parse(raw);
        } catch {
            const snaps = Object.keys(localStorage)
                .filter(k => k.startsWith(SNAPSHOT_PREFIX))
                .sort();

            const last = snaps.pop();
            if (!last) return;

            localStorage.setItem(
                window.DataService.STORAGE_KEY,
                localStorage.getItem(last)
            );
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
