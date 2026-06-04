"use strict";

/**
 * 🧠 Smart Cycle Engine v2.3 (FIXED: TRUE CYCLE MATH + READINESS GATE)
 */

window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const TOTAL_PAGES = 4638;

    // 🔥 FIX: true cycle budget (auto-calculated)
    const PAGES_PER_CYCLE = Math.floor(TOTAL_PAGES / TOTAL_CYCLES); // 1159

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    const WEIGHTS = {
        Math: 0.35,
        Physics: 0.20,
        Chemistry: 0.25,
        Biology: 0.20
    };

    // --- READINESS GATE ---
    function isDataReady() {
        return typeof window.maxPagesByGrade !== 'undefined';
    }

    function getStartDate() {
        const data = (window.DataService && window.DataService.get()) || {};
        if (!data.startDate) {
            data.startDate = new Date().toISOString().split("T")[0];
        }
        return new Date(data.startDate);
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

    // 🔥 FIXED CORE LOGIC (cycle-based remaining system)
    function getRemainingPages() {
        if (!isDataReady()) return { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

        const data = (window.DataService && window.DataService.get()) || {};
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
        // Return safe empty state if not ready to prevent crash during PWA load
        if (!isDataReady()) {
            return { cycle: 1, day: 1, globalDay: 1, totalDays: TOTAL_DAYS, breakdown: {}, total: 0 };
        }

        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);

        const remaining = getRemainingPages();

        // 🔥 FIX: cycle-aware remaining days
        const cycleRemainingDays = DAYS_PER_CYCLE - dayInCycle + 1;

        const cycleRemainingPages = PAGES_PER_CYCLE;

        const cycleTotalRemaining =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        // 🔥 FIX: true cycle daily target
        const dailyTarget = Math.ceil(cycleRemainingPages / cycleRemainingDays);

        const breakdown = {};
        let sum = 0;

        SUBJECTS.forEach(s => {
            const ratio = cycleTotalRemaining > 0 ? remaining[s] / cycleTotalRemaining : WEIGHTS[s];

            let value = Math.round(dailyTarget * ratio);
            value = Math.max(1, value);

            breakdown[s] = value;
            sum += value;
        });

        const correction = dailyTarget - sum;
        breakdown[Math.random() > 0.5 ? "Math" : "Physics"] += correction;

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

    function getProgress() {
        const day = getCurrentDay();
        
        // Return safe empty state if not ready
        if (!isDataReady()) return { pagesDone: 0, pagesTotal: 0, pagesPercent: 0, day, dayPercent: 0 };

        const data = (window.DataService && window.DataService.get()) || {};
        const progress = data.studyProgress || {};

        let done = 0;
        let max = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(s => {
                const m = Number(window.maxPagesByGrade?.[g]?.[s]) || 0;
                const d = Number(gData[s]) || 0;

                done += d;
                max += m;
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

    return {
        getDailyMission,
        getProgress
    };

})();
