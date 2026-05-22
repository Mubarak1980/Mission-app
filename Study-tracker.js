"use strict";

// ===============================
// Study-tracker.js (PWA SAFE IMPROVED)
// ===============================

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English"];

// ===============================
// STORAGE SAFE
// ===============================
function loadProgress(grade) {
    try {
        const data = JSON.parse(
            localStorage.getItem(`grade_${grade}_progress`) || "{}"
        );

        return data && typeof data === "object"
            ? data
            : {};

    } catch {
        return {};
    }
}

function saveProgress(grade, data) {
    try {
        localStorage.setItem(
            `grade_${grade}_progress`,
            JSON.stringify(data || {})
        );
    } catch (e) {
        console.warn("Storage failed:", e);
    }
}

// ===============================
// UI COMPONENT
// ===============================
function createSubject(name, maxPages, savedPages) {

    const safeMax = Number(maxPages) || 0;

    const safeSaved = Math.min(
        Number(savedPages) || 0,
        safeMax
    );

    const percent = safeMax
        ? Math.round((safeSaved / safeMax) * 100)
        : 0;

    return `
        <div class="subject ${percent === 100 ? "complete" : ""}">

            <h3>${name}</h3>

            <input 
                class="subject-progress"
                type="number"
                min="0"
                max="${safeMax}"
                value="${safeSaved}"
                data-subject="${name}"
                data-maxpages="${safeMax}"
            />

            <progress
                value="${safeSaved}"
                max="${safeMax}">
            </progress>

            <p>${percent}% complete</p>

        </div>
    `;
}

// ===============================
// UI UPDATE
// ===============================
function updateSubjectUI(container, value, max) {

    const safeValue = Math.min(
        Number(value) || 0,
        Number(max) || 0
    );

    const percent = max
        ? Math.round((safeValue / max) * 100)
        : 0;

    const progressBar = container.querySelector("progress");
    const text = container.querySelector("p");

    if (progressBar) {
        progressBar.value = safeValue;
    }

    if (text) {
        text.textContent = `${percent}% complete`;
    }

    container.classList.toggle(
        "complete",
        percent === 100
    );
}

// ===============================
// INPUT HANDLER
// ===============================
function handleInput(e, grade, saved) {

    const input = e.target;

    if (!input.classList.contains("subject-progress")) {
        return;
    }

    const subject = input.dataset.subject;

    const max = Number(
        input.dataset.maxpages
    ) || 0;

    let value = Math.max(
        0,
        Number(input.value) || 0
    );

    value = Math.min(value, max);

    input.value = value;

    if (!subject) return;

    // ✅ ONLY SAVE CURRENT SUBJECT
    saved[subject] = value;

    const container = input.closest(".subject");

    if (container) {
        updateSubjectUI(container, value, max);
    }

    saveProgress(grade, saved);

    updateGradeSummary(grade);
}

// ===============================
// LOAD SECTION
// ===============================
function loadStudySection(grade) {

    const mainContent =
        document.getElementById("main-content");

    if (!mainContent) return;

    if (!window.maxPagesByGrade) {

        mainContent.innerHTML = `
            <p style="
                padding:20px;
                text-align:center;
                color:red;
            ">
                System error:
                maxPagesByGrade is not loaded
            </p>
        `;

        return;
    }

    const data = window.maxPagesByGrade[grade];

    if (!data) {

        mainContent.innerHTML = `
            <p style="
                padding:20px;
                text-align:center;
            ">
                No data found for Grade ${grade}
            </p>
        `;

        return;
    }

    const saved = loadProgress(grade);

    let html = `
        <h2>📘 Grade ${grade} Study Tracker</h2>

        <div class="subjects-container">
    `;

    for (const subject of SUBJECTS) {

        html += createSubject(
            subject,
            data[subject] || 0,
            saved[subject] || 0
        );
    }

    html += `</div>`;

    // ===============================
    // RENDER
    // ===============================
    mainContent.innerHTML = html;

    // ===============================
    // ✅ FIXED EVENT LISTENER
    // IMPORTANT:
    // Remove old listener problem
    // ===============================
    mainContent.oninput = (e) => {
        handleInput(e, grade, saved);
    };

    updateGradeSummary(grade);
}

// ===============================
// SUMMARY
// ===============================
function updateGradeSummary(grade) {

    const saved = loadProgress(grade);

    const data =
        window.maxPagesByGrade?.[grade];

    if (!data) return;

    let totalDone = 0;
    let totalPages = 0;

    for (const subject of SUBJECTS) {

        const max =
            Number(data[subject]) || 0;

        const done = Math.min(
            Number(saved[subject]) || 0,
            max
        );

        totalDone += done;
        totalPages += max;
    }

    const percent = totalPages
        ? Math.round(
            (totalDone / totalPages) * 100
        )
        : 0;

    const el =
        document.getElementById(
            "grade-progress-bar"
        );

    if (el) {

        el.innerHTML = `
            <label>
                📘 Grade ${grade}
                Overall Progress:
                ${percent}%
            </label>

            <progress
                value="${percent}"
                max="100">
            </progress>
        `;
    }
}

// ===============================
// EXPORTS
// ===============================
window.loadStudySection = loadStudySection;
window.updateGradeSummary = updateGradeSummary;
