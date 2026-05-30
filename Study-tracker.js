"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

window.maxPagesByGrade = {
    9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 },
    10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 },
    11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 },
    12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 }
};

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

    // 1. CLEAR: Wipe everything (including old buttons)
    mainContent.innerHTML = "";

    // 2. DATA
    const masterData = (window.DataService && window.DataService.get()) || { studyProgress: {} };
    const savedData = masterData.studyProgress?.[gradeNum] || {};
    const config = window.maxPagesByGrade?.[gradeNum];

    if (!config) return;

    window.activeStudyGrade = gradeNum;
    window.activeStudySavedData = savedData;

    // 3. RENDER
    let html = `<h2>📚 Grade ${gradeNum} Study Tracker</h2><div class="subjects-container">`;
    SUBJECTS.forEach(subject => {
        html += createSubjectHtml(subject, config[subject], savedData[subject] || 0);
    });
    html += `</div>`;

    // 4. NAVIGATION: Only these buttons will exist
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

// IMPROVED INPUT HANDLER: Sanitizes input and caps at MAX
document.getElementById("main-content").addEventListener("input", function(e) {
    if (!e.target.classList.contains("subject-progress")) return;
    
    const input = e.target;
    const max = Number(input.dataset.maxpages);
    
    // Convert input to number (strips leading zeros)
    let val = Number(input.value.replace(/[^0-9]/g, ''));
    
    // Cap at Max
    if (val > max) val = max;
    
    // Update visual input and internal state
    input.value = val; 
    const subject = input.dataset.subject;
    window.activeStudySavedData[subject] = val;

    // Save
    const masterData = window.DataService.get() || { studyProgress: {} };
    if (!masterData.studyProgress) masterData.studyProgress = {};
    masterData.studyProgress[window.activeStudyGrade] = window.activeStudySavedData;
    window.DataService.set(masterData);

    // Refresh UI
    const percent = max > 0 ? Math.round((val / max) * 100) : 0;
    input.parentElement.querySelector("progress").value = val;
    input.parentElement.querySelector("p").innerText = `${percent}% (${val}/${max} pages)`;
});
    
