"use strict";

/* =====================================================
   📘 MAIN ENGINE (UNIFIED STORAGE & UI PERSISTENCE)
===================================================== */
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
        pages: 0,
        ui: { section: "study", grade: 9 } // Default UI state
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
                  window.cachedNativeData = JSON.parse(this.result);
                  window.isNativeStorageReady = true;
                  localStorage.setItem(window.DataService.STORAGE_KEY, JSON.stringify(window.cachedNativeData[window.DataService.STORAGE_KEY]));
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

/* ===============================
   UI STATE MANAGEMENT
=============================== */
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

/* ===============================
   BOOTSTRAP ENGINE
=============================== */
(() => {
  try {
    window.maxPagesByGrade = {
      9: { Math: 363, Physics: 174, Chemistry: 175, Biology: 164, English: 223 },
      10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174, English: 316 },
      11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284, English: 283 },
      12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354, English: 263 }
    };

    window.DataService.initNativeFileSystem(() => {
        // Automatically restore the last section on boot
        const lastUI = window.UI.load();
        window.loadSection(lastUI.section, lastUI.grade);
    });
    
    console.log("🚀 Engine Initialized: UI Persistence Active.");
  } catch (err) {
    console.error("Critical Engine Failure:", err);
  }
})();

/* ===============================
   ROUTING
=============================== */
window.loadSection = (type, grade) => {
  const map = { study: "loadStudySection", dashboard: "loadDashboard", timetable: "loadWeeklyTimetable" };
  if (window[map[type]]) {
      window.UI.save(type, grade); // Persist selection
      window[map[type]](grade);
  }
};
               
