"use strict";

/**
 * 🧠 Smart Cycle Engine v2
 * 4 Cycles × 90 Days = 360 Day System
 * Deterministic workload distribution engine
 */

window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    // Approx weight distribution (can be tuned later)
    const WEIGHTS = {
        Math: 0.35,
        Physics: 0.20,
        Chemistry: 0.25,
        Biology: 0.20
    };

    // 🔹 Get system start date from DataService
    function getStartDate() {
        const data = window.DataService.get();
        if (!data.startDate) {
            data.startDate = new Date().toISOString().split("T")[0];
            window.DataService.set(data);
        }
        return new Date(data.startDate);
    }

    // 🔹 Calculate current day in cycle system
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

    // 🔹 Load total remaining workload from study tracker
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

    // 🔹 Core Mission Generator
    function getDailyMission() {
        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);

        const remaining = getRemainingPages();

        const totalRemaining =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        const breakdown = {};

        SUBJECTS.forEach(s => {
            const weight = WEIGHTS[s];
            const base = totalRemaining * weight;

            // smooth distribution across remaining days
            const perDay = Math.ceil(base / (TOTAL_DAYS - day + 1));

            breakdown[s] = Math.max(1, perDay);
        });

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

        return {
            cycle,
            day: dayInCycle,
            globalDay: day,
            totalDays: TOTAL_DAYS,
            breakdown,
            total
        };
    }

    // 🔹 Progress Engine
    function getProgress() {
        const day = getCurrentDay();
        const data = window.DataService.get();
        const progress = data.studyProgress || {};

        let done = 0;
        let max = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};
            for (const s of SUBJECTS) {
                done += Number(gData[s]) || 0;
                max += Number(window.maxPagesByGrade?.[g]?.[s]) || 0;
            }
        }

        return {
            pagesDone: done,
            pagesTotal: max,
            pagesPercent: max ? Math.round((done / max) * 100) : 0,
            day,
            dayPercent: Math.round((day / TOTAL_DAYS) * 100)
        };
    }

    return {
        getDailyMission,
        getProgress
    };

})();
