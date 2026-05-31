"use strict";

(function () {

    // =====================================================
    // 🧠 SMART CYCLE ENGINE (CORE SYSTEM BRAIN)
    // =====================================================

    const SmartEngine = {};

    // ===============================
    // CONFIGURATION
    // ===============================
    SmartEngine.CONFIG = {
        TOTAL_PAGES: 4648,
        CYCLE_DAYS: 90,
        CYCLES_PER_YEAR: 4,
        SUBJECTS: ["Math", "Physics", "Chemistry", "Biology"],

        SUBJECT_WEIGHTS: {
            Math: 1643,
            Physics: 929,
            Chemistry: 1090,
            Biology: 986
        }
    };

    // ===============================
    // INTERNAL DATA ACCESS
    // ===============================
    function getMasterData() {
        if (!window.DataService) {
            return { studyProgress: {}, startDate: new Date().toISOString().split("T")[0] };
        }
        return window.DataService.get();
    }

    function getDaysElapsed(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        return Math.max(1, Math.floor((now - start) / 86400000));
    }

    // ===============================
    // OVERALL PROGRESS ENGINE
    // ===============================
    SmartEngine.getStats = function () {
        const data = getMasterData();

        let totalRead = 0;
        let subjectStats = {
            Math: 0,
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };

        const study = data.studyProgress || {};

        Object.values(study).forEach(grade => {
            Object.entries(grade || {}).forEach(([subject, pages]) => {
                const val = Number(pages) || 0;
                totalRead += val;
                if (subjectStats.hasOwnProperty(subject)) {
                    subjectStats[subject] += val;
                }
            });
        });

        const percent = Math.min(
            100,
            Math.round((totalRead / SmartEngine.CONFIG.TOTAL_PAGES) * 100)
        );

        return {
            totalRead,
            subjectStats,
            percent
        };
    };

    // ===============================
    // CYCLE CALCULATOR
    // ===============================
    SmartEngine.getCycleInfo = function () {
        const data = getMasterData();
        const startDate = data.startDate || new Date().toISOString().split("T")[0];

        const daysElapsed = getDaysElapsed(startDate);

        const cycleLength = SmartEngine.CONFIG.CYCLE_DAYS;

        const currentCycle = Math.min(
            SmartEngine.CONFIG.CYCLES_PER_YEAR,
            Math.floor(daysElapsed / cycleLength) + 1
        );

        const dayInCycle = (daysElapsed % cycleLength) + 1;

        return {
            cycle: currentCycle,
            day: dayInCycle,
            daysElapsed
        };
    };

    // ===============================
    // DAILY TARGET ENGINE
    // ===============================
    SmartEngine.getDailyMission = function () {

        const stats = SmartEngine.getStats();
        const cycleInfo = SmartEngine.getCycleInfo();

        const remainingPages = Math.max(0, SmartEngine.CONFIG.TOTAL_PAGES - stats.totalRead);

        const remainingDays =
            SmartEngine.CONFIG.CYCLE_DAYS * SmartEngine.CONFIG.CYCLES_PER_YEAR - cycleInfo.daysElapsed;

        const dailyBase = remainingDays > 0
            ? Math.ceil(remainingPages / remainingDays)
            : Math.ceil(remainingPages / 1);

        // ===============================
        // SUBJECT PRIORITY DISTRIBUTION
        // ===============================
        const gaps = SmartEngine.CONFIG.SUBJECTS.map(sub => {
            const target = SmartEngine.CONFIG.SUBJECT_WEIGHTS[sub];
            const done = stats.subjectStats[sub] || 0;

            return {
                subject: sub,
                gap: Math.max(0, target - done)
            };
        });

        const totalGap = gaps.reduce((a, b) => a + b.gap, 0) || 1;

        const breakdown = {};

        SmartEngine.CONFIG.SUBJECTS.forEach(sub => {
            const weight = gaps.find(g => g.subject === sub).gap / totalGap;
            breakdown[sub] = Math.max(1, Math.round(dailyBase * weight));
        });

        // Fix rounding drift
        let total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        breakdown[SmartEngine.CONFIG.SUBJECTS[0]] += (dailyBase - total);

        return {
            cycle: cycleInfo.cycle,
            day: cycleInfo.day,
            breakdown,
            total: Object.values(breakdown).reduce((a, b) => a + b, 0),
            remainingPages,
            remainingDays
        };
    };

    // ===============================
    // ADAPTIVE STATUS ENGINE
    // ===============================
    SmartEngine.getStatus = function () {
        const stats = SmartEngine.getStats();
        const cycle = SmartEngine.getCycleInfo();

        const expectedProgress =
            (cycle.daysElapsed /
                (SmartEngine.CONFIG.CYCLE_DAYS * SmartEngine.CONFIG.CYCLES_PER_YEAR)) *
            100;

        let status = "On Track";

        if (stats.percent < expectedProgress - 10) {
            status = "Needs Sprint";
        } else if (stats.percent > expectedProgress + 10) {
            status = "Ahead of Schedule";
        }

        return {
            status,
            progress: stats.percent,
            expected: Math.round(expectedProgress)
        };
    };

    // ===============================
    // EXPORT
    // ===============================
    window.SmartEngine = SmartEngine;

})();
