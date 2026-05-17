// ===============================
// Main.js - Core Application Engine (PRODUCTION SAFE)
// ===============================

window.maxPagesByGrade = {
  9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164, English: 223 },
  10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174, English: 316 },
  11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284, English: 283 },
  12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354, English: 263 }
};

const TOTAL_DAYS = 90;
const TOTAL_PAGES = 5705;

// ===============================
// SAFE STORAGE
// ===============================
function safeJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ===============================
// CYCLE ENGINE
// ===============================
function getCycleState() {
  const todayStr = todayISO();
  const state = safeJSON("cycleState", {});

  if (!state.startDate) state.startDate = todayStr;

  const start = new Date(state.startDate);
  const now = new Date(todayStr);

  const diff = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
     Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000
  );

  state.cycleDay = Math.min(Math.max(1, diff + 1), TOTAL_DAYS);
  state.remainingDays = Math.max(0, TOTAL_DAYS - state.cycleDay);

  try {
    localStorage.setItem("cycleState", JSON.stringify(state));
  } catch {}

  return state;
}

// ===============================
// TODAY DATA
// ===============================
function getTodayKey() {
  return todayISO();
}

function getTodayPlan() {
  const plan = safeJSON("todayPlan", {});
  const today = plan[getTodayKey()];
  return Array.isArray(today) ? today : [];
}

function getTodayLog() {
  const logs = safeJSON("dailyStudyLog", {});
  const today = logs[getTodayKey()];
  return today && typeof today === "object" ? today : {};
}

// ===============================
// PROGRESS ENGINE
// ===============================
function getExpectedProgress() {
  const cycle = getCycleState();
  const expectedPages = (cycle.cycleDay / TOTAL_DAYS) * TOTAL_PAGES;

  return {
    cycleDay: cycle.cycleDay,
    remainingDays: cycle.remainingDays,
    expectedPages: Math.round(expectedPages)
  };
}

// ===============================
// ACTUAL PROGRESS
// ===============================
function getActualProgress() {
  const grades = [9, 10, 11, 12];
  const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];

  let total = 0;

  for (const g of grades) {
    const saved = safeJSON(`grade_${g}_progress`, {});
    for (const s of subjects) {
      total += Number(saved[s]) || 0;
    }
  }

  return { actualPages: total };
}

// ===============================
// DELAY STATUS
// ===============================
function getDelayStatus() {
  const expected = getExpectedProgress();
  const actual = getActualProgress();

  const gap = actual.actualPages - expected.expectedPages;

  let status = "🟢 AHEAD / ON TRACK";
  if (gap < 0) status = "🟡 SLIGHTLY BEHIND";
  if (gap < -200) status = "🔴 SERIOUSLY BEHIND";

  return {
    cycleDay: expected.cycleDay,
    expectedPages: expected.expectedPages,
    actualPages: actual.actualPages,
    gap,
    status
  };
}

// ===============================
// DAILY DELAYS
// ===============================
function getPlannedVsActual() {
  const plan = getTodayPlan();
  const log = getTodayLog();

  const delays = [];

  for (const p of plan) {
    if (!p?.grade || !p?.subjects) continue;

    const actual = log[p.grade] || {};
    for (const subject in p.subjects) {
      const planned = Number(p.subjects[subject]) || 0;
      const done = Number(actual[subject]) || 0;

      if (done < planned) {
        delays.push({
          grade: p.grade,
          subject,
          missing: planned - done
        });
      }
    }
  }

  return delays;
}

// ===============================
// SYSTEM STATUS
// ===============================
function getSystemStatus() {
  const cycle = getDelayStatus();
  const dailyDelays = getPlannedVsActual();

  return {
    cycle,
    dailyDelays,
    isOnTrack: cycle.gap >= 0 && dailyDelays.length === 0
  };
}

// ===============================
// SNAPSHOT
// ===============================
function getSystemSnapshot() {
  const status = getSystemStatus();

  return {
    time: {
      cycleDay: status.cycle.cycleDay,
      remainingDays: TOTAL_DAYS - status.cycle.cycleDay
    },
    progress: {
      actual: status.cycle.actualPages,
      expected: status.cycle.expectedPages,
      gap: status.cycle.gap
    },
    alerts: {
      isOnTrack: status.isOnTrack,
      hasDailyIssues: status.dailyDelays.length > 0,
      delayCount: status.dailyDelays.length
    }
  };
}

// ===============================
// SMART CYCLE
// ===============================
function getSmartCycle() {
  const cycle = getDelayStatus();
  const actualTotal = getActualProgress().actualPages;

  const expected = cycle.expectedPages;
  const gap = actualTotal - expected;

  const remainingDays = Math.max(1, TOTAL_DAYS - cycle.cycleDay);

  let catchUp = gap < 0 ? Math.ceil(Math.abs(gap) / remainingDays) : 0;
  catchUp = Math.min(catchUp, 60);

  const base = TOTAL_PAGES / TOTAL_DAYS;

  let target = base + catchUp;
  target = Math.min(Math.max(target, 25), 85);

  return {
    expected: Math.round(expected),
    actual: Math.round(actualTotal),
    gap: Math.round(gap),
    status: gap >= 0 ? "AHEAD / ON TRACK" : "BEHIND",
    catchUpPerDay: catchUp,
    remainingDays,
    dailyLimit: {
      target: Math.round(target),
      safe: target <= 70,
      warning: target > 70
    }
  };
}

// ===============================
// UI STATE
// ===============================
let currentGrade = 9;
let currentSection = "study";

let nav, prevBtn, nextBtn;

function saveUIState() {
  try {
    localStorage.setItem("ui_state", JSON.stringify({
      grade: currentGrade,
      section: currentSection
    }));
  } catch {}
}

function loadUIState() {
  const saved = safeJSON("ui_state", null);
  if (!saved) return;

  currentGrade = Number(saved.grade) || 9;
  currentSection = saved.section || "study";
}

// ===============================
// NAV BUTTONS
// ===============================
function updateNavButtons() {
  if (!nav || !prevBtn || !nextBtn) return;

  if (currentSection === "study") {
    nav.style.display = "flex";
    prevBtn.disabled = currentGrade <= 9;
    nextBtn.disabled = currentGrade >= 12;
  } else {
    nav.style.display = "none";
  }
}

// ===============================
// SECTION LOADER (UNCHANGED LOGIC)
// ===============================
function loadSection(type, grade) {
  currentSection = type;
  if (grade) currentGrade = Number(grade);

  saveUIState();
  updateNavButtons();

  if (type === "study") loadStudySection && loadStudySection(currentGrade);
  if (type === "timetable") loadWeeklyTimetable && loadWeeklyTimetable();
  if (type === "dashboard") loadDashboard && loadDashboard();
  if (type === "top-student") loadTopStudentMode && loadTopStudentMode();
  if (type === "sunnah") loadSunnahTracker && loadSunnahTracker();
}

// ===============================
// NAVIGATION
// ===============================
function nextGrade() {
  if (currentGrade < 12) loadSection("study", ++currentGrade);
}

function previousGrade() {
  if (currentGrade > 9) loadSection("study", --currentGrade);
}

// ===============================
// 🚀 FIXED INIT (THIS IS THE IMPORTANT PART)
// ===============================
function initApp() {
  if (document.body.dataset.initialized) return;
  document.body.dataset.initialized = "1";

  nav = document.getElementById("grade-nav");
  prevBtn = document.getElementById("prev-btn");
  nextBtn = document.getElementById("next-btn");

  loadUIState();

  // ✅ FIX: break blocking startup work
  requestAnimationFrame(() => {
    getCycleState();

    setTimeout(() => {
      loadSection(currentSection, currentGrade);
    }, 0);
  });
}

// ===============================
// BOOT
// ===============================
document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", initApp)
  : initApp();

// ===============================
window.nextGrade = nextGrade;
window.previousGrade = previousGrade;
window.loadSection = loadSection;
