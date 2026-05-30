"use strict";

(function() {
    // 1. GLOBAL ENGINE REGISTRY
    window.NATIVE_FILE_NAME = "mission_app_progress.json";
    window.isNativeStorageReady = false;

    // 2. DATA SERVICE
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

    // 3. SMART CYCLE ENGINE
    window.SmartEngine = {
        getOverallStats() {
            const masterData = window.DataService.get();
            let total = 0;
            Object.keys(masterData.studyProgress || {}).forEach(grade => {
                Object.values(masterData.studyProgress[grade]).forEach(p => total += Number(p) || 0);
            });
            return { totalRead: total };
        },

        getSubjectPriorities() {
            const progress = window.DataService.get().studyProgress || {};
            const subjectStats = {};
            Object.keys(progress).forEach(grade => {
                Object.keys(progress[grade]).forEach(subj => {
                    subjectStats[subj] = (subjectStats[subj] || 0) + Number(progress[grade][subj]);
                });
            });
            const totals = { Math: 1643, Physics: 929, Chemistry: 1090, Biology: 986 };
            return Object.keys(totals).map(subj => {
                const completed = subjectStats[subj] || 0;
                return { name: subj, percent: (completed / totals[subj]) * 100 };
            }).sort((a, b) => a.percent - b.percent);
        },

        getAdaptiveTarget() {
            const stats = this.getOverallStats();
            const daysPassed = Math.max(1, Math.floor((new Date() - new Date(window.DataService.get().startDate)) / 86400000));
            const currentVelocity = stats.totalRead / daysPassed;
            const pagesRemaining = Math.max(0, 4648 - stats.totalRead);
            const daysRemaining = Math.max(1, 90 - daysPassed);
            const rawTarget = pagesRemaining / daysRemaining;
            
            return { 
                dailyTarget: Math.ceil(currentVelocity > rawTarget ? rawTarget * 0.95 : rawTarget * 1.05), 
                priority: this.getSubjectPriorities()[0] 
            };
        }
    };

    // 4. UI CONTROLLER (The Fix for the Black Screen)
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

    window.SectionMap = { 
        study: "loadStudySection", 
        timetable: "loadWeeklyTimetable", 
        dashboard: "loadDashboard" 
    };

    window.loadSection = (type, grade) => {
        const main = document.getElementById("main-content");
        if (!main) return console.error("Element #main-content missing");

        const fnName = window.SectionMap[type];
        
        // Final sanity check: Does the function exist?
        if (typeof window[fnName] === 'function') {
            main.innerHTML = "";
            window.UI.save(type, grade);
            window[fnName](grade); 
        } else {
            console.error(`Missing function: ${fnName}. Make sure it is defined as window.${fnName} = function()...`);
            main.innerHTML = `<div style="padding:20px; color:red;">Error: Module '${type}' not found.</div>`;
        }
    };

    // 5. INITIALIZATION
    document.addEventListener("DOMContentLoaded", () => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
})();
                  
