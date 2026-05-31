"use strict";

/**
 * 🧠 Smart Cycle Engine v2.1 (Cycle-Aware Fix)
 * 4 Cycles × 90 Days = 360 Day System
 * Total Pages = 4638
 * Cycle Budget = 1159 pages per cycle (logical enforcement layer)
 */

window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const TOTAL_PAGES = 4638;
    const PAGES_PER_CYCLE = 1159;

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    // Weight distribution (kept stable)
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
    // GLOBAL DAY
    // ===============================
    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();

        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

        return Math.min(Math.max(diff, 1), TOTAL_DAYS);
    }

    // ===============================
    // CYCLE INFO
    // ===============================
    function getCycleInfo(day) {
        const cycle = Math.ceil(day / DAYS_PER_CYCLE);
        const dayInCycle = ((day - 1) % DAYS_PER_CYCLE) + 1;

        return { cycle, dayInCycle };
    }

    // ===============================
    // STUDY DATA READER
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
    // FIXED CYCLE-AWARE DISTRIBUTION
    // ===============================
    function getRemainingPagesByCycle() {
        const remaining = getRemainingPages();

        const totalRemaining =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        // scale remaining into cycle proportion (1159 / 4638)
        const cycleRatio = PAGES_PER_CYCLE / TOTAL_PAGES;

        return {
            Math: remaining.Math * cycleRatio,
            Physics: remaining.Physics * cycleRatio,
            Chemistry: remaining.Chemistry * cycleRatio,
            Biology: remaining.Biology * cycleRatio
        };
    }

    // ===============================
    // DAILY MISSION (CYCLE LOCKED)
    // ===============================
    function getDailyMission() {
        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);

        const remaining = getRemainingPagesByCycle();

        const remainingCycleDays = DAYS_PER_CYCLE - dayInCycle + 1;

        const breakdown = {};

        SUBJECTS.forEach(s => {
            const perDay = Math.ceil(remaining[s] / remainingCycleDays);
            breakdown[s] = Math.max(1, perDay);
        });

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

        return {
            cycle,
            day: dayInCycle,
            globalDay: day,
            totalDays: TOTAL_DAYS,
            breakdown,
            total,
            cycleBudget: PAGES_PER_CYCLE
        };
    }

    // ===============================
    // PROGRESS ENGINE (GLOBAL VIEW)
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
