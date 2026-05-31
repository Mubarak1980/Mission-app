"use strict";

(function() {
    // 1. DATA SERVICE
    window.DataService = {
        STORAGE_KEY: "study_progress",
        get(fallback) {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : (fallback || { 
                startDate: new Date().toISOString().split("T")[0], 
                studyProgress: {},
                ui: { section: "study", grade: 9 }
            });
        },
        set(data) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        }
    };

    // 2. SMART ENGINE (Upgraded Workload Distributor)
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

        getAdaptiveTarget() {
            const stats = this.getOverallStats();
            const daysPassed = Math.max(1, Math.floor((new Date() - new Date(window.DataService.get().startDate)) / 86400000));
            const pagesRemaining = Math.max(0, this.TOTAL_PAGES - stats.totalRead);
            const daysRemaining = Math.max(1, 90 - daysPassed);
            
            // Calculate Priority: Sort subjects by 'Gap' (Target - Completed)
            const priorities = Object.keys(this.SUBJECT_WEIGHTS).map(subj => {
                const completed = stats.subjectStats[subj] || 0;
                return { name: subj, gap: this.SUBJECT_WEIGHTS[subj] - completed };
            }).sort((a, b) => b.gap - a.gap);

            const status = stats.pagePercent < (daysPassed / 90 * 100) - 10 ? "🚨 Needs Sprint" : "✅ On Track";

            return { 
                dailyTarget: Math.ceil(pagesRemaining / daysRemaining),
                topPriority: priorities[0],
                daysRemaining: daysRemaining,
                status: status 
            };
        }
    };

    // 3. UI CONTROLLER
    window.UI = {
        save(section, grade) { 
            const s = window.DataService.get(); 
            s.ui = { section, grade }; 
            window.DataService.set(s); 
        },
        load() { 
            return window.DataService.get().ui || { section: "study", grade: 9 }; 
        }
    };

    // 4. MODULE REGISTRY
    window.SectionMap = { 
        study: "loadStudySection", 
        timetable: "loadWeeklyTimetable", 
        dashboard: "loadDashboard",
        topstudent: "loadTopStudentMode",
        sunnah: "loadSunnahTracker"
    };

    window.loadSection = (type, grade) => {
        const main = document.getElementById("main-content");
        if (!main) return;

        const fnName = window.SectionMap[type];
        
        if (typeof window[fnName] === 'function') {
            try {
                main.innerHTML = ""; 
                window.UI.save(type, grade);
                window[fnName](grade); 
            } catch (err) {
                console.error(`Runtime Error in ${fnName}:`, err);
                main.innerHTML = `<div style="padding:20px; color:red;">Module error.</div>`;
            }
        } else {
            console.error(`Missing function: ${fnName}`);
            main.innerHTML = `<div style="padding:20px; color:red;">Module not found.</div>`;
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
})();
