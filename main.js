window.SmartEngine = {
    TOTAL_PAGES: 4648,
    SUBJECT_WEIGHTS: { Math: 1643, Physics: 929, Chemistry: 1090, Biology: 986 },

    getOverallStats() {
        const masterData = window.DataService.get();
        let total = 0;
        let subjectStats = {};
        
        Object.values(masterData.studyProgress || {}).forEach(gradeData => {
            Object.entries(gradeData).forEach(([subj, pages]) => {
                total += Number(pages) || 0;
                subjectStats[subj] = (subjectStats[subj] || 0) + Number(pages);
            });
        });
        
        return { 
            totalRead: total, 
            pagePercent: Math.min(Math.round((total / this.TOTAL_PAGES) * 100), 100),
            subjectStats: subjectStats
        };
    },

    // ADVANCED WORKLOAD DISTRIBUTOR & SMART CYCLE
    getAdaptiveTarget() {
        const stats = this.getOverallStats();
        const daysElapsed = Math.max(1, Math.floor((new Date() - new Date(window.DataService.get().startDate)) / 86400000));
        const pagesRemaining = Math.max(0, this.TOTAL_PAGES - stats.totalRead);
        const daysRemaining = Math.max(1, 90 - daysElapsed);
        
        // Velocity Calculation: Pages read per day on average
        const currentVelocity = stats.totalRead / daysElapsed;
        const requiredVelocity = pagesRemaining / daysRemaining;

        // Prioritization: Sort subjects by remaining gap
        const priorities = Object.keys(this.SUBJECT_WEIGHTS).map(subj => ({
            name: subj, 
            gap: Math.max(0, this.SUBJECT_WEIGHTS[subj] - (stats.subjectStats[subj] || 0))
        })).sort((a, b) => b.gap - a.gap);

        // Proactive Status Logic
        let status = "✅ On Track";
        if (currentVelocity < (requiredVelocity * 0.8)) status = "🚨 Needs Sprint";
        else if (stats.pagePercent > (daysElapsed / 90 * 100) + 10) status = "🔥 Ahead of Schedule";

        return { 
            dailyTarget: Math.ceil(requiredVelocity),
            topPriority: priorities[0],
            daysRemaining: daysRemaining,
            status: status,
            efficiency: (currentVelocity / requiredVelocity * 100).toFixed(0)
        };
    }
};
                                                           
