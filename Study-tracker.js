"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English"];
let activeStudyGrade = null;
let activeStudySavedData = null;

function loadProgress(grade) {
    const masterData = window.DataService.get();
    if (!masterData.studyProgress) masterData.studyProgress = {};
    return masterData.studyProgress[grade] || {};
}

function saveProgress(grade, data) {
    const masterData = window.DataService.get();
    if (!masterData.studyProgress) masterData.studyProgress = {};
    masterData.studyProgress[grade] = data;
    window.DataService.set(masterData);
}

function calculatePercent(done, max) {
    const safeDone = Math.max(0, Number(done) || 0);
    const safeMax = Math.max(0, Number(max) || 0);
    if (safeMax <= 0) return 0;
    return Math.min(100, Math.round((safeDone / safeMax) * 100));
}

// Generates the subject cards
function createSubject(name, maxPages, savedPages) {
    const safeMax = Number(maxPages) || 0;
    const safeSaved = Math.min(Number(savedPages) || 0, safeMax);
    const percent = calculatePercent(safeSaved, safeMax);

    return `
        <div class="subject">
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
            <progress value="${safeSaved}" max="${safeMax}"></progress>
            <p class="subject-percent">${percent}% (${safeSaved}/${safeMax} pages)</p>
        </div>
    `;
}

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
        percentText.innerHTML = `${percent}% (${safeValue}/${safeMax} pages)`;
    }
}

// Corrected Router with Input Limiting
function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;

    const subject = input.dataset.subject;
    const max = Number(input.dataset.maxpages) || 0;

    // 1. Sanitize: Allow only numbers, limit to 4 digits (enough for pages)
    let valStr = input.value.replace(/[^0-9]/g, '');
    if (valStr.length > 4) valStr = valStr.slice(0, 4);
    
    // 2. Convert to number and enforce range
    let value = Number(valStr) || 0;
    if (value > max) {
        value = max;
        input.value = max; // Force input box to show max limit
    } else {
        input.value = valStr; // Show the sanitized number
    }

    activeStudySavedData[subject] = value;
    saveProgress(activeStudyGrade, activeStudySavedData);
    updateSubjectUI(input.closest(".subject"), value, max);
    updateGradeSummary(activeStudyGrade);
}

function loadStudySection(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    activeStudyGrade = grade;
    activeStudySavedData = loadProgress(grade);

    const data = window.maxPagesByGrade?.[grade];
    if (!data) return;

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
    const el = document.getElementById("grade-progress-bar");
    if (el) {
        el.innerHTML = `
            <div class="subject">
                <h3>Grade ${grade} Overall Progress</h3>
                <progress value="${totalDone}" max="${totalPages}"></progress>
                <p class="subject-percent">${percent}% (${totalDone}/${totalPages} pages)</p>
            </div>
        `;
    }
}

window.loadStudySection = loadStudySection;
    
