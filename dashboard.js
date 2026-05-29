"use strict";

function loadDashboard() {
  try {
    const main = document.getElementById("main-content");
    if (!main) return;

    if (typeof window.maxPagesByGrade === 'undefined') {
        throw new Error("Grade configuration not loaded.");
    }

    const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];
    const grades = [9, 10, 11, 12];

    let html = `<h2>📊 Dashboard</h2><div class="dashboard-container">`;

    // 3. Render Subject Progress
    subjects.forEach(subject => {
      let totalDone = 0, totalMax = 0;
      grades.forEach(grade => {
        // FIXED: Using DataService instead of localStorage
        const saved = window.DataService.get(`grade_${grade}_progress`) || {};
        const max = Number(window.maxPagesByGrade?.[grade]?.[subject]) || 0;
        
        // Safety check to handle missing subject keys
        const done = Math.min(Number(saved[subject]) || 0, max);
        totalDone += done;
        totalMax += max;
      });

      const avg = totalMax ? Math.round((totalDone / totalMax) * 100) : 0;
      html += `
        <div class="dashboard-subject">
          <h3>${subject}</h3>
          <progress max="${totalMax}" value="${totalDone}" style="width:100%; height:12px;"></progress>
          <p>${avg}% (${totalDone}/${totalMax} pgs)</p>
        </div>`;
    });

    // 4. Metrics Render
    const metrics = (typeof window.getSmartCycle === "function") ? window.getSmartCycle() : { actualPages: 0, TOTAL_PAGES: 5705 };
    
    html += `</div>
      <div class="metrics-summary" style="margin-top: 20px; padding: 15px; background: #121821; border-radius: 10px;">
        <h3>📈 Master Completion</h3>
        <p>Total: ${metrics.actualPages.toLocaleString()} / ${metrics.TOTAL_PAGES.toLocaleString()} pages</p>
      </div>`;

    main.innerHTML = html;

  } catch (err) {
    console.error("Dashboard Render Failed:", err);
    document.getElementById("main-content").innerHTML = `<div style="color:red;">Error loading dashboard: ${err.message}</div>`;
  }
}

window.loadDashboard = loadDashboard;
      
