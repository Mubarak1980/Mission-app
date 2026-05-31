"use strict";

(function () {

    const TOTAL_PAGES = 4648;
    const CYCLE_DAYS = 90;
    const TOTAL_CYCLES = 4;

    const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

    const SUBJECT_WEIGHTS = {
        Math: 1643,
        Physics: 929,
        Chemistry: 1090,
        Biology: 986
    };

    function getMasterData() {
        if (!window.DataService) {
            return { studyProgress: {}, startDate: new Date().toISOString().split("T")[0] };
        }
        return window.DataService.get();
    }

    function getDaysSinceStart(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        const diff = Math.floor((now - start) / 86400000);
        return Math.max(1, diff);
    }

    function getTotalDone() {
        const data = getMasterData();
        let total = 0;

        const grades = data.studyProgress || {};

        Object.values(grades).forEach(gradeData => {
            Object.values(gradeData).forEach(val => {
                total += Number(val) || 0;
            });
        });

        return total;
    }

    function getSubjectDone(subject) {
        const data = getMasterData();
        let total = 0;

        Object.values(data.studyProgress || {}).forEach(gradeData => {
            total += Number(gradeData?.[subject]) || 0;
        });

        return total;
    }

    function getCycleInfo(daysElapsed) {
        const cycle = Math.min(
            TOTAL_CYCLES,
            Math.floor((daysElapsed - 1) / CYCLE_DAYS) + 1
        );

        const dayInCycle = ((daysElapsed - 1) % CYCLE_DAYS) + 1;

        return { cycle, dayInCycle };
    }

    function calculateDailyTarget(remainingPages, remainingDays) {
        if (remainingDays <= 0) return remainingPages;
        return Math.ceil(remainingPages / remainingDays);
    }

    function generateBreakdown(totalToday, subjectRemaining) {

        const totalRemainingWeight = Object.values(subjectRemaining)
            .reduce((a, b) => a + b, 0);

        let breakdown = {};

        SUBJECTS.forEach(subject => {
            const weight = subjectRemaining[subject] || 0;

            const share = totalRemainingWeight > 0
                ? weight / totalRemainingWeight
                : 1 / SUBJECTS.length;

            breakdown[subject] = Math.max(1, Math.round(totalToday * share));
        });

        return breakdown;
    }

    // ============================
    // 🚀 PUBLIC API
    // ============================
    window.SmartEngine = {

        getDailyMission() {

            const data = getMasterData();

            const startDate = data.startDate || new Date().toISOString().split("T")[0];

            const daysElapsed = getDaysSinceStart(startDate);

            const { cycle, dayInCycle } = getCycleInfo(daysElapsed);

            const totalDone = getTotalDone();

            const remaining = Math.max(0, TOTAL_PAGES - totalDone);

            const remainingDays = Math.max(1, (TOTAL_CYCLES * CYCLE_DAYS) - daysElapsed);

            const dailyTarget = calculateDailyTarget(remaining, remainingDays);

            const subjectDone = {
                Math: getSubjectDone("Math"),
                Physics: getSubjectDone("Physics"),
                Chemistry: getSubjectDone("Chemistry"),
                Biology: getSubjectDone("Biology")
            };

            const subjectRemaining = {
                Math: Math.max(0, SUBJECT_WEIGHTS.Math - subjectDone.Math),
                Physics: Math.max(0, SUBJECT_WEIGHTS.Physics - subjectDone.Physics),
                Chemistry: Math.max(0, SUBJECT_WEIGHTS.Chemistry - subjectDone.Chemistry),
                Biology: Math.max(0, SUBJECT_WEIGHTS.Biology - subjectDone.Biology)
            };

            const breakdown = generateBreakdown(dailyTarget, subjectRemaining);

            return {
                cycle,
                day: dayInCycle,
                totalRemaining: remaining,
                total: dailyTarget,
                breakdown
            };
        }
    };

})();
