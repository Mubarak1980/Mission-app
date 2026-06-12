"use strict";

window.SmartEngine = (function () {

    // ======================================================
    // 📊 CORE CONSTANTS
    // ======================================================
    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const TOTAL_PAGES = 4638;
    const PAGES_PER_CYCLE = Math.floor(TOTAL_PAGES / TOTAL_CYCLES);

    const SUBJECTS = Object.freeze(["Math", "Physics", "Chemistry", "Biology"]);

    const WEIGHTS = Object.freeze({
        Math: 0.35,
        Physics: 0.20,
        Chemistry: 0.25,
        Biology: 0.20
    });

    // ======================================================
    // 🔐 SAFE HELPERS
    // ======================================================
    function getData() {
        if (!window.DataService) return {};
        const data = window.DataService.get?.() || {};
        return data && typeof data === "object" ? data : {};
    }

    function isDataReady() {
        return !!window.maxPagesByGrade;
    }

    function safeNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }

    function sumSubjects(obj) {
        return SUBJECTS.reduce((sum, s) => sum + safeNumber(obj?.[s]), 0);
    }

    // ======================================================
    // 📅 TIME ENGINE
    // ======================================================
    function getStartDate() {
        const data = getData();
        const fallback = new Date().toISOString().split("T")[0];
        return new Date(data.startDate || fallback);
    }

    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();

        const diffDays = Math.floor((now - start) / 86400000) + 1;

        return Math.min(Math.max(diffDays, 1), TOTAL_DAYS);
    }

    function getCycleInfo(day) {
        return {
            cycle: Math.ceil(day / DAYS_PER_CYCLE),
            dayInCycle: ((day - 1) % DAYS_PER_CYCLE) + 1
        };
    }

    // ======================================================
    // 📦 REMAINING WORK ENGINE
    // ======================================================
    function getRemainingPages() {
        if (!isDataReady()) {
            return { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };
        }

        const data = getData();
        const progress = data.studyProgress || {};

        const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(subject => {
                const max = safeNumber(window.maxPagesByGrade?.[g]?.[subject]);
                const done = safeNumber(gData?.[subject]);

                totals[subject] += Math.max(0, max - done);
            });
        }

        return totals;
    }

    // ======================================================
    // 📈 BACKLOG SYSTEM (STABLE CURVE)
    // ======================================================
    function getBacklogFactor(done, expected) {
        if (expected <= 0) return 1;

        const ratio = done / expected;
        if (ratio >= 1) return 1;

        // smooth + stable growth curve
        return 1 + Math.pow(1 - ratio, 1.2) * 0.6;
    }

    // ======================================================
    // 🧠 WEEKLY WEIGHTS (NORMALIZED)
    // ======================================================
    function getWeeklyWeights() {
        const data = getData();
        const progress = data.studyProgress || {};

        const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };
        let overall = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(s => {
                const v = safeNumber(gData?.[s]);
                totals[s] += v;
                overall += v;
            });
        }

        return SUBJECTS.reduce((acc, s) => {
            acc[s] = overall > 0 ? totals[s] / overall : WEIGHTS[s];
            return acc;
        }, {});
    }

    // ======================================================
    // 📉 BURNOUT PROTECTION
    // ======================================================
    function applyBurnoutCap(value, avg) {
        const cap = avg * 1.3;

        if (value > cap) return Math.ceil(cap);
        if (value < 1) return 1;

        return Math.round(value);
    }

    // ======================================================
    // 🔮 COMPLETION PREDICTION
    // ======================================================
    function predictCompletion(remaining, dailyTarget) {
        const total = sumSubjects(remaining);

        if (dailyTarget <= 0) {
            return {
                estimatedDays: TOTAL_DAYS,
                onTrack: false,
                riskLevel: "HIGH"
            };
        }

        const estimatedDays = total / dailyTarget;

        return {
            estimatedDays: Math.ceil(estimatedDays),
            onTrack: estimatedDays <= TOTAL_DAYS,
            riskLevel:
                estimatedDays > TOTAL_DAYS ? "HIGH" :
                estimatedDays > TOTAL_DAYS * 0.9 ? "MEDIUM" : "LOW"
        };
    }

    // ======================================================
    // 📌 DAILY MISSION ENGINE (CORE FIXED LOGIC)
    // ======================================================
    function getDailyMission() {

        if (!isDataReady()) {
            return {
                cycle: 1,
                day: 1,
                globalDay: 1,
                totalDays: TOTAL_DAYS,
                breakdown: {},
                total: 0
            };
        }

        const day = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(day);

        const remaining = getRemainingPages();
        const cycleRemainingDays = DAYS_PER_CYCLE - dayInCycle + 1;

        const cycleTotalRemaining = sumSubjects(remaining);

        const baseTarget = Math.ceil(PAGES_PER_CYCLE / cycleRemainingDays);

        const expectedProgress = day / TOTAL_DAYS;
        const doneProgress = 1 - (cycleTotalRemaining / TOTAL_PAGES);

        const adjustedTarget =
            Math.ceil(baseTarget * getBacklogFactor(doneProgress, expectedProgress));

        const weights = getWeeklyWeights();

        const breakdown = {};
        let total = 0;

        SUBJECTS.forEach(subject => {
            const ratio = cycleTotalRemaining > 0
                ? remaining[subject] / cycleTotalRemaining
                : weights[subject];

            let value = Math.max(1, Math.round(adjustedTarget * ratio));

            const avg = adjustedTarget / SUBJECTS.length;
            value = applyBurnoutCap(value, avg);

            breakdown[subject] = value;
            total += value;
        });

        // SAFE BALANCING CORRECTION
        const correction = adjustedTarget - total;

        const maxSubject = SUBJECTS.reduce((a, b) =>
            breakdown[a] > breakdown[b] ? a : b
        );

        breakdown[maxSubject] = Math.max(1, breakdown[maxSubject] + correction);

        return {
            cycle,
            day: dayInCycle,
            globalDay: day,
            totalDays: TOTAL_DAYS,
            breakdown,
            total: sumSubjects(breakdown),
            cycleBudget: PAGES_PER_CYCLE,
            prediction: predictCompletion(remaining, adjustedTarget)
        };
    }

    // ======================================================
    // 📊 PROGRESS ENGINE
    // ======================================================
    function getProgress() {
        const day = getCurrentDay();

        if (!isDataReady()) {
            return {
                pagesDone: 0,
                pagesTotal: 0,
                pagesPercent: 0,
                day,
                dayPercent: 0
            };
        }

        const data = getData();
        const progress = data.studyProgress || {};

        let done = 0;
        let max = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(subject => {
                done += safeNumber(gData?.[subject]);
                max += safeNumber(window.maxPagesByGrade?.[g]?.[subject]);
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

    // ======================================================
    // 📅 WEEKLY PLANNER (STABLE + REAL DATA ONLY)
    // ======================================================
    function getWeeklyPlanner() {

        if (!isDataReady()) {
            return {
                week: 1,
                range: "1-7",
                efficiency: 0,
                status: "NO_DATA",
                planned: 0,
                actual: 0,
                subjects: {}
            };
        }

        const day = getCurrentDay();
        const week = Math.ceil(day / 7);

        const weekStart = (week - 1) * 7 + 1;
        const weekEnd = Math.min(week * 7, TOTAL_DAYS);

        const data = getData();
        const progress = data.studyProgress || {};

        let plannedTotal = 0;
        let actualTotal = 0;

        const subjects = {
            Math: { planned: 0, actual: 0 },
            Physics: { planned: 0, actual: 0 },
            Chemistry: { planned: 0, actual: 0 },
            Biology: { planned: 0, actual: 0 }
        };

        // PLAN (deterministic per day, not repeated mutation)
        for (let d = weekStart; d <= weekEnd; d++) {

            const fakeDay = d;
            const cycleDay = ((fakeDay - 1) % DAYS_PER_CYCLE) + 1;

            const remainingDays = DAYS_PER_CYCLE - cycleDay + 1;
            const base = Math.ceil(PAGES_PER_CYCLE / remainingDays);

            const simulated = SUBJECTS.reduce((acc, s) => {
                acc[s] = Math.round(base * getWeeklyWeights()[s]);
                return acc;
            }, {});

            SUBJECTS.forEach(s => {
                subjects[s].planned += simulated[s];
                plannedTotal += simulated[s];
            });
        }

        // ACTUAL
        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(s => {
                const v = safeNumber(gData?.[s]);
                subjects[s].actual += v;
                actualTotal += v;
            });
        }

        const efficiency = plannedTotal > 0 ? actualTotal / plannedTotal : 1;

        return {
            week,
            range: `${weekStart}-${weekEnd}`,
            planned: plannedTotal,
            actual: actualTotal,
            efficiency: Math.round(efficiency * 100),
            status:
                efficiency >= 1 ? "ON_TRACK" :
                efficiency >= 0.85 ? "SLIGHT_DELAY" :
                efficiency >= 0.70 ? "BEHIND" : "CRITICAL",
            subjects
        };
    }

    // ======================================================
    // 📤 PUBLIC API
    // ======================================================
    return {
        getDailyMission,
        getProgress,
        getWeeklyPlanner
    };

})();
