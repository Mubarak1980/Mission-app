"use strict";

// =====================================================
// 📘 STUDY TRACKER (PWA OPTIMIZED & MATCHED METRICS)
// =====================================================

const SUBJECTS = [
    "Math",
    "Physics",
    "Chemistry",
    "Biology",
    "English"
];

// Memory anchors to prevent event listener cloning errors
let activeStudyGrade = null;
let activeStudySavedData = null;

// ===============================
// STORAGE SAFE
// ===============================
function loadProgress(grade) {
    try {
        const raw = localStorage.getItem(`grade_${grade}_progress`);
        if (!raw) return {};
        const data = JSON.parse(raw);
        return (data && typeof data === "object") ? data : {};
    } catch (err) {
        console.warn("Progress load failed:", err);
        return {};
    }
}

function saveProgress(grade, data) {
    try {
        localStorage.setItem(`grade_${grade}_progress`, JSON.stringify(data || {}));
    } catch (err) {
        console.warn("Storage failed:", err);
    }
}

// ===============================
// SAFE NUMBER
// ===============================
function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return isNaN(n) ? fallback : n;
}

// ===============================
// PERCENT ENGINE
// ===============================
function calculatePercent(done, max) {
    const safeDone = safeNumber(done);
    const safeMax = safeNumber(max);
    if (safeMax <= 0) return 0;
    return Math.min(100, Math.round((safeDone / safeMax) * 100));
}

// ===============================
// SUBJECT COMPONENT
// ===============================
function createSubject(name, maxPages, savedPages) {
    const safeMax = safeNumber(maxPages);
    const safeSaved = Math.min(safeNumber(savedPages), safeMax);
    const percent = calculatePercent(safeSaved, safeMax);

    return `
        <div class="subject ${percent === 100 ? "complete" : ""}">
            <h3>${name}</h3>

            <input
                class="subject-progress"
                type="number"
                inputmode="numeric"
                min="0"
                max="${safeMax}"
                value="${safeSaved}"
                data-subject="${name}"
                data-maxpages="${safeMax}"
                autocomplete="off"
            />

            <div class="subject-progress-wrapper">
                <progress value="${safeSaved}" max="${safeMax}"></progress>
            </div>

            <p class="subject-percent">
                ${percent}% progress <span style="font-size:0.85em; color:#888;">(${safeSaved}/${safeMax} pages)</span>
            </p>
        </div>
    `;
}

// ===============================
// UI UPDATE
// ===============================
function updateSubjectUI(container, value, max) {
    if (!container) return;

    const safeMax = safeNumber(max);
    const safeValue = Math.min(safeNumber(value), safeMax);
    const percent = calculatePercent(safeValue, safeMax);

    const progressBar = container.querySelector("progress");
    const percentText = container.querySelector(".subject-percent");

    if (progressBar) {
        progressBar.value = safeValue;
        progressBar.max = safeMax;
    }

    if (percentText) {
        percentText.innerHTML = `${percent}% progress <span style="font-size:0.85em; color:#888;">(${safeValue}/${safeMax} pages)</span>`;
    }

    container.classList.toggle("complete", percent === 100);
}

// ===============================
// CENTRALIZED INPUT HANDLER ROUTER
// ===============================
function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;
    if (!activeStudyGrade || !activeStudySavedData) return;

    const subject = input.dataset.subject;
    const max = safeNumber(input.dataset.maxpages);
    
    let value = Math.max(0, safeNumber(input.value));
    value = Math.min(value, max);
    input.value = value;

    if (!subject) return;

    // Direct context mutation
    activeStudySavedData[subject] = value;

    const container = input.closest(".subject");
    if (container) {
        updateSubjectUI(container, value, max);
    }

    saveProgress(activeStudyGrade, activeStudySavedData);
    updateGradeSummary(activeStudyGrade);
}

// ===============================
// LOAD STUDY SECTION
// ===============================
function loadStudySection(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    if (!window.maxPagesByGrade) {
        mainContent.innerHTML = `
            <p style="padding:20px; text-align:center; color:red;">
                System error: maxPagesByGrade is not loaded
            </p>
        `;
        return;
    }

    const data = window.maxPagesByGrade[grade];
    if (!data) {
        mainContent.innerHTML = `<p style="padding:20px; text-align:center;">No data found for Grade ${grade}</p>`;
        return;
    }

    // Capture states accurately
    activeStudyGrade = grade;
    activeStudySavedData = loadProgress(grade);

    let html = `
        <h2>📘 Grade ${grade} Study Tracker</h2>
        <div class="subjects-container">
    `;

    for (const subject of SUBJECTS) {
        html += createSubject(subject, data[subject] || 0, activeStudySavedData[subject] || 0);
    }

    html += `</div>`;
    mainContent.innerHTML = html;

    // Safely remove structural duplicates before rebinding
    mainContent.removeEventListener("input", cleanStudyInputRouter);
    mainContent.addEventListener("input", cleanStudyInputRouter);

    updateGradeSummary(grade);
}

// ===============================
// GRADE SUMMARY
// ===============================
function updateGradeSummary(grade) {
    const saved = loadProgress(grade);
    const data = window.maxPagesByGrade?.[grade];
    if (!data) return;

    let totalDone = 0;
    let totalPages = 0;

    for (const subject of SUBJECTS) {
        const max = safeNumber(data[subject]);
        const done = Math.min(safeNumber(saved[subject]), max);
        totalDone += done;
        totalPages += max;
    }

    const percent = calculatePercent(totalDone, totalPages);
    const el = document.getElementById("grade-progress-bar");
    if (!el) return;

    el.innerHTML = `
        <label>📘 Grade ${grade} Overall Progress: ${percent}%</label>
        <progress value="${percent}" max="100"></progress>
        <p style="margin-top:6px; color:#888; font-size:0.9em;">
            (${totalDone}/${totalPages} pages)
        </p>
    `;
}

// ===============================
// EXPORTS
// ===============================
window.loadStudySection = loadStudySection;
window.updateGradeSummary = updateGradeSummary;
    
