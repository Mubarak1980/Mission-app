"use strict";

/**
 * 🧠 Smart Cycle Engine v2.3 (Professional Stabilized System)
 */
window.SmartEngine = (function () {

    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;
    const PAGES_PER_CYCLE = 1159;
    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    // 1. HELPER: Get or Set Start Date
    function getStartDate() {
        const data = window.DataService.get();
        if (!data.startDate) {
            data.startDate = new Date().toISOString().split("T")[0];
            window.DataService.set(data);
        }
        return new Date(data.startDate);
    }

    // 2. HELPER: Current Day Calculation
    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(diff + 1, 1), TOTAL_DAYS);
    }

    // 3. HELPER: Get Total Possible Pages (Config)
    function getTotalPossiblePages() {
        let total = 0;
        for (let g = 9; g <= 12; g++) {
            const config = window.maxPagesByGrade?.[g] || {};
            SUBJECTS.forEach(s => total += (Number(config[s]) || 0));
        }
        return total;
    }

    // 4. HELPER: Get Completed Pages (DataService)
    function getCompletedPages() {
        const data = window.DataService.get();
        const progress = data.studyProgress || {};
        let total = 0;
        for (let g = 9; g <= 12; g++) {
            const gData = progress[g.toString()] || {};
            SUBJECTS.forEach(s => total += (Number(gData[s]) || 0));
        }
        return total;
    }

    // 5. PUBLIC MISSION LOGIC
    function getDailyMission() {
        const day = getCurrentDay();
        const cycle = Math.ceil(day / DAYS_PER_CYCLE);
        const dayInCycle = ((day - 1) % DAYS_PER_CYCLE) + 1;
        
        return {
            cycle: cycle > 4 ? 4 : cycle,
            day: dayInCycle,
            globalDay: day,
            totalDays: TOTAL_DAYS,
            cycleBudget: PAGES_PER_CYCLE
        };
    }

    // 6. PUBLIC PROGRESS LOGIC
    function getProgress() {
        const day = getCurrentDay();
        const done = getCompletedPages();
        const max = getTotalPossiblePages();

        return {
            pagesDone: done,
            pagesTotal: max,
            pagesPercent: max > 0 ? Math.round((done / max) * 100) : 0,
            day: day,
            dayTotal: TOTAL_DAYS,
            dayPercent: Math.round((day / TOTAL_DAYS) * 100)
        };
    }

    return {
        getDailyMission,
        getProgress
    };

})();
    
