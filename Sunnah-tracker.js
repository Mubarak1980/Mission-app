"use strict";

// =====================================================
// 🕌 SUNNAH TRACKER (FULLY UNIFIED & SANITIZED)
// =====================================================

const totalQuranPages = 604;
const pagesPerJuz = 20;
const totalJuz = 30;

function loadSunnahState() {
    const masterData = (window.DataService && window.DataService.get()) || {};

    if (!masterData.sunnahProgress || typeof masterData.sunnahProgress !== "object") {
        masterData.sunnahProgress = {
            pages: 0,
            juz: 0
        };
        window.DataService && window.DataService.set(masterData);
    }

    return masterData.sunnahProgress;
}

function saveSunnahProgress(data) {
    const masterData = (window.DataService && window.DataService.get()) || {};

    if (!masterData.sunnahProgress) {
        masterData.sunnahProgress = {};
    }

    masterData.sunnahProgress = {
        ...masterData.sunnahProgress,
        ...data
    };

    window.DataService && window.DataService.set(masterData);
}

// ===============================
// OPTIMIZED INPUT HANDLER
// ===============================
function cleanSunnahInputRouter(e) {
    const input = e.target;
    if (!input || input.id !== "quran-pages") return;

    // 1. Sanitize input
    let valStr = String(input.value || "").replace(/[^0-9]/g, '');
    if (valStr.length > 3) valStr = valStr.slice(0, 3);

    let value = Number(valStr);
    if (isNaN(value)) value = 0;

    if (value > totalQuranPages) value = totalQuranPages;

    input.value = value;

    // 2. Compute juz
    const newJuz = Math.min(Math.floor(value / pagesPerJuz), totalJuz);

    // 3. Save safely
    saveSunnahProgress({ pages: value, juz: newJuz });

    // 4. UI updates (safe guards)
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

    const pages = Math.min(
        Math.max(Number(saved.pages) || 0, 0),
        totalQuranPages
    );

    const juz = Math.min(
        Math.floor(pages / pagesPerJuz),
        totalJuz
    );

    container.innerHTML = `
        <h2>🕌 Sunnah & Quran Tracker</h2>

        <div class="sunnah-container" style="padding: 20px;">

            <label for="quran-pages">
                Quran Pages Read (Total: ${totalQuranPages})
            </label>

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

            <progress 
                id="quran-pages-progress" 
                value="${pages}" 
                max="${totalQuranPages}" 
                style="width: 100%; height: 12px;"
            ></progress>

            <div style="margin-top: 20px;">
                <p>Current Juz: <span id="quran-juz">${juz}</span> / ${totalJuz}</p>

                <progress 
                    id="quran-juz-progress" 
                    value="${juz}" 
                    max="${totalJuz}" 
                    style="width: 100%; height: 12px;"
                ></progress>
            </div>

        </div>
    `;

    // 🔥 PWA SAFE EVENT BINDING (prevents duplicate listeners)
    container.removeEventListener("input", cleanSunnahInputRouter);
    container.addEventListener("input", cleanSunnahInputRouter);
};
