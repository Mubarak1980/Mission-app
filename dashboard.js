"use strict";

// =====================================================
// 📊 DASHBOARD (FULLY UNIFIED WITH DATA BRIDGE)
// =====================================================

window.loadDashboard = (grade) => {
  try {
    const main = document.getElementById("main-content");
    if (!main) return;

    // 🛡️ Ensure clean slate
    main.innerHTML = "";

    if (typeof window.maxPagesByGrade === 'undefined') {
        throw new Error("Grade configuration not loaded.");
    }

    // 1. Fetch Unified Master Data
    const masterData = window.DataService.get();
    const studyProgress = masterData.studyProgress || {}; // Access the nested object
    
    const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];
    const grades = [9, 10, 11, 12];

    let html = `<h2>📊 Master Dashboard</h2><div class="dashboard-container">`;

    // 2. Render Subject Progress
    subjects.forEach(subject => {
      let totalDone = 0, totalMax = 0;
      
      grades.forEach(gradeKey => {
        // Retrieve progress for this specific grade from the unified object
        const saved = studyProgress[gradeKey] || {};
        const max = Number(window.maxPagesByGrade?.[gradeKey]?.[subject]) || 0;
        
        const done = Math.min(Number(saved[subject]) || 0, max);
        totalDone += done;
        totalMax += max;
      });

      const avg = totalMax ? Math.round((totalDone / totalMax) * 100) : 0;
      
      html += `
        <div class="dashboard-subject" style="margin-bottom: 15px;">
          <h3 style="margin-bottom: 5px;">${subject}</h3>
          <progress max="${totalMax}" value="${totalDone}" style="width:100%; height:12px;"></progress>
          <p style="font-size: 13px; color: #8b949e; margin-top: 5px;">${avg}% (${totalDone}/${totalMax} pages)</p>
        </div>`;
    });

    // 3. Metrics Render
    // If getSmartCycle is not yet defined, provide a neutral fallback
    const metrics = (typeof window.getSmartCycle === "function") 
        ? window.getSmartCycle() 
        : { actualPages: 0, TOTAL_PAGES: 5705 };
    
    html += `</div>
      <div class="metrics-summary" style="margin-top: 20px; padding: 15px; background: #121821; border-radius: 10px;">
        <h3>📈 Overall Master Completion</h3>
        <p>Total: ${metrics.actualPages.toLocaleString()} / ${metrics.TOTAL_PAGES.toLocaleString()} pages</p>
      </div>`;

    main.innerHTML = html;

  } catch (err) {
    console.error("Dashboard Render Failed:", err);
    const main = document.getElementById("main-content");
    if (main) {
        main.innerHTML = `<div style="color:red; padding: 20px;">Error loading dashboard: ${err.message}</div>`;
    }
  }
};
