"use strict";

(function() {
    // 1. DATA SERVICE (Persistence Layer)
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

    // 2. SMART ENGINE (Calculation Layer)
    window.SmartEngine = {
        getOverallStats() {
            const masterData = window.DataService.get();
            let total = 0;
            Object.keys(masterData.studyProgress || {}).forEach(grade => {
                Object.values(masterData.studyProgress[grade]).forEach(p => total += Number(p) || 0);
            });
            return { totalRead: total, pagePercent: Math.min(Math.round((total / 4648) * 100), 100) };
        },

        getAdaptiveTarget() {
            const stats = this.getOverallStats();
            const daysPassed = Math.max(1, Math.floor((new Date() - new Date(window.DataService.get().startDate)) / 86400000));
            const pagesRemaining = Math.max(0, 4648 - stats.totalRead);
            const daysRemaining = Math.max(1, 90 - daysPassed);
            
            const rawTarget = pagesRemaining / daysRemaining;
            return { 
                dailyTarget: Math.ceil(rawTarget), 
                daysRemaining: daysRemaining,
                status: stats.pagePercent < (Math.min(daysPassed/90*100, 100) - 10) ? "🚨 Needs Sprint" : "✅ On Track"
            };
        }
    };

    // 3. UI CONTROLLER (The Orchestrator)
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

    // MAP OF ALL MODULE FUNCTIONS
    window.SectionMap = { 
        study: "loadStudySection", 
        timetable: "loadWeeklyTimetable", 
        dashboard: "loadDashboard",
        topstudent: "loadTopStudentMode",
        sunnah: "loadSunnahTracker"
    };

    window.loadSection = (type, grade) => {
        const main = document.getElementById("main-content");
        if (!main) return console.error("Critical: #main-content not found.");

        const fnName = window.SectionMap[type];
        
        // Safety: verify the function exists globally
        if (typeof window[fnName] === 'function') {
            try {
                main.innerHTML = ""; // Clear existing content
                window.UI.save(type, grade);
                window[fnName](grade); // Call the module
            } catch (err) {
                console.error(`Error executing ${fnName}:`, err);
                main.innerHTML = `<div style="padding:20px; color:red;">App Error: Module ${type} crashed.</div>`;
            }
        } else {
            console.error(`Missing Function: ${fnName} is not defined globally.`);
            main.innerHTML = `<div style="padding:20px; color:red;">Error: Module ${type} not found.</div>`;
        }
    };

    // 4. INITIALIZATION
    document.addEventListener("DOMContentLoaded", () => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
})();
