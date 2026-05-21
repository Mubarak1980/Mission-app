"use strict";

// =====================================================
// 📊 DASHBOARD (WEIGHTED PROGRESS FIXED)
// =====================================================

function loadDashboard() {
  try {
    const main = document.getElementById("main-content");
    if (!main) return;

    if (!window.maxPagesByGrade) {
      main.innerHTML = `<p style="color:red; text-align:center; padding:20px;">Error: grade data not loaded</p>`;
      return;
    }

    const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];
    const grades = [9, 10, 11, 12];

    // ===============================
    // SAFE LOCAL PROGRESS
    // ===============================
    const loadProgress = (grade) => {
      try {
        return JSON.parse(localStorage.getItem(`grade_${grade}_progress`) || "{}");
      } catch {
        return {};
      }
    };

    // ===============================
    // BUILD SUBJECT PROGRESS (TRUE CALCULATIONS)
    // ===============================
    let html = `
      <h2>📊 Dashboard: Overall Subject Progress</h2>
      <div class="dashboard-container">
    `;

    subjects.forEach(subject => {
      let totalAbsoluteDone = 0;
      let totalAbsoluteMax = 0;

      grades.forEach(grade => {
        const saved = loadProgress(grade);
        const maxPages = Number(window.maxPagesByGrade?.[grade]?.[subject]) || 0;
        const done = Math.min(Number(saved?.[subject]) || 0, maxPages);

        totalAbsoluteDone += done;
        totalAbsoluteMax += maxPages;
      });

      // Calculate mathematically accurate weighted percentage progress
      const accurateAvg = totalAbsoluteMax ? Math.round((totalAbsoluteDone / totalAbsoluteMax) * 100) : 0;

      html += `
        <div class="dashboard-subject">
          <h3>${subject}</h3>
          <progress value="${accurateAvg}" max="100"></progress>
          <p>${accurateAvg}% progress <span style="font-size:0.85em; color:#888;">(${totalAbsoluteDone}/${totalAbsoluteMax} pages)</span></p>
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

          <hr style="border:0; border-top:1px solid #222; margin:12px 0;"/>

          <p>📉 Remaining Days: ${safe.remainingDays}</p>
          <p>🚀 Catch-up Per Day: ${safe.catchUpPerDay}</p>
          <p>📈 Daily Target: <b style="color:#00d4ff;">${safe.dailyTarget}</b> pages</p>

          <p>⚡ Intensity: <b style="color: ${safe.intensity === 'CRITICAL' ? '#ff4d4d' : '#00d4ff'}">${safe.intensity}</b></p>
          <p>🔥 Status: <b>${safe.pressure}</b></p>

          <p>📌 Base Target: ${safe.baseTarget}</p>
        </div>
      `;
    }

    // ===============================
    // RENDER
    // ===============================
    main.innerHTML = html;

    // Clean up top sub-grade wrapper values upon dashboard focus
    const bar = document.getElementById("grade-progress-bar");
    if (bar) bar.innerHTML = "";

  } catch (err) {
    console.error("Dashboard crash:", err);
  }
}

window.loadDashboard = loadDashboard;
        
