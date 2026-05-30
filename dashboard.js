"use strict";

window.loadDashboard = () => {
  try {
    const main = document.getElementById("main-content");
    if (!main) return;

    main.innerHTML = "";

    const masterData = window.DataService.get();
    const studyProgress = masterData.studyProgress || {}; 
    
    const subjects = ["Math", "Physics", "Chemistry", "Biology"];
    const grades = [9, 10, 11, 12];
    
    let subjectHtml = "";

    // Render Subject Progress
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

      const avg = subjectTotalMax ? Math.round((subjectTotalDone / subjectTotalMax) * 100) : 0;
      
      subjectHtml += `
        <div class="dashboard-subject" style="margin-bottom: 25px; padding: 15px; background: #121821; border-radius: 10px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #00d4ff;">${subject}</h3>
          <progress max="${subjectTotalMax}" value="${subjectTotalDone}" style="width:100%; height:12px;"></progress>
          <p style="font-size: 14px; color: #8b949e; margin-top: 8px;">
            <strong>${avg}%</strong> completion (${subjectTotalDone.toLocaleString()} / ${subjectTotalMax.toLocaleString()} pages)
          </p>
        </div>`;
    });

    // Final Render (Cleaned: No yearly summary, no global total)
    main.innerHTML = `
      <h2 style="margin-bottom: 20px;">📊 Subject Mastery Dashboard</h2>
      <div class="dashboard-container">
        ${subjectHtml}
      </div>`;

  } catch (err) {
    console.error("Dashboard Render Failed:", err);
    document.getElementById("main-content").innerHTML = `<div style="color:red;">Error loading dashboard.</div>`;
  }
};
