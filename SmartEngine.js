"use strict";

window.SmartEngine = (function () {
    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;
    const PAGES_PER_CYCLE = 1159;
    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];
    const WEIGHTS = { Math: 0.35, Physics: 0.20, Chemistry: 0.25, Biology: 0.20 };

    function getStartDate() {
        const data = window.DataService.get();
        if (!data.startDate) {
            data.startDate = new Date().toISOString().split("T")[0];
            window.DataService.set(data);
        }
        return new Date(data.startDate);
    }

    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(Math.max(diff, 1), TOTAL_DAYS);
    }

    function getRemainingPages() {
        const data = window.DataService.get();
        // Defensive check: ensure studyProgress exists
        const progress = data.studyProgress || {};
        const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

        for (let g = 9; g <= 12; g++) {
            // FIX: Convert grade to string to match JSON keys in localStorage
            const gData = progress[g.toString()] || {}; 
            const gMax = window.maxPagesByGrade?.[g] || {};

            SUBJECTS.forEach(s => {
                const max = Number(gMax[s]) || 0;
                const done = Number(gData[s] || 0); // Ensure we get a number
                totals[s] += Math.max(0, max - done);
            });
        }
        return totals;
    }

    function getDailyMission() {
        const day = getCurrentDay();
        const dayInCycle = ((day - 1) % DAYS_PER_CYCLE) + 1;
        const cycleRemainingDays = DAYS_PER_CYCLE - dayInCycle + 1;
        const remaining = getRemainingPages();
        
        const cycleTotalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0);
        const dailyTarget = Math.ceil(PAGES_PER_CYCLE / cycleRemainingDays);

        const breakdown = {};
        let sum = 0;

        SUBJECTS.forEach(s => {
            const ratio = cycleTotalRemaining > 0 ? (remaining[s] / cycleTotalRemaining) : WEIGHTS[s];
            let value = Math.round(dailyTarget * ratio);
            breakdown[s] = Math.max(1, value);
            sum += breakdown[s];
        });

        // Correction
        const correction = dailyTarget - sum;
        breakdown[SUBJECTS[0]] += correction;

        return {
            day: dayInCycle,
            breakdown: breakdown,
            total: Object.values(breakdown).reduce((a, b) => a + b, 0)
        };
    }

    return { getDailyMission };
})();
    
