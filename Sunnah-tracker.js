"use strict";

// =====================================================
// 🕌 SUNNAH TRACKER (1 PAGE PER DAY MODEL LOCKED)
// =====================================================

const totalQuranPages = 604;
const pagesPerJuz = 20;
const totalJuz = Math.ceil(totalQuranPages / pagesPerJuz);

// 🎯 YOUR PACE: Exactly 1 page per day
const TARGET_PAGES_PER_DAY = 1; 

// ===============================
// SAFE HELPERS
// ===============================
function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return isNaN(n) ? fallback : n;
}

// ===============================
// DAYS CALCULATION (SAFE)
// ===============================
function getDaysSinceStart(startDate) {
    try {
        const today = new Date();
        const start = new Date(startDate);

        if (isNaN(start.getTime())) return 1;

        // Strip hour metrics to evaluate pure calendar dates cleanly
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);

        const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    } catch {
        return 1;
    }
}

// ===============================
// LOAD STATE (SAFE)
// ===============================
function loadSunnahState() {
    try {
        const data = JSON.parse(localStorage.getItem("sunnah_progress"));
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

// ===============================
// SAVE STATE (MERGE SAFE)
// ===============================
function saveSunnahProgress(data) {
    try {
        const prev = loadSunnahState();
        localStorage.setItem(
            "sunnah_progress",
            JSON.stringify({
                ...prev,
                ...data
            })
        );
    } catch (e) {
        console.warn("Failed to save sunnah progress:", e);
    }
}

// ==========================================
// CENTRALIZED INPUT HANDLER ROUTER
// ==========================================
function cleanSunnahInputRouter(e) {
    const input = e.target;
    if (!input || input.id !== "quran-pages") return;

    let value = safeNumber(input.value);
    value = Math.max(0, Math.min(value, totalQuranPages));

    const newJuz = Math.floor(value / pagesPerJuz);
    input.value = value;

    const pagesProgress = document.getElementById("quran-pages-progress");
    const juzInput = document.getElementById("quran-juz");
    const juzProgress = document.getElementById("quran-juz-progress");
    
    const pagesPercentText = pagesProgress ? pagesProgress.nextElementSibling : null;
    const juzPercentText = juzProgress ? juzProgress.nextElementSibling : null;

    if (pagesProgress) pagesProgress.value = value;
    if (juzInput) juzInput.value = newJuz;
    if (juzProgress) juzProgress.value = newJuz;

    // Update text indicators dynamically on-screen
    if (pagesPercentText && pagesPercentText.tagName === "P") {
        const percentPages = Math.round((value / totalQuranPages) * 100);
        pagesPercentText.textContent = `${percentPages}% (${value}/${totalQuranPages} pages)`;
    }
    if (juzPercentText && juzPercentText.tagName === "P") {
        const percentJuz = Math.round((newJuz / totalJuz) * 100);
        juzPercentText.textContent = `${percentJuz}% (${newJuz}/${totalJuz} Juz)`;
    }

    saveSunnahProgress({
        pages: value,
        juz: newJuz
    });
}

// ===============================
// MAIN TRACKER COMPONENT
// ===============================
function loadSunnahTracker() {
    const container = document.getElementById("main-content");
    if (!container) return;

    const saved = loadSunnahState();

    // Seal the date instantly on first view so it doesn't shift forward tomorrow
    let startDate = saved.startDate;
    if (!startDate) {
        startDate = new Date().toISOString().split("T")[0];
        saveSunnahProgress({ startDate: startDate });
    }

    const pages = Math.min(Math.max(safeNumber(saved.pages), 0), totalQuranPages);
    const daysSinceStart = getDaysSinceStart(startDate);

    // Dynamic Expected Target Model based on 1 page per day pace
    const expectedPages = Math.min(daysSinceStart * TARGET_PAGES_PER_DAY, totalQuranPages);
    const juz = Math.floor(pages / pagesPerJuz);

    // Fair status buffer rules based on reading 1 page a day
    let status = "🟢 On Track";
    if (pages < expectedPages - 3) {
        status = "🟠 Behind";
    } else if (pages > expectedPages + 5) {
        status = "🚀 Ahead";
    }

    const percentPages = Math.round((pages / totalQuranPages) * 100);
    const percentJuz = Math.round((juz / totalJuz) * 100);

    container.innerHTML = `
        <h2>🕌 Sunnah Tracker</h2>

        <div class="quran-progress">
            <p><strong>Start Date:</strong> ${startDate}</p>
            <p><strong>Day:</strong> ${daysSinceStart}</p>
            <p><strong>Expected Pages:</strong> ${expectedPages}</p>
            <p><strong>Status:</strong> ${status}</p>

            <label for="quran-pages">Pages Read</label>
            <input id="quran-pages"
                type="number"
                inputmode="numeric"
                min="0"
                max="${totalQuranPages}"
                value="${pages}"
                autocomplete="off" />

            <progress id="quran-pages-progress"
                max="${totalQuranPages}"
                value="${pages}"></progress>
            <p>${percentPages}% (${pages}/${totalQuranPages} pages)</p>

            <label for="quran-juz">Juz Completed</label>
            <input id="quran-juz"
                type="number"
                value="${juz}"
                readonly />

            <progress id="quran-juz-progress"
                max="${totalJuz}"
                value="${juz}"></progress>
            <p>${percentJuz}% (${juz}/${totalJuz} Juz)</p>
        </div>
    `;

    // Unbind layout event duplicates to match your Study Tracker safety patterns
    container.removeEventListener("input", cleanSunnahInputRouter);
    container.addEventListener("input", cleanSunnahInputRouter);
}

// ===============================
// EXPORT
// ===============================
window.loadSunnahTracker = loadSunnahTracker;
                     
