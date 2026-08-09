"use strict";

window.SmartEngine = (function () {

    // ======================================================
    // 📊 CORE CONSTANTS
    // ======================================================
    const TOTAL_CYCLES = 5;
    const DAYS_PER_CYCLE = 60;
    const TOTAL_DAYS = TOTAL_CYCLES * DAYS_PER_CYCLE;

    // Pages in one complete curriculum reading
    const TOTAL_PAGES = 3654;

    // The curriculum must be completed five times
    const TOTAL_READINGS = 5;
    const TOTAL_READING_PAGES = TOTAL_PAGES * TOTAL_READINGS;

    // One cycle represents one complete reading
    const PAGES_PER_CYCLE = TOTAL_PAGES;

    // 18,270 total reading-pages ÷ 300 total days = 60.9
    const DAILY_TARGET = TOTAL_READING_PAGES / TOTAL_DAYS;

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
        if (!window.DataService) return {};
        return window.DataService.get?.() || {};
    }

    function isDataReady() {
        return !!window.maxPagesByGrade;
    }

    function safeNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }

    function sumSubjects(obj) {
        return SUBJECTS.reduce((sum, subject) => {
            return sum + safeNumber(obj?.[subject]);
        }, 0);
    }

    function getCurriculumTotals() {
        const totals = {
            Math: 0,
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };

        if (!isDataReady()) return totals;

        for (let grade = 9; grade <= 12; grade++) {
            SUBJECTS.forEach(subject => {
                totals[subject] += safeNumber(
                    window.maxPagesByGrade?.[grade]?.[subject]
                );
            });
        }

        return totals;
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
        const millisecondsPerDay = 24 * 60 * 60 * 1000;

        const diff = Math.floor(
            (new Date() - getStartDate()) / millisecondsPerDay
        ) + 1;

        return Math.min(
            Math.max(diff, 1),
            TOTAL_DAYS
        );
    }

    function getCycleInfo(day) {
        return {
            cycle: Math.ceil(day / DAYS_PER_CYCLE),
            dayInCycle: ((day - 1) % DAYS_PER_CYCLE) + 1
        };
    }

    // ======================================================
    // 📦 COMPLETED WORK
    // ======================================================
    function getCompletedPages() {
        const data = getData();
        const progress = data.studyProgress || {};

        const completed = {
            Math: 0,
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };

        for (let grade = 9; grade <= 12; grade++) {
            const gradeData = progress[grade] || {};

            SUBJECTS.forEach(subject => {
                completed[subject] += Math.max(
                    0,
                    safeNumber(gradeData?.[subject])
                );
            });
        }

        return completed;
    }

    // ======================================================
    // 📦 REMAINING WORK FOR CURRENT CYCLE
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

        const curriculumTotals = getCurriculumTotals();
        const completed = getCompletedPages();

        return SUBJECTS.reduce((remaining, subject) => {
            remaining[subject] = Math.max(
                0,
                curriculumTotals[subject] - completed[subject]
            );

            return remaining;
        }, {});
    }

    // ======================================================
    // 📈 BACKLOG CONTROL
    // ======================================================
    function getBacklogFactor(doneProgress, expectedProgress) {
        if (expectedProgress <= 0) return 1;

        const ratio = doneProgress / expectedProgress;

        if (ratio >= 1) return 1;

        const deficit = 1 - ratio;

        return 1 + Math.min(deficit * 0.6, 0.35);
    }

    // ======================================================
    // 🧠 SUBJECT WEIGHTS
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

        for (let grade = 9; grade <= 12; grade++) {
            const gradeData = progress[grade] || {};

            SUBJECTS.forEach(subject => {
                const value = safeNumber(gradeData?.[subject]);

                totals[subject] += value;
                overall += value;
            });
        }

        return SUBJECTS.reduce((weights, subject) => {
            weights[subject] = overall
                ? totals[subject] / overall
                : WEIGHTS[subject];

            return weights;
        }, {});
    }

    // ======================================================
    // 📉 BURNOUT CONTROL
    // ======================================================
    function applyBurnoutCap(value, average) {
        const cap = average * 1.3;

        return Math.min(
            Math.max(value, 1),
            Math.ceil(cap)
        );
    }

    // ======================================================
    // 🔮 PREDICTION
    // ======================================================
    function predictCompletion(remaining, dailyTarget) {
        const totalRemaining = sumSubjects(remaining);

        if (dailyTarget <= 0) {
            return {
                estimatedDays: TOTAL_DAYS,
                onTrack: false,
                riskLevel: "HIGH"
            };
        }

        const estimatedDays = totalRemaining / dailyTarget;

        return {
            estimatedDays: Math.ceil(estimatedDays),
            onTrack: estimatedDays <= TOTAL_DAYS,
            riskLevel:
                estimatedDays > TOTAL_DAYS
                    ? "HIGH"
                    : estimatedDays > TOTAL_DAYS * 0.9
                        ? "MEDIUM"
                        : "LOW"
        };
    }

    // ======================================================
    // 📌 DAILY MISSION
    // ======================================================
    function getDailyMission() {
        if (!isDataReady()) {
            return {
                cycle: 1,
                day: 1,
                globalDay: 1,
                totalDays: TOTAL_DAYS,
                totalCycles: TOTAL_CYCLES,
                daysPerCycle: DAYS_PER_CYCLE,
                totalPages: TOTAL_PAGES,
                totalReadings: TOTAL_READINGS,
                totalReadingPages: TOTAL_READING_PAGES,
                dailyTarget: Math.ceil(DAILY_TARGET),
                breakdown: {},
                total: 0
            };
        }

        const globalDay = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(globalDay);

        const remaining = getRemainingPages();

        const expectedProgress = dayInCycle / DAYS_PER_CYCLE;

        const completedTotal = sumSubjects(getCompletedPages());
        const curriculumTotal = sumSubjects(getCurriculumTotals());

        const doneProgress = curriculumTotal > 0
            ? completedTotal / curriculumTotal
            : 0;

        const backlogFactor = getBacklogFactor(
            doneProgress,
            expectedProgress
        );

        // The correct base target for five complete readings
        const adjustedTarget = Math.ceil(
            DAILY_TARGET * backlogFactor
        );

        const remainingTotal = sumSubjects(remaining);
        const weights = getWeeklyWeights();

        const breakdown = {};
        let total = 0;

        SUBJECTS.forEach(subject => {
            const ratio = remainingTotal > 0
                ? remaining[subject] / remainingTotal
                : weights[subject];

            const average = adjustedTarget / SUBJECTS.length;

            let value = Math.round(adjustedTarget * ratio);

            value = applyBurnoutCap(value, average);

            breakdown[subject] = value;
            total += value;
        });

        // Correct rounding so the subject total equals the daily target
        const correction = adjustedTarget - total;

        const maxSubject = SUBJECTS.reduce((a, b) => {
            return breakdown[a] > breakdown[b] ? a : b;
        });

        breakdown[maxSubject] = Math.max(
            1,
            breakdown[maxSubject] + correction
        );

        return {
            cycle,
            day: dayInCycle,
            globalDay,
            totalDays: TOTAL_DAYS,
            totalCycles: TOTAL_CYCLES,
            daysPerCycle: DAYS_PER_CYCLE,
            totalPages: TOTAL_PAGES,
            totalReadings: TOTAL_READINGS,
            totalReadingPages: TOTAL_READING_PAGES,
            dailyTarget: Math.ceil(DAILY_TARGET),
            breakdown,
            total: sumSubjects(breakdown),
            cycleBudget: PAGES_PER_CYCLE,
            prediction: predictCompletion(
                remaining,
                adjustedTarget
            )
        };
    }

    // ======================================================
    // 📊 PROGRESS
    // ======================================================
    function getProgress() {
        const day = getCurrentDay();

        if (!isDataReady()) {
            return {
                pagesDone: 0,
                pagesTotal: TOTAL_PAGES,
                pagesPercent: 0,
                readingPagesDone: 0,
                readingPagesTotal: TOTAL_READING_PAGES,
                readingPagesPercent: 0,
                day,
                dayPercent: Math.round((day / TOTAL_DAYS) * 100)
            };
        }

        const completed = getCompletedPages();
        const pagesDone = sumSubjects(completed);

        const pagesPercent = TOTAL_PAGES > 0
            ? Math.round((pagesDone / TOTAL_PAGES) * 100)
            : 0;

        const cycleProgress = Math.min(
            pagesDone,
            TOTAL_PAGES
        );

        const readingPagesDone =
            ((getCycleInfo(day).cycle - 1) * TOTAL_PAGES) +
            cycleProgress;

        const readingPagesPercent = TOTAL_READING_PAGES > 0
            ? Math.round(
                (readingPagesDone / TOTAL_READING_PAGES) * 100
            )
            : 0;

        return {
            pagesDone,
            pagesTotal: TOTAL_PAGES,
            pagesPercent,
            readingPagesDone,
            readingPagesTotal: TOTAL_READING_PAGES,
            readingPagesPercent,
            day,
            dayPercent: Math.round((day / TOTAL_DAYS) * 100)
        };
    }

    // ======================================================
    // 📅 WEEKLY PLANNER
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
        const weekEnd = Math.min(
            week * 7,
            TOTAL_DAYS
        );

        const progress = getCompletedPages();

        const subjects = {
            Math: { planned: 0, actual: progress.Math },
            Physics: { planned: 0, actual: progress.Physics },
            Chemistry: { planned: 0, actual: progress.Chemistry },
            Biology: { planned: 0, actual: progress.Biology }
        };

        let plannedTotal = 0;

        for (let dayNumber = weekStart; dayNumber <= weekEnd; dayNumber++) {
            const dailyMission = getMissionForDay(dayNumber);

            SUBJECTS.forEach(subject => {
                subjects[subject].planned += dailyMission.breakdown[subject];
                plannedTotal += dailyMission.breakdown[subject];
            });
        }

        const actualTotal = sumSubjects(progress);

        const efficiency = plannedTotal > 0
            ? actualTotal / plannedTotal
            : 1;

        return {
            week,
            range: `${weekStart}-${weekEnd}`,
            planned: plannedTotal,
            actual: actualTotal,
            efficiency: Math.round(efficiency * 100),
            status:
                efficiency >= 1
                    ? "ON_TRACK"
                    : efficiency >= 0.85
                        ? "SLIGHT_DELAY"
                        : efficiency >= 0.70
                            ? "BEHIND"
                            : "CRITICAL",
            subjects
        };
    }

    // ======================================================
    // 📌 PLANNED MISSION FOR A SPECIFIC DAY
    // ======================================================
    function getMissionForDay(dayNumber) {
        const safeDay = Math.min(
            Math.max(safeNumber(dayNumber), 1),
            TOTAL_DAYS
        );

        const { dayInCycle } = getCycleInfo(safeDay);

        const target = Math.ceil(DAILY_TARGET);
        const weights = WEIGHTS;

        const breakdown = {};
        let total = 0;

        SUBJECTS.forEach(subject => {
            const average = target / SUBJECTS.length;

            let value = Math.round(
                target * weights[subject]
            );

            value = applyBurnoutCap(value, average);

            breakdown[subject] = value;
            total += value;
        });

        const correction = target - total;

        const maxSubject = SUBJECTS.reduce((a, b) => {
            return breakdown[a] > breakdown[b] ? a : b;
        });

        breakdown[maxSubject] = Math.max(
            1,
            breakdown[maxSubject] + correction
        );

        return {
            cycle: Math.ceil(safeDay / DAYS_PER_CYCLE),
            day: dayInCycle,
            globalDay: safeDay,
            breakdown,
            total: sumSubjects(breakdown)
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
