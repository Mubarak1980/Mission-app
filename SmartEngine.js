"use strict";

/**
 * 🧠 Smart Cycle Engine v3.0 (ADAPTIVE INTELLIGENCE UPGRADE)
 * - Deterministic planning (no randomness)
 * - Backlog recovery system
 * - Burnout protection
 * - Weekly adaptive balancing
 * - Completion prediction engine
 */

window.SmartEngine = (function () {

    // ======================================================
    // 📊 CORE CONSTANTS (UNCHANGED STRUCTURE)
    // ======================================================
    const TOTAL_CYCLES = 4;
    const DAYS_PER_CYCLE = 90;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    const TOTAL_PAGES = 4638;

    const PAGES_PER_CYCLE = Math.floor(TOTAL_PAGES / TOTAL_CYCLES);

    const SUBJECTS = Object.freeze([
        "Math",
        "Physics",
        "Chemistry",
        "Biology"
    ]);

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
        return (window.DataService && window.DataService.get()) || {};
    }

    function isDataReady() {
        return typeof window.maxPagesByGrade !== "undefined";
    }

    function safeNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }

    // ======================================================
    // 📅 TIME ENGINE
    // ======================================================
    function getStartDate() {
        const data = getData();
        const fallback = new Date().toISOString().split("T")[0];
        const start = data.startDate || fallback;
        return new Date(start);
    }

    function getCurrentDay() {
        const start = getStartDate();
        const now = new Date();

        const diff = Math.floor(
            (now - start) / (1000 * 60 * 60 * 24)
        ) + 1;

        return Math.min(Math.max(diff, 1), TOTAL_DAYS);
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
            return {
                Math: 0,
                Physics: 0,
                Chemistry: 0,
                Biology: 0
            };
        }

        const data = getData();
        const progress = data.studyProgress || {};

        const totals = {
            Math: 0,
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };

        for (let g = 9; g <= 12; g++) {

            const gData = progress[g] || {};

            SUBJECTS.forEach(subject => {

                const max = safeNumber(window.maxPagesByGrade?.[g]?.[subject]);
                const done = safeNumber(gData[subject]);

                totals[subject] += Math.max(0, max - done);
            });
        }

        return totals;
    }

    // ======================================================
    // 📈 BACKLOG SYSTEM (NEW)
    // ======================================================
    function getBacklogFactor(done, expected) {
        if (done >= expected) return 1;

        const delay = expected - done;

        return 1 + (delay / expected) * 0.8;
    }

    // ======================================================
    // 🧠 WEEKLY ADAPTIVE BALANCING (NEW)
    // ======================================================
    function getWeeklyWeights() {
        const data = getData();
        const progress = data.studyProgress || {};

        const totals = {
            Math: 0,
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };

        let overall = 0;

        for (let g = 9; g <= 12; g++) {
            const gData = progress[g] || {};

            SUBJECTS.forEach(s => {
                const val = safeNumber(gData[s]);
                totals[s] += val;
                overall += val;
            });
        }

        return SUBJECTS.reduce((acc, s) => {
            acc[s] = overall > 0
                ? totals[s] / overall
                : WEIGHTS[s];
            return acc;
        }, {});
    }

    // ======================================================
    // 📉 BURNOUT PROTECTION (NEW)
    // ======================================================
    function applyBurnoutCap(value, avg) {
        const maxAllowed = avg * 1.4;
        return Math.min(value, Math.ceil(maxAllowed));
    }

    // ======================================================
    // 🔮 COMPLETION PREDICTION (NEW)
    // ======================================================
    function predictCompletion(remaining, dailyTarget) {

        const total =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        const estimatedDays = total / dailyTarget;

        return {
            estimatedDays: Math.ceil(estimatedDays),
            onTrack: estimatedDays <= TOTAL_DAYS,
            riskLevel:
                estimatedDays > TOTAL_DAYS ? "HIGH" :
                estimatedDays > TOTAL_DAYS * 0.92 ? "MEDIUM" : "LOW"
        };
    }

    // ======================================================
    // 📌 DAILY MISSION ENGINE (CORE)
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

        const remainingDays =
            TOTAL_DAYS - day + 1;

        const cycleRemainingDays =
            DAYS_PER_CYCLE - dayInCycle + 1;

        const cycleRemainingPages = PAGES_PER_CYCLE;

        const cycleTotalRemaining =
            remaining.Math +
            remaining.Physics +
            remaining.Chemistry +
            remaining.Biology;

        // ==================================================
        // 🎯 BASE DAILY TARGET (GLOBAL + CYCLE STRUCTURE)
        // ==================================================
        const baseTarget = Math.ceil(
            cycleRemainingPages / cycleRemainingDays
        );

        // ==================================================
        // ⚠️ BACKLOG ADJUSTMENT
        // ==================================================
        const expectedProgress =
            ((TOTAL_DAYS - remainingDays) / TOTAL_DAYS);

        const doneProgress =
            1 - (cycleTotalRemaining / TOTAL_PAGES);

        const backlogFactor =
            getBacklogFactor(doneProgress, expectedProgress);

        const adjustedTarget =
            Math.ceil(baseTarget * backlogFactor);

        // ==================================================
        // 🧠 WEEKLY ADAPTIVE WEIGHTS
        // ==================================================
        const dynamicWeights = getWeeklyWeights();

        // ==================================================
        // 📦 BREAKDOWN DISTRIBUTION
        // ==================================================
        const breakdown = {};
        let sum = 0;

        SUBJECTS.forEach(subject => {

            const ratio =
                cycleTotalRemaining > 0
                    ? remaining[subject] / cycleTotalRemaining
                    : dynamicWeights[subject];

            let value =
                Math.round(adjustedTarget * ratio);

            value = Math.max(1, value);

            // Burnout protection
            const avg = adjustedTarget / SUBJECTS.length;
            value = applyBurnoutCap(value, avg);

            breakdown[subject] = value;
            sum += value;
        });

        // ==================================================
        // ⚖️ DETERMINISTIC BALANCE FIX (NO RANDOMNESS)
        // ==================================================
        const correction = adjustedTarget - sum;

        const biggestGapSubject =
            SUBJECTS.reduce((a, b) =>
                (breakdown[a] < breakdown[b] ? a : b)
            );

        breakdown[biggestGapSubject] += correction;

        // ==================================================
        // 🔮 PREDICTION OUTPUT
        // ==================================================
        const prediction = predictCompletion(
            remaining,
            adjustedTarget
        );

        return {
            cycle,
            day: dayInCycle,
            globalDay: day,
            totalDays: TOTAL_DAYS,
            breakdown,
            total: Object.values(breakdown)
                .reduce((a, b) => a + b, 0),
            cycleBudget: PAGES_PER_CYCLE,
            prediction
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

                const m = safeNumber(
                    window.maxPagesByGrade?.[g]?.[subject]
                );

                const d = safeNumber(gData[subject]);

                done += d;
                max += m;
            });
        }

        return {
            pagesDone: done,
            pagesTotal: max,
            pagesPercent: max
                ? Math.round((done / max) * 100)
                : 0,
            day,
            dayPercent: Math.round(
                (day / TOTAL_DAYS) * 100
            )
        };
    }

    // ======================================================
    // 📤 PUBLIC API
    // ======================================================
    return {
        getDailyMission,
        getProgress
    };

})();
