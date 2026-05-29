"use strict";

/* =====================================================
   📘 MAIN ENGINE (UNIFIED STORAGE BRIDGE)
   Everything now runs through window.DataService
===================================================== */

window.NATIVE_FILE_NAME = "mission_app_progress.json";
window.cachedNativeData = window.cachedNativeData || {}; 
window.isNativeStorageReady = false;

window.DataService = {
  // Use a single Source of Truth
  STORAGE_KEY: "study_progress",

  get(fallback) {
    // 1. Check if we have loaded native phone storage
    if (window.isNativeStorageReady && window.cachedNativeData[this.STORAGE_KEY]) {
      return window.cachedNativeData[this.STORAGE_KEY];
    }
    // 2. Fallback to localStorage
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : (fallback || { startDate: new Date().toISOString().split("T")[0], cycleNumber: 1, pages: 0 });
  },

  set(data) {
    // Update local cache
    window.cachedNativeData[this.STORAGE_KEY] = data;
    // Update localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    
    // Mirror to Native File System if on mobile
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

    window.DataService.initNativeFileSystem();
    console.log("🚀 Engine Initialized: Modular Data Bridge Active.");
  } catch (err) {
    console.error("Critical Engine Failure:", err);
  }
})();
  
