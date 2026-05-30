"use strict";

// 1. Updated Subject List
const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

// 2. Verified Master Configuration
window.maxPagesByGrade = {
    9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 },
    10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 },
    11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 },
    12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 }
};

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
    const safeMax = Math.max(0, Number(max) || 0);
    const safeDone = Math.max(0, Math.min(Number(done) || 0, safeMax));
    if (safeMax <= 0) return 0;
    return Math.round((safeDone / safeMax) * 100);
}

function createSubject(name, maxPages, savedPages) {
    const safeMax = Number(maxPages) || 0;
    const safeSaved = Math.min(Number(savedPages) || 0, safeMax);
    const percent = calculatePercent(safeSaved, safeMax);

    return `
        <div class="subject" style="margin-bottom: 20px;">
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
                style="width: 100%; padding: 10px; border-radius: 6px; margin-bottom: 5px;"
            />
            <progress value="${safeSaved}" max="${safeMax}" style="width: 100%; height: 12px;"></progress>
            <p class="subject-percent" style="font-size: 13px; color: #8b949e; margin-top: 5px;">
                ${percent}% (${safeSaved}/${safeMax} pages)
            </p>
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
    }
    if (percentText) {
        percentText.innerHTML = `${percent}% (${safeValue}/${safeMax} pages)`;
    }
}

function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;

    const subject = input.dataset.subject;
    const max = Number(input.dataset.maxpages) || 0;

    let valStr = input.value.replace(/[^0-9]/g, '');
    if (valStr.length > 4) valStr = valStr.slice(0, 4);
    
    let value = Number(valStr);
    if (isNaN(value)) value = 0;
    if (value > max) value = max;

    input.value = value; 

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

    let html = `<h2>📚 Grade ${grade} Study Tracker</h2><div class="subjects-container">`;
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
                <h3>Overall Grade ${grade} Progress</h3>
                <progress value="${totalDone}" max="${totalPages}" style="width: 100%; height: 16px;"></progress>
                <p style="text-align: center; margin-top: 5px;">${percent}% (${totalDone}/${totalPages} pages)</p>
            </div>
        `;
    }
}

window.loadStudySection = loadStudySection;
