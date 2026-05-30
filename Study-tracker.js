"use strict";

// ADD THIS: Ensure we handle empty data gracefully
function loadProgress(grade) {
    const masterData = window.DataService.get();
    if (!masterData.studyProgress) masterData.studyProgress = {};
    // Return empty object if no data for this grade exists
    return masterData.studyProgress[grade] || {};
}

function loadStudySection(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
        console.error("Main content container not found!");
        return;
    }

    // 1. Set the active state
    activeStudyGrade = grade;
    activeStudySavedData = loadProgress(grade);

    // 2. Validate configuration
    const data = window.maxPagesByGrade?.[grade];
    if (!data) {
        mainContent.innerHTML = `<p style="color:white; padding:20px;">Configuration error: Grade ${grade} not defined.</p>`;
        return;
    }

    // 3. Render the UI
    let html = `<h2>📚 Grade ${grade} Study Tracker</h2><div class="subjects-container">`;
    for (const subject of SUBJECTS) {
        // Fallback to 0 if data is missing
        const saved = activeStudySavedData[subject] || 0;
        html += createSubject(subject, data[subject], saved);
    }
    
    html += `</div><div id="grade-progress-bar"></div>`;
    mainContent.innerHTML = html;

    // 4. Attach Event Listeners
    mainContent.removeEventListener("input", cleanStudyInputRouter);
    mainContent.addEventListener("input", cleanStudyInputRouter);
    
    // 5. Update summary
    updateGradeSummary(grade);
}

// Ensure it is bound to the window for the navigation to find it
window.loadStudySection = loadStudySection;
