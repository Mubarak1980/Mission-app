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
    // 🧠 DYNAMIC SUBJECT DIFFICULTY
    // ======================================================
    const SUBJECT_DIFFICULTY = Object.freeze({
        Math: 0.30,
        Physics: 0.25,
        Chemistry: 0.25,
        Biology: 0.20
    });

    // ======================================================
    // 📦 CACHE FOR PERFORMANCE
    // ======================================================
    const cache = {
        mission: null,
        missionTimestamp: 0,
        progress: null,
        progressTimestamp: 0,
        weekly: null,
        weeklyTimestamp: 0,
        streak: null,
        streakTimestamp: 0
    };

    // ======================================================
    // 🔐 SAFE HELPERS
    // ======================================================
    function getData() {
        try {
            return (window.DataService && window.DataService.get()) || {};
        } catch (error) {
            console.error("Error in getData:", error);
            return {};
        }
    }

    function isDataReady() {
        try {
            return typeof window.maxPagesByGrade !== "undefined";
        } catch (error) {
            console.error("Error in isDataReady:", error);
            return false;
        }
    }

    function safeNumber(v) {
        try {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        } catch (error) {
            return 0;
        }
    }

    // ======================================================
    // 📈 HISTORY HELPERS
    // ======================================================
    function getLast3DaysProgress() {
        try {
            const day = getCurrentDay();
            const data = getData();
            const progress = data.studyProgress || {};
            
            let total = 0;
            for (let d = day - 2; d <= day; d++) {
                if (d < 1) continue;
                SUBJECTS.forEach(s => {
                    total += safeNumber(progress[d]?.[s]);
                });
            }
            return total;
        } catch (error) {
            console.error("Error in getLast3DaysProgress:", error);
            return 0;
        }
    }

    function getRecentAverage(days) {
        try {
            const day = getCurrentDay();
            const data = getData();
            const progress = data.studyProgress || {};
            
            let total = 0;
            let count = 0;
            
            for (let d = day - days + 1; d <= day; d++) {
                if (d < 1) continue;
                let dayTotal = 0;
                SUBJECTS.forEach(s => {
                    dayTotal += safeNumber(progress[d]?.[s]);
                });
                total += dayTotal;
                count++;
            }
            
            return count > 0 ? total / count : 0;
        } catch (error) {
            console.error("Error in getRecentAverage:", error);
            return 0;
        }
    }

    function getTotalProgress(subject) {
        try {
            const data = getData();
            const progress = data.studyProgress || {};
            
            let total = 0;
            for (let g = 9; g <= 12; g++) {
                total += safeNumber(progress[g]?.[subject]);
            }
            return total;
        } catch (error) {
            console.error("Error in getTotalProgress:", error);
            return 0;
        }
    }

    function getTotalOverall() {
        try {
            let total = 0;
            SUBJECTS.forEach(s => {
                total += getTotalProgress(s);
            });
            return total;
        } catch (error) {
            console.error("Error in getTotalOverall:", error);
            return 0;
        }
    }

    // ======================================================
    // 📅 TIME ENGINE
    // ======================================================
    function getStartDate() {
        try {
            const data = getData();
            const fallback = new Date().toISOString().split("T")[0];
            const start = data.startDate || fallback;
            return new Date(start);
        } catch (error) {
            console.error("Error in getStartDate:", error);
            return new Date();
        }
    }

    function getCurrentDay() {
        try {
            const start = getStartDate();
            const now = new Date();
            
            const diff = Math.floor((now - start) / 86400000) + 1;
            
            return Math.min(Math.max(diff, 1), TOTAL_DAYS);
        } catch (error) {
            console.error("Error in getCurrentDay:", error);
            return 1;
        }
    }

    function getCycleInfo(day) {
        try {
            return {
                cycle: Math.ceil(day / DAYS_PER_CYCLE),
                dayInCycle: ((day - 1) % DAYS_PER_CYCLE) + 1
            };
        } catch (error) {
            console.error("Error in getCycleInfo:", error);
            return { cycle: 1, dayInCycle: 1 };
        }
    }

    // ======================================================
    // 📦 REMAINING WORK ENGINE
    // ======================================================
    function getRemainingPages() {
        try {
            if (!isDataReady()) {
                return { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };
            }

            const data = getData();
            if (!data || !data.studyProgress) {
                console.warn("Invalid data structure");
                return { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };
            }

            const progress = data.studyProgress || {};

            const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };

            for (let g = 9; g <= 12; g++) {
                const gData = progress[g] || {};

                SUBJECTS.forEach(subject => {
                    const max = safeNumber(window.maxPagesByGrade?.[g]?.[subject]);
                    const done = safeNumber(gData[subject]);
                    totals[subject] += Math.max(0, max - done);
                });
            }

            return totals;
        } catch (error) {
            console.error("Error in getRemainingPages:", error);
            return { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };
        }
    }

    // ======================================================
    // 📈 BACKLOG SYSTEM
    // ======================================================
    function getBacklogFactor(done, expected) {
        if (expected <= 0) return 1;

        const ratio = done / expected;

        if (ratio >= 1) return 1;

        const last3DaysDone = getLast3DaysProgress();
        const expected3Days = (PAGES_PER_CYCLE / DAYS_PER_CYCLE) * 3;
        const streakBroken = last3DaysDone < expected3Days;

        const multiplier = streakBroken ? 1.2 : 0.6;

        return 1 + (1 - ratio) * multiplier;
    }

    // ======================================================
    // 🧠 WEEKLY WEIGHTS
    // ======================================================
    function getWeeklyWeights() {
        try {
            const data = getData();
            const progress = data.studyProgress || {};

            const totals = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };
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
                const userWeight = overall ? totals[s] / overall : WEIGHTS[s];
                acc[s] = (userWeight * 0.6) + (SUBJECT_DIFFICULTY[s] * 0.4);
                return acc;
            }, {});
        } catch (error) {
            console.error("Error in getWeeklyWeights:", error);
            return WEIGHTS;
        }
    }

    // ======================================================
    // 📉 BURNOUT PROTECTION
    // ======================================================
    function applyBurnoutCap(value, avg) {
        try {
            const recentAvg = getRecentAverage(7);
            
            const tolerance = recentAvg > 0 ? avg / recentAvg : 1;
            
            const capFactor = 1 + (tolerance * 0.3);
            const cap = avg * capFactor;
            
            return Math.min(value, Math.ceil(cap));
        } catch (error) {
            console.error("Error in applyBurnoutCap:", error);
            return Math.min(value, Math.ceil(avg * 1.3));
        }
    }

    // ======================================================
    // 🔮 COMPLETION PREDICTION
    // ======================================================
    function predictCompletion(remaining, dailyTarget) {
        try {
            const total =
                remaining.Math +
                remaining.Physics +
                remaining.Chemistry +
                remaining.Biology;

            if (dailyTarget <= 0) {
                return {
                    estimatedDays: TOTAL_DAYS,
                    onTrack: false,
                    riskLevel: "HIGH",
                    riskMessage: "⚠️ Critical! You need to add 20+ pages/day to catch up",
                    estimatedCompletionDate: null
                };
            }

            const estimatedDays = total / dailyTarget;
            const riskLevel =
                estimatedDays > TOTAL_DAYS ? "HIGH" :
                estimatedDays > TOTAL_DAYS * 0.9 ? "MEDIUM" : "LOW";

            const riskMessages = {
                HIGH: "⚠️ Critical! You need to add 20+ pages/day to catch up",
                MEDIUM: "📉 Slight delay. Add 5-10 pages/day to stay on track",
                LOW: "✅ Great progress! You're ahead of schedule 🎉"
            };

            const startDate = getStartDate();
            const completionDate = new Date(startDate);
            completionDate.setDate(completionDate.getDate() + Math.ceil(estimatedDays));

            return {
                estimatedDays: Math.ceil(estimatedDays),
                onTrack: estimatedDays <= TOTAL_DAYS,
                riskLevel: riskLevel,
                riskMessage: riskMessages[riskLevel],
                estimatedCompletionDate: completionDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })
            };
        } catch (error) {
            console.error("Error in predictCompletion:", error);
            return {
                estimatedDays: TOTAL_DAYS,
                onTrack: false,
                riskLevel: "HIGH",
                riskMessage: "⚠️ Error calculating completion",
                estimatedCompletionDate: null
            };
        }
    }

    // ======================================================
    // 📌 DAILY MISSION ENGINE
    // ======================================================
    function getDailyMission() {
        try {
            const now = Date.now();
            if (cache.mission && (now - cache.missionTimestamp) < 5000) {
                return cache.mission;
            }

            if (!isDataReady()) {
                return {
                    cycle: 1,
                    day: 1,
                    globalDay: 1,
                    totalDays: TOTAL_DAYS,
                    breakdown: {},
                    total: 0,
                    cycleBudget: PAGES_PER_CYCLE,
                    prediction: null
                };
            }

            const day = getCurrentDay();
            const { cycle, dayInCycle } = getCycleInfo(day);

            const remaining = getRemainingPages();

            const cycleRemainingDays = DAYS_PER_CYCLE - dayInCycle + 1;

            const cycleTotalRemaining =
                remaining.Math + remaining.Physics + remaining.Chemistry + remaining.Biology;

            const currentDate = new Date(getStartDate());
            currentDate.setDate(currentDate.getDate() + day - 1);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const weekendMultiplier = isWeekend ? 1.2 : 1.0;

            const baseTarget = Math.ceil((PAGES_PER_CYCLE / cycleRemainingDays) * weekendMultiplier);

            const expectedProgress = (TOTAL_DAYS - (TOTAL_DAYS - day + 1)) / TOTAL_DAYS;
            const doneProgress = 1 - (cycleTotalRemaining / TOTAL_PAGES);

            const adjustedTarget = Math.ceil(baseTarget * getBacklogFactor(doneProgress, expectedProgress));

            const dynamicWeights = getWeeklyWeights();

            const breakdown = {};
            let sum = 0;

            SUBJECTS.forEach(subject => {
                const expectedSubject = (TOTAL_PAGES * WEIGHTS[subject]) / TOTAL_CYCLES;
                const doneSubject = getTotalProgress(subject);
                const subjectBacklog = getBacklogFactor(doneSubject / expectedSubject, expectedSubject);

                const ratio =
                    cycleTotalRemaining > 0
                        ? remaining[subject] / cycleTotalRemaining
                        : dynamicWeights[subject];

                let value = Math.max(1, Math.round(adjustedTarget * ratio * subjectBacklog));

                const avg = adjustedTarget / SUBJECTS.length;
                value = applyBurnoutCap(value, avg);

                breakdown[subject] = value;
                sum += value;
            });

            const correction = adjustedTarget - sum;

            const targetSubject =
                SUBJECTS.reduce((a, b) =>
                    breakdown[a] < breakdown[b] ? a : b
                );

            breakdown[targetSubject] += correction;

            const prediction = predictCompletion(remaining, adjustedTarget);

            const result = {
                cycle,
                day: dayInCycle,
                globalDay: day,
                totalDays: TOTAL_DAYS,
                breakdown,
                total: Object.values(breakdown).reduce((a, b) => a + b, 0),
                cycleBudget: PAGES_PER_CYCLE,
                prediction,
                isWeekend,
                weekendMultiplier
            };

            cache.mission = result;
            cache.missionTimestamp = now;

            return result;
        } catch (error) {
            console.error("Error in getDailyMission:", error);
            return {
                cycle: 1,
                day: 1,
                globalDay: 1,
                totalDays: TOTAL_DAYS,
                breakdown: {},
                total: 0,
                cycleBudget: PAGES_PER_CYCLE,
                prediction: null,
                isWeekend: false,
                weekendMultiplier: 1.0
            };
        }
    }

    // ======================================================
    // 📊 PROGRESS ENGINE
    // ======================================================
    function getProgress() {
        try {
            const now = Date.now();
            if (cache.progress && (now - cache.progressTimestamp) < 5000) {
                return cache.progress;
            }

            const day = getCurrentDay();

            if (!isDataReady()) {
                return {
                    pagesDone: 0,
                    pagesTotal: 0,
                    pagesPercent: 0,
                    day,
                    dayPercent: 0,
                    nextMilestone: null,
                    milestoneReached: false
                };
            }

            const data = getData();
            const progress = data.studyProgress || {};

            let done = 0;
            let max = 0;

            for (let g = 9; g <= 12; g++) {
                const gData = progress[g] || {};

                SUBJECTS.forEach(subject => {
                    const m = safeNumber(window.maxPagesByGrade?.[g]?.[subject]);
                    const d = safeNumber(gData[subject]);

                    done += d;
                    max += m;
                });
            }

            const pagesPercent = max ? Math.round((done / max) * 100) : 0;
            const milestones = [25, 50, 75, 90, 100];
            const nextMilestone = milestones.find(m => pagesPercent < m) || null;

            const result = {
                pagesDone: done,
                pagesTotal: max,
                pagesPercent: pagesPercent,
                day,
                dayPercent: Math.round((day / TOTAL_DAYS) * 100),
                nextMilestone,
                milestoneReached: nextMilestone && pagesPercent >= nextMilestone
            };

            cache.progress = result;
            cache.progressTimestamp = now;

            return result;
        } catch (error) {
            console.error("Error in getProgress:", error);
            return {
                pagesDone: 0,
                pagesTotal: 0,
                pagesPercent: 0,
                day: 1,
                dayPercent: 0,
                nextMilestone: null,
                milestoneReached: false
            };
        }
    }

    // ======================================================
    // 📅 WEEKLY PLANNER
    // ======================================================
    function getWeeklyPlanner() {
        try {
            const now = Date.now();
            if (cache.weekly && (now - cache.weeklyTimestamp) < 5000) {
                return cache.weekly;
            }

            if (!isDataReady()) {
                return {
                    week: 1,
                    range: "1-7",
                    efficiency: 0,
                    status: "NO_DATA",
                    planned: 0,
                    actual: 0,
                    subjects: {},
                    suggestedRestDay: false
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

            for (let d = weekStart; d <= weekEnd; d++) {
                const { cycle, dayInCycle } = getCycleInfo(d);
                const cycleRemainingDays = DAYS_PER_CYCLE - dayInCycle + 1;
                const baseTarget = Math.ceil(PAGES_PER_CYCLE / cycleRemainingDays);
                
                const simulatedDate = new Date(getStartDate());
                simulatedDate.setDate(simulatedDate.getDate() + d - 1);
                const isWeekend = simulatedDate.getDay() === 0 || simulatedDate.getDay() === 6;
                const weekendMultiplier = isWeekend ? 1.2 : 1.0;
                
                const adjustedTarget = Math.ceil(baseTarget * weekendMultiplier);
                const dynamicWeights = getWeeklyWeights();

                SUBJECTS.forEach(s => {
                    const val = Math.round(adjustedTarget * dynamicWeights[s]);
                    subjects[s].planned += val;
                    plannedTotal += val;
                });
            }

            for (let g = 9; g <= 12; g++) {
                const gData = progress[g] || {};

                SUBJECTS.forEach(s => {
                    const val = safeNumber(gData[s]);
                    subjects[s].actual += val;
                    actualTotal += val;
                });
            }

            const efficiency = plannedTotal > 0
                ? actualTotal / plannedTotal
                : 1;

            const recentAvg = getRecentAverage(7);
            const targetAvg = PAGES_PER_CYCLE / DAYS_PER_CYCLE;
            const suggestedRestDay = recentAvg > targetAvg * 1.5;

            const result = {
                week,
                range: `${weekStart}-${weekEnd}`,
                planned: plannedTotal,
                actual: actualTotal,
                efficiency: Math.round(efficiency * 100),
                status:
                    efficiency >= 1 ? "ON_TRACK" :
                    efficiency >= 0.85 ? "SLIGHT_DELAY" :
                    efficiency >= 0.70 ? "BEHIND" : "CRITICAL",
                subjects,
                suggestedRestDay,
                restDayMessage: suggestedRestDay ? "🏖️ You've been pushing hard! Consider a rest day tomorrow" : null
            };

            cache.weekly = result;
            cache.weeklyTimestamp = now;

            return result;
        } catch (error) {
            console.error("Error in getWeeklyPlanner:", error);
            return {
                week: 1,
                range: "1-7",
                efficiency: 0,
                status: "ERROR",
                planned: 0,
                actual: 0,
                subjects: {},
                suggestedRestDay: false,
                restDayMessage: null
            };
        }
    }

    // ======================================================
    // 🔥 STUDY STREAK (FIXED)
    // ======================================================
    function getStudyStreak() {
        try {
            const now = Date.now();
            if (cache.streak && (now - cache.streakTimestamp) < 5000) {
                return cache.streak;
            }

            const day = getCurrentDay();
            const data = getData();
            const progress = data.studyProgress || {};
            
            let streak = 0;
            
            for (let d = day; d >= 1; d--) {
                let dayTotal = 0;
                for (let g = 9; g <= 12; g++) {
                    SUBJECTS.forEach(s => {
                        dayTotal += safeNumber(progress[g]?.[s]);
                    });
                }
                
                if (dayTotal > 0) streak++;
                else break;
            }
            
            const result = streak;
            cache.streak = result;
            cache.streakTimestamp = now;
            
            return result;
        } catch (error) {
            console.error("Error in getStudyStreak:", error);
            return 0;
        }
    }

    // ======================================================
    // 📤 PUBLIC API
    // ======================================================
    return {
        getDailyMission,
        getProgress,
        getWeeklyPlanner,
        getStudyStreak
    };

})();
