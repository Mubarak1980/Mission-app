"use strict";

// =====================================================
// 🕌 SUNNAH TRACKER (FULLY UNIFIED WITH DATA BRIDGE)
// =====================================================

const totalQuranPages = 604;
const pagesPerJuz = 20;
const totalJuz = 30; 
const TARGET_PAGES_PER_DAY = 1; 

// ===============================
// BRIDGE-AWARE STORAGE
// ===============================
function loadSunnahState() {
    // Fetches directly from the unified master file
    return window.DataService.get("sunnah_progress") || {};
}

function saveSunnahProgress(data) {
    const prev = loadSunnahState();
    // Save to the bridge (which handles Android internal storage mirroring)
    window.DataService.set("sunnah_progress", { ...prev, ...data });
}

// ===============================
// CENTRALIZED INPUT HANDLER
// ===============================
function cleanSunnahInputRouter(e) {
    const input = e.target;
    if (!input || input.id !== "quran-pages") return;

    let value = Math.max(0, Math.min(Number(input.value) || 0, totalQuranPages));
    const newJuz = Math.min(Math.floor(value / pagesPerJuz), totalJuz);
    
    input.value = value;

    // Update UI elements
    const pagesProgress = document.getElementById("quran-pages-progress");
    const juzInput = document.getElementById("quran-juz");
    const juzProgress = document.getElementById("quran-juz-progress");
    
    if (pagesProgress) pagesProgress.value = value;
    if (juzInput) juzInput.value = newJuz;
    if (juzProgress) juzProgress.value = newJuz;

    // Trigger Bridge Save
    saveSunnahProgress({ pages: value, juz: newJuz });
}

// ===============================
// MAIN TRACKER COMPONENT
// ===============================
function loadSunnahTracker() {
    const container = document.getElementById("main-content");
    if (!container) return;

    const saved = loadSunnahState();
    let startDate = saved.startDate || new Date().toISOString().split("T")[0];
    
    if (!saved.startDate) saveSunnahProgress({ startDate });

    const pages = Math.min(Math.max(Number(saved.pages) || 0, 0), totalQuranPages);
    const juz = Math.min(Math.floor(pages / pagesPerJuz), totalJuz);

    // ... (keep your existing HTML generation code)
    // Just ensure the event listener is attached:
    container.innerHTML = `... your HTML template ...`;
    container.removeEventListener("input", cleanSunnahInputRouter);
    container.addEventListener("input", cleanSunnahInputRouter);
}

window.loadSunnahTracker = loadSunnahTracker;
    
