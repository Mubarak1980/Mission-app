"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

window.maxPagesByGrade = {
    9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 },
    10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 },
    11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 },
    12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 }
};

// ===============================
// SUBJECT CARD
// ===============================
function createSubjectHtml(name, max, saved) {
    const percent = max > 0
        ? Math.round((Math.min(saved, max) / max) * 100)
        : 0;

    return `
        <div class="subject">
            <h3>${name}</h3>

            <input class="subject-progress"
                type="number"
                value="${saved}"
                data-subject="${name}"
                data-maxpages="${max}">

            <progress value="${saved}" max="${max}"></progress>

            <p class="subject-stats">
                ${percent}% (${saved}/${max} pages)
            </p>
        </div>
    `;
}

// ===============================
// MAIN FUNCTION
// ===============================
window.loadStudySection = function (grade) {

    const mainContent = document.getElementById("main-content");
    const gradeNum = parseInt(grade);

    if (!mainContent) return;

    const masterData = window.DataService?.get() || { studyProgress: {} };
    const savedData = masterData.studyProgress?.[gradeNum] || {};
    const config = window.maxPagesByGrade?.[gradeNum];

    if (!config) return;

    window.activeStudyGrade = gradeNum;
    window.activeStudySavedData = savedData;

    // totals
    let totalMax = 0;
    let totalSaved = 0;

    SUBJECTS.forEach(subject => {
        const max = config[subject] || 0;
        const saved = Math.min(savedData[subject] || 0, max);

        totalMax += max;
        totalSaved += saved;
    });

    const totalPercent = totalMax
        ? Math.round((totalSaved / totalMax) * 100)
        : 0;

    // ===============================
    // HTML OUTPUT
    // ===============================
    let html = `
        <h2>📚 Grade ${gradeNum} Study Tracker</h2>

        <div class="overall-summary-card">
            <div class="overall-header">
                <span>Overall Progress</span>
                <span class="overall-percent">${totalPercent}%</span>
            </div>

            <progress value="${totalSaved}" max="${totalMax}"></progress>

            <p class="overall-text">
                ${totalSaved.toLocaleString()} / ${totalMax.toLocaleString()} Total
            </p>
        </div>

        <div class="subjects-container">
    `;

    SUBJECTS.forEach(subject => {
        html += createSubjectHtml(subject, config[subject], savedData[subject] || 0);
    });

    html += `</div>`;

    // ===============================
    // FIXED NAVIGATION (USES GLOBAL CSS)
    // ===============================
    html += `
        <div class="section-buttons">
            <button class="nav-button"
                onclick="loadStudySection(${Math.max(9, gradeNum - 1)})">
                Previous
            </button>

            <button class="nav-button"
                onclick="loadStudySection(${Math.min(12, gradeNum + 1)})">
                Next
            </button>
        </div>
    `;

    mainContent.innerHTML = html;
};

// ===============================
// INPUT HANDLER (UNCHANGED LOGIC)
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    mainContent.addEventListener("input", function (e) {

        if (!e.target.classList.contains("subject-progress")) return;

        const input = e.target;
        const max = Number(input.dataset.maxpages);

        let val = Number(input.value.replace(/[^0-9]/g, ''));

        if (val > max) val = max;

        input.value = val;

        const subject = input.dataset.subject;
        window.activeStudySavedData[subject] = val;

        const masterData = window.DataService.get() || { studyProgress: {} };
        masterData.studyProgress[window.activeStudyGrade] = window.activeStudySavedData;
        window.DataService.set(masterData);

        const percent = Math.round((val / max) * 100);

        input.parentElement.querySelector("progress").value = val;
        input.parentElement.querySelector(".subject-stats").innerText =
            `${percent}% (${val}/${max} pages)`;

        const config = window.maxPagesByGrade?.[window.activeStudyGrade];

        let totalMax = 0;
        let totalSaved = 0;

        SUBJECTS.forEach(s => {
            const m = config[s] || 0;
            const v = Math.min(window.activeStudySavedData[s] || 0, m);

            totalMax += m;
            totalSaved += v;
        });

        const totalPercent = Math.round((totalSaved / totalMax) * 100);

        const summaryCard = document.querySelector(".overall-summary-card");

        if (summaryCard) {
            summaryCard.querySelector(".overall-percent").innerText = `${totalPercent}%`;
            summaryCard.querySelector("progress").value = totalSaved;
            summaryCard.querySelector(".overall-text").innerText =
                `${totalSaved.toLocaleString()} / ${totalMax.toLocaleString()} Total`;
        }
    });
});
