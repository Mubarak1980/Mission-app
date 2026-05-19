// ===============================
// MAIN ENGINE (OPTIMIZED + MODULAR)
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
STORAGE UTILS (SAFE + FAST)
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
DATE UTILS (UTC SAFE)
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
TODAY DATA
=============================== */
function getTodayPlan() {
const plan = Storage.get("todayPlan", {});
return plan[todayISO()] ?? [];
}

function getTodayLog() {
const logs = Storage.get("dailyStudyLog", {});
return logs[todayISO()] ?? {};
}

/* ===============================
PROGRESS ENGINE
=============================== */
function getExpectedProgress() {
const { cycleDay, remainingDays } = getCycleState();

return {
cycleDay,
remainingDays,
expectedPages: Math.round((cycleDay / TOTAL_DAYS) * TOTAL_PAGES)
};
}

function getActualProgress() {
let total = 0;

for (const g of GRADES) {
const saved = Storage.get(grade_${g}_progress, {});
for (const s of SUBJECTS) {
total += Number(saved[s]) || 0;
}
}

return total;
}

/* ===============================
DELAY STATUS (IMPROVED LOGIC)
=============================== */
function getDelayStatus() {
const expected = getExpectedProgress();
const actual = getActualProgress();

const gap = actual - expected.expectedPages;

let status;
if (gap >= 0) status = "🟢 ON TRACK";
else if (gap >= -200) status = "🟡 SLIGHTLY BEHIND";
else status = "🔴 CRITICAL";

return {
...expected,
actualPages: actual,
gap,
status
};
}

/* ===============================
DAILY DELAYS
=============================== */
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

/* ===============================
SMART TARGET SYSTEM (UPGRADED)
=============================== */
function getSmartCycle() {
const cycle = getDelayStatus();

const gap = cycle.gap;
const remainingDays = Math.max(1, TOTAL_DAYS - cycle.cycleDay);

const catchUp = gap < 0
? Math.min(Math.ceil(Math.abs(gap) / remainingDays), 60)
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
UI STATE (ISOLATED)
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
NAVIGATION CONTROLLER
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
if (!this.nav) return;

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
SECTION LOADER (CLEAN MAP)
=============================== */
const SectionMap = {
study: () => window.loadStudySection?.(UI.currentGrade),
timetable: () => window.loadWeeklyTimetable?.(),
dashboard: () => window.loadDashboard?.(),
"top-student": () => window.loadTopStudentMode?.(),
sunnah: () => window.loadSunnahTracker?.()
};

function loadSection(type, grade) {
UI.currentSection = type;

if (grade !== undefined) {
UI.currentGrade = Number(grade);
}

UI.save();
Nav.update();

try {
SectionMap[type]?.();
} catch (e) {
console.error("Section error:", e);
}
}

/* ===============================
NAVIGATION ACTIONS
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
INIT (PWA SAFE)
=============================== */
let initialized = false;

function initApp() {
if (initialized) return;
initialized = true;

UI.load();
Nav.init();
getCycleState();

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
GLOBAL EXPORTS (CONTROLLED)
=============================== */
window.loadSection = loadSection;
window.nextGrade = nextGrade;
window.previousGrade = previousGrade;

})();
