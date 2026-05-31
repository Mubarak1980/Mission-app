"use strict";

/**
 * 🧠 Smart Cycle Engine v3 (Cycle Locked System)
 * 4 Cycles × 90 Days = 360 Days
 * Fixed Cycle Budget: ~1159 pages per cycle
 */

window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const TOTAL_PAGES = 4638;
    const PAGES_PER_CYCLE = TOTAL_PAGES / TOTAL_CYCLES; // ~1159.5

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    const WEIGHTS = {
        Math: 0.35,
        Physics: 0.20,
        Chemistry: 0.25,
        Biology: 0.20
    };

    // ===============================
    // START DATE (PERSISTENT)
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
    // GLOBAL DAY (1 → 360)
    // ===============================
    function getGlobalDay() {
        const start = getStartDate();
        const now = new Date();
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(Math.max(diff, 1), TOTAL_DAYS);
    }

    // ===============================
    // CYCLE CALCULATION
    // ===============================
    function getCycleInfo(globalDay) {
        const cycle = Math.ceil(globalDay / DAYS_PER_CYCLE);
        const dayInCycle = ((globalDay - 1) % DAYS_PER_CYCLE) + 1;

        const cycleStartDay = (cycle - 1) * DAYS_PER_CYCLE + 1;
        const cycleEndDay = cycle * DAYS_PER_CYCLE;

        return {
            cycle,
            dayInCycle,
            cycleStartDay,
            cycleEndDay
        };
    }

    // ===============================
    // PROGRESS INSIDE CYCLE ONLY
    // ===============================
    function getCycleProgress() {
        const data = window.DataService.get();
        const progress = data.studyProgress || {};

        const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};
            SUBJECTS.forEach(s => {
                totals[s] += Number(gData[s]) || 0;
            });
        }

        const cycleDone =
            totals.Math +
            totals.Physics +
            totals.Chemistry +
            totals.Biology;

        return {
            totals,
            cycleDone
        };
    }

    // ===============================
    // DAILY MISSION (CYCLE LOCKED)
    // ===============================
    function getDailyMission() {

        const globalDay = getGlobalDay();
        const { cycle, dayInCycle } = getCycleInfo(globalDay);

        const { cycleDone } = getCycleProgress();

        const cycleRemaining = Math.max(PAGES_PER_CYCLE - cycleDone, 0);
        const remainingDaysInCycle = Math.max(DAYS_PER_CYCLE - dayInCycle + 1, 1);

        const breakdown = {};

        SUBJECTS.forEach(subject => {
            const weight = WEIGHTS[subject];

            const base = cycleRemaining * weight;

            const perDay = Math.ceil(base / remainingDaysInCycle);

            breakdown[subject] = Math.max(1, perDay);
        });

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

        return {
            cycle,
            day: dayInCycle,
            globalDay,

            cycleBudget: PAGES_PER_CYCLE,
            cycleRemaining,

            totalDays: TOTAL_DAYS,

            breakdown,
            total
        };
    }

    // ===============================
    // GLOBAL PROGRESS (OPTIONAL UI)
    // ===============================
    function getProgress() {
        const globalDay = getGlobalDay();

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

            globalDay,
            dayPercent: Math.round((globalDay / TOTAL_DAYS) * 100)
        };
    }

    return {
        getDailyMission,
        getProgress
    };

})();
