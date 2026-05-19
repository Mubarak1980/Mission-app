"use strict";

// ===============================
// Study-tracker.js (STABLE VERSION)
// ===============================

const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English'];

// ===============================
// SAFE STORAGE
// ===============================
function loadProgress(grade) {
    try {
        return JSON.parse(localStorage.getItem(`grade_${grade}_progress`) || "{}");
    } catch {
        return {};
    }
}

function saveProgress(grade, data) {
    try {
        localStorage.setItem(`grade_${grade}_progress`, JSON.stringify(data));
    } catch (e) {
        console.warn("Storage failed:", e);
    }
}

// ===============================
// UI CREATION
// ===============================
function createSubject(name, maxPages, savedPages) {
    const percent = maxPages ? Math.round((savedPages / maxPages) * 100) : 0;

    return `
        <div class="subject ${percent === 100 ? 'complete' : ''}">
            <h3>${name}</h3>

            <input 
                class="subject-progress" 
                type="number" 
                min="0" 
                max="${maxPages}" 
                value="${savedPages}" 
                data-subject="${name}" 
                data-maxpages="${maxPages}"
            />

            <progress value="${savedPages}" max="${maxPages}"></progress>

            <p>${percent}% complete</p>
        </div>
    `;
}

// ===============================
// UI UPDATE
// ===============================
function updateSubjectUI(container, value, max) {
    const percent = max ? Math.round((value / max) * 100) : 0;

    const progressBar = container.querySelector('progress');
    const text = container.querySelector('p');

    if (progressBar) progressBar.value = value;
    if (text) text.textContent = `${percent}% complete`;

    container.classList.toggle('complete', percent === 100);
}

// ===============================
// INPUT HANDLER
// ===============================
function handleInput(e, grade, saved) {
    const input = e.target;

    if (!input.classList.contains("subject-progress")) return;

    let value = Math.max(0, Number(input.value) || 0);
    const max = Number(input.dataset.maxpages || 0);

    if (value > max) value = max;
    input.value = value;

    const subject = input.dataset.subject;
    if (!subject) return;

    saved[subject] = value;

    const container = input.closest(".subject");
    if (container) updateSubjectUI(container, value, max);

    saveProgress(grade, saved);
    updateGradeSummary(grade);
}

// ===============================
// LOAD SECTION (FIXED CORE BUG)
// ===============================
function loadStudySection(grade) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const data = window.maxPagesByGrade?.[grade];

    // ❌ FIX: no false "No data" error anymore
    if (!window.maxPagesByGrade) {
        mainContent.innerHTML = `
            <p style="padding:20px;text-align:center;">
                System error: grade data not loaded
            </p>
        `;
        return;
    }

    if (!data) {
        mainContent.innerHTML = `
            <p style="padding:20px;text-align:center;">
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

    mainContent.innerHTML = html;

    // ✅ FIX: prevent duplicate event listeners
    const freshMain = document.getElementById("main-content");

    freshMain.addEventListener("input", (e) => {
        handleInput(e, grade, saved);
    });

    updateGradeSummary(grade);
}

// ===============================
// SUMMARY
// ===============================
function updateGradeSummary(grade) {
    const saved = loadProgress(grade);
    const data = window.maxPagesByGrade?.[grade];
    if (!data) return;

    let totalDone = 0;
    let totalPages = 0;

    for (const subject of SUBJECTS) {
        const max = data[subject] || 0;
        const done = Math.min(saved[subject] || 0, max);

        totalDone += done;
        totalPages += max;
    }

    const percent = totalPages
        ? Math.round((totalDone / totalPages) * 100)
        : 0;

    const el = document.getElementById('grade-progress-bar');

    if (el) {
        el.innerHTML = `
            <label>📘 Grade ${grade} Overall Progress: ${percent}%</label>
            <progress value="${percent}" max="100"></progress>
        `;
    }
}

// ===============================
// EXPORT
// ===============================
window.loadStudySection = loadStudySection;
window.updateGradeSummary = updateGradeSummary;
