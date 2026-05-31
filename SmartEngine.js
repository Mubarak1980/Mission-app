"use strict";

window.SmartEngine = {
    TOTAL_PAGES: 4648,
    TOTAL_DAYS: 360,
    CYCLE_DAYS: 90,
    CYCLES: 4,

    SUBJECTS: ["Math", "Physics", "Chemistry", "Biology"],

    // ===============================
    // 🔍 READ REAL DATA (FROM SYSTEM)
    // ===============================
    getSystemStats() {
        const data = window.DataService.get();
        const progress = data.studyProgress || {};
        
        let totalDone = 0;

        const subjectTotals = {
            Math: 0,
            Physics: 0,
            Chemistry: 0,
            Biology: 0
        };

        for (const grade of [9,10,11,12]) {
            const g = progress[grade] || {};

            for (const subject of this.SUBJECTS) {
                const val = Number(g[subject] || 0);
                subjectTotals[subject] += val;
                totalDone += val;
            }
        }

        return {
            totalDone,
            subjectTotals
        };
    },

    // ===============================
    // 📅 YEAR PROGRESS (360 DAYS)
    // ===============================
    getYearProgress() {
        const start = new Date(window.DataService.get().startDate);
        const now = new Date();

        const diffDays = Math.max(0, Math.floor((now - start) / 86400000));

        return {
            day: diffDays,
            percent: Math.min(100, Math.round((diffDays / this.TOTAL_DAYS) * 100))
        };
    },

    // ===============================
    // 📘 TOTAL PAGE PROGRESS
    // ===============================
    getPageProgress() {
        const stats = this.getSystemStats();

        return {
            done: stats.totalDone,
            percent: Math.min(100, Math.round((stats.totalDone / this.TOTAL_PAGES) * 100)),
            remaining: Math.max(0, this.TOTAL_PAGES - stats.totalDone)
        };
    },

    // ===============================
    // 🧠 DAILY 90-DAY CYCLE ENGINE
    // ===============================
    getDailyMission() {
        const stats = this.getSystemStats();
        const pageProgress = this.getPageProgress();

        const data = window.DataService.get();
        const start = new Date(data.startDate);
        const now = new Date();

        const day = Math.max(1, Math.floor((now - start) / 86400000));
        const cycleDay = (day % this.CYCLE_DAYS) || 1;
        const cycle = Math.ceil(day / this.CYCLE_DAYS);

        const remainingDays = Math.max(1, this.CYCLE_DAYS - cycleDay);
        const remainingPages = pageProgress.remaining;

        const baseDaily = Math.ceil(remainingPages / remainingDays);

        // Weighted distribution (slight bias to weak subjects)
        const breakdown = {
            Math: Math.round(baseDaily * 0.35),
            Physics: Math.round(baseDaily * 0.20),
            Chemistry: Math.round(baseDaily * 0.25),
            Biology: Math.round(baseDaily * 0.20)
        };

        const total = Object.values(breakdown).reduce((a,b) => a + b, 0);

        return {
            cycle,
            day: cycleDay,
            breakdown,
            total
        };
    }
};
