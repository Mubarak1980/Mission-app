"use strict";

window.SmartEngine = (function () {

    // ======================================================
    // 📊 CORE CONSTANTS
    // ======================================================
    const TOTAL_CYCLES = 5;
    const DAYS_PER_CYCLE = 60;
    const TOTAL_DAYS =
        TOTAL_CYCLES * DAYS_PER_CYCLE;

    // Pages in one complete curriculum reading
    const TOTAL_PAGES = 3654;

    // Five complete readings
    const TOTAL_READINGS = 5;
    const TOTAL_READING_PAGES =
        TOTAL_PAGES * TOTAL_READINGS;

    // One cycle equals one complete reading
    const PAGES_PER_CYCLE = TOTAL_PAGES;

    // 18,270 ÷ 300 = 60.9 → 61
    const FIXED_DAILY_TARGET = 61;

    // Recovery limits
    const MIN_DAILY_TARGET = 61;
    const MAX_DAILY_TARGET = 75;

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

    function saveData(data) {
        if (window.DataService?.save) {
            window.DataService.save(data);
        }
    }

    function isDataReady() {
        return !!window.maxPagesByGrade;
    }

    function safeNumber(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
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

    function formatNumber(value) {
        return safeNumber(value)
            .toLocaleString("en-US");
    }

    function getTodayKey() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function createLocalDate(
        year,
        month,
        day
    ) {
        return new Date(
            year,
            month - 1,
            day,
            0,
            0,
            0,
            0
        );
    }

    // ======================================================
    // 📚 CURRICULUM TOTALS
    // ======================================================
    function getCurriculumTotals() {
        const totals =
            createEmptySubjectObject();

        if (!isDataReady()) {
            return totals;
        }

        for (
            let grade = 9;
            grade <= 12;
            grade++
        ) {
            SUBJECTS.forEach(subject => {
                totals[subject] += safeNumber(
                    window.maxPagesByGrade
                        ?. [grade]
                        ?. [subject]
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

        const fallback = getTodayKey();
        const value = data.startDate || fallback;

        if (value instanceof Date) {
            return createLocalDate(
                value.getFullYear(),
                value.getMonth() + 1,
                value.getDate()
            );
        }

        const text = String(value);
        const match = text.match(
            /^(d{4})-(d{2})-(d{2})/
        );

        if (match) {
            return createLocalDate(
                Number(match[1]),
                Number(match[2]),
                Number(match[3])
            );
        }

        const parsed = new Date(value);

        return Number.isNaN(parsed.getTime())
            ? createLocalDate(
                ...getTodayKey()
                    .split("-")
                    .map(Number)
            )
            : createLocalDate(
                parsed.getFullYear(),
                parsed.getMonth() + 1,
                parsed.getDate()
            );
    }

    function getCurrentDay() {
        const millisecondsPerDay =
            24 * 60 * 60 * 1000;

        const today = new Date();

        const todayStart = createLocalDate(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate()
        );

        const startDate = getStartDate();

        const difference = Math.floor(
            (
                todayStart.getTime() -
                startDate.getTime()
            ) / millisecondsPerDay
        ) + 1;

        return Math.min(
            Math.max(difference, 1),
            TOTAL_DAYS
        );
    }

    function getCycleInfo(day) {
        const safeDay = Math.min(
            Math.max(safeNumber(day), 1),
            TOTAL_DAYS
        );

        return {
            cycle: Math.ceil(
                safeDay / DAYS_PER_CYCLE
            ),
            dayInCycle:
                ((safeDay - 1) % DAYS_PER_CYCLE) + 1
        };
    }

    // ======================================================
    // 📚 CURRICULUM PROGRESS
    // ======================================================
    function getCompletedPages() {
        const data = getData();
        const progress =
            data.studyProgress || {};

        const completed =
            createEmptySubjectObject();

        for (
            let grade = 9;
            grade <= 12;
            grade++
        ) {
            const gradeData =
                progress[grade] || {};

            SUBJECTS.forEach(subject => {
                completed[subject] += Math.max(
                    0,
                    safeNumber(
                        gradeData?.[subject]
                    )
                );
            });
        }

        return completed;
    }

    function getRemainingPages() {
        const totals =
            getCurriculumTotals();

        const completed =
            getCompletedPages();

        return SUBJECTS.reduce(
            (remaining, subject) => {
                remaining[subject] = Math.max(
                    0,
                    totals[subject] -
                    completed[subject]
                );

                return remaining;
            },
            createEmptySubjectObject()
        );
    }

    // ======================================================
    // 📝 DAILY STUDY LOG
    // ======================================================
    function getStudyLog() {
        const data = getData();

        return data.studyLog &&
            typeof data.studyLog === "object"
            ? data.studyLog
            : {};
    }

    function getDayRecord(day) {
        return getStudyLog()[String(day)] ||
            null;
    }

    function getCompletedReadingPages() {
        const studyLog =
            getStudyLog();

        const loggedPages =
            Object.values(studyLog).reduce(
                (total, record) => {
                    return total + Math.max(
                        0,
                        safeNumber(
                            record?.completed
                        )
                    );
                },
                0
            );

        const curriculumPages =
            sumSubjects(
                getCompletedPages()
            );

        return Math.max(
            loggedPages,
            curriculumPages
        );
    }

    function getCompletedPagesThroughDay(day) {
        const studyLog =
            getStudyLog();

        return Object.entries(studyLog)
            .reduce((total, [key, record]) => {
                const recordDay =
                    safeNumber(key);

                if (recordDay > day) {
                    return total;
                }

                return total + Math.max(
                    0,
                    safeNumber(
                        record?.completed
                    )
                );
            }, 0);
    }

    function countMissedDays() {
        const currentDay =
            getCurrentDay();

        const studyLog =
            getStudyLog();

        let missedDays = 0;

        for (
            let day = 1;
            day < currentDay;
            day++
        ) {
            const record =
                studyLog[String(day)];

            if (!record) {
                missedDays++;
                continue;
            }

            if (
                record.missed === true ||
                safeNumber(
                    record.completed
                ) === 0
            ) {
                missedDays++;
            }
        }

        return missedDays;
    }

    function getMissedBacklog() {
        const currentDay =
            getCurrentDay();

        const studyLog =
            getStudyLog();

        let backlog = 0;

        for (
            let day = 1;
            day < currentDay;
            day++
        ) {
            const record =
                studyLog[String(day)];

            if (!record) {
                backlog += FIXED_DAILY_TARGET;
                continue;
            }

            const target = Math.max(
                FIXED_DAILY_TARGET,
                safeNumber(
                    record.target
                )
            );

            const completed = Math.max(
                0,
                safeNumber(
                    record.completed
                )
            );

            backlog += Math.max(
                0,
                target - completed
            );
        }

        return backlog;
    }

    function recordToday(
        completedPages,
        subjectPages = {}
    ) {
        const data = getData();
        const currentDay =
            getCurrentDay();

        const {
            cycle,
            dayInCycle
        } = getCycleInfo(currentDay);

        const completed = Math.max(
            0,
            Math.floor(
                safeNumber(completedPages)
            )
        );

        const target =
            getDailyTarget();

        const studyLog = {
            ...getStudyLog()
        };

        studyLog[String(currentDay)] = {
            cycle,
            day: dayInCycle,
            target,
            completed,
            missed: completed === 0,
            recorded: true,
            recordedAt: new Date()
                .toISOString(),
            subjects: SUBJECTS.reduce(
                (result, subject) => {
                    result[subject] =
                        Math.max(
                            0,
                            Math.floor(
                                safeNumber(
                                    subjectPages
                                        ?. [subject]
                                )
                            )
                        );

                    return result;
                },
                {}
            )
        };

        saveData({
            ...data,
            studyLog
        });

        return studyLog[
            String(currentDay)
        ];
    }

    function closePreviousUnrecordedDays() {
        const data = getData();
        const studyLog = {
            ...getStudyLog()
        };

        const currentDay =
            getCurrentDay();

        let changed = false;

        for (
            let day = 1;
            day < currentDay;
            day++
        ) {
            const key = String(day);

            if (studyLog[key]) {
                continue;
            }

            const {
                cycle,
                dayInCycle
            } = getCycleInfo(day);

            studyLog[key] = {
                cycle,
                day: dayInCycle,
                target: FIXED_DAILY_TARGET,
                completed: 0,
                missed: true,
                recorded: true,
                automaticallyClosed: true,
                subjects:
                    createEmptySubjectObject()
            };

            changed = true;
        }

        if (changed) {
            saveData({
                ...data,
                studyLog
            });
        }

        return studyLog;
    }

    // ======================================================
    // 📈 CYCLE TRACKING
    // ======================================================
    function getCycleCompletedPages(cycle) {
        const studyLog =
            getStudyLog();

        return Object.values(studyLog)
            .reduce((total, record) => {
                if (
                    safeNumber(
                        record?.cycle
                    ) !== safeNumber(cycle)
                ) {
                    return total;
                }

                return total + Math.max(
                    0,
                    safeNumber(
                        record.completed
                    )
                );
            }, 0);
    }

    function getCycleRemainingPages(cycle) {
        return Math.max(
            0,
            PAGES_PER_CYCLE -
            getCycleCompletedPages(cycle)
        );
    }

    // ======================================================
    // 🧠 SUBJECT DISTRIBUTION
    // ======================================================
    function getSubjectRatios() {
        const remaining =
            getRemainingPages();

        const total =
            sumSubjects(remaining);

        if (total <= 0) {
            return {
                ...WEIGHTS
            };
        }

        return SUBJECTS.reduce(
            (ratios, subject) => {
                ratios[subject] =
                    remaining[subject] / total;

                return ratios;
            },
            {}
        );
    }

    function createExactBreakdown(target) {
        const ratios =
            getSubjectRatios();

        const breakdown = {};
        const fractions = [];

        let assigned = 0;

        SUBJECTS.forEach(subject => {
            const exactValue =
                target * ratios[subject];

            const wholeValue =
                Math.floor(exactValue);

            breakdown[subject] =
                wholeValue;

            assigned += wholeValue;

            fractions.push({
                subject,
                fraction:
                    exactValue - wholeValue
            });
        });

        let remainingPages =
            target - assigned;

        fractions.sort((a, b) => {
            return b.fraction - a.fraction;
        });

        let index = 0;

        while (remainingPages > 0) {
            const item =
                fractions[
                    index % fractions.length
                ];

            breakdown[item.subject]++;
            remainingPages--;
            index++;
        }

        return breakdown;
    }

    // ======================================================
    // 🎯 RECOVERY TARGET
    // ======================================================
    function getCurrentDayState() {
        const currentDay =
            getCurrentDay();

        const record =
            getDayRecord(currentDay);

        const recorded =
            record?.recorded === true;

        const completed =
            Math.max(
                0,
                safeNumber(
                    record?.completed
                )
            );

        return {
            record,
            recorded,
            completed,
            missed:
                recorded && completed === 0
        };
    }

    function getDailyTarget() {
        const currentDay =
            getCurrentDay();

        const remainingDays =
            Math.max(
                1,
                TOTAL_DAYS -
                currentDay + 1
            );

        const completedPages =
            getCompletedReadingPages();

        const remainingPages =
            Math.max(
                0,
                TOTAL_READING_PAGES -
                completedPages
            );

        const backlog =
            getMissedBacklog();

        const state =
            getCurrentDayState();

        const currentDayBacklog =
            state.missed
                ? Math.max(
                    FIXED_DAILY_TARGET,
                    safeNumber(
                        state.record?.target
                    )
                )
                : 0;

        const requiredTarget =
            Math.ceil(
                (
                    remainingPages +
                    backlog +
                    currentDayBacklog
                ) / remainingDays
            );

        return Math.min(
            Math.max(
                requiredTarget,
                MIN_DAILY_TARGET
            ),
            MAX_DAILY_TARGET
        );
    }

    function getRecoveryStatus() {
        const currentDay =
            getCurrentDay();

        const remainingDays =
            Math.max(
                0,
                TOTAL_DAYS -
                currentDay + 1
            );

        const completedPages =
            getCompletedReadingPages();

        const remainingPages =
            Math.max(
                0,
                TOTAL_READING_PAGES -
                completedPages
            );

        const previousBacklog =
            getMissedBacklog();

        const state =
            getCurrentDayState();

        const currentDayBacklog =
            state.missed
                ? Math.max(
                    FIXED_DAILY_TARGET,
                    safeNumber(
                        state.record?.target
                    )
                )
                : 0;

        const backlog =
            previousBacklog +
            currentDayBacklog;

        const requiredTarget =
            remainingDays > 0
                ? Math.ceil(
                    (
                        remainingPages +
                        backlog
                    ) / remainingDays
                )
                : Infinity;

        const dailyTarget =
            Math.min(
                Math.max(
                    requiredTarget,
                    MIN_DAILY_TARGET
                ),
                MAX_DAILY_TARGET
            );

        const deadlineAtRisk =
            requiredTarget >
            MAX_DAILY_TARGET;

        let status;

        if (!state.recorded) {
            status = "NOT_RECORDED";
        } else if (state.missed) {
            status = "MISSED_TODAY";
        } else if (deadlineAtRisk) {
            status = "DEADLINE_AT_RISK";
        } else if (backlog > 0) {
            status = "RECOVERY";
        } else {
            status = "ON_TRACK";
        }

        return {
            currentDayRecorded:
                state.recorded,

            currentDayCompleted:
                state.completed,

            currentDayMissed:
                state.missed,

            missedDays:
                countMissedDays() +
                (state.missed ? 1 : 0),

            backlog,
            remainingDays,
            remainingPages,
            requiredTarget,
            dailyTarget,

            maximumDailyTarget:
                MAX_DAILY_TARGET,

            deadlineAtRisk,
            status
        };
    }

    // ======================================================
    // 🔮 PREDICTION
    // ======================================================
    function predictCompletion(
        remaining,
        dailyTarget
    ) {
        const totalRemaining =
            sumSubjects(remaining);

        if (dailyTarget <= 0) {
            return {
                estimatedDays: TOTAL_DAYS,
                onTrack: false,
                riskLevel: "HIGH"
            };
        }

        const estimatedDays =
            totalRemaining / dailyTarget;

        return {
            estimatedDays: Math.ceil(
                estimatedDays
            ),
            onTrack:
                estimatedDays <= TOTAL_DAYS,
            riskLevel:
                estimatedDays > TOTAL_DAYS
                    ? "HIGH"
                    : estimatedDays >
                        TOTAL_DAYS * 0.9
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
                system:
                    "60 days (5 cycle × 3654 pages)",

                cycle: 1,
                day: 1,
                globalDay: 1,

                totalDays: TOTAL_DAYS,
                totalCycles: TOTAL_CYCLES,
                daysPerCycle: DAYS_PER_CYCLE,

                totalPages: TOTAL_PAGES,
                totalReadings: TOTAL_READINGS,
                totalReadingPages:
                    TOTAL_READING_PAGES,

                dailyTarget:
                    FIXED_DAILY_TARGET,

                breakdown:
                    createEmptySubjectObject(),

                total: 0,

                daysProgress: "1 / 300",

                totalPagesProgress:
                    `0 / ${formatNumber(
                        TOTAL_READING_PAGES
                    )}`,

                status: "NO_DATA",
                missedDays: 0,
                backlog: 0,
                deadlineAtRisk: false
            };
        }

        const globalDay =
            getCurrentDay();

        const {
            cycle,
            dayInCycle
        } = getCycleInfo(globalDay);

        const recovery =
            getRecoveryStatus();

        const dailyTarget =
            recovery.dailyTarget;

        const breakdown =
            createExactBreakdown(
                dailyTarget
            );

        const cycleCompleted =
            getCycleCompletedPages(cycle);

        return {
            system:
                "60 days (5 cycle × 3654 pages)",

            cycle,
            day: dayInCycle,
            globalDay,

            totalDays: TOTAL_DAYS,
            totalCycles: TOTAL_CYCLES,
            daysPerCycle: DAYS_PER_CYCLE,

            totalPages: TOTAL_PAGES,
            totalReadings: TOTAL_READINGS,
            totalReadingPages:
                TOTAL_READING_PAGES,

            dailyTarget,
            breakdown,
            total: sumSubjects(
                breakdown
            ),

            cycleBudget:
                PAGES_PER_CYCLE,

            cycleCompleted,

            cycleRemaining:
                Math.max(
                    0,
                    PAGES_PER_CYCLE -
                    cycleCompleted
                ),

            daysProgress:
                `${globalDay} / ${TOTAL_DAYS}`,

            totalPagesProgress:
                `${formatNumber(
                    getCompletedReadingPages()
                )} / ${formatNumber(
                    TOTAL_READING_PAGES
                )}`,

            missedDays:
                recovery.missedDays,

            backlog:
                recovery.backlog,

            remainingDays:
                recovery.remainingDays,

            requiredTarget:
                recovery.requiredTarget,

            maximumDailyTarget:
                recovery.maximumDailyTarget,

            status:
                recovery.status,

            deadlineAtRisk:
                recovery.deadlineAtRisk,

            currentDayRecorded:
                recovery.currentDayRecorded,

            currentDayMissed:
                recovery.currentDayMissed,

            prediction:
                predictCompletion(
                    getRemainingPages(),
                    dailyTarget
                )
        };
    }

    // ======================================================
    // 📊 PROGRESS
    // ======================================================
    function getProgress() {
        const day =
            getCurrentDay();

        if (!isDataReady()) {
            return {
                pagesDone: 0,
                pagesTotal: TOTAL_PAGES,
                pagesPercent: 0,

                readingPagesDone: 0,
                readingPagesTotal:
                    TOTAL_READING_PAGES,
                readingPagesPercent: 0,

                day,
                totalDays: TOTAL_DAYS,
                dayPercent: Math.round(
                    (day / TOTAL_DAYS) * 100
                ),

                daysProgress:
                    `${day} / ${TOTAL_DAYS}`,

                totalPagesProgress:
                    `0 / ${formatNumber(
                        TOTAL_READING_PAGES
                    )}`
            };
        }

        const completed =
            getCompletedPages();

        const pagesDone =
            sumSubjects(completed);

        const pagesPercent =
            TOTAL_PAGES > 0
                ? Math.min(
                    100,
                    Math.round(
                        (
                            pagesDone /
                            TOTAL_PAGES
                        ) * 100
                    )
                )
                : 0;

        const cycle =
            getCycleInfo(day).cycle;

        const readingPagesDone =
            Math.min(
                TOTAL_READING_PAGES,
                (
                    (cycle - 1) *
                    TOTAL_PAGES
                ) +
                Math.min(
                    pagesDone,
                    TOTAL_PAGES
                )
            );

        const readingPagesPercent =
            TOTAL_READING_PAGES > 0
                ? Math.min(
                    100,
                    Math.round(
                        (
                            readingPagesDone /
                            TOTAL_READING_PAGES
                        ) * 100
                    )
                )
                : 0;

        const recovery =
            getRecoveryStatus();

        return {
            pagesDone,
            pagesTotal: TOTAL_PAGES,
            pagesPercent,

            readingPagesDone,
            readingPagesTotal:
                TOTAL_READING_PAGES,
            readingPagesPercent,

            day,
            totalDays: TOTAL_DAYS,

            dayPercent: Math.round(
                (day / TOTAL_DAYS) * 100
            ),

            daysProgress:
                `${day} / ${TOTAL_DAYS}`,

            totalPagesProgress:
                `${formatNumber(
                    getCompletedReadingPages()
                )} / ${formatNumber(
                    TOTAL_READING_PAGES
                )}`,

            missedDays:
                recovery.missedDays,

            backlog:
                recovery.backlog,

            status:
                recovery.status,

            deadlineAtRisk:
                recovery.deadlineAtRisk
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

        const day =
            getCurrentDay();

        const week =
            Math.ceil(day / 7);

        const weekStart =
            (week - 1) * 7 + 1;

        const weekEnd =
            Math.min(
                week * 7,
                TOTAL_DAYS
            );

        const completed =
            getCompletedPages();

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
            const mission =
                getMissionForDay(dayNumber);

            SUBJECTS.forEach(subject => {
                subjects[subject].planned +=
                    mission.breakdown[subject];

                plannedTotal +=
                    mission.breakdown[subject];
            });
        }

        const actualTotal =
            sumSubjects(completed);

        const efficiency =
            plannedTotal > 0
                ? actualTotal / plannedTotal
                : 1;

        return {
            week,
            range:
                `${weekStart}-${weekEnd}`,

            planned: plannedTotal,
            actual: actualTotal,

            efficiency:
                Math.round(
                    efficiency * 100
                ),

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
    // 📌 MISSION FOR SPECIFIC DAY
    // ======================================================
    function getMissionForDay(dayNumber) {
        const safeDay = Math.min(
            Math.max(
                safeNumber(dayNumber),
                1
            ),
            TOTAL_DAYS
        );

        const info =
            getCycleInfo(safeDay);

        const target =
            safeDay === getCurrentDay()
                ? getDailyTarget()
                : FIXED_DAILY_TARGET;

        const breakdown =
            createExactBreakdown(target);

        return {
            cycle: info.cycle,
            day: info.dayInCycle,
            globalDay: safeDay,
            breakdown,
            total: sumSubjects(
                breakdown
            )
        };
    }

    // ======================================================
    // 📤 PUBLIC API
    // ======================================================
    return {
        getDailyMission,
        getProgress,
        getWeeklyPlanner,
        getDailyTarget,
        getRecoveryStatus,
        recordToday,
        closePreviousUnrecordedDays,
        getMissedBacklog,
        getCycleCompletedPages,
        getCycleRemainingPages,
        formatNumber
    };

})();
