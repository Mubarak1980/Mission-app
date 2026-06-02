"use strict";

/**

* 🧠 Smart Cycle Engine v2.4

* FIXED: Restored breakdown and total properties required by weekly-timetable.js
*/
window.SmartEngine = (function () {

const TOTAL_CYCLES = 4;
const DAYS_PER_CYCLE = 90;
const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

// =====================================
// START DATE
// =====================================
function getStartDate() {
const data =
(window.DataService && window.DataService.get()) || {
startDate: new Date().toISOString().split("T")[0]
};

 return new Date(data.startDate);

}

// =====================================
// CURRENT DAY
// =====================================
function getCurrentDay() {
const start = getStartDate();
const now = new Date();

 const diff =
     Math.floor((now - start) / (1000 * 60 * 60 * 24));

 return Math.min(Math.max(diff + 1, 1), TOTAL_DAYS);

}

// =====================================
// TOTAL POSSIBLE PAGES
// =====================================
function getTotalPossiblePages() {
let total = 0;

 const config = window.maxPagesByGrade || {};

 for (let g = 9; g <= 12; g++) {
     const gradeConfig = config[g] || {};

     SUBJECTS.forEach(subject => {
         total += Number(gradeConfig[subject]) || 0;
     });
 }

 return total;

}

// =====================================
// COMPLETED PAGES
// =====================================
function getCompletedPages() {
const data =
(window.DataService && window.DataService.get()) || {
studyProgress: {}
};

 const progress = data.studyProgress || {};

 let total = 0;

 for (let g = 9; g <= 12; g++) {
     const gradeData = progress[g] || {};

     SUBJECTS.forEach(subject => {
         total += Number(gradeData[subject]) || 0;
     });
 }

 return total;

}

// =====================================
// DAILY MISSION
// =====================================
function getDailyMission() {
const day = getCurrentDay();

 const cycle = Math.ceil(day / DAYS_PER_CYCLE);

 const dayInCycle =
     ((day - 1) % DAYS_PER_CYCLE) + 1;

 // Fixed study allocation
 const breakdown = {
     Math: 18,
     Physics: 10,
     Chemistry: 12,
     Biology: 12
 };

 const total =
     breakdown.Math +
     breakdown.Physics +
     breakdown.Chemistry +
     breakdown.Biology;

 return {
     cycle: Math.min(cycle, 4),
     day: dayInCycle,
     globalDay: day,
     totalDays: TOTAL_DAYS,
     breakdown,
     total
 };

}

// =====================================
// PROGRESS
// =====================================
function getProgress() {
const day = getCurrentDay();

 const done = getCompletedPages();

 const max = getTotalPossiblePages();

 return {
     pagesDone: done,
     pagesTotal: max,
     pagesPercent:
         max > 0
             ? Math.round((done / max) * 100)
             : 0,

     day: day,
     dayTotal: TOTAL_DAYS,

     dayPercent:
         Math.round((day / TOTAL_DAYS) * 100)
 };

}

return {
getDailyMission,
getProgress
};

})();
