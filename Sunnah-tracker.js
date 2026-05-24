"use strict";

// =====================================================
// 🕌 SUNNAH TRACKER (TIMEZONE-LOCALIZED & JUZ-FIXED)
// =====================================================

const totalQuranPages = 604;
const pagesPerJuz = 20;
const totalJuz = 30; // 🔥 FIXED: Locked to exactly 30 Juz instead of rounding up to 31

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
// DAYS CALCULATION (LOCAL TIMEZONE SAFE)
// ===============================
function getDaysSinceStart(startDate) {
    try {
        const today = new Date();
        const start = new Date(startDate);

        if (isNaN(start.getTime())) return 1;

        // Strip hour metrics cleanly without relying on UTC strings
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

    // 🔥 FIXED: Floor calculation capped at 30 so page 604 stays perfectly inside Juz 30
    const newJuz = Math.min(Math.floor(value / pagesPerJuz), totalJuz);
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

    // Force a structural content re-evaluation to switch the status badge instantly
    const saved = loadSunnahState();
    const daysSinceStart = getDaysSinceStart(saved.startDate || new Date().toISOString().split("T")[0]);
    const expectedPages = Math.min(daysSinceStart * TARGET_PAGES_PER_DAY, totalQuranPages);

    let status = "🟢 On Track";
    if (value < expectedPages) {
        status = "🟠 Behind";
    } else if (value > expectedPages + 2) {
        status = "🚀 Ahead";
    }

    const statusEl = document.querySelector(".quran-progress p strong:nth-of-type(4)");
    if (statusEl && statusEl.parentElement) {
        statusEl.parentElement.innerHTML = `<strong>Status:</strong> ${status}`;
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

    // Fixed: Pull local calendar values directly to bypass UTC evening rollover bugs
    let startDate = saved.startDate;
    if (!startDate) {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        startDate = `${year}-${month}-${day}`;
        saveSunnahProgress({ startDate: startDate });
    }

    const pages = Math.min(Math.max(safeNumber(saved.pages), 0), totalQuranPages);
    const daysSinceStart = getDaysSinceStart(startDate);

    const expectedPages = Math.min(daysSinceStart * TARGET_PAGES_PER_DAY, totalQuranPages);
    
    // 🔥 FIXED: Floor calculation capped at 30 so page 604 reads as Juz 30 loading initial states
    const juz = Math.min(Math.floor(pages / pagesPerJuz), totalJuz);

    // Fixed: Strict evaluation rules to align with a 1 page/day target profile
    let status = "🟢 On Track";
    if (pages < expectedPages) {
        status = "🟠 Behind";
    } else if (pages > expectedPages + 2) {
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

    container.removeEventListener("input", cleanSunnahInputRouter);
    container.addEventListener("input", cleanSunnahInputRouter);
}

// ===============================
// EXPORT
// ===============================
window.loadSunnahTracker = loadSunnahTracker;
    
