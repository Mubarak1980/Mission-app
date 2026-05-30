"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

// Global configuration
window.maxPagesByGrade = {
    9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 },
    10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 },
    11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 },
    12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 }
};

let activeStudyGrade = null;
let activeStudySavedData = null;

// UI Component: Generate Subject Box
function createSubjectHtml(name, max, saved) {
    const percent = max > 0 ? Math.round((Math.min(saved, max) / max) * 100) : 0;
    return `
        <div class="subject" style="margin-bottom: 20px; background: #161b22; padding: 15px; border-radius: 8px;">
            <h3 style="margin-top:0;">${name}</h3>
            <input class="subject-progress" type="number" value="${saved}" 
                data-subject="${name}" data-maxpages="${max}" 
                style="width: 100%; padding: 10px; border-radius: 4px; background: #0d1117; color: white; border: 1px solid #30363d;">
            <progress value="${saved}" max="${max}" style="width: 100%; height: 10px; margin-top: 10px;"></progress>
            <p style="font-size: 13px; color: #8b949e; margin-top: 5px;">${percent}% (${saved}/${max} pages)</p>
        </div>
    `;
}

// MAIN RENDER FUNCTION
window.loadStudySection = function(grade) {
    const mainContent = document.getElementById("main-content");
    const gradeNum = parseInt(grade);
    if (!mainContent) return;

    // 1. CLEAR: Wipe everything to prevent duplicated buttons
    mainContent.innerHTML = "";

    // 2. DATA: Load saved progress
    const masterData = (window.DataService && window.DataService.get()) || { studyProgress: {} };
    const savedData = masterData.studyProgress?.[gradeNum] || {};
    const config = window.maxPagesByGrade?.[gradeNum];

    if (!config) return;

    activeStudyGrade = gradeNum;
    activeStudySavedData = savedData;

    // 3. RENDER: Build the subjects
    let html = `<h2>📚 Grade ${gradeNum} Study Tracker</h2><div class="subjects-container">`;
    SUBJECTS.forEach(subject => {
        html += createSubjectHtml(subject, config[subject], savedData[subject] || 0);
    });
    html += `</div>`;

    // 4. NAVIGATION: Add ONLY the blue buttons
    html += `
        <div style="display: flex; gap: 10px; margin-top: 20px; margin-bottom: 50px;">
            <button onclick="loadStudySection(${Math.max(9, gradeNum - 1)})" 
                style="flex: 1; padding: 15px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: bold;">
                Previous
            </button>
            <button onclick="loadStudySection(${Math.min(12, gradeNum + 1)})" 
                style="flex: 1; padding: 15px; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: bold;">
                Next
            </button>
        </div>
    `;

    mainContent.innerHTML = html;
};

// INPUT HANDLER: Update data on change
document.getElementById("main-content").addEventListener("input", function(e) {
    if (!e.target.classList.contains("subject-progress")) return;
    
    const input = e.target;
    const subject = input.dataset.subject;
    const max = Number(input.dataset.maxpages);
    let value = Math.min(Math.max(0, Number(input.value)), max);

    // Update Memory
    activeStudySavedData[subject] = value;
    
    // Save to DataService
    const masterData = window.DataService.get() || { studyProgress: {} };
    masterData.studyProgress[activeStudyGrade] = activeStudySavedData;
    window.DataService.set(masterData);

    // Update UI
    const percent = max > 0 ? Math.round((value / max) * 100) : 0;
    input.parentElement.querySelector("progress").value = value;
    input.parentElement.querySelector("p").innerText = `${percent}% (${value}/${max} pages)`;
});
    
