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
   💾 TRUE NATIVE STORAGE ENGINE (HYBRID INTERNAL STORAGE)
===================================================== */
const NATIVE_FILE_NAME = "mission_app_progress.json";
window.cachedNativeData = {}; 
window.isNativeStorageReady = false; // Safety bridge flag

const Storage = {
  // Read Data
  get(key, fallback) {
    // If native hardware file is ready, read from memory cache
    if (window.isNativeStorageReady && window.cachedNativeData && window.cachedNativeData[key] !== undefined) {
      return window.cachedNativeData[key];
    }
    // Fallback to standard browser storage if native hardware isn't ready yet
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  // Save Data
  set(key, value) {
    // 1. Always update memory cache instantly
    window.cachedNativeData[key] = value;
    
    // 2. Always write to localStorage as a quick backup tier
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Browser storage mirror backup skipped");
    }

    // 3. If native hardware is ready, write directly to the phone's internal storage chip
    if (window.isNativeStorageReady && window.cordova && window.cordova.file) {
      const dataStringToSave = JSON.stringify(window.cachedNativeData);
      const path = cordova.file.dataDirectory; // Secure internal storage folder

      window.resolveLocalFileSystemURL(path, (dir) => {
        dir.getFile(NATIVE_FILE_NAME, { create: true, exclusive: false }, (fileEntry) => {
          fileEntry.createWriter((fileWriter) => {
            fileWriter.onwriteend = () => {
              console.log("💾 SUCCESS: Progress saved directly to phone internal storage!");
            };
            fileWriter.onerror = (e) => console.error("Internal storage write failed:", e);

            const blob = new Blob([dataStringToSave], { type: "text/plain" });
            fileWriter.write(blob);
          });
        });
      });
    }
  },

  // Read the hidden file from internal storage when phone boots up
  initNativeFileSystem(callback) {
    const loadFromHardwareFile = () => {
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
                    window.isNativeStorageReady = true;
                    console.log("📥 SUCCESS: Loaded progress from phone internal storage.");
                    
                    // Sync internal storage data back to localStorage layer just in case
                    for (const key in window.cachedNativeData) {
                      localStorage.setItem(key, JSON.stringify(window.cachedNativeData[key]));
                    }
                  } else {
                    // File is empty, mark ready anyway to allow writing
                    window.isNativeStorageReady = true;
                  }
                } catch (e) {
                  console.error("Error parsing internal file data:", e);
                  window.isNativeStorageReady = true; 
                }
                if (typeof callback === "function") callback();
              };
              reader.readAsText(file);
            });
          }, () => { window.isNativeStorageReady = true; if (typeof callback === "function") callback(); });
        }, () => { window.isNativeStorageReady = true; if (typeof callback === "function") callback(); });
      } else {
        window.isNativeStorageReady = false; // Not running in Cordova shell package
        if (typeof callback === "function") callback();
      }
    };

    // Safety Bridge: Wait for device hardware to be fully ready before touching files
    if (window.cordova) {
      document.addEventListener("deviceready", loadFromHardwareFile, false);
    } else {
      // If running inside a normal web browser testing environment, boot up immediately
      document.addEventListener("deviceready", loadFromHardwareFile, false);
      setTimeout(() => {
        if (!window.isNativeStorageReady) {
          console.log("ℹ️ Running in browser standard storage environment.");
          if (typeof callback === "function") callback();
        }
      }, 500);
    }
  }
};

/* ===============================
   🔒 STORAGE PROTECTION ENGINE (PERSISTENT API TIER)
=============================== */
async function enforceDataPersistence() {
    try {
        if (navigator.storage && navigator.storage.persist) {
            let alreadyPersisted = await navigator.storage.persisted();
            if (!alreadyPersisted) {
                alreadyPersisted = await navigator.storage.persist();
            }
            if (alreadyPersisted) {
                console.log("🔒 Storage Protection: ACTIVE.");
            }
        }
    } catch (error) {
        console.error("Persistence Engine failed to initialize:", error);
    }
}

/* ===============================
   MAX PAGES DATA
=============================== */
window.maxPagesByGrade = window.maxPagesByGrade && Object.keys(window.maxPagesByGrade).length ? window.maxPagesByGrade : {
  9: { Math: 363, Physics: 174, Chemistry: 175, Biology: 164, English: 223 },
  10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174, English: 316 },
  11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284, English: 283 },
  12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354, English: 263 }
};

/* ===============================
   CONSTANTS
=============================== */
const GRADES = [9, 10, 11, 12];
const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English"];
const TOTAL_DAYS = 90;
const TOTAL_PAGES = 5705;

/* ===============================
   DATE UTIL (LOCAL-SAFE TIMEZONE ADJUSTMENT)
=============================== */
function todayISO() {
  const d = new Date();
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
  const state = Storage.get("cycleState", { startDate: today });
  const start = new Date(state.startDate);
  const now = new Date(today);

  const diffDays = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
     Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000
  );

  const cycleDay = Math.min(Math.max(1, diffDays + 1), TOTAL_DAYS);
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
  if (gap >= 300) status = "🟢 AHEAD 🚀";
  else if (gap >= 0) status = "🟢 ON TRACK";
  else if (gap >= -150) status = "🟡 SLIGHTLY BEHIND";
  else if (gap >= -400) status = "🟠 BEHIND";
  else status = "🔴 CRITICAL";

  return { ...expected, actualPages: actual, gap, status };
}

/* ===============================
   SMART CYCLE ENGINE
=============================== */
function getSmartCycle() {
  const cycle = getDelayStatus();
  const remainingDays = Math.max(1, TOTAL_DAYS - cycle.cycleDay);
  const gap = Number(cycle.gap) || 0;
  const baseTarget = TOTAL_PAGES / TOTAL_DAYS;

  let catchUpPerDay = 0;
  if (gap < -50) {
    catchUpPerDay = Math.ceil(Math.abs(gap) / remainingDays);
  }
  catchUpPerDay = Math.min(catchUpPerDay, 40);

  let dailyTarget = baseTarget + catchUpPerDay;
  dailyTarget = Math.max(25, Math.min(dailyTarget, 90));

  let intensity = "SAFE";
  if (dailyTarget > 75) intensity = "HIGH";
  else if (dailyTarget > 60) intensity = "MODERATE";

  let pressure = "ON_TRACK";
  if (gap < -500) pressure = "CRITICAL";
  else if (gap < -250) pressure = "HIGH";
  else if (gap < -50) pressure = "LOW_BACKLOG";

  const structuralBase = Math.round(baseTarget);
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
  currentSection: "study",

  save() {
    Storage.set("ui_state", { grade: this.currentGrade, section: this.currentSection });
  },

  load() {
    const saved = Storage.get("ui_state", null);
    this.currentSection = "study";
    if (!saved) {
      this.currentGrade = 9;
      return;
    }
    this.currentGrade = Number(saved.grade) || 9;
  }
};

/* ===============================
   NAVIGATION INTERFACE HOOKS
=============================== */
const Nav = {
  nav: null, prev: null, next: null,
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
      main.innerHTML = `<p style="padding:20px; color:red; text-align:center;">${message}</p>`;
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
  if (typeof type !== "string") type = "study";
  UI.currentSection = type;
  const parsedGrade = Number(grade);

  if (!isNaN(parsedGrade)) {
    UI.currentGrade = Math.min(12, Math.max(9, parsedGrade));
  }

  UI.save();
  Nav.update();

  if (typeof SectionMap[type] === "function") SectionMap[type]();
}

function nextGrade() { if (UI.currentGrade < 12) loadSection("study", UI.currentGrade + 1); }
function previousGrade() { if (UI.currentGrade > 9) loadSection("study", UI.currentGrade - 1); }

/* ===============================
   INITIALIZE CORE APPLICATION WORKSPACE
=============================== */
let initialized = false;

function initApp() {
  if (initialized) return;
  initialized = true;

  // Hybrid file loader: safe loading tier loop integration
  Storage.initNativeFileSystem(() => {
    UI.load();
    Nav.init();
    getCycleState();
    enforceDataPersistence();

    console.log("🚀 Mission App Ready: HYBRID HARWARE TRACKING ACTIVE");

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
   EXPORTS
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
