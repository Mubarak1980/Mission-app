"use strict";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

window.maxPagesByGrade = {
    9:  { Math: 311, Physics: 138, Chemistry: 152, Biology: 153 },
    10: { Math: 335, Physics: 217, Chemistry: 202, Biology: 150 },
    11: { Math: 120, Physics: 308, Chemistry: 295, Biology: 243 },
    12: { Math: 306, Physics: 154, Chemistry: 245, Biology: 325 }
};

function createSubjectHtml(name, max, saved) {
    const safeSaved = Number(saved) || 0;
    const safeMax = Number(max) || 0;
    const percent = safeMax > 0 ? Math.round((Math.min(safeSaved, safeMax) / safeMax) * 100) : 0;

    return `
        <div class="subject">
            <h3>${name}</h3>
            <input class="subject-progress"
                type="number"
                value="${safeSaved}"
                min="0"
                max="${safeMax}"
                data-subject="${name}"
                data-maxpages="${safeMax}" />
            <progress value="${safeSaved}" max="${safeMax}"></progress>
            <p class="subject-stats">
                ${percent}% (${safeSaved}/${safeMax} pages)
            </p>
        </div>
    `;
}

function getSafeStudyData() {
    const data = (window.DataService && typeof window.DataService.get === "function")
        ? (window.DataService.get() || {})
        : {};

    return {
        ...data,
        studyProgress: {
            ...(data.studyProgress || {})
        },
        ui: {
            ...(data.ui || { section: "study", grade: 9 })
        }
    };
}

function updateStudySummary(grade, gradeData) {
    const config = window.maxPagesByGrade?.[grade];
    if (!config) return;

    let totalMax = 0;
    let totalSaved = 0;

    SUBJECTS.forEach(subject => {
        const max = Number(config[subject]) || 0;
        const saved = Math.min(Number(gradeData?.[subject]) || 0, max);
        totalMax += max;
        totalSaved += saved;
    });

    const totalPercent = totalMax > 0 ? Math.round((totalSaved / totalMax) * 100) : 0;
    const card = document.querySelector(".overall-summary-card");

    if (card) {
        const percentNode = card.querySelector(".overall-percent");
        const progressNode = card.querySelector("progress");
        const textNode = card.querySelector(".overall-text");

        if (percentNode) percentNode.innerText = `${totalPercent}%`;
        if (progressNode) progressNode.value = totalSaved;
        if (textNode) textNode.innerText = `${totalSaved.toLocaleString()} / ${totalMax.toLocaleString()} Total`;
    }
}

window.loadStudySection = function (grade) {
    const mainContent = document.getElementById("main-content");
    const gradeNum = Number.parseInt(grade, 10);

    if (!mainContent || !Number.isFinite(gradeNum)) return;

    mainContent.style.opacity = "0";
    mainContent.style.transform = "translateY(-5px)";

    setTimeout(() => {
        mainContent.innerHTML = "";

        const masterData = getSafeStudyData();
        const config = window.maxPagesByGrade?.[gradeNum];
        if (!config) return;

        const savedData = {
            ...(masterData.studyProgress?.[gradeNum] || {})
        };

        window.activeStudyGrade = gradeNum;
        window.activeStudySavedData = {
            ...savedData
        };

        let totalMax = 0;
        let totalSaved = 0;

        SUBJECTS.forEach(subject => {
            const max = Number(config[subject]) || 0;
            const saved = Math.min(Number(savedData[subject]) || 0, max);
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
            <div class="study-nav">
                <button class="study-nav-button prev-button"
                    onclick="loadStudySection(${prev})"
                    ${gradeNum === 9 ? "disabled" : ""}>
                    <span class="button-icon">←</span>
                    <span class="button-text">Previous</span>
                    <span class="button-grade">${prev}</span>
                </button>
                <button class="study-nav-button next-button"
                    onclick="loadStudySection(${next})"
                    ${gradeNum === 12 ? "disabled" : ""}>
                    <span class="button-icon">→</span>
                    <span class="button-text">Next</span>
                    <span class="button-grade">${next}</span>
                </button>
            </div>
        `;

        mainContent.innerHTML = html;
        mainContent.style.opacity = "1";
        mainContent.style.transform = "translateY(0)";
    }, 150);
};

document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    mainContent.addEventListener("input", async function (e) {
        const input = e.target;
        if (!input.classList.contains("subject-progress")) return;

        const grade = Number(window.activeStudyGrade);
        if (!Number.isFinite(grade)) return;

        const config = window.maxPagesByGrade?.[grade];
        if (!config) return;

        const subject = input.dataset.subject;
        const max = Number(input.dataset.maxpages) || 0;

        const raw = String(input.value).replace(/[^0-9]/g, "");
        let val = raw === "" ? 0 : Number(raw);

        if (!Number.isFinite(val) || val < 0) val = 0;
        if (val > max) val = max;

        input.value = val;

        const currentData = getSafeStudyData();
        const currentStudyProgress = {
            ...(currentData.studyProgress || {})
        };

        const currentGradeData = {
            ...(currentStudyProgress[grade] || {})
        };

        currentGradeData[subject] = val;
        currentStudyProgress[grade] = currentGradeData;
        currentData.studyProgress = currentStudyProgress;

        window.activeStudySavedData = {
            ...currentGradeData
        };

        if (window.DataService && typeof window.DataService.set === "function") {
            await window.DataService.set(currentData);
        }

        const percent = max ? Math.round((val / max) * 100) : 0;
        const subjectCard = input.closest(".subject");

        if (subjectCard) {
            const progressBar = subjectCard.querySelector("progress");
            const stats = subjectCard.querySelector(".subject-stats");

            if (progressBar) progressBar.value = val;
            if (stats) stats.innerText = `${percent}% (${val}/${max} pages)`;
        }

        updateStudySummary(grade, currentGradeData);
    });
});
