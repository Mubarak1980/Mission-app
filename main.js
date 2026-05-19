// ===============================
// MAIN ENGINE (FINAL STABLE VERSION)
// ===============================

(() => {
"use strict";

/* ===============================
   CONSTANTS
=============================== */
const GRADES = [9, 10, 11, 12];
const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English"];

const TOTAL_DAYS = 90;
const TOTAL_PAGES = 5705;

/* ===============================
   STORAGE UTILITIES
=============================== */
const Storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
};

/* ===============================
   DATE UTIL
=============================== */
function todayISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .split("T")[0];
}

/* ===============================
   CYCLE ENGINE
=============================== */
function getCycleState() {
  const today = todayISO();
  const state = Storage.get("cycleState", { startDate: today });

  const start = new Date(state.startDate);
  const now = new Date(today);

  const diffDays =
    Math.floor(
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
   PROGRESS ENGINE
=============================== */
function getExpectedProgress() {
  const { cycleDay } = getCycleState();

  return {
    cycleDay,
    remainingDays: Math.max(0, TOTAL_DAYS - cycleDay),
    expectedPages: Math.round((cycleDay / TOTAL_DAYS) * TOTAL_PAGES)
  };
}

function getActualProgress() {
  let total = 0;

  for (const g of GRADES) {
    const saved = Storage.get(`grade_${g}_progress`, {});
    for (const s of SUBJECTS) {
      total += Number(saved?.[s]) || 0;
    }
  }

  return total;
}

/* ===============================
   STATUS ENGINE
=============================== */
function getDelayStatus() {
  const expected = getExpectedProgress();
  const actual = getActualProgress();

  const gap = actual - expected.expectedPages;

  let status = "🟢 ON TRACK";
  if (gap < 0 && gap >= -200) status = "🟡 SLIGHTLY BEHIND";
  if (gap < -200) status = "🔴 CRITICAL";

  return {
    ...expected,
    actualPages: actual,
    gap,
    status
  };
}

/* ===============================
   SMART CYCLE
=============================== */
function getSmartCycle() {
  const cycle = getDelayStatus();

  const remainingDays = Math.max(1, TOTAL_DAYS - cycle.cycleDay);
  const catchUp =
    cycle.gap < 0
      ? Math.min(Math.ceil(Math.abs(cycle.gap) / remainingDays), 60)
      : 0;

  let target = (TOTAL_PAGES / TOTAL_DAYS) + catchUp;
  target = Math.min(Math.max(target, 25), 85);

  return {
    ...cycle,
    catchUpPerDay: catchUp,
    remainingDays,
    dailyTarget: Math.round(target),
    intensity: target <= 70 ? "SAFE" : "HIGH"
  };
}

/* ===============================
   UI STATE
=============================== */
const UI = {
  currentGrade: 9,
  currentSection: "study",

  save() {
    Storage.set("ui_state", {
      grade: this.currentGrade,
      section: this.currentSection
    });
  },

  load() {
    const saved = Storage.get("ui_state", null);
    if (!saved) return;

    this.currentGrade = Number(saved.grade) || 9;
    this.currentSection = saved.section || "study";
  }
};

/* ===============================
   NAV CONTROLLER
=============================== */
const Nav = {
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
   SAFE MODULE CALL
=============================== */
function safeCall(fnName, fallbackText) {
  const fn = window[fnName];

  if (typeof fn !== "function") {
    const main = document.getElementById("main-content");

    if (main) {
      main.innerHTML = `
        <p style="padding:20px;text-align:center;color:red;">
          ${fallbackText}
        </p>
      `;
    }

    console.warn("Missing module:", fnName);
    return false;
  }

  return true;
}

/* ===============================
   SECTION MAP
=============================== */
const SectionMap = {
  study: () => {
    if (!safeCall("loadStudySection", "Study Tracker not loaded")) return;
    window.loadStudySection(UI.currentGrade);
  },

  timetable: () => {
    if (!safeCall("loadWeeklyTimetable", "Timetable not loaded")) return;
    window.loadWeeklyTimetable();
  },

  dashboard: () => {
    if (!safeCall("loadDashboard", "Dashboard not loaded")) return;
    window.loadDashboard();
  },

  "top-student": () => {
    if (!safeCall("loadTopStudentMode", "Top Student Mode not loaded")) return;
    window.loadTopStudentMode();
  },

  sunnah: () => {
    if (!safeCall("loadSunnahTracker", "Sunnah Tracker not loaded")) return;
    window.loadSunnahTracker();
  }
};

/* ===============================
   LOAD SECTION
=============================== */
function loadSection(type, grade) {
  UI.currentSection = type;

  const g = Number(grade);
  if (!isNaN(g)) UI.currentGrade = g;

  UI.save();
  Nav.update();

  const fn = SectionMap[type];
  if (typeof fn === "function") fn();
}

/* ===============================
   NAV ACTIONS
=============================== */
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
   INIT
=============================== */
let initialized = false;

function initApp() {
  if (initialized) return;
  initialized = true;

  UI.load();
  Nav.init();
  getCycleState();

  console.log("✅ Mission App Initialized");

  requestAnimationFrame(() => {
    loadSection(UI.currentSection, UI.currentGrade);
  });
}

/* ===============================
   BOOTSTRAP
=============================== */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

/* ===============================
   GLOBAL EXPORTS (IMPORTANT FIX)
=============================== */
window.loadSection = loadSection;
window.nextGrade = nextGrade;
window.previousGrade = previousGrade;

// 🔥 CRITICAL FIX FOR YOUR OTHER FILES
window.UI = UI;
window.getCurrentGradeSafe = () => UI.currentGrade || 9;

})();
