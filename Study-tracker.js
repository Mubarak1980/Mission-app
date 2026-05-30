"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

// Ensure this is globally available for the function to find
window.maxPagesByGrade = {
    9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 },
    10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 },
    11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 },
    12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 }
};

window.loadStudySection = function(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    // 1. Force Clear existing content
    mainContent.innerHTML = ""; 

    // 2. Fetch Data
    const gradeNum = parseInt(grade);
    const masterData = (window.DataService && window.DataService.get()) || { studyProgress: {} };
    const savedData = masterData.studyProgress?.[gradeNum] || {};
    const config = window.maxPagesByGrade?.[gradeNum];

    if (!config) return;

    // 3. Render Subject List
    let html = `<h2>📚 Grade ${gradeNum} Study Tracker</h2>`;
    SUBJECTS.forEach(subject => {
        const max = config[subject] || 0;
        const saved = savedData[subject] || 0;
        const percent = max > 0 ? Math.round((Math.min(saved, max) / max) * 100) : 0;

        html += `
            <div class="subject" style="margin-bottom: 20px; background: #161b22; padding: 15px; border-radius: 8px;">
                <h3>${subject}</h3>
                <input class="subject-progress" type="number" value="${saved}" 
                    data-subject="${subject}" data-maxpages="${max}" 
                    style="width: 100%; padding: 10px; border-radius: 4px;">
                <progress value="${saved}" max="${max}" style="width: 100%; height: 10px;"></progress>
                <p>${percent}% (${saved}/${max} pages)</p>
            </div>
        `;
    });

    // 4. Inject ONLY ONE set of buttons
    html += `
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="loadStudySection(${Math.max(9, gradeNum - 1)})" style="flex:1; padding:15px;">Previous</button>
            <button onclick="loadStudySection(${Math.min(12, gradeNum + 1)})" style="flex:1; padding:15px;">Next</button>
        </div>
    `;

    mainContent.innerHTML = html;
};
