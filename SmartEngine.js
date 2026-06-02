"use strict";

/**

* 🧠 Smart Cycle Engine v3.0
* 4 Cycles × 90 Days = 360 Days
* Total Pages = 4638
* Automatically calculates cycle progress
*/

window.SmartEngine = (function () {

const TOTAL_CYCLES = 4;
const DAYS_PER_CYCLE = 90;
const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

const TOTAL_PAGES = 4638;
const PAGES_PER_CYCLE = Math.ceil(TOTAL_PAGES / TOTAL_CYCLES);

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

    return Math.min(
        Math.max(diff + 1, 1),
        TOTAL_DAYS
    );
}

// =====================================
// CYCLE INFO
// =====================================
function getCycleInfo(day) {
    return {
        cycle: Math.min(
            Math.ceil(day / DAYS_PER_CYCLE),
            TOTAL_CYCLES
        ),
        dayInCycle:
            ((day - 1) % DAYS_PER_CYCLE) + 1
    };
}

// =====================================
// TOTAL PAGES CONFIG
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
// REMAINING SUBJECT PAGES
// =====================================
function getRemainingPages() {
    const data =
        (window.DataService && window.DataService.get()) || {
            studyProgress: {}
        };

    const progress = data.studyProgress || {};
    const config = window.maxPagesByGrade || {};

    const remaining = {
        Math: 0,
        Physics: 0,
        Chemistry: 0,
        Biology: 0
    };

    for (let g = 9; g <= 12; g++) {
        const gradeData = progress[g] || {};
        const gradeConfig = config[g] || {};

        SUBJECTS.forEach(subject => {

            const max =
                Number(gradeConfig[subject]) || 0;

            const done =
                Number(gradeData[subject]) || 0;

            remaining[subject] +=
                Math.max(0, max - done);
        });
    }

    return remaining;
}

// =====================================
// DAILY MISSION
// =====================================
function getDailyMission() {

    const day = getCurrentDay();

    const {
        cycle,
        dayInCycle
    } = getCycleInfo(day);

    const remaining = getRemainingPages();

    const remainingDays =
        DAYS_PER_CYCLE - dayInCycle + 1;

    const totalRemainingPages =
        remaining.Math +
        remaining.Physics +
        remaining.Chemistry +
        remaining.Biology;

    const cycleTarget =
        Math.ceil(
            PAGES_PER_CYCLE / remainingDays
        );

    const breakdown = {};

    let allocated = 0;

    SUBJECTS.forEach(subject => {

        const ratio =
            totalRemainingPages > 0
                ? remaining[subject] /
                  totalRemainingPages
                : 0.25;

        let pages =
            Math.round(
                cycleTarget * ratio
            );

        pages = Math.max(1, pages);

        breakdown[subject] = pages;

        allocated += pages;
    });

    const correction =
        cycleTarget - allocated;

    breakdown.Math =
        Math.max(
            1,
            breakdown.Math + correction
        );

    return {
        cycle,
        day: dayInCycle,
        globalDay: day,
        totalDays: TOTAL_DAYS,
        breakdown,
        total:
            breakdown.Math +
            breakdown.Physics +
            breakdown.Chemistry +
            breakdown.Biology,
        cycleBudget: PAGES_PER_CYCLE
    };
}

// =====================================
// PROGRESS
// =====================================
function getProgress() {

    const day = getCurrentDay();

    const done =
        getCompletedPages();

    const max =
        getTotalPossiblePages();

    return {
        pagesDone: done,
        pagesTotal: max,

        pagesPercent:
            max > 0
                ? Math.round(
                      (done / max) * 100
                  )
                : 0,

        day,

        dayTotal: TOTAL_DAYS,

        dayPercent:
            Math.round(
                (day / TOTAL_DAYS) * 100
            )
    };
}

return {
    getDailyMission,
    getProgress
};

})();
