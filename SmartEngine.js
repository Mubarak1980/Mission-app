"use strict";

/**
 * 🧠 Smart Cycle Engine v2.3 (PWA-OPTIMIZED)
 */

window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;
    const TOTAL_PAGES = 4638;
    const PAGES_PER_CYCLE = Math.floor(TOTAL_PAGES / TOTAL_CYCLES);

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];
    const WEIGHTS = { Math: 0.35, Physics: 0.20, Chemistry: 0.25, Biology: 0.20 };

    // --- PWA READINESS GATE ---
    function isDataReady() {
        return typeof window.maxPagesByGrade !== 'undefined';
    }

    // Safe accessor for DataService
    function getStoredData() {
        return (window.DataService && typeof window.DataService.get === 'function') 
            ? window.DataService.get() 
            : { studyProgress: {}, startDate: new Date().toISOString().split("T")[0] };
    }

    function getStartDate() {
        const data = getStoredData();
        const start = data.startDate ? new Date(data.startDate) : new Date();
        return isNaN(start.getTime()) ? new Date() : start;
    }

    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(Math.max(diff, 1), TOTAL_DAYS);
    }

    function getCycleInfo(day) {
        return {
            cycle: Math.ceil(day / DAYS_PER_CYCLE),
            dayInCycle: ((day - 1) % DAYS_PER_CYCLE) + 1
        };
    }

    function getRemainingPages() {
        if (!isDataReady()) return { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

        const data = getStoredData();
        const progress = data.studyProgress || {};
        const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};
            SUBJECTS.forEach(s => {
                const max = Number(window.maxPagesByGrade?.[g]?.[s]) || 0;
                const done = Number(gData[s]) || 0;
                totals[s] += Math.max(0, max - done);
            });
        }
        return totals;
    }

    function getDailyMission() {
        if (!isDataReady()) {
            return { cycle: 1, day: 1, globalDay: 1, totalDays: TOTAL_DAYS, breakdown: { Math:0, Physics:0, Chemistry:0, Biology:0 }, total: 0 };
        }

        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);
        const remaining = getRemainingPages();

        const cycleRemainingDays = Math.max(1, DAYS_PER_CYCLE - dayInCycle + 1);
        const cycleTotalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0);
        const dailyTarget = Math.ceil(cycleTotalRemaining / cycleRemainingDays);

        const breakdown = {};
        let sum = 0;

        SUBJECTS.forEach(s => {
            const ratio = cycleTotalRemaining > 0 ? remaining[s] / cycleTotalRemaining : WEIGHTS[s];
            let value = Math.max(1, Math.round(dailyTarget * ratio));
            breakdown[s] = value;
            sum += value;
        });

        return { cycle, day: dayInCycle, globalDay: day, totalDays: TOTAL_DAYS, breakdown, total: sum };
    }

    function getProgress() {
        if (!isDataReady()) return { pagesDone: 0, pagesTotal: 0, pagesPercent: 0, day: 1, dayPercent: 0 };

        const data = getStoredData();
        const progress = data.studyProgress || {};
        let done = 0;
        let max = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};
            SUBJECTS.forEach(s => {
                max += Number(window.maxPagesByGrade?.[g]?.[s]) || 0;
                done += Number(gData[s]) || 0;
            });
        }

        return {
            pagesDone: done,
            pagesTotal: max,
            pagesPercent: max ? Math.round((done / max) * 100) : 0,
            day: getCurrentDay(),
            dayPercent: Math.round((getCurrentDay() / TOTAL_DAYS) * 100)
        };
    }

    return { getDailyMission, getProgress };

})();
                        
