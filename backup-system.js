
"use strict";

/**
 * 📁 File System Backup Layer (PWA Survival Mode)
 * - Auto writes backup file
 * - Uses File System Access API if available
 * - Falls back to download if not supported
 */

(function () {

    const FILE_NAME = "mission-backup.json";
    const BACKUP_INTERVAL = 60 * 1000; // 1 min

    let fileHandle = null;
    let lastBackup = 0;

    // ===============================
    // GET APP STATE
    // ===============================
    function getState() {
        try {
            return window.DataService?.get() || null;
        } catch {
            return null;
        }
    }

    // ===============================
    // CREATE BACKUP DATA
    // ===============================
    function createBackupPayload() {
        return {
            version: 1,
            timestamp: Date.now(),
            data: getState()
        };
    }

    // ===============================
    // SAVE USING FILE SYSTEM API
    // ===============================
    async function saveToFileSystem(data) {
        try {
            if (!fileHandle) {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: FILE_NAME,
                    types: [{
                        description: "Mission Backup",
                        accept: { "application/json": [".json"] }
                    }]
                });
            }

            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();

            console.log("[Backup] Saved to file system");
            return true;

        } catch (e) {
            console.warn("[Backup] File system API failed:", e);
            return false;
        }
    }

    // ===============================
    // FALLBACK DOWNLOAD METHOD
    // ===============================
    function downloadBackup(data) {
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json"
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = FILE_NAME;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

            console.log("[Backup] Downloaded backup file");
        } catch (e) {
            console.error("[Backup] Download failed:", e);
        }
    }

    // ===============================
    // MAIN BACKUP FUNCTION
    // ===============================
    async function backupNow(force = false) {
        const now = Date.now();

        if (!force && now - lastBackup < 5000) return;

        const payload = createBackupPayload();
        if (!payload.data) return;

        const success = await saveToFileSystem(payload);

        if (!success) {
            downloadBackup(payload);
        }

        lastBackup = now;
    }

    // ===============================
    // AUTO HOOK INTO DATA SERVICE
    // ===============================
    function hookDataService() {
        const original = window.DataService?.set;
        if (!original) return;

        window.DataService.set = function (data) {
            const result = original.call(this, data);

            backupNow(true); // instant backup after every change

            return result;
        };
    }

    // ===============================
    // BACKGROUND BACKUP LOOP
    // ===============================
    function startAutoBackup() {
        setInterval(() => {
            backupNow(false);
        }, BACKUP_INTERVAL);
    }

    // ===============================
    // INIT
    // ===============================
    document.addEventListener("DOMContentLoaded", () => {
        hookDataService();
        startAutoBackup();
    });

    // ===============================
    // PUBLIC API
    // ===============================
    window.BackupSystem = {
        backupNow
    };

})();
