"use strict";

// =====================================================
// 📊 DASHBOARD (FULLY SYNCED WITH MAIN.JS)
// =====================================================

function loadDashboard() {

  try {

    const main = document.getElementById("main-content");
    if (!main) return;

    if (!window.maxPagesByGrade) {
      main.innerHTML = `<p style="color:red;">Error: grade data not loaded</p>`;
      return;
    }

    const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];
    const grades = [9, 10, 11, 12];

    // ===============================
    // SAFE LOCAL PROGRESS (MATCH MAIN.JS FORMAT)
    // ===============================
    const loadProgress = (grade) => {
      try {
        return JSON.parse(localStorage.getItem(`grade_${grade}_progress`) || "{}");
      } catch {
        return {};
      }
    };

    // ===============================
    // BUILD SUBJECT PROGRESS
    // ===============================
    let html = `
      <h2>📊 Dashboard: Overall Subject Progress</h2>
      <div class="dashboard-container">
    `;

    subjects.forEach(subject => {

      let totalPercent = 0;
      let count = 0;

      grades.forEach(grade => {

        const saved = loadProgress(grade);
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
    // CYCLE INFO (FROM MAIN.JS ONLY)
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
// SMART CYCLE (ROBUST VERSION)
// ===============================
if (typeof window.getSmartCycle === "function") {

  const smart = window.getSmartCycle();

  // HARD SAFETY NORMALIZATION (IMPORTANT)
  const safe = {
    expectedPages: Number(smart?.expectedPages ?? 0),
    actualPages: Number(smart?.actualPages ?? 0),
    gap: Number(smart?.gap ?? 0),
    remainingDays: Number(smart?.remainingDays ?? 0),
    catchUpPerDay: Number(smart?.catchUpPerDay ?? 0),
    dailyTarget: Number(smart?.dailyTarget ?? 0),
    intensity: smart?.intensity ?? "SAFE",
    pressure: smart?.pressure ?? "ON_TRACK",
    baseTarget: Number(smart?.baseTarget ?? 0)
  };

  html += `
    <div class="smart-cycle-section">
      <h2>🧠 Smart Study Engine</h2>

      <p>📊 Expected Pages: ${safe.expectedPages}</p>
      <p>📚 Actual Pages: ${safe.actualPages}</p>
      <p>⚖️ Gap: ${safe.gap}</p>

      <hr/>

      <p>📉 Remaining Days: ${safe.remainingDays}</p>
      <p>🚀 Catch-up Per Day: ${safe.catchUpPerDay}</p>
      <p>📈 Daily Target: ${safe.dailyTarget} pages</p>

      <p>⚡ Intensity: <b>${safe.intensity}</b></p>
      <p>🔥 Status: <b>${safe.pressure}</b></p>

      <p>📌 Base Target: ${safe.baseTarget}</p>
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
