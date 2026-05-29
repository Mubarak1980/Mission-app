"use strict";

// =====================================================
// 🕌 SUNNAH TRACKER (FULLY UNIFIED WITH DATA BRIDGE)
// =====================================================

const totalQuranPages = 604;
const pagesPerJuz = 20;
const totalJuz = 30;

// ===============================
// BRIDGE-AWARE LOADING
// ===============================
function loadSunnahState() {
    const masterData = window.DataService.get();
    // Ensure the sunnahProgress object exists within the master state
    if (!masterData.sunnahProgress) masterData.sunnahProgress = { 
        pages: 0, 
        juz: 0, 
        startDate: new Date().toISOString().split("T")[0] 
    };
    return masterData.sunnahProgress;
}

// ===============================
// BRIDGE-AWARE SAVING
// ===============================
function saveSunnahProgress(data) {
    const masterData = window.DataService.get();
    // Merge new data into the master object
    masterData.sunnahProgress = { ...(masterData.sunnahProgress || {}), ...data };
    // Persist through the unified bridge
    window.DataService.set(masterData);
}

// ===============================
// CENTRALIZED INPUT HANDLER
// ===============================
function cleanSunnahInputRouter(e) {
    const input = e.target;
    if (!input || input.id !== "quran-pages") return;

    let value = Math.max(0, Math.min(Number(input.value) || 0, totalQuranPages));
    const newJuz = Math.min(Math.floor(value / pagesPerJuz), totalJuz);
    
    // Save to the bridge
    saveSunnahProgress({ pages: value, juz: newJuz });

    // Update UI components
    const pagesProgress = document.getElementById("quran-pages-progress");
    const juzDisplay = document.getElementById("quran-juz");
    const juzProgress = document.getElementById("quran-juz-progress");
    
    if (pagesProgress) pagesProgress.value = value;
    if (juzDisplay) juzDisplay.innerText = newJuz;
    if (juzProgress) juzProgress.value = newJuz;
}

// ===============================
// MAIN TRACKER COMPONENT
// ===============================
window.loadSunnahTracker = (grade) => {
    const container = document.getElementById("main-content");
    if (!container) return;

    // 🛡️ Ensure clean slate
    container.innerHTML = "";

    const saved = loadSunnahState();
    const pages = Math.min(Math.max(Number(saved.pages) || 0, 0), totalQuranPages);
    const juz = Math.min(Math.floor(pages / pagesPerJuz), totalJuz);

    container.innerHTML = `
        <h2>🕌 Sunnah & Quran Tracker</h2>
        <div class="sunnah-container" style="padding: 20px;">
            <label for="quran-pages">Quran Pages Read (Total: ${totalQuranPages})</label>
            <input type="number" id="quran-pages" value="${pages}" min="0" max="${totalQuranPages}" 
                   style="width: 100%; padding: 10px; margin: 10px 0; border-radius: 6px;">
            
            <progress id="quran-pages-progress" value="${pages}" max="${totalQuranPages}" style="width: 100%;"></progress>
            
            <div style="margin-top: 20px;">
                <p>Current Juz: <span id="quran-juz">${juz}</span> / ${totalJuz}</p>
                <progress id="quran-juz-progress" value="${juz}" max="${totalJuz}" style="width: 100%;"></progress>
            </div>
        </div>
    `;

    container.removeEventListener("input", cleanSunnahInputRouter);
    container.addEventListener("input", cleanSunnahInputRouter);
};
