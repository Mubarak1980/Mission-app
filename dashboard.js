"use strict";

// =====================================================
// 📊 DASHBOARD (FIXED + CONSISTENT)
// =====================================================

function loadDashboard() {

  try {

    window.currentSection = "dashboard";

    const main = document.getElementById("main-content");
    if (!main) return;

    if (!window.maxPagesByGrade) {
      main.innerHTML = `<p style="color:red;">Error: grade data not loaded</p>`;
      return;
    }

    const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];
    const grades = [9, 10, 11, 12];

    // ===============================
    // SAFE LOCAL PROGRESS
    // ===============================
    const loadProgressSafe = (grade) => {
      try {
        return JSON.parse(localStorage.getItem(`grade_${grade}_progress`) || "{}");
      } catch {
        return {};
      }
    };

    // ===============================
    // BUILD SUBJECT CARDS
    // ===============================
    let html = `
      <h2>📊 Dashboard: Overall Subject Progress</h2>
      <div class="dashboard-container">
    `;

    subjects.forEach(subject => {

      let totalPercent = 0;
      let count = 0;

      grades.forEach(grade => {

        const saved = loadProgressSafe(grade);
        const maxPages = window.maxPagesByGrade?.[grade]?.[subject] || 0;
        const done = Number(saved?.[subject]) || 0;

        if (maxPages > 0) {
          totalPercent += (done / maxPages) * 100;
          count++;
        }
      });

      const avg = count ? Math.round(totalPercent / count) : 0;

      html += `
        <div class="dashboard-subject">
          <h3>${subject}</h3>
          <progress value="${avg}" max="100"></progress>
          <p>${avg}% progress</p>
        </div>
      `;
    });

    html += `</div>`;

    // ===============================
    // CYCLE INFO (FIXED)
    // ===============================
    if (typeof getCycleState === "function") {

      const cycle = getCycleState();

      html += `
        <div class="delay-section">
          <h2>⏱️ Cycle Info</h2>
          <p>📅 Day: ${cycle.cycleDay}/90</p>
          <p>📉 Remaining: ${cycle.remainingDays}</p>
        </div>
      `;
    }

    // ===============================
    // SMART ENGINE (FIXED TO MATCH MAIN.JS)
    // ===============================
    if (typeof getSmartCycle === "function") {

      const smart = getSmartCycle();

      html += `
        <div class="smart-cycle-section">
          <h2>🧠 Smart Study Engine</h2>

          <p>📊 Expected Pages: ${smart.expectedPages}</p>
          <p>📚 Actual Pages: ${smart.actualPages}</p>
          <p>⚖️ Gap: ${smart.gap}</p>

          <hr/>

          <p>🚀 Catch-up/day: ${smart.catchUpPerDay}</p>
          <p>📈 Daily Target: ${smart.dailyTarget}</p>
          <p>🔥 Intensity: <b>${smart.intensity}</b></p>
        </div>
      `;
    }

    // ===============================
    // RENDER
    // ===============================
    main.innerHTML = html;

    const bar = document.getElementById("grade-progress-bar");
    if (bar) bar.innerHTML = "";

  } catch (err) {
    console.error("Dashboard crash:", err);
  }
}

window.loadDashboard = loadDashboard;
