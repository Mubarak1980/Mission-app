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

    // 2. SMART ENGINE
    window.SmartEngine = {
        getOverallStats() {
            const masterData = window.DataService.get();
            let total = 0;
            Object.keys(masterData.studyProgress || {}).forEach(grade => {
                Object.values(masterData.studyProgress[grade]).forEach(p => total += Number(p) || 0);
            });
            // Fixed: Return pagePercent to prevent timetable.js from crashing
            const percent = Math.min(Math.round((total / 4648) * 100), 100);
            return { totalRead: total, pagePercent: percent };
        },

        getAdaptiveTarget() {
            const stats = this.getOverallStats();
            const daysPassed = Math.max(1, Math.floor((new Date() - new Date(window.DataService.get().startDate)) / 86400000));
            const pagesRemaining = Math.max(0, 4648 - stats.totalRead);
            const daysRemaining = Math.max(1, 90 - daysPassed);
            const rawTarget = pagesRemaining / daysRemaining;
            
            // Fixed: Define status explicitly to prevent undefined errors
            const progressTarget = (daysPassed / 90) * 100;
            const status = stats.pagePercent < (progressTarget - 10) ? "🚨 Needs Sprint" : "✅ On Track";

            return { 
                dailyTarget: Math.ceil(rawTarget), 
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
        
        // Safety: verify the function exists before calling
        if (typeof window[fnName] === 'function') {
            try {
                main.innerHTML = ""; 
                window.UI.save(type, grade);
                window[fnName](grade); 
            } catch (err) {
                console.error(`Runtime Error in ${fnName}:`, err);
                main.innerHTML = `<div style="padding:20px; color:red;">Module load error.</div>`;
            }
        } else {
            console.error(`Missing function: ${fnName}`);
            main.innerHTML = `<div style="padding:20px; color:red;">Error: Module '${type}' not found.</div>`;
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
})();
