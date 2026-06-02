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
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(diff + 1, 1), TOTAL_DAYS);
    }

    function getTotalPossiblePages() {
        let total = 0;
        for (let g = 9; g <= 12; g++) {
            const config = window.maxPagesByGrade?.[g] || {};
            SUBJECTS.forEach(s => total += (Number(config[s]) || 0));
        }
        return total;
    }

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
    
