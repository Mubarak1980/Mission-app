"use strict";

// ===============================
// MAIN ENGINE (FINAL IMPROVED VERSION)
// ===============================

(() => {

/* ===============================
   SAFETY WRAPPER (ADDED)
   Prevents silent crashes in PWA
=============================== */
try {

/* ===============================
   MAX PAGES DATA
=============================== */
window.maxPagesByGrade = window.maxPagesByGrade || {
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
   STORAGE (IMPROVED: safer + null guard)
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
      localStorage.setItem(key, JSON.stringify(value ?? fallback));
    } catch {}
  }
};

/* ===============================
   DATE UTIL (IMPROVED: timezone-safe fix)
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

/* ===============================
   ACTUAL PROGRESS (FIXED NaN PROTECTION)
=============================== */
function getActualProgress() {
  let total = 0;

  for (const g of GRADES) {
    const saved = Storage.get(`grade_${g}_progress`, {});
    for (const s of SUBJECTS) {
      const val = Number(saved?.[s]);
      total += isNaN(val) ? 0 : val;
    }
  }

  return total;
}

/* ===============================
   STATUS ENGINE (IMPROVED READABILITY)
=============================== */
function getDelayStatus() {
  const expected = getExpectedProgress();
  const actual = getActualProgress();

  const gap = actual - expected.expectedPages;

  let status;

  if (gap >= 300) status = "🟢 AHEAD 🚀";
  else if (gap >= 0) status = "🟢 ON TRACK";
  else if (gap >= -150) status = "🟡 SLIGHTLY BEHIND";
  else if (gap >= -400) status = "🟠 BEHIND";
  else status = "🔴 CRITICAL";

  return {
    ...expected,
    actualPages: actual,
    gap,
    status
  };
}

/* ===============================
   SMART CYCLE (IMPROVED STABILITY)
=============================== */
function getSmartCycle() {
  const cycle = getDelayStatus();

  const remainingDays = Math.max(1, TOTAL_DAYS - cycle.cycleDay);
  const gap = cycle.gap;

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

  return {
    ...cycle,
    remainingDays,
    catchUpPerDay,
    dailyTarget: Math.round(dailyTarget),
    intensity,
    baseTarget: Math.round(baseTarget),
    pressure
  };
}

/* ===============================
   UI STATE (IMPROVED NULL SAFE LOAD)
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
   NAV (FIX: null-safe DOM init)
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
   SAFE CALL
=============================== */
function safeCall(fnName, msg) {
  if (typeof window[fnName] !== "function") {
    const main = document.getElementById("main-content");
    if (main) {
      main.innerHTML = `<p style="padding:20px;color:red">${msg}</p>`;
    }
    return false;
  }
  return true;
}

/* ===============================
   SECTION MAP
=============================== */
const SectionMap = {
  study: () => {
    if (!safeCall("loadStudySection", "Study not loaded")) return;
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
    if (!safeCall("loadTopStudentMode", "Top Student not loaded")) return;
    window.loadTopStudentMode();
  },

  sunnah: () => {
    if (!safeCall("loadSunnahTracker", "Sunnah not loaded")) return;
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

  SectionMap[type]?.();
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
   INIT (IMPROVED double-run protection)
=============================== */
let initialized = false;

function initApp() {
  if (initialized) return;
  initialized = true;

  UI.load();
  Nav.init();
  getCycleState();

  console.log("✅ Mission App Ready");

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

} catch (err) {
  console.error("🔥 Main engine crashed:", err);
}

})();
