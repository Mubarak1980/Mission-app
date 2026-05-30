"use strict";

// =====================================================
// 🕌 SUNNAH TRACKER (FULLY UNIFIED & SANITIZED)
// =====================================================

const totalQuranPages = 604;
const pagesPerJuz = 20;
const totalJuz = 30;

function loadSunnahState() {
    const masterData = window.DataService.get();
    if (!masterData.sunnahProgress) masterData.sunnahProgress = { 
        pages: 0, 
        juz: 0 
    };
    return masterData.sunnahProgress;
}

function saveSunnahProgress(data) {
    const masterData = window.DataService.get();
    masterData.sunnahProgress = { ...(masterData.sunnahProgress || {}), ...data };
    window.DataService.set(masterData);
}

// ===============================
// OPTIMIZED INPUT HANDLER
// ===============================
function cleanSunnahInputRouter(e) {
    const input = e.target;
    if (!input || input.id !== "quran-pages") return;

    // 1. Sanitize: Allow only numbers, limit to 3 digits (max 604)
    let valStr = input.value.replace(/[^0-9]/g, '');
    if (valStr.length > 3) valStr = valStr.slice(0, 3);
    
    // 2. Convert to number (strips leading zeros)
    let value = Number(valStr);
    if (isNaN(value)) value = 0;
    
    // 3. Enforce range
    if (value > totalQuranPages) value = totalQuranPages;
    
    // 4. Update the input display immediately to cleaned value
    input.value = value;

    // 5. Calculate logic
    const newJuz = Math.min(Math.floor(value / pagesPerJuz), totalJuz);
    
    // 6. Save to bridge
    saveSunnahProgress({ pages: value, juz: newJuz });

    // 7. Update UI components
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

    const saved = loadSunnahState();
    const pages = Math.min(Math.max(Number(saved.pages) || 0, 0), totalQuranPages);
    const juz = Math.min(Math.floor(pages / pagesPerJuz), totalJuz);

    container.innerHTML = `
        <h2>🕌 Sunnah & Quran Tracker</h2>
        <div class="sunnah-container" style="padding: 20px;">
            <label for="quran-pages">Quran Pages Read (Total: ${totalQuranPages})</label>
            <input 
                type="number" 
                inputmode="numeric" 
                pattern="[0-9]*" 
                id="quran-pages" 
                value="${pages}" 
                min="0" 
                max="${totalQuranPages}" 
                style="width: 100%; padding: 10px; margin: 10px 0; border-radius: 6px; box-sizing: border-box;"
            >
            
            <progress id="quran-pages-progress" value="${pages}" max="${totalQuranPages}" style="width: 100%; height: 12px;"></progress>
            
            <div style="margin-top: 20px;">
                <p>Current Juz: <span id="quran-juz">${juz}</span> / ${totalJuz}</p>
                <progress id="quran-juz-progress" value="${juz}" max="${totalJuz}" style="width: 100%; height: 12px;"></progress>
            </div>
        </div>
    `;

    container.removeEventListener("input", cleanSunnahInputRouter);
    container.addEventListener("input", cleanSunnahInputRouter);
};
