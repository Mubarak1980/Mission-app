"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

window.maxPagesByGrade = {
    9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 },
    10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 },
    11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 },
    12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 }
};

let activeStudyGrade = null;
let activeStudySavedData = null;

// SAFE DATA ACCESS
function loadProgress(grade) {
    if (!window.DataService) return {};
    const masterData = window.DataService.get() || {};
    if (!masterData.studyProgress) masterData.studyProgress = {};
    return masterData.studyProgress[grade] || {};
}

function saveProgress(grade, data) {
    if (!window.DataService) return;
    const masterData = window.DataService.get() || { studyProgress: {} };
    masterData.studyProgress[grade] = data;
    window.DataService.set(masterData);
}

// UI HELPERS (Unchanged logic)
function calculatePercent(done, max) {
    const safeMax = Math.max(0, Number(max) || 0);
    const safeDone = Math.max(0, Math.min(Number(done) || 0, safeMax));
    return safeMax <= 0 ? 0 : Math.round((safeDone / safeMax) * 100);
}

function createSubject(name, maxPages, savedPages) {
    const safeMax = Number(maxPages) || 0;
    const safeSaved = Math.min(Number(savedPages) || 0, safeMax);
    const percent = calculatePercent(safeSaved, safeMax);

    return `
        <div class="subject" style="margin-bottom: 20px;">
            <h3>${name}</h3>
            <input class="subject-progress" type="number" value="${safeSaved}" data-subject="${name}" data-maxpages="${safeMax}"
                style="width: 100%; padding: 10px; border-radius: 6px; margin-bottom: 5px;"/>
            <progress value="${safeSaved}" max="${safeMax}" style="width: 100%; height: 12px;"></progress>
            <p class="subject-percent" style="font-size: 13px; color: #8b949e; margin-top: 5px;">
                ${percent}% (${safeSaved}/${safeMax} pages)
            </p>
        </div>
    `;
}

// CORE FUNCTIONS
function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input.classList.contains("subject-progress")) return;

    const subject = input.dataset.subject;
    const max = Number(input.dataset.maxpages);
    let value = Math.min(Math.max(0, Number(input.value)), max);

    input.value = value;
    activeStudySavedData[subject] = value;
    saveProgress(activeStudyGrade, activeStudySavedData);
    
    // Update individual UI
    const container = input.closest(".subject");
    const percent = calculatePercent(value, max);
    container.querySelector("progress").value = value;
    container.querySelector(".subject-percent").innerHTML = `${percent}% (${value}/${max} pages)`;
    
    updateGradeSummary(activeStudyGrade);
}

window.loadStudySection = function(grade) {
    const mainContent = document.getElementById("main-content");
    const gradeNum = parseInt(grade);
    if (!mainContent) return;

    activeStudyGrade = gradeNum;
    activeStudySavedData = loadProgress(gradeNum);
    const data = window.maxPagesByGrade?.[gradeNum];

    if (!data) {
        mainContent.innerHTML = `<p style="padding:20px;">Configuration for Grade ${gradeNum} not found.</p>`;
        return;
    }

    let html = `<h2>📚 Grade ${gradeNum} Study Tracker</h2><div class="subjects-container">`;
    for (const subject of SUBJECTS) {
        html += createSubject(subject, data[subject], activeStudySavedData[subject] || 0);
    }
    html += `</div><div id="grade-progress-bar"></div>`;

    // NAVIGATION BUTTONS RESTORED HERE
    html += `
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="loadStudySection(${Math.max(9, gradeNum - 1)})" style="flex:1; padding:15px;">Previous</button>
            <button onclick="loadStudySection(${Math.min(12, gradeNum + 1)})" style="flex:1; padding:15px;">Next</button>
        </div>
    `;

    mainContent.innerHTML = html;
    mainContent.removeEventListener("input", cleanStudyInputRouter);
    mainContent.addEventListener("input", cleanStudyInputRouter);
    updateGradeSummary(gradeNum);
};

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
            <div class="subject" style="margin-top: 20px;">
                <h3>Overall Grade ${grade} Progress</h3>
                <progress value="${totalDone}" max="${totalPages}" style="width: 100%; height: 16px;"></progress>
                <p style="text-align: center; margin-top: 5px;">${percent}% (${totalDone}/${totalPages} pages)</p>
            </div>
        `;
    }
}
    
