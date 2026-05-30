"use strict";

// ... (Your SUBJECTS, maxPagesByGrade, loadProgress, saveProgress, calculatePercent, createSubject, updateSubjectUI code remains identical) ...

// 🧠 INTEGRATED VELOCITY LOGIC with State-Machine Enforcement
function cleanStudyInputRouter(e) {
    const input = e.target;
    if (!input || !input.classList.contains("subject-progress")) return;

    // 1. STATE-MACHINE CHECK: Prevent action if cycle is complete
    if (!window.StateEngine.canLogProgress()) {
        alert("⚠️ Cycle Complete: You cannot log new progress. Please reset your cycle.");
        // Reset input to last known valid value
        input.value = activeStudySavedData[input.dataset.subject] || 0;
        return;
    }

    const subject = input.dataset.subject;
    const max = Number(input.dataset.maxpages) || 0;

    let valStr = input.value.replace(/[^0-9]/g, '');
    if (valStr.length > 4) valStr = valStr.slice(0, 4);
    
    let value = Number(valStr);
    if (isNaN(value)) value = 0;
    if (value > max) value = max;

    input.value = value; 

    // 2. Log velocity
    const previousValue = activeStudySavedData[subject] || 0;
    const pagesAdded = value - previousValue;

    if (pagesAdded > 0) {
        window.DataService.logVelocity(subject, pagesAdded);
    }

    activeStudySavedData[subject] = value;
    saveProgress(activeStudyGrade, activeStudySavedData);
    updateSubjectUI(input.closest(".subject"), value, max);
    updateGradeSummary(activeStudyGrade);
}

// 3. Updated loadStudySection
function loadStudySection(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    // Check state before allowing interaction
    const isLocked = !window.StateEngine.canLogProgress();

    activeStudyGrade = grade;
    activeStudySavedData = loadProgress(grade);

    const data = window.maxPagesByGrade?.[grade];
    if (!data) return;

    let html = `
        <h2>📚 Grade ${grade} Study Tracker</h2>
        ${isLocked ? `<div style="background: #ff4d4d; color: white; padding: 10px; border-radius: 5px; margin-bottom: 10px;">Cycle Complete: Read-Only Mode</div>` : ""}
        <div class="subjects-container" ${isLocked ? 'style="pointer-events: none; opacity: 0.6;"' : ""}>
    `;
    
    for (const subject of SUBJECTS) {
        html += createSubject(subject, data[subject], activeStudySavedData[subject] || 0);
    }
    
    html += `</div><div id="grade-progress-bar"></div>`;
    mainContent.innerHTML = html;

    mainContent.removeEventListener("input", cleanStudyInputRouter);
    if (!isLocked) {
        mainContent.addEventListener("input", cleanStudyInputRouter);
    }
    updateGradeSummary(grade);
}

// ... (Your updateGradeSummary and window.loadStudySection = loadStudySection remain identical) ...
