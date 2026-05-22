"use strict";

// ===============================
// Sunnah-tracker.js (FINAL IMPROVED PWA SAFE)
// ===============================

const totalQuranPages = 604;

// 🔥 FIXED MODEL: 1 Juz ≈ 20 pages
const pagesPerJuz = 20;
const totalJuz = Math.ceil(totalQuranPages / pagesPerJuz);

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

        const diff = Math.floor(
            (today - start) / (1000 * 60 * 60 * 24)
        );

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

// ===============================
// MAIN TRACKER
// ===============================
function loadSunnahTracker() {

    const container = document.getElementById("main-content");
    if (!container) return;

    const saved = loadSunnahState();

    const startDate =
        saved.startDate ||
        new Date().toISOString().split("T")[0];

    const pages = Math.min(
        Math.max(safeNumber(saved.pages), 0),
        totalQuranPages
    );

    const daysSinceStart = getDaysSinceStart(startDate);

    // 🔥 FIXED EXPECTED MODEL
    const expectedPages = Math.min(
        daysSinceStart * pagesPerJuz,
        totalQuranPages
    );

    const juz = Math.floor(pages / pagesPerJuz);

    let status = "🟢 On Track";

    if (pages < expectedPages - 20) {
        status = "🟠 Behind";
    } else if (pages > expectedPages + 10) {
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

            <label>Pages Read</label>
            <input id="quran-pages"
                type="number"
                min="0"
                max="${totalQuranPages}"
                value="${pages}" />

            <progress id="quran-pages-progress"
                max="${totalQuranPages}"
                value="${pages}"></progress>

            <p>
                ${percentPages}% (${pages}/${totalQuranPages} pages)
            </p>

            <label>Juz Completed</label>
            <input id="quran-juz"
                type="number"
                value="${juz}"
                readonly />

            <progress id="quran-juz-progress"
                max="${totalJuz}"
                value="${juz}"></progress>

            <p>
                ${percentJuz}% (${juz}/${totalJuz} Juz)
            </p>
        </div>
    `;

    const input = document.getElementById("quran-pages");

    if (input) {
        input.oninput = () => {

            let value = safeNumber(input.value);
            value = Math.max(0, Math.min(value, totalQuranPages));

            const newJuz = Math.floor(value / pagesPerJuz);

            input.value = value;

            const pagesProgress =
                document.getElementById("quran-pages-progress");

            const juzInput =
                document.getElementById("quran-juz");

            const juzProgress =
                document.getElementById("quran-juz-progress");

            if (pagesProgress) pagesProgress.value = value;
            if (juzInput) juzInput.value = newJuz;
            if (juzProgress) juzProgress.value = newJuz;

            saveSunnahProgress({
                pages: value,
                juz: newJuz,
                startDate
            });
        };
    }
}

// ===============================
// EXPORT
// ===============================
window.loadSunnahTracker = loadSunnahTracker;
