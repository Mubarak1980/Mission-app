"use strict";

(function() {
  try {
    // =====================================================
    // 📘 MAIN ENGINE: UNIFIED STORAGE, STATE & SMART LOGIC
    // =====================================================
    window.NATIVE_FILE_NAME = "mission_app_progress.json";
    window.cachedNativeData = window.cachedNativeData || {}; 
    window.isNativeStorageReady = false;

    // 1. DATA SERVICE (Persistence)
    window.DataService = {
      STORAGE_KEY: "study_progress",
      get(fallback) {
        if (window.isNativeStorageReady && window.cachedNativeData[this.STORAGE_KEY]) {
          return window.cachedNativeData[this.STORAGE_KEY];
        }
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : (fallback || { 
            startDate: new Date().toISOString().split("T")[0], 
            studyProgress: {},
            ui: { section: "study", grade: 9 }
        });
      },
      set(data) {
        window.cachedNativeData[this.STORAGE_KEY] = data;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      },
      initNativeFileSystem(callback) {
        window.isNativeStorageReady = true;
        if (callback) callback();
      }
    };

    // 2. SMART CYCLE ENGINE (PRO VERSION)
    window.SmartEngine = {
      getOverallStats() {
        const masterData = window.DataService.get();
        let total = 0;
        const progress = masterData.studyProgress || {};
        Object.keys(progress).forEach(grade => {
            Object.values(progress[grade]).forEach(p => total += Number(p) || 0);
        });
        return { totalRead: total };
      },
      
      // Gap Analysis: Identifies weakest subject
      getSubjectPriorities() {
        const masterData = window.DataService.get();
        const progress = masterData.studyProgress || {};
        const subjectStats = {};
        Object.keys(progress).forEach(grade => {
            Object.keys(progress[grade]).forEach(subj => {
                subjectStats[subj] = (subjectStats[subj] || 0) + Number(progress[grade][subj]);
            });
        });
        const totals = { Math: 1643, Physics: 929, Chemistry: 1090, Biology: 986 };
        return Object.keys(totals).map(subj => {
            const completed = subjectStats[subj] || 0;
            return { name: subj, percent: (completed / totals[subj]) * 100, remaining: totals[subj] - completed };
        }).sort((a, b) => a.percent - b.percent);
      },

      getAdaptiveTarget() {
          const stats = this.getOverallStats();
          const daysPassed = Math.max(1, Math.floor((new Date() - new Date(window.DataService.get().startDate)) / 86400000));
          const currentVelocity = stats.totalRead / daysPassed; 
          
          const pagesRemaining = Math.max(0, 4648 - stats.totalRead);
          const daysRemaining = Math.max(1, 90 - daysPassed);
          
          const rawTarget = pagesRemaining / daysRemaining;
          // Momentum-weighted: reward consistency with 5% buffer
          const adaptiveTarget = currentVelocity > rawTarget ? Math.ceil(rawTarget * 0.95) : Math.ceil(rawTarget * 1.05);
          
          return { dailyTarget: adaptiveTarget, priority: this.getSubjectPriorities()[0] };
      }
    };

    // 3. UI CONTROLLER & GLOBAL REGISTRY
    window.UI = {
        save(section, grade) { const s = window.DataService.get(); s.ui = { section, grade }; window.DataService.set(s); },
        load() { return window.DataService.get().ui || { section: "study", grade: 9 }; }
    };

    window.SectionMap = { 
        study: "loadStudySection", 
        timetable: "loadWeeklyTimetable", 
        dashboard: "loadDashboard" 
    };

    window.loadSection = (type, grade) => {
      const main = document.getElementById("main-content");
      const fnName = window.SectionMap[type];
      if (typeof window[fnName] === 'function') {
          main.innerHTML = "";
          window.UI.save(type, grade);
          window[fnName](grade); 
      }
    };

    window.maxPagesByGrade = { 9: { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 }, 10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 }, 11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 }, 12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 } };

    document.addEventListener("DOMContentLoaded", () => {
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
  } catch (err) { console.error("Critical Engine Failure:", err); }
})();
          
