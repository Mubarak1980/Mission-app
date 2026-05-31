"use strict";

/**
 * 🧠 Smart Cycle Engine v3 (Professional System)
 * 4 Cycles × 90 Days = 360 Days
 * 4638 pages × 4 cycles = 18,552 pages/year
 */

window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const TOTAL_PAGES_PER_CYCLE = 4638;
    const TOTAL_PAGES_YEAR = TOTAL_PAGES_PER_CYCLE * TOTAL_CYCLES;

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    const WEIGHTS = {
        Math: 0.35,
        Physics: 0.20,
        Chemistry: 0.25,
        Biology: 0.20
    };

    // =========================
    // START DATE
    // =========================
    function getStartDate() {
        const data = window.DataService.get();
        if (!data.startDate) {
            data.startDate = new Date().toISOString().split("T")[0];
            window.DataService.set(data);
        }
        return new Date(data.startDate);
    }

    // =========================
    // DAY CALCULATION
    // =========================
    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(Math.max(diff, 1), TOTAL_DAYS);
    }

    function getCycleInfo(day) {
        const cycle = Math.ceil(day / DAYS_PER_CYCLE);
        const dayInCycle = ((day - 1) % DAYS_PER_CYCLE) + 1;
        return { cycle, dayInCycle };
    }

    // =========================
    // PROGRESS CALCULATION
    // =========================
    function getProgress() {
        const data = window.DataService.get();
        const progress = data.studyProgress || {};

        let done = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};
            for (const s of SUBJECTS) {
                done += Number(gData[s]) || 0;
            }
        }

        const expected = (getCurrentDay() / TOTAL_DAYS) * TOTAL_PAGES_YEAR;

        let status = "ON TRACK";
        const diff = done - expected;

        if (diff < -50) status = "BEHIND";
        else if (diff > 50) status = "AHEAD";

        return {
            pagesDone: done,
            pagesTotal: TOTAL_PAGES_YEAR,
            completionPercent: Math.round((done / TOTAL_PAGES_YEAR) * 100),

            expectedToday: Math.round(expected),
            deviation: Math.round(diff),

            status
        };
    }

    // =========================
    // DAILY MISSION
    // =========================
    function getDailyMission() {
        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);

        const dailyTarget = Math.ceil(TOTAL_PAGES_PER_CYCLE / DAYS_PER_CYCLE);

        const breakdown = {};
        SUBJECTS.forEach(s => {
            breakdown[s] = Math.max(1, Math.round(dailyTarget * WEIGHTS[s]));
        });

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

        return {
            cycle,
            day: dayInCycle,
            globalDay: day,

            totalDays: TOTAL_DAYS,
            cycleBudget: TOTAL_PAGES_PER_CYCLE,
            systemBudget: TOTAL_PAGES_YEAR,

            breakdown,
            total
        };
    }

    return {
        getDailyMission,
        getProgress
    };

})();
