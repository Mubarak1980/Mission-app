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

    // 2. UI CONTROLLER & SECTION MAPPING
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

    // 3. REGISTER MODULES (Ensure these match your function names EXACTLY)
    window.SectionMap = { 
        study: "loadStudySection", 
        timetable: "loadWeeklyTimetable", 
        dashboard: "loadDashboard",
        topstudent: "loadTopStudentMode",
        sunnah: "loadSunnahTracker"
    };

    window.loadSection = (type, grade) => {
        const main = document.getElementById("main-content");
        if (!main) return console.error("Critical: #main-content missing");

        const fnName = window.SectionMap[type];
        
        // Debugging log: Open your console to see if this matches
        console.log(`System: Loading ${type} via ${fnName}`);

        if (typeof window[fnName] === 'function') {
            try {
                main.innerHTML = ""; 
                window.UI.save(type, grade);
                window[fnName](grade); 
            } catch (err) {
                console.error(`Runtime Error in ${fnName}:`, err);
                main.innerHTML = `<div style="padding:20px; color:red;">Error loading ${type}. Check console.</div>`;
            }
        } else {
            console.error(`Missing Function: ${fnName} is not defined on window.`);
            main.innerHTML = `<div style="padding:20px; color:red;">Error: Module '${type}' (function ${fnName}) not found.</div>`;
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
})();
