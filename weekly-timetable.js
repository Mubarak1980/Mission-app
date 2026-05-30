"use strict";

window.loadDashboard = () => {
    // 1. Safety check: Ensure the Engine is loaded before proceeding
    if (!window.SmartEngine || !window.DataService) {
        console.error("Dashboard failed: SmartEngine or DataService not initialized.");
        document.getElementById("main-content").innerHTML = `<div style="color:orange;">Engine loading... please wait.</div>`;
        return;
    }

    try {
        const main = document.getElementById("main-content");
        if (!main) return;

        // Clear current content
        main.innerHTML = "";

        const masterData = window.DataService.get();
        const studyProgress = masterData.studyProgress || {}; 
        
        // Use Smart Engine for accurate global stats
        const stats = window.SmartEngine.getOverallStats();
        const dailyTarget = window.SmartEngine.calculateDynamicTarget();

        // 1. Subjects list
        const subjects = ["Math", "Physics", "Chemistry", "Biology"];
        const grades = [9, 10, 11, 12];

        let totalGlobalDone = stats.totalRead;
        let totalGlobalMax = 18552; // Annual goal

        let html = `<h2>📊 Master Dashboard</h2>`;

        // 2. Yearly Progress Section (Engine-Driven)
        html += `
          <div class="yearly-summary" style="margin-bottom: 20px; padding: 15px; background: #121821; border-radius: 10px; border-left: 4px solid #00d4ff;">
            <h3>Yearly Progress & Smart Velocity</h3>
            <p>Pages: ${stats.pagePercent}% (${totalGlobalDone.toLocaleString()} / ${totalGlobalMax.toLocaleString()})</p>
            <progress max="100" value="${stats.pagePercent}" style="width:100%; height:12px; margin-bottom:10px;"></progress>
            <p>Time: ${stats.timePercent}% (${stats.daysPassed}/360 days)</p>
            <progress max="100" value="${stats.timePercent}" style="width:100%; height:12px;"></progress>
            <p style="margin-top: 10px; font-weight: bold; color: #00d4ff;">Current Smart Velocity: ${dailyTarget} pages/day</p>
          </div>
          <div class="dashboard-container">`;

        // 3. Render Subject Progress
        subjects.forEach(subject => {
          let subjectTotalDone = 0;
          let subjectTotalMax = 0;
          
          grades.forEach(gradeKey => {
            const saved = studyProgress[gradeKey] || {};
            // Safely access maxPagesByGrade
            const gradeData = (window.maxPagesByGrade && window.maxPagesByGrade[gradeKey]) ? window.maxPagesByGrade[gradeKey] : {};
            const max = Number(gradeData[subject]) || 0;
            const done = Math.min(Number(saved[subject]) || 0, max);
            
            subjectTotalDone += done;
            subjectTotalMax += max;
          });

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

        html += `</div>
          <div class="metrics-summary" style="margin-top: 20px; padding: 15px; background: #121821; border-radius: 10px;">
            <h3>📈 Workload Status</h3>
            <p style="font-size: 18px; font-weight: bold;">
              ${window.SmartEngine.getWorkloadStatus(stats.pagePercent, stats.timePercent)}
            </p>
          </div>`;

        main.innerHTML = html;

    } catch (err) {
        console.error("Dashboard Render Failed:", err);
        document.getElementById("main-content").innerHTML = `<div style="color:red;">Error loading dashboard. Please check console.</div>`;
    }
};
