"use strict";

// =====================================================
// 📊 DASHBOARD (ENGINE-COMPATIBLE VERSION)
// =====================================================

function loadDashboard() {
  try {

    const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'English'];
    const grades = [9, 10, 11, 12];

    const main = document.getElementById('main-content');
    if (!main) return;

    // ===============================
    // SAFE STORAGE (NO DEPENDENCY)
    // ===============================
    const loadProgress = (grade) => {
      try {
        return JSON.parse(
          localStorage.getItem(`grade_${grade}_progress`) || "{}"
        );
      } catch {
        return {};
      }
    };

    // ===============================
    // UI RENDER
    // ===============================
    let html = `
      <h2>📊 Dashboard: Overall Subject Progress</h2>
      <div class="dashboard-container">
    `;

    subjects.forEach(subject => {

      let totalPercent = 0;
      let validGrades = 0;

      grades.forEach(grade => {

        const saved = loadProgress(grade);
        const max = window.maxPagesByGrade?.[grade]?.[subject] || 0;
        const done = Number(saved?.[subject]) || 0;

        if (max > 0) {
          totalPercent += (done / max) * 100;
          validGrades++;
        }
      });

      const avg = validGrades
        ? Math.round(totalPercent / validGrades)
        : 0;

      html += `
        <div class="dashboard-subject">
          <h3>${subject}</h3>
          <progress value="${avg}" max="100"></progress>
          <p>${avg}% progress in ${subject}</p>
        </div>
      `;
    });

    html += `</div>`;

    // ===============================
    // CYCLE INFO (SAFE HOOK)
    // ===============================
    if (typeof window.getSystemSnapshot === "function") {
      const system = window.getSystemSnapshot();

      html += `
        <div class="delay-section">
          <h2>⏱️ Cycle Info</h2>
          <p>📅 Day: ${system?.time?.cycleDay ?? 0}/90</p>
          <p>📉 Gap: ${system?.progress?.gap ?? 0}</p>
        </div>
      `;
    }

    // ===============================
    // SMART ENGINE (SAFE HOOK)
    // ===============================
    if (typeof window.getSmartCycle === "function") {

      const smart = window.getSmartCycle();

      const actual = Number(smart?.actual) || 0;
      const expected = Number(smart?.expected) || 0;

      const rate = expected > 0
        ? ((actual / expected) * 100).toFixed(1)
        : 0;

      html += `
        <div class="smart-cycle-section">
          <h2>🧠 Smart Study Engine</h2>

          <p>📊 Expected: ${expected}</p>
          <p>📚 Actual: ${actual}</p>
          <p>⚖️ Gap: ${smart?.gap ?? 0}</p>
          <p>📈 Progress Rate: ${rate}%</p>

          <hr/>

          <p>🚀 Catch-up: ${smart?.catchUpPerDay ?? 0}/day</p>
          <p>🛡️ Safe Limit: ${smart?.dailyTarget ?? smart?.dailyLimit?.target ?? 0}</p>

          <p>
            ⚠️ Risk:
            <b>${smart?.intensity === "HIGH" ? "HIGH" : "SAFE"}</b>
          </p>
        </div>
      `;
    }

    main.innerHTML = html;

    // clear old bar safely
    const bar = document.getElementById('grade-progress-bar');
    if (bar) bar.innerHTML = '';

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

window.loadDashboard = loadDashboard;
