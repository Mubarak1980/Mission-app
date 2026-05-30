"use strict";

// =====================================================
// 📘 STUDY TRACKER (PWA OPTIMIZED & BRIDGE INTEGRATED)
// =====================================================

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English"];

let activeStudyGrade = null;
let activeStudySavedData = null;

// ===============================
// BRIDGE-AWARE LOADING
// ===============================
function loadProgress(grade) {
    const masterData = window.DataService.get();
    if (!masterData.studyProgress) masterData.studyProgress = {};
    return masterData.studyProgress[grade] || {};
}

// ===============================
// BRIDGE-AWARE SAVING
// ===============================
function saveProgress(grade, data) {
    const masterData = window.DataService.get();
    if (!masterData.studyProgress) masterData.studyProgress = {};
    masterData.studyProgress[grade] = data;
    window.DataService.set(masterData);
}

// ===============================
// PERCENT ENGINE
// ===============================
function calculatePercent(done, max) {
    const safeDone = Math.max(0, Number(done) || 0);
    const safeMax = Math.max(0, Number(max) || 0);
    if (safeMax <= 0) return 0;
    return Math.min(100, Math.round((safeDone / safeMax) * 100));
}

// ===============================
// SUBJECT COMPONENT
// ===============================
function createSubject(name, maxPages, savedPages) {
    const safeMax = Number(maxPages) || 0;
    const safeSaved = Math.min(Number(savedPages) || 0, safeMax);
    const percent = calculatePercent(safeSaved, safeMax);

    // Structure optimized for CSS hookup
    return `
        <div class="subject ${percent === 100 ? "complete" : ""}">
            <h3>${name}</h3>
            <input
                class="subject-progress"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                min="0"
                max="${safeMax}"
                value="${safeSaved}"
                data-subject="${name}"
                data-maxpages="${safeMax}"
            />
            <div class="subject-progress-wrapper">
                <progress value="${safeSaved}" max="${safeMax}"></progress>
            </div>
            <p class="subject-percent">
                ${percent}% progress (${safeSaved}/${safeMax} pages)
            </p>
        </div>
    `;
}

// ===============================
// UI UPDATE
// ===============================
function updateSubjectUI(container, value, max) {
    if (!container) return;
    const safeMax = Number(max) || 0;
    const safeValue = Math.min(Number(value) || 0, safeMax);
    const percent = calculatePercent(safeValue, safeMax);

    const progressBar = container.querySelector("progress");
    const percentText = container.querySelector(".subject-percent");

    if (progressBar) {
        progressBar.value = safeValue;
        progressBar.max = safeMax;
    }
    if (percentText) {
        percentText.innerHTML = `${percent}% progress (${safeValue}/${safeMax} pages)`;
    }
}

// ===============================
// CENTRALIZED INPUT HANDLER
// ===============================
function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;

    const subject = input.dataset.subject;
    const max = Number(input.dataset.maxpages) || 0;
    let value = Math.max(0, Number(input.value) || 0);
    if (value > max) value = max;

    activeStudySavedData[subject] = value;
    saveProgress(activeStudyGrade, activeStudySavedData);
    updateSubjectUI(input.closest(".subject"), value, max);
    updateGradeSummary(activeStudyGrade);
}

// ===============================
// LOAD STUDY SECTION
// ===============================
function loadStudySection(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    activeStudyGrade = grade;
    activeStudySavedData = loadProgress(grade);

    const data = window.maxPagesByGrade?.[grade];
    if (!data) {
        mainContent.innerHTML = `<p>Error: No data for Grade ${grade}</p>`;
        return;
    }

    // Wrapped in a dedicated container to allow CSS grid/flex styling
    let html = `<div class="subjects-container">`;
    for (const subject of SUBJECTS) {
        html += createSubject(subject, data[subject], activeStudySavedData[subject] || 0);
    }
    html += `</div>`;
    mainContent.innerHTML = html;

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

    let totalDone = 0, totalPages = 0;
    for (const subject of SUBJECTS) {
        const max = Number(data[subject]) || 0;
        totalDone += Math.min(Number(saved[subject]) || 0, max);
        totalPages += max;
    }

    const percent = calculatePercent(totalDone, totalPages);
    // Finds the existing static element from your index.html
    const el = document.getElementById("grade-progress-bar");
    if (el) {
        el.innerHTML = `Grade ${grade} Overall: ${percent}% (${totalDone}/${totalPages} pages)`;
    }
}

window.loadStudySection = loadStudySection;
