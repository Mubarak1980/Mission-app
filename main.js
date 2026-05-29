"use strict";

// =====================================================
// 📘 MAIN ENGINE (CASE-ALIGNED & TIMEZONE-SAFE PRODUCTION VERSION)
// =====================================================

(() => {

/* ===============================
   SAFETY WRAPPER
=============================== */
try {

/* =====================================================
   💾 TRUE NATIVE STORAGE ENGINE (LOCAL DIRECT FILE-SYSTEM)
===================================================== */
const NATIVE_FILE_NAME = "mission_app_progress.json";
window.cachedNativeData = {}; // Fast running in-memory data mirror

const Storage = {
  // Synchronous read for core application engine runtime loops
  get(key, fallback) {
    if (window.cachedNativeData && window.cachedNativeData[key] !== undefined) {
      return window.cachedNativeData[key];
    }
    // Fallback to legacy localstorage if native disk hasn't loaded to cache memory yet
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  // Native asynchronous direct hard-drive writing portal
  set(key, value) {
    // 1. Update running memory layer cache instantly
    window.cachedNativeData[key] = value;
    
    // 2. Mirror copy to localStorage as a redundant secondary backup tier
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Local storage mirror sync skipped");
    }

    // 3. Commit write natively straight to Android Storage chip hardware
    document.addEventListener("deviceready", () => {
      if (window.cordova && window.cordova.file) {
        const dataStringToSave = JSON.stringify(window.cachedNativeData);
        const path = cordova.file.dataDirectory; // App's secure private folder (Immune to Chrome cleans)

        window.resolveLocalFileSystemURL(path, (dir) => {
          dir.getFile(NATIVE_FILE_NAME, { create: true, exclusive: false }, (fileEntry) => {
            fileEntry.createWriter((fileWriter) => {
              fileWriter.onwriteend = () => {
                console.log("💾 SUCCESS: Progress written directly to device hard drive!");
              };
              fileWriter.onerror = (e) => console.error("Native storage commit failed:", e);

              const blob = new Blob([dataStringToSave], { type: "text/plain" });
              fileWriter.write(blob);
            });
          });
        });
      }
    }, false);
  },

  // Runs on application boot sequence to read tracking datasets back from hardware
  initNativeFileSystem(callback) {
    document.addEventListener("deviceready", () => {
      if (window.cordova && window.cordova.file) {
        const path = cordova.file.dataDirectory;
        window.resolveLocalFileSystemURL(path, (dir) => {
          dir.getFile(NATIVE_FILE_NAME, { create: true, exclusive: false }, (fileEntry) => {
            fileEntry.file((file) => {
              const reader = new FileReader();
              reader.onloadend = function() {
                try {
                  if (this.result) {
                    window.cachedNativeData = JSON.parse(this.result);
                    console.log("📥 SUCCESS: Re-loaded progress database from physical hardware storage.");
                  }
                } catch (e) {
                  console.error("Error breaking down native file dictionary structures:", e);
                }
                if (typeof callback === "function") callback();
              };
              reader.readAsText(file);
            });
          }, () => { if (typeof callback === "function") callback(); });
        }, () => { if (typeof callback === "function") callback(); });
      } else {
        if (typeof callback === "function") callback();
      }
    }, false);
  }
};

/* ===============================
   🔒 STORAGE PROTECTION ENGINE (PERSISTENT API TIER)
=============================== */
async function enforceDataPersistence() {
    try {
        if (navigator.storage && navigator.storage.persist) {
            // Check if it is already locked first
            let alreadyPersisted = await navigator.storage.persisted();
            
            if (!alreadyPersisted) {
                // Request Chrome to lock the storage tier
                alreadyPersisted = await navigator.storage.persist();
            }

            if (alreadyPersisted) {
                console.log("🔒 Storage Protection: ACTIVE. Chrome has locked your database against automated cache cleans.");
            } else {
                console.warn("⚠️ Storage Protection: RESTRICTED. Chrome is handling data in standard tier.");
            }
        }
    } catch (error) {
        console.error("Persistence Engine failed to initialize:", error);
    }
}

/* ===============================
   MAX PAGES DATA
=============================== */
// Refined: Ensuring object keys do not get overwritten if data.js loads late
window.maxPagesByGrade = window.maxPagesByGrade && Object.keys(window.maxPagesByGrade).length ? window.maxPagesByGrade : {
  9: {
    Math: 363,
    Physics: 174,
    Chemistry: 175,
    Biology: 164,
    English: 223
  },

  10: {
    Math: 385,
    Physics: 249,
    Chemistry: 298,
    Biology: 174,
    English: 316
  },

  11: {
    Math: 479,
    Physics: 329,
    Chemistry: 330,
    Biology: 284,
    English: 283
  },

  12: {
    Math: 416,
    Physics: 177,
    Chemistry: 287,
    Biology: 354,
    English: 263
  }
};

/* ===============================
   CONSTANTS
=============================== */
const GRADES = [9, 10, 11, 12];

const SUBJECTS = [
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "English"
];

const TOTAL_DAYS = 90;

const TOTAL_PAGES = 5705;

/* ===============================
   DATE UTIL (LOCAL-SAFE TIMEZONE ADJUSTMENT)
=============================== */
function todayISO() {
  const d = new Date();
  
  // Fixed: Pulls local calendar dates directly to stop UTC rolling over early in East Africa Time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/* ===============================
   CYCLE ENGINE
=============================== */
function getCycleState() {
  const today = todayISO();

  const state = Storage.get(
    "cycleState",
    { startDate: today }
  );

  const start = new Date(state.startDate);
  const now = new Date(today);

  const diffDays = Math.floor(
    (
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
    ) / 86400000
  );

  const cycleDay = Math.min(
    Math.max(1, diffDays + 1),
    TOTAL_DAYS
  );

  const result = {
    ...state,
    cycleDay,
    remainingDays: Math.max(0, TOTAL_DAYS - cycleDay)
  };

  Storage.set("cycleState", result);
  return result;
}

/* ===============================
   EXPECTED PROGRESS
=============================== */
function getExpectedProgress() {
  const cycle = getCycleState();

  return {
    cycleDay: Number(cycle.cycleDay) || 1,
    remainingDays: Number(cycle.remainingDays) || 0,
    expectedPages: Math.round(((Number(cycle.cycleDay) || 1) / TOTAL_DAYS) * TOTAL_PAGES)
  };
}

/* ===============================
   ACTUAL PROGRESS
=============================== */
function getActualProgress() {
  let total = 0;

  for (const grade of GRADES) {
    const saved = Storage.get(`grade_${grade}_progress`, {});
    for (const subject of SUBJECTS) {
      const value = Number(saved?.[subject]);
      total += isNaN(value) ? 0 : value;
    }
  }

  return Math.max(0, Math.round(total));
}

/* ===============================
   DELAY STATUS
=============================== */
function getDelayStatus() {
  const expected = getExpectedProgress();
  const actual = getActualProgress();
  const gap = actual - expected.expectedPages;

  let status = "🟢 ON TRACK";

  if (gap >= 300) {
    status = "🟢 AHEAD 🚀";
  } else if (gap >= 0) {
    status = "🟢 ON TRACK";
  } else if (gap >= -150) {
    status = "🟡 SLIGHTLY BEHIND";
  } else if (gap >= -400) {
    status = "🟠 BEHIND";
  } else {
    status = "🔴 CRITICAL";
  }

  return {
    ...expected,
    actualPages: actual,
    gap,
    status
  };
}

/* ===============================
   SMART CYCLE ENGINE
=============================== */
function getSmartCycle() {
  const cycle = getDelayStatus();
  const remainingDays = Math.max(1, TOTAL_DAYS - cycle.cycleDay);
  const gap = Number(cycle.gap) || 0;
  
  // 📈 5705 pages / 90 days baseline evaluation
  const baseTarget = TOTAL_PAGES / TOTAL_DAYS;

  let catchUpPerDay = 0;
  if (gap < -50) {
    catchUpPerDay = Math.ceil(Math.abs(gap) / remainingDays);
  }

  catchUpPerDay = Math.min(catchUpPerDay, 40);

  let dailyTarget = baseTarget + catchUpPerDay;
  dailyTarget = Math.max(25, Math.min(dailyTarget, 90));

  let intensity = "SAFE";
  if (dailyTarget > 75) {
    intensity = "HIGH";
  } else if (dailyTarget > 60) {
    intensity = "MODERATE";
  }

  let pressure = "ON_TRACK";
  if (gap < -500) {
    pressure = "CRITICAL";
  } else if (gap < -250) {
    pressure = "HIGH";
  } else if (gap < -50) {
    pressure = "LOW_BACKLOG";
  }

  // Ensure calculations return at least a baseline target of 63 pages
  const structuralBase = Math.round(baseTarget);

  // 📊 EXTRA TRACKER METRICS: MASTER COMPLETION CALCULATION
  const actualPages = cycle.actualPages || 0;
  const totalPagesPercentage = Math.min(100, Math.max(0, parseFloat(((actualPages / TOTAL_PAGES) * 100).toFixed(1))));
  const remainingPages = Math.max(0, TOTAL_PAGES - actualPages);

  return {
    ...cycle,
    remainingDays,
    catchUpPerDay,
    dailyTarget: Math.round(dailyTarget),
    intensity,
    pressure,
    baseTarget: structuralBase > 0 ? structuralBase : 63,
    // Properties exported for dashboard layout rendering
    TOTAL_PAGES,
    totalPagesPercentage,
    remainingPages
  };
}

/* ===============================
   UI STATE
=============================== */
const UI = {
  currentGrade: 9,
  currentSection: "study", // Default fallback initialization anchor

  save() {
    Storage.set(
      "ui_state",
      {
        grade: this.currentGrade,
        section: this.currentSection
      }
    );
  },

  load() {
    const saved = Storage.get("ui_state", null);
    
    // 🔒 Always force layout entry space back to Study Tracker on fresh system loads/refreshes
    this.currentSection = "study";

    if (!saved) {
      this.currentGrade = 9;
      return;
    }

    // Retain your active grade selection cleanly across initializations
    this.currentGrade = Number(saved.grade) || 9;
  }
};

/* ===============================
   NAVIGATION INTERFACE HOOKS
=============================== */
const Nav = {
  nav: null,
  prev: null,
  next: null,

  init() {
    this.nav = document.getElementById("grade-nav");
    this.prev = document.getElementById("prev-btn");
    this.next = document.getElementById("next-btn");
  },

  update() {
    if (!this.nav || !this.prev || !this.next) return;

    if (UI.currentSection === "study") {
      this.nav.style.display = "flex";
      this.prev.disabled = UI.currentGrade <= 9;
      this.next.disabled = UI.currentGrade >= 12;
    } else {
      this.nav.style.display = "none";
    }
  }
};

/* ===============================
   SAFE EXTERNAL VIEW INTERACTION CALLS
=============================== */
function safeCall(fnName, message) {
  if (typeof window[fnName] !== "function") {
    const main = document.getElementById("main-content");
    if (main) {
      main.innerHTML = `
        <p style="padding:20px; color:red; text-align:center;">
          ${message}
        </p>
      `;
    }
    console.error(`Missing function: ${fnName}`);
    return false;
  }
  return true;
}

/* ===============================
   SECTION ROUTER MAP
=============================== */
const SectionMap = {
  study: () => {
    if (!safeCall("loadStudySection", "Study Tracker failed to load")) return;
    window.loadStudySection(UI.currentGrade);
  },
  timetable: () => {
    if (!safeCall("loadWeeklyTimetable", "Weekly Timetable failed to load")) return;
    window.loadWeeklyTimetable();
  },
  dashboard: () => {
    if (!safeCall("loadDashboard", "Dashboard failed to load")) return;
    window.loadDashboard();
  },
  "top-student": () => {
    if (!safeCall("loadTopStudentMode", "Top Student Mode failed to load")) return;
    window.loadTopStudentMode();
  },
  sunnah: () => {
    if (!safeCall("loadSunnahTracker", "Sunnah Tracker failed to load")) return;
    window.loadSunnahTracker();
  }
};

/* ===============================
   LOAD GLOBAL SECTION LAYER
=============================== */
function loadSection(type, grade) {
  if (typeof type !== "string") {
    type = "study";
  }

  UI.currentSection = type;
  const parsedGrade = Number(grade);

  if (!isNaN(parsedGrade)) {
    UI.currentGrade = Math.min(12, Math.max(9, parsedGrade));
  }

  UI.save();
  Nav.update();

  if (typeof SectionMap[type] === "function") {
    SectionMap[type]();
  } else {
    console.warn("Unknown section:", type);
  }
}

function nextGrade() {
  if (UI.currentGrade < 12) {
    loadSection("study", UI.currentGrade + 1);
  }
}

function previousGrade() {
  if (UI.currentGrade > 9) {
    loadSection("study", UI.currentGrade - 1);
  }
}

/* ===============================
   INITIALIZE CORE APPLICATION WORKSPACE
=============================== */
let initialized = false;

function initApp() {
  if (initialized) return;
  initialized = true;

  // Intercept boot flow: Read physical file configurations from hardware space first
  Storage.initNativeFileSystem(() => {
    UI.load();
    Nav.init();
    getCycleState();
    
    // Fire storage protection loop
    enforceDataPersistence();

    console.log("🚀 Mission App Ready: HARDWARE TRACKING MODE ACTIVE");

    requestAnimationFrame(() => {
      loadSection(UI.currentSection, UI.currentGrade);
    });
  });
}

/* ===============================
   SERVICE WORKER CONTROL INTERACTION MESSAGES
=============================== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_ACTIVATED") {
      console.log("✅ Service Worker Updated");
    }
  });
}

/* ===============================
   BOOTSTRAP INTERFACE TRIGGER
=============================== */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

/* ===============================
   EXPORTS (Declared safely prior to lifecycle thread compilation loops)
=============================== */
window.loadSection = loadSection;
window.nextGrade = nextGrade;
window.previousGrade = previousGrade;
window.UI = UI;
window.getCurrentGradeSafe = () => UI.currentGrade || 9;
window.getSmartCycle = getSmartCycle;
window.getCycleState = getCycleState;
window.getExpectedProgress = getExpectedProgress;
window.getActualProgress = getActualProgress;
window.isRunningStandalone = () => true;

} catch (err) {
  console.error("🔥 Main engine crashed:", err);
}

})();
                              
