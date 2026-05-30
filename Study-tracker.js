"use strict";

// 1. Global Subjects Definition
const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology"];

// 2. Helper: Calculate percentage safely
function calculatePercent(done, max) {
    const safeMax = Math.max(0, Number(max) || 0);
    const safeDone = Math.max(0, Math.min(Number(done) || 0, safeMax));
    return safeMax <= 0 ? 0 : Math.round((safeDone / safeMax) * 100);
}

// 3. Helper: Generate UI components
function createSubject(name, maxPages, savedPages) {
    const safeMax = Number(maxPages) || 0;
    const safeSaved = Math.min(Number(savedPages) || 0, safeMax);
    const percent = calculatePercent(safeSaved, safeMax);

    return `
        <div class="subject" style="margin-bottom: 20px; background: #161b22; padding: 15px; border-radius: 8px;">
            <h3 style="margin-top:0; color: #00d4ff;">${name}</h3>
            <input class="subject-progress" type="number" 
                value="${safeSaved}" 
                data-subject="${name}" 
                data-maxpages="${safeMax}"
                style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #30363d; background: #0d1117; color: white; margin-bottom: 5px;">
            <progress value="${safeSaved}" max="${safeMax}" style="width: 100%; height: 10px;"></progress>
            <p style="font-size: 12px; color: #8b949e; margin-top: 5px;">${percent}% (${safeSaved}/${safeMax} pages)</p>
        </div>
    `;
}

// 4. Main Loading Function (Fixed to prevent black screen)
window.loadStudySection = function(grade) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    // Load data or initialize empty if none exists
    const masterData = (window.DataService && typeof window.DataService.get === 'function') ? window.DataService.get() : { studyProgress: {} };
    const savedData = masterData.studyProgress?.[grade] || {};
    const config = window.maxPagesByGrade?.[grade];

    if (!config) {
        mainContent.innerHTML = `<p style="padding: 20px;">Configuration for Grade ${grade} not found.</p>`;
        return;
    }

    // Render HTML
    let html = `<h2>📚 Grade ${grade} Study Tracker</h2><div class="subjects-container">`;
    SUBJECTS.forEach(sub => {
        html += createSubject(sub, config[sub], savedData[sub] || 0);
    });
    html += `</div>`;

    mainContent.innerHTML = html;

    // Attach listener for inputs
    mainContent.addEventListener("input", (e) => {
        if (!e.target.classList.contains("subject-progress")) return;
        
        // Simple save logic
        const sub = e.target.dataset.subject;
        const val = Math.min(Number(e.target.value), Number(e.target.dataset.maxpages));
        
        masterData.studyProgress[grade] = masterData.studyProgress[grade] || {};
        masterData.studyProgress[grade][sub] = val;
        
        if (window.DataService && typeof window.DataService.set === 'function') {
            window.DataService.set(masterData);
        }
        
        // Re-render percent text
        const p = e.target.parentElement.querySelector("p");
        const percent = calculatePercent(val, e.target.dataset.maxpages);
        p.innerText = `${percent}% (${val}/${e.target.dataset.maxpages} pages)`;
        e.target.parentElement.querySelector("progress").value = val;
    });
};
