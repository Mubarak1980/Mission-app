"use strict";

// ===============================
// Sunnah-tracker.js (IMPROVED PWA SAFE)
// ===============================

const totalQuranPages = 604;
const totalJuz = 30;

// ===============================
// HELPERS
// ===============================
function getDaysSinceStart(startDate) {
    const today = new Date();
    const start = new Date(startDate);

    const diff = Math.floor(
        (today - start) / (1000 * 60 * 60 * 24)
    );

    return Math.max(1, diff + 1);
}

// ===============================
// LOAD STATE
// ===============================
function loadSunnahState() {
    try {
        return JSON.parse(localStorage.getItem("sunnah_progress")) || {};
    } catch {
        return {};
    }
}

// ===============================
// SAVE STATE
// ===============================
function saveSunnahProgress(data) {
    try {
        const prev = loadSunnahState();
        localStorage.setItem(
            "sunnah_progress",
            JSON.stringify({ ...prev, ...data })
        );
    } catch (e) {
        console.warn("Failed to save sunnah progress:", e);
    }
}

// ===============================
// MAIN
// ===============================
function loadSunnahTracker() {
    const container = document.getElementById("main-content");
    if (!container) return;

    const saved = loadSunnahState();

    const startDate =
        saved.startDate ||
        new Date().toISOString().split("T")[0];

    const pages = Math.min(
        Math.max(Number(saved.pages) || 0, 0),
        totalQuranPages
    );

    const daysSinceStart = getDaysSinceStart(startDate);

    const expectedPages = Math.min(daysSinceStart, totalQuranPages);

    const juz = Math.floor(
        (pages / totalQuranPages) * totalJuz
    );

    let status = "🟢 On Track";
    if (pages < expectedPages - 20) status = "🟠 Behind";
    else if (pages > expectedPages + 10) status = "🟢 Ahead";

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

            <p>${Math.round((pages / totalQuranPages) * 100)}%</p>

            <label>Juz Completed</label>
            <input id="quran-juz"
                type="number"
                value="${juz}"
                readonly />

            <progress id="quran-juz-progress"
                max="${totalJuz}"
                value="${juz}"></progress>

            <p>${Math.round((juz / totalJuz) * 100)}%</p>
        </div>
    `;

    const input = document.getElementById("quran-pages");

    if (input) {
        input.addEventListener("input", () => {
            let value = Number(input.value);

            if (isNaN(value)) value = 0;

            value = Math.max(0, Math.min(value, totalQuranPages));

            const newJuz = Math.floor(
                (value / totalQuranPages) * totalJuz
            );

            input.value = value;

            const pagesProgress = document.getElementById("quran-pages-progress");
            const juzInput = document.getElementById("quran-juz");
            const juzProgress = document.getElementById("quran-juz-progress");

            if (pagesProgress) pagesProgress.value = value;
            if (juzInput) juzInput.value = newJuz;
            if (juzProgress) juzProgress.value = newJuz;

            saveSunnahProgress({
                pages: value,
                juz: newJuz,
                startDate
            });
        });
    }
}

// ===============================
// EXPORT
// ===============================
window.loadSunnahTracker = loadSunnahTracker;
