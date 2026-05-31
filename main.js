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

    // 2. UI CONTROLLER
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

    // 3. MODULE REGISTRY
    window.SectionMap = { 
        study: "loadStudySection", 
        timetable: "loadWeeklyTimetable", 
        dashboard: "loadDashboard",
        topstudent: "loadTopStudentMode",
        sunnah: "loadSunnahTracker"
    };

    // 4. CENTRAL LOADER
    window.loadSection = (type, grade) => {
        const main = document.getElementById("main-content");
        if (!main) return;
        
        const fnName = window.SectionMap[type];
        
        if (typeof window[fnName] === 'function') {
            try {
                window.UI.save(type, grade);
                window[fnName](grade); 
            } catch (err) {
                console.error(`Runtime Error in ${fnName}:`, err);
                main.innerHTML = `<div style="padding:20px; color:red;">Module load error.</div>`;
            }
        } else {
            console.error(`Missing function: ${fnName}`);
            main.innerHTML = `<div style="padding:20px; color:red;">Module '${type}' not found.</div>`;
        }
    };

    // 5. INITIALIZATION
    document.addEventListener("DOMContentLoaded", () => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
})();
