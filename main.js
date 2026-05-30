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

    // 2. STATE-MACHINE ENGINE (The Gatekeeper)
    window.StateEngine = {
        getCurrentState() {
            const data = window.DataService.get();
            const daysPassed = Math.floor((new Date() - new Date(data.startDate)) / (1000 * 60 * 60 * 24));
            if (daysPassed > 90) return "CYCLE_COMPLETE";
            if (!data.studyProgress || Object.keys(data.studyProgress).length === 0) return "INITIALIZING";
            return "ACTIVE_STUDY";
        },
        canLogProgress() { return this.getCurrentState() === "ACTIVE_STUDY"; }
    };

    // 3. SMART CYCLE ENGINE (Logic & Guidance)
    window.SmartEngine = {
      getOverallStats() {
        const masterData = window.DataService.get();
        let total = 0;
        Object.values(masterData.studyProgress || {}).forEach(grade => Object.values(grade).forEach(p => total += Number(p) || 0));
        return { totalRead: total, pagePercent: Math.min(Math.round((total / 18552) * 100), 100), timePercent: Math.min(Math.round((Math.min(Math.floor((new Date() - new Date(masterData.startDate)) / 86400000), 360) / 360) * 100), 100) };
      },
      
      // NEW: Cycle Countdown logic
      getCycleTimeRemaining() {
        const data = window.DataService.get();
        const daysPassed = Math.floor((new Date() - new Date(data.startDate)) / (1000 * 60 * 60 * 24));
        return { remaining: Math.max(0, 90 - daysPassed), percent: Math.min(Math.round((daysPassed / 90) * 100), 100) };
      },

      // NEW: Dynamic Workload Distribution
      getSuggestedDailyWorkload() {
        const time = this.getCycleTimeRemaining();
        const remainingPages = Math.max(0, 4638 - this.getOverallStats().totalRead);
        const dailyTarget = Math.round(remainingPages / Math.max(1, time.remaining));
        return {
            totalTarget: dailyTarget,
            Math: Math.round(dailyTarget * 0.40),
            Physics: Math.round(dailyTarget * 0.20),
            Chemistry: Math.round(dailyTarget * 0.20),
            Biology: Math.round(dailyTarget * 0.20)
        };
      },

      getWorkloadStatus(pageP, timeP) {
        return pageP >= timeP ? "✅ On Track" : (pageP >= timeP - 10 ? "⚠️ Slightly Behind" : "🚨 Needs Sprint");
      }
    };

    // 4. UI CONTROLLER
    window.UI = {
        save(section, grade) { const s = window.DataService.get(); s.ui = { section, grade }; window.DataService.set(s); },
        load() { return window.DataService.get().ui || { section: "study", grade: 9 }; }
    };

    const SectionMap = { study: "loadStudySection", timetable: "loadWeeklyTimetable", dashboard: "loadDashboard", topstudent: "loadTopStudentMode", sunnah: "loadSunnahTracker" };

    window.loadSection = (type, grade) => {
      const main = document.getElementById("main-content");
      if (!main) return;
      main.innerHTML = "";
      const fn = SectionMap[type];
      if (window[fn]) {
          window.UI.save(type, grade);
          document.querySelectorAll('.nav-button').forEach(b => b.classList.toggle('active', b.dataset.target === type));
          window[fn](grade);
      }
    };

    window.maxPagesByGrade = { 9: { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 }, 10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 }, 11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 }, 12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 } };

    document.addEventListener("DOMContentLoaded", () => {
        window.DataService.initNativeFileSystem(() => {
            const lastUI = window.UI.load();
            setTimeout(() => window.loadSection(lastUI.section, lastUI.grade), 100);
        });
        console.log("🚀 State-Machine Engine Initialized. Mode:", window.StateEngine.getCurrentState());
    });
  } catch (err) { console.error("Critical Engine Failure:", err); }
})();
              
