"use strict";

(function() {
  try {
    // =====================================================
    // 📘 MAIN ENGINE (UNIFIED STORAGE, UI & SMART ENGINE)
    // =====================================================
    window.NATIVE_FILE_NAME = "mission_app_progress.json";
    window.cachedNativeData = window.cachedNativeData || {}; 
    window.isNativeStorageReady = false;

    window.DataService = {
      STORAGE_KEY: "study_progress",

      get(fallback) {
        if (window.isNativeStorageReady && window.cachedNativeData[this.STORAGE_KEY]) {
          return window.cachedNativeData[this.STORAGE_KEY];
        }
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : (fallback || { 
            startDate: new Date().toISOString().split("T")[0], 
            cycleNumber: 1, 
            studyProgress: {},
            velocityLog: {}, 
            ui: { section: "study", grade: 9 }
        });
      },

      set(data) {
        window.cachedNativeData[this.STORAGE_KEY] = data;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        if (window.isNativeStorageReady && window.cordova?.file) {
          const path = cordova.file.dataDirectory;
          window.resolveLocalFileSystemURL(path, (dir) => {
            dir.getFile(window.NATIVE_FILE_NAME, { create: true }, (fileEntry) => {
              fileEntry.createWriter((fileWriter) => {
                fileWriter.write(new Blob([JSON.stringify(window.cachedNativeData)], { type: "text/plain" }));
              });
            });
          });
        }
      },

      logVelocity(subject, pages) {
        const data = this.get();
        if (!data.velocityLog) data.velocityLog = {};
        if (!data.velocityLog[subject]) data.velocityLog[subject] = { total: 0, sessions: 0 };
        data.velocityLog[subject].total += pages;
        data.velocityLog[subject].sessions += 1;
        this.set(data);
      },

      initNativeFileSystem(callback) {
        const load = () => {
          if (window.cordova?.file) {
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dir) => {
              dir.getFile(window.NATIVE_FILE_NAME, { create: true }, (fileEntry) => {
                fileEntry.file((file) => {
                  const reader = new FileReader();
                  reader.onloadend = function() {
                    if (this.result) {
                      try { window.cachedNativeData = JSON.parse(this.result); } catch (e) { window.cachedNativeData = {}; }
                      window.isNativeStorageReady = true;
                      localStorage.setItem(window.DataService.STORAGE_KEY, JSON.stringify(window.cachedNativeData[window.DataService.STORAGE_KEY] || {}));
                    }
                    if (callback) callback();
                  };
                  reader.readAsText(file);
                });
              });
            });
          } else {
            window.isNativeStorageReady = true;
            if (callback) callback();
          }
        };
        window.cordova ? document.addEventListener("deviceready", load, false) : load();
      }
    };

    // 🧠 SMART CYCLE ENGINE: Dynamically re-balances workload
    window.SmartEngine = {
      calculateDynamicTarget() {
        const masterData = window.DataService.get();
        const TOTAL_CYCLE_PAGES = 4638;
        const TOTAL_CYCLE_DAYS = 90;
        
        let totalCompleted = 0;
        if (masterData.studyProgress) {
            Object.values(masterData.studyProgress).forEach(gradeData => {
                Object.values(gradeData).forEach(pages => totalCompleted += Number(pages) || 0);
            });
        }

        const startDate = new Date(masterData.startDate);
        const daysPassed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(1, TOTAL_CYCLE_DAYS - daysPassed);
        const pagesRemaining = Math.max(0, TOTAL_CYCLE_PAGES - totalCompleted);

        return Math.round(pagesRemaining / daysRemaining);
      },

      getWorkloadStatus(pagePercent, timePercent) {
        if (pagePercent >= timePercent) return "✅ On Track";
        if (pagePercent >= timePercent - 10) return "⚠️ Slightly Behind";
        return "🚨 Needs Sprint";
      }
    };

    window.UI = {
        save(section, grade) {
            const state = window.DataService.get();
            state.ui = { section, grade };
            window.DataService.set(state);
        },
        load() {
            return window.DataService.get().ui || { section: "study", grade: 9 };
        }
    };

    const SectionMap = {
      study: "loadStudySection",
      timetable: "loadWeeklyTimetable",
      dashboard: "loadDashboard",
      topstudent: "loadTopStudentMode",
      sunnah: "loadSunnahTracker"
    };

    window.loadSection = (type, grade) => {
      const mainContent = document.getElementById("main-content");
      if (!mainContent) return;
      mainContent.innerHTML = ""; 
      const functionName = SectionMap[type];
      if (window[functionName]) {
          window.UI.save(type, grade);
          document.querySelectorAll('.nav-button').forEach(btn => btn.classList.toggle('active', btn.dataset.target === type));
          window[functionName](grade);
      }
    };

    window.maxPagesByGrade = {
      9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164, English: 0 },
      10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174, English: 0 },
      11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284, English: 0 },
      12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354, English: 0 }
    };

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("next-btn")?.addEventListener("click", () => {
            const state = window.UI.load();
            const nextGrade = Math.min(state.grade + 1, 12);
            window.loadSection(state.section, nextGrade);
        });

        document.getElementById("prev-btn")?.addEventListener("click", () => {
            const state = window.UI.load();
            const prevGrade = Math.max(state.grade - 1, 9);
            window.loadSection(state.section, prevGrade);
        });

        window.DataService.initNativeFileSystem(() => {
            const lastUI = window.UI.load();
            window.loadSection(lastUI.section, lastUI.grade);
        });
        
        console.log("🚀 Smart Engine Engine Initialized.");
    });
    
  } catch (err) {
    console.error("Critical Engine Failure:", err);
  }
})();
            
