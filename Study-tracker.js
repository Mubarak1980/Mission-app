"use strict";

// =====================================================
// 📘 STUDY TRACKER (PWA OPTIMIZED & MATCHED METRICS)
// =====================================================

const SUBJECTS = [
    "Math",
    "Physics",
    "Chemistry",
    "Biology",
    "English"
];

// Memory anchors to prevent event listener cloning errors
let activeStudyGrade = null;
let activeStudySavedData = null;

// ===============================
// STORAGE SAFE PIPELINE BRIDGE
// ===============================
function loadProgress(grade) {
    // Routed cleanly through our secure unified mobile database wrapper
    if (window.Storage && typeof window.Storage.get === "function") {
        return window.Storage.get(`grade_${grade}_progress`, {});
    }
    
    // Fail-safe programmatic fallback for early initialization phases
    try {
        const raw = localStorage.getItem(`grade_${grade}_progress`);
        if (!raw) return {};
        const data = JSON.parse(raw);
        return (data && typeof data === "object") ? data : {};
    } catch (err) {
        console.warn("Progress load failed:", err);
        return {};
    }
}

function saveProgress(grade, data) {
    // Guard tracking integrity using our secure storage layer
    if (window.Storage && typeof window.Storage.set === "function") {
        window.Storage.set(`grade_${grade}_progress`, data || {});
        return;
    }

    try {
        localStorage.setItem(`grade_${grade}_progress`, JSON.stringify(data || {}));
    } catch (err) {
        console.warn("Storage failed:", err);
    }
}

// ===============================
// SAFE NUMBER
// ===============================
function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return isNaN(n) ? fallback : n;
}

// ===============================
// PERCENT ENGINE
// ===============================
function calculatePercent(done, max) {
    const safeDone = safeNumber(done);
    const safeMax = safeNumber(max);
    if (safeMax <= 0) return 0;
    return Math.min(100, Math.round((safeDone / safeMax) * 100));
}

// ===============================
// SUBJECT COMPONENT
// ===============================
function createSubject(name, maxPages, savedPages) {
    const safeMax = safeNumber(maxPages);
    const safeSaved = Math.min(safeNumber(savedPages), safeMax);
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
                autocomplete="off"
                style="touch-action: manipulation; -webkit-user-select: text; user-select: text;"
            />

            <div class="subject-progress-wrapper" style="margin-top: 4px;">
                <progress value="${safeSaved}" max="${safeMax}"></progress>
            </div>

            <p class="subject-percent" style="margin-top: 6px; font-size: 12px; font-weight: 500; text-align: right; color: var(--muted, #8b949e);">
                ${percent}% progress <span style="font-size:0.85em; color: var(--muted, #8b949e);">(${safeSaved}/${safeMax} pages)</span>
            </p>
        </div>
    `;
}

// ===============================
// UI UPDATE
// ===============================
function updateSubjectUI(container, value, max) {
    if (!container) return;

    const safeMax = safeNumber(max);
    const safeValue = Math.min(safeNumber(value), safeMax);
    const percent = calculatePercent(safeValue, safeMax);

    const progressBar = container.querySelector("progress");
    const percentText = container.querySelector(".subject-percent");

    if (progressBar) {
        progressBar.value = safeValue;
        progressBar.max = safeMax;
    }

    if (percentText) {
        percentText.innerHTML = `${percent}% progress <span style="font-size:0.85em; color: var(--muted, #8b949e);">(${safeValue}/${safeMax} pages)</span>`;
    }

    container.classList.toggle("complete", percent === 100);
}

// ===============================
// CENTRALIZED INPUT HANDLER ROUTER
// ===============================
function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;
    if (!activeStudyGrade || !activeStudySavedData) return;

    const subject = input.dataset.subject;
    const max = safeNumber(input.dataset.maxpages);
    
    // Allow empty values temporarily during live editing sessions so mobile users can type freely
    if (input.value === "") return;

    let value = Math.max(0, safeNumber(input.value));
    if (value > max) {
        value = max;
        input.value = value;
    }

    if (!subject) return;

    // Mutate internal memory structure safely
    activeStudySavedData[subject] = value;

    const container = input.closest(".subject");
    if (container) {
        updateSubjectUI(container, value, max);
    }

    saveProgress(activeStudyGrade, activeStudySavedData);
    updateGradeSummary(activeStudyGrade);
}

// Safe tracking point closure for handling unfocused element resets on mobile screens
function handleBlurSanitization(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;
    if (input.value === "") {
        input.value = 0;
        cleanStudyInputRouter(e);
    }
}

// ===============================
// LOAD STUDY SECTION
// ===============================
function loadStudySection(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    if (!window.maxPagesByGrade) {
        mainContent.innerHTML = `
            <p style="padding:20px; text-align:center; color:#ff4d4d; font-weight: bold;">
                System error: maxPagesByGrade is not loaded
            </p>
        `;
        return;
    }

    const data = window.maxPagesByGrade[grade];
    if (!data) {
        mainContent.innerHTML = `<p style="padding:20px; text-align:center; color: var(--muted, #8b949e);">No data found for Grade ${grade}</p>`;
        return;
    }

    // Capture lifecycle variables securely
    activeStudyGrade = grade;
    activeStudySavedData = loadProgress(grade);

    let html = `
        <h2>📘 Grade ${grade} Study Tracker</h2>
        <div class="subjects-container" style="padding-bottom: 24px;">
    `;

    for (const subject of SUBJECTS) {
        html += createSubject(subject, data[subject] || 0, activeStudySavedData[subject] || 0);
    }

    html += `</div>`;
    mainContent.innerHTML = html;

    // Clean up event infrastructure paths systematically to prevent double execution loops
    mainContent.removeEventListener("input", cleanStudyInputRouter);
    mainContent.removeEventListener("blur", handleBlurSanitization, true);
    
    mainContent.addEventListener("input", cleanStudyInputRouter);
    mainContent.addEventListener("blur", handleBlurSanitization, true);

    updateGradeSummary(grade);
}

// ===============================
// GRADE SUMMARY
// ===============================
function updateGradeSummary(grade) {
    const saved = loadProgress(grade);
    const data = window.maxPagesByGrade?.[grade];
    if (!data) return;

    let totalDone = 0;
    let totalPages = 0;

    for (const subject of SUBJECTS) {
        const max = safeNumber(data[subject]);
        const done = Math.min(safeNumber(saved[subject]), max);
        totalDone += done;
        totalPages += max;
    }

    const percent = calculatePercent(totalDone, totalPages);
    const el = document.getElementById("grade-progress-bar");
    if (!el) return;

    el.innerHTML = `
        <label style="color: var(--primary, #00d4ff); font-weight: 600;">📘 Grade ${grade} Overall Progress: ${percent}%</label>
        <progress value="${percent}" max="100" style="margin-top: 4px;"></progress>
        <p style="margin-top:6px; color: var(--muted, #8b949e); font-size:12px; font-weight: 500; text-align: right;">
            (${totalDone}/${totalPages} pages)
        </p>
    `;
}

// ===============================
// EXPORTS
// ===============================
window.loadStudySection = loadStudySection;
window.updateGradeSummary = updateGradeSummary;
