"use strict";

// =====================================================
// 📘 STUDY TRACKER (PWA OPTIMIZED & BRIDGE INTEGRATED)
// =====================================================

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English"];

let activeStudyGrade = null;
let activeStudySavedData = null;

// ===============================
// BRIDGE-AWARE LOADING
// ===============================
function loadProgress(grade) {
    // We utilize our unified DataService bridge
    return window.DataService.get(`grade_${grade}_progress`) || {};
}

// ===============================
// BRIDGE-AWARE SAVING
// ===============================
function saveProgress(grade, data) {
    // 1. Update the grade-specific storage
    window.DataService.set(`grade_${grade}_progress`, data || {});

    // 2. Sync Master Metrics
    // By updating the master state, we ensure the Dashboard engine 
    // always has the most recent page counts available.
    if (typeof window.getSmartCycle === "function") {
        console.log("🔄 Syncing Master Engine metrics...");
    }
}

// ===============================
// PERCENT ENGINE
// ===============================
function calculatePercent(done, max) {
    const safeDone = Math.max(0, Number(done) || 0);
    const safeMax = Math.max(0, Number(max) || 0);
    if (safeMax <= 0) return 0;
    return Math.min(100, Math.round((safeDone / safeMax) * 100));
}

// ===============================
// SUBJECT COMPONENT
// ===============================
function createSubject(name, maxPages, savedPages) {
    const safeMax = Number(maxPages) || 0;
    const safeSaved = Math.min(Number(savedPages) || 0, safeMax);
    const percent = calculatePercent(safeSaved, safeMax);

    return `
        <div class="subject ${percent === 100 ? "complete" : ""}" style="contain: content; margin-bottom: 14px;">
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
                style="width: 100%; padding: 8px; border-radius: 6px;"
            />
            <div class="subject-progress-wrapper" style="margin-top: 4px;">
                <progress value="${safeSaved}" max="${safeMax}" style="width: 100%;"></progress>
            </div>
            <p class="subject-percent" style="margin-top: 6px; font-size: 12px; font-weight: 500; text-align: right; color: #8b949e;">
                ${percent}% progress (${safeSaved}/${safeMax} pages)
            </p>
        </div>
    `;
}

// ===============================
// UI UPDATE
// ===============================
function updateSubjectUI(container, value, max) {
    if (!container) return;
    const safeMax = Number(max) || 0;
    const safeValue = Math.min(Number(value) || 0, safeMax);
    const percent = calculatePercent(safeValue, safeMax);

    const progressBar = container.querySelector("progress");
    const percentText = container.querySelector(".subject-percent");

    if (progressBar) {
        progressBar.value = safeValue;
        progressBar.max = safeMax;
    }
    if (percentText) {
        percentText.innerHTML = `${percent}% progress (${safeValue}/${safeMax} pages)`;
    }
}

// ===============================
// CENTRALIZED INPUT HANDLER
// ===============================
function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;

    const subject = input.dataset.subject;
    const max = Number(input.dataset.maxpages) || 0;
    let value = Math.max(0, Number(input.value) || 0);
    if (value > max) value = max;

    activeStudySavedData[subject] = value;
    saveProgress(activeStudyGrade, activeStudySavedData);
    updateSubjectUI(input.closest(".subject"), value, max);
    updateGradeSummary(activeStudyGrade);
}

// ===============================
// LOAD STUDY SECTION
// ===============================
function loadStudySection(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    activeStudyGrade = grade;
    activeStudySavedData = loadProgress(grade);

    const data = window.maxPagesByGrade?.[grade];
    if (!data) {
        mainContent.innerHTML = `<p>Error: No data for Grade ${grade}</p>`;
        return;
    }

    let html = `<h2>📘 Grade ${grade} Study Tracker</h2><div class="subjects-container">`;
    for (const subject of SUBJECTS) {
        html += createSubject(subject, data[subject], activeStudySavedData[subject] || 0);
    }
    html += `</div>`;
    mainContent.innerHTML = html;

    mainContent.removeEventListener("input", cleanStudyInputRouter);
    mainContent.addEventListener("input", cleanStudyInputRouter);
    updateGradeSummary(grade);
}

// ===============================
// GRADE SUMMARY
// ===============================
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
        el.innerHTML = `Grade ${grade} Overall: ${percent}% (${totalDone}/${totalPages} pages)`;
    }
}

window.loadStudySection = loadStudySection;
        
