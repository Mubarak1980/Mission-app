"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

window.maxPagesByGrade = {
    9:  { Math: 363, Physics: 174, Chemistry: 175, Biology: 164 },
    10: { Math: 385, Physics: 249, Chemistry: 298, Biology: 174 },
    11: { Math: 479, Physics: 329, Chemistry: 330, Biology: 284 },
    12: { Math: 416, Physics: 177, Chemistry: 287, Biology: 354 }
};

function createSubjectHtml(name, max, saved) {
    const percent = max > 0 ? Math.round((Math.min(saved, max) / max) * 100) : 0;

    return `
        <div class="subject">
            <h3>${name}</h3>
            <input class="subject-progress"
                type="number"
                value="${saved}"
                data-subject="${name}"
                data-maxpages="${max}" />
            <progress value="${saved}" max="${max}"></progress>
            <p class="subject-stats">
                ${percent}% (${saved}/${max} pages)
            </p>
        </div>
    `;
}

window.loadStudySection = function (grade) {
    const mainContent = document.getElementById("main-content");
    const gradeNum = parseInt(grade);
    if (!mainContent) return;
    mainContent.innerHTML = "";

    const masterData = (window.DataService && window.DataService.get()) || { studyProgress: {} };
    const savedData = masterData.studyProgress?.[gradeNum] || {};
    const config = window.maxPagesByGrade?.[gradeNum];
    if (!config) return;

    window.activeStudyGrade = gradeNum;
    window.activeStudySavedData = savedData;

    let totalMax = 0;
    let totalSaved = 0;

    SUBJECTS.forEach(s => {
        const max = config[s] || 0;
        const saved = Math.min(savedData[s] || 0, max);
        totalMax += max;
        totalSaved += saved;
    });

    const totalPercent = totalMax > 0 ? Math.round((totalSaved / totalMax) * 100) : 0;

    let html = `<h2>📚 Grade ${gradeNum} Study Tracker</h2>`;

    html += `
        <div class="overall-summary-card content-spacing">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                <span><b>Overall Progress</b></span>
                <span class="overall-percent">${totalPercent}%</span>
            </div>
            <progress value="${totalSaved}" max="${totalMax}"></progress>
            <p class="overall-text">
                ${totalSaved.toLocaleString()} / ${totalMax.toLocaleString()} Total
            </p>
        </div>

        <div class="subjects-container content-spacing">
    `;

    SUBJECTS.forEach(subject => {
        html += createSubjectHtml(subject, config[subject], savedData[subject] || 0);
    });

    html += `</div>`;

    const prev = Math.max(9, gradeNum - 1);
    const next = Math.min(12, gradeNum + 1);

    html += `
        <div class="study-nav content-spacing">
            <button class="study-nav-button"
                onclick="loadStudySection(${prev})"
                ${gradeNum === 9 ? "disabled" : ""}>
                Previous
            </button>
            <button class="study-nav-button"
                onclick="loadStudySection(${next})"
                ${gradeNum === 12 ? "disabled" : ""}>
                Next
            </button>
        </div>
    `;

    mainContent.innerHTML = html;
};

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

        const percent = max ? Math.round((val / max) * 100) : 0;
        input.parentElement.querySelector("progress").value = val;
        input.parentElement.querySelector(".subject-stats").innerText = `${percent}% (${val}/${max} pages)`;

        const config = window.maxPagesByGrade?.[window.activeStudyGrade];
        let totalMax = 0;
        let totalSaved = 0;
        SUBJECTS.forEach(s => {
            const m = config[s] || 0;
            const v = Math.min(window.activeStudySavedData[s] || 0, m);
            totalMax += m;
            totalSaved += v;
        });

        const totalPercent = totalMax ? Math.round((totalSaved / totalMax) * 100) : 0;
        const card = document.querySelector(".overall-summary-card");
        if (card) {
            card.querySelector(".overall-percent").innerText = `${totalPercent}%`;
            card.querySelector("progress").value = totalSaved;
            card.querySelector(".overall-text").innerText = `${totalSaved.toLocaleString()} / ${totalMax.toLocaleString()} Total`;
        }
    });
});
    
