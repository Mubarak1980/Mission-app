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
    const DAILY_TARGET = Math.ceil(
        TOTAL_READING_PAGES / TOTAL_DAYS
    );

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

    function safeNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function sumSubjects(object) {
        return SUBJECTS.reduce((sum, subject) => {
            return sum + safeNumber(object?.[subject]);
        }, 0);
    }

    function createEmptySubjectObject() {
        return {
            Math: 0,
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };
    }

    function getCurriculumTotals() {
        const totals = createEmptySubjectObject();

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

        const difference = Math.floor(
            (new Date() - getStartDate()) / millisecondsPerDay
        ) + 1;

        return Math.min(
            Math.max(difference, 1),
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
    // 📚 COMPLETED CURRICULUM PAGES
    // ======================================================
    function getCompletedPages() {
        const data = getData();
        const progress = data.studyProgress || {};
        const completed = createEmptySubjectObject();

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
    // 📦 REMAINING CURRICULUM PAGES
    // ======================================================
    function getRemainingPages() {
        const curriculumTotals = getCurriculumTotals();
        const completed = getCompletedPages();

        return SUBJECTS.reduce((remaining, subject) => {
            remaining[subject] = Math.max(
                0,
                curriculumTotals[subject] - completed[subject]
            );

            return remaining;
        }, createEmptySubjectObject());
    }

    // ======================================================
    // 🧠 SUBJECT DISTRIBUTION
    // ======================================================
    function getSubjectRatios() {
        const remaining = getRemainingPages();
        const remainingTotal = sumSubjects(remaining);

        if (remainingTotal <= 0) {
            return { ...WEIGHTS };
        }

        return SUBJECTS.reduce((ratios, subject) => {
            ratios[subject] = remaining[subject] / remainingTotal;
            return ratios;
        }, {});
    }

    // ======================================================
    // 🎯 EXACT DAILY TARGET NORMALIZATION
    // ======================================================
    function createExactBreakdown(target) {
        const ratios = getSubjectRatios();
        const breakdown = {};
        const fractions = [];

        let assigned = 0;

        SUBJECTS.forEach(subject => {
            const exactValue = target * ratios[subject];
            const wholeValue = Math.floor(exactValue);

            breakdown[subject] = wholeValue;
            assigned += wholeValue;

            fractions.push({
                subject,
                fraction: exactValue - wholeValue
            });
        });

        let remainingPages = target - assigned;

        fractions.sort((a, b) => b.fraction - a.fraction);

        let index = 0;

        while (remainingPages > 0) {
            const subject = fractions[index % fractions.length].subject;

            breakdown[subject] += 1;
            remainingPages--;
            index++;
        }

        return breakdown;
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
                dailyTarget: DAILY_TARGET,
                breakdown: createEmptySubjectObject(),
                total: 0
            };
        }

        const globalDay = getCurrentDay();
        const { cycle, dayInCycle } = getCycleInfo(globalDay);

        const remaining = getRemainingPages();
        const breakdown = createExactBreakdown(DAILY_TARGET);

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
            dailyTarget: DAILY_TARGET,
            breakdown,
            total: sumSubjects(breakdown),
            cycleBudget: PAGES_PER_CYCLE,
            prediction: predictCompletion(
                remaining,
                DAILY_TARGET
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
                dayPercent: Math.round(
                    (day / TOTAL_DAYS) * 100
                )
            };
        }

        const completed = getCompletedPages();
        const pagesDone = sumSubjects(completed);

        const pagesPercent = TOTAL_PAGES > 0
            ? Math.min(
                100,
                Math.round((pagesDone / TOTAL_PAGES) * 100)
            )
            : 0;

        const cycle = getCycleInfo(day).cycle;

        const readingPagesDone = Math.min(
            TOTAL_READING_PAGES,
            ((cycle - 1) * TOTAL_PAGES) +
            Math.min(pagesDone, TOTAL_PAGES)
        );

        const readingPagesPercent = TOTAL_READING_PAGES > 0
            ? Math.min(
                100,
                Math.round(
                    (readingPagesDone / TOTAL_READING_PAGES) * 100
                )
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
            dayPercent: Math.round(
                (day / TOTAL_DAYS) * 100
            )
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

        const completed = getCompletedPages();

        const subjects = {
            Math: {
                planned: 0,
                actual: completed.Math
            },
            Physics: {
                planned: 0,
                actual: completed.Physics
            },
            Chemistry: {
                planned: 0,
                actual: completed.Chemistry
            },
            Biology: {
                planned: 0,
                actual: completed.Biology
            }
        };

        let plannedTotal = 0;

        for (
            let dayNumber = weekStart;
            dayNumber <= weekEnd;
            dayNumber++
        ) {
            const plannedMission = getMissionForDay(dayNumber);

            SUBJECTS.forEach(subject => {
                subjects[subject].planned +=
                    plannedMission.breakdown[subject];

                plannedTotal +=
                    plannedMission.breakdown[subject];
            });
        }

        const actualTotal = sumSubjects(completed);

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

        const cycleInfo = getCycleInfo(safeDay);
        const breakdown = createExactBreakdown(DAILY_TARGET);

        return {
            cycle: cycleInfo.cycle,
            day: cycleInfo.dayInCycle,
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
