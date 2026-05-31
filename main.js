window.SmartEngine = {
    TOTAL_PAGES: 4648,
    SUBJECT_WEIGHTS: { Math: 1643, Physics: 929, Chemistry: 1090, Biology: 986 },

    getOverallStats() {
        const masterData = window.DataService.get() || {};
        const progress = masterData.studyProgress || {};
        
        let total = 0;
        let subjectStats = { Math: 0, Physics: 0, Chemistry: 0, Biology: 0 };
        
        // Loop through each grade's subject data safely
        Object.values(progress).forEach(gradeData => {
            if (gradeData && typeof gradeData === 'object') {
                Object.entries(gradeData).forEach(([subj, pages]) => {
                    const count = Number(pages) || 0;
                    total += count;
                    if (subjectStats.hasOwnProperty(subj)) {
                        subjectStats[subj] += count;
                    }
                });
            }
        });
        
        return { 
            totalRead: total, 
            pagePercent: Math.min(Math.round((total / this.TOTAL_PAGES) * 100), 100),
            subjectStats: subjectStats
        };
    },

    getAdaptiveTarget() {
        const stats = this.getOverallStats();
        // Use a safe date fallback
        const startDate = new Date(window.DataService.get().startDate || new Date());
        const daysElapsed = Math.max(1, Math.floor((new Date() - startDate) / 86400000));
        
        const pagesRemaining = Math.max(0, this.TOTAL_PAGES - stats.totalRead);
        const daysRemaining = Math.max(1, 90 - daysElapsed);
        
        const currentVelocity = stats.totalRead / daysElapsed;
        const requiredVelocity = pagesRemaining / daysRemaining;

        // Prioritization
        const priorities = Object.keys(this.SUBJECT_WEIGHTS).map(subj => ({
            name: subj, 
            gap: Math.max(0, this.SUBJECT_WEIGHTS[subj] - (stats.subjectStats[subj] || 0))
        })).sort((a, b) => b.gap - a.gap);

        // Status Logic
        let status = "✅ On Track";
        if (currentVelocity < (requiredVelocity * 0.8)) status = "🚨 Needs Sprint";
        else if (stats.pagePercent > (daysElapsed / 90 * 100) + 10) status = "🔥 Ahead of Schedule";

        return { 
            dailyTarget: Math.ceil(requiredVelocity),
            topPriority: priorities[0] || { name: "None", gap: 0 },
            daysRemaining: daysRemaining,
            status: status,
            efficiency: Math.round((currentVelocity / (requiredVelocity || 1)) * 100)
        };
    }
};
                                             
