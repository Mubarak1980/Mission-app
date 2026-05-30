"use strict";

window.loadDashboard = () => {
  try {
    const main = document.getElementById("main-content");
    if (!main) return;

    // Clear current content
    main.innerHTML = "";

    const masterData = window.DataService.get();
    const studyProgress = masterData.studyProgress || {}; 
    
    // Yearly Constants
    const YEARLY_GOAL_PAGES = 4638;
    const YEARLY_GOAL_DAYS = 360;
    const startDate = new Date(masterData.startDate || new Date());
    const daysPassed = Math.min(Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24)), YEARLY_GOAL_DAYS);

    // 1. Subjects list updated to match the 4-subject system exactly
    const subjects = ["Math", "Physics", "Chemistry", "Biology"];
    const grades = [9, 10, 11, 12];

    let totalGlobalDone = 0;
    let totalGlobalMax = 0;

    let html = `<h2>📊 Master Dashboard</h2>`;

    // ADDED: Yearly Progress Section (Your requested feature)
    const pagePercent = Math.round((totalGlobalDone / YEARLY_GOAL_PAGES) * 100);
    const timePercent = Math.round((daysPassed / YEARLY_GOAL_DAYS) * 100);
    
    html += `
      <div class="yearly-summary" style="margin-bottom: 20px; padding: 15px; background: #121821; border-radius: 10px;">
        <h3>Yearly Progress</h3>
        <p>Pages: ${pagePercent}% (${totalGlobalDone}/${YEARLY_GOAL_PAGES})</p>
        <progress max="100" value="${pagePercent}" style="width:100%; height:12px; margin-bottom:10px;"></progress>
        <p>Time: ${timePercent}% (${daysPassed}/${YEARLY_GOAL_DAYS} days)</p>
        <progress max="100" value="${timePercent}" style="width:100%; height:12px;"></progress>
      </div>
      <div class="dashboard-container">`;

    // 2. Render Subject Progress (Aggregated across all grades)
    subjects.forEach(subject => {
      let subjectTotalDone = 0;
      let subjectTotalMax = 0;
      
      grades.forEach(gradeKey => {
        const saved = studyProgress[gradeKey] || {};
        const max = Number(window.maxPagesByGrade?.[gradeKey]?.[subject]) || 0;
        const done = Math.min(Number(saved[subject]) || 0, max);
        
        subjectTotalDone += done;
        subjectTotalMax += max;
      });

      // Update global trackers
      totalGlobalDone += subjectTotalDone;
      totalGlobalMax += subjectTotalMax;

      const avg = subjectTotalMax ? Math.round((subjectTotalDone / subjectTotalMax) * 100) : 0;
      
      html += `
        <div class="dashboard-subject" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 5px;">${subject}</h3>
          <progress max="${subjectTotalMax}" value="${subjectTotalDone}" style="width:100%; height:12px;"></progress>
          <p style="font-size: 13px; color: #8b949e; margin-top: 5px;">
            ${avg}% (${subjectTotalDone.toLocaleString()} / ${subjectTotalMax.toLocaleString()} pages)
          </p>
        </div>`;
    });

    // 3. Final Metrics Render
    html += `</div>
      <div class="metrics-summary" style="margin-top: 20px; padding: 15px; background: #121821; border-radius: 10px;">
        <h3>📈 Overall Master Completion</h3>
        <p style="font-size: 18px; font-weight: bold;">
          Total: ${totalGlobalDone.toLocaleString()} / ${totalGlobalMax.toLocaleString()} pages
        </p>
      </div>`;

    main.innerHTML = html;

  } catch (err) {
    console.error("Dashboard Render Failed:", err);
    document.getElementById("main-content").innerHTML = `<div style="color:red;">Error loading dashboard.</div>`;
  }
};
      
