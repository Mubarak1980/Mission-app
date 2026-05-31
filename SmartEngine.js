"use strict";

/**
 * 🧠 Smart Cycle Engine v2.3 (Professional Stabilized System)
 * 4 Cycles × 90 Days = 360 Days
 * Total Pages = 4638
 * Cycle Budget = 1159 pages (STRICT DISTRIBUTION SAFE)
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
    // DAY CALCULATION
    // ===============================
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

    // ===============================
    // REAL REMAINING (UNCHANGED LOGIC, CLEANER USAGE)
    // ===============================
    function getRemainingPages() {
        const data = window.DataService.get();
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

    // ===============================
    // DAILY MISSION (STABLE DISTRIBUTION)
    // ===============================
    function getDailyMission() {
        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);

        const remaining = getRemainingPages();

        const cycleRemainingDays = DAYS_PER_CYCLE - dayInCycle + 1;

        const cycleTotalRemaining =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        // LOCKED DAILY TARGET (cycle-safe)
        const dailyTarget = Math.ceil(PAGES_PER_CYCLE / cycleRemainingDays);

        const breakdown = {};
        let sum = 0;

        SUBJECTS.forEach(s => {
            const ratio = cycleTotalRemaining > 0 ? remaining[s] / cycleTotalRemaining : WEIGHTS[s];

            let value = Math.round(dailyTarget * ratio);
            value = Math.max(1, value);

            breakdown[s] = value;
            sum += value;
        });

        // Normalize WITHOUT bias (fixes Math overload issue)
        const correction = dailyTarget - sum;
        const adjustSubject = SUBJECTS[0];

        breakdown[adjustSubject] = Math.max(1, breakdown[adjustSubject] + correction);

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
    // PROGRESS (UNCHANGED BUT CLEAN)
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
