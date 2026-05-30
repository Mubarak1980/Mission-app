window.loadDashboard = (grade) => {
  try {
    const main = document.getElementById("main-content");
    if (!main) return;

    main.innerHTML = "";

    const masterData = window.DataService.get();
    const studyProgress = masterData.studyProgress || {}; 
    
    const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];
    const grades = [9, 10, 11, 12];

    let totalGlobalDone = 0;
    let totalGlobalMax = 0;

    let html = `<h2>📊 Master Dashboard</h2><div class="dashboard-container">`;

    // 1. Render Subject Progress (Aggregated across all grades)
    subjects.forEach(subject => {
      let totalDone = 0, totalMax = 0;
      
      grades.forEach(gradeKey => {
        const saved = studyProgress[gradeKey] || {};
        const max = Number(window.maxPagesByGrade?.[gradeKey]?.[subject]) || 0;
        const done = Math.min(Number(saved[subject]) || 0, max);
        
        totalDone += done;
        totalMax += max;
      });

      // Track global totals for the master completion
      totalGlobalDone += totalDone;
      totalGlobalMax += totalMax;

      const avg = totalMax ? Math.round((totalDone / totalMax) * 100) : 0;
      
      html += `
        <div class="dashboard-subject" style="margin-bottom: 15px;">
          <h3 style="margin-bottom: 5px;">${subject}</h3>
          <progress max="${totalMax}" value="${totalDone}" style="width:100%; height:12px;"></progress>
          <p style="font-size: 13px; color: #8b949e; margin-top: 5px;">${avg}% (${totalDone}/${totalMax} pages)</p>
        </div>`;
    });

    // 2. Metrics Render (Correctly calculating from the variables above)
    html += `</div>
      <div class="metrics-summary" style="margin-top: 20px; padding: 15px; background: #121821; border-radius: 10px;">
        <h3>📈 Overall Master Completion</h3>
        <p>Total: ${totalGlobalDone.toLocaleString()} / ${totalGlobalMax.toLocaleString()} pages</p>
      </div>`;

    main.innerHTML = html;

  } catch (err) {
    console.error("Dashboard Render Failed:", err);
    document.getElementById("main-content").innerHTML = `<div style="color:red;">Error loading dashboard.</div>`;
  }
};
