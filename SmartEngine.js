"use strict";

window.SmartEngine = (function () {
    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;
    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    // 1. Properly get start date or set it if missing
    function getStartDate() {
        let data = window.DataService.get();
        if (!data.startDate) {
            data.startDate = new Date().toISOString().split("T")[0];
            window.DataService.set(data);
        }
        return new Date(data.startDate);
    }

    // 2. Accurate day calculation
    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();
        // Time difference in days
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(diff + 1, 1), TOTAL_DAYS);
    }

    // 3. Get total possible pages from your config
    function getTotalPossiblePages() {
        let total = 0;
        for (let g = 9; g <= 12; g++) {
            const config = window.maxPagesByGrade?.[g] || {};
            SUBJECTS.forEach(s => total += (config[s] || 0));
        }
        return total;
    }

    // 4. Get pages completed from DataService
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

    return {
        getDailyMission: function() {
            const day = getCurrentDay();
            const cycle = Math.ceil(day / DAYS_PER_CYCLE);
            const dayInCycle = ((day - 1) % DAYS_PER_CYCLE) + 1;
            
            // Return mission logic here...
            return { cycle, day: dayInCycle, totalDays: TOTAL_DAYS };
        },
        getProgress: function() {
            const day = getCurrentDay();
            return {
                pagesDone: getCompletedPages(),
                pagesTotal: getTotalPossiblePages(),
                day: day,
                totalDays: TOTAL_DAYS
            };
        }
    };
})();
    
