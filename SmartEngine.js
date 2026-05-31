"use strict";

/**
 * 🧠 Smart Cycle Engine v2.2 (Cycle-Budget Corrected)
 * 4 Cycles × 90 Days = 360 Days
 * Total Pages = 4638
 * Cycle Budget = 1159 pages
 */

window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const TOTAL_PAGES = 4638;
    const PAGES_PER_CYCLE = 1159;

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    const WEIGHTS = {
        Math: 0.35,
        Physics: 0.20,
        Chemistry: 0.25,
        Biology: 0.20
    };

    // ===============================
    // START DATE
    // ===============================
    function getStartDate() {
        const data = window.DataService.get();
        if (!data.startDate) {
            data.startDate = new Date().toISOString().split("T")[0];
            window.DataService.set(data);
        }
        return new Date(data.startDate);
    }

    // ===============================
    // GLOBAL DAY (1–360)
    // ===============================
    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();

        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

        return Math.min(Math.max(diff, 1), TOTAL_DAYS);
    }

    // ===============================
    // CYCLE CALCULATION
    // ===============================
    function getCycleInfo(day) {
        const cycle = Math.ceil(day / DAYS_PER_CYCLE);
        const dayInCycle = ((day - 1) % DAYS_PER_CYCLE) + 1;

        return { cycle, dayInCycle };
    }

    // ===============================
    // GET REMAINING GLOBAL PROGRESS
    // ===============================
    function getRemainingPages() {
        const data = window.DataService.get();
        const progress = data.studyProgress || {};

        const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(s => {
                totals[s] += Number(window.maxPagesByGrade?.[g]?.[s]) || 0;
                totals[s] -= Number(gData[s]) || 0;
            });
        }

        return totals;
    }

    // ===============================
    // CYCLE-LOCKED DISTRIBUTION FIX
    // ===============================
    function getRemainingPagesByCycle() {
        const remaining = getRemainingPages();

        const totalRemaining =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        const cycleRatio = PAGES_PER_CYCLE / TOTAL_PAGES;

        return {
            Math: remaining.Math * cycleRatio,
            Physics: remaining.Physics * cycleRatio,
            Chemistry: remaining.Chemistry * cycleRatio,
            Biology: remaining.Biology * cycleRatio
        };
    }

    // ===============================
    // DAILY MISSION (FIXED CORE LOGIC)
    // ===============================
    function getDailyMission() {
        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);

        const remaining = getRemainingPagesByCycle();

        const remainingCycleDays = DAYS_PER_CYCLE - dayInCycle + 1;

        const cycleRemainingTotal =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        const expectedDailyTotal = Math.ceil(PAGES_PER_CYCLE / remainingCycleDays);

        const breakdown = {};
        let tempTotal = 0;

        SUBJECTS.forEach(s => {
            const ratio = remaining[s] / cycleRemainingTotal;
            let value = Math.round(expectedDailyTotal * ratio);

            value = Math.max(1, value);

            breakdown[s] = value;
            tempTotal += value;
        });

        const diff = expectedDailyTotal - tempTotal;

        breakdown.Math += diff;
        if (breakdown.Math < 1) breakdown.Math = 1;

        return {
            cycle,
            day: dayInCycle,
            globalDay: day,
            totalDays: TOTAL_DAYS,
            breakdown,
            total: Object.values(breakdown).reduce((a, b) => a + b, 0),
            cycleBudget: PAGES_PER_CYCLE
        };
    }

    // ===============================
    // PROGRESS TRACKER
    // ===============================
    function getProgress() {
        const day = getCurrentDay();

        const data = window.DataService.get();
        const progress = data.studyProgress || {};

        let done = 0;
        let max = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(s => {
                done += Number(gData[s]) || 0;
                max += Number(window.maxPagesByGrade?.[g]?.[s]) || 0;
            });
        }

        return {
            pagesDone: done,
            pagesTotal: max,
            pagesPercent: max ? Math.round((done / max) * 100) : 0,
            day,
            dayPercent: Math.round((day / TOTAL_DAYS) * 100)
        };
    }

    // ===============================
    // PUBLIC API
    // ===============================
    return {
        getDailyMission,
        getProgress
    };

})();
