"use strict";

// =====================================================================
// 📅 WEEKLY TIMETABLE (TIMEZONE-SAFE PRODUCTION MATRIX - UNIFIED)
// =====================================================================

function loadWeeklyTimetable() {
  const container = document.getElementById("main-content");
  if (!container) {
    console.error('[System] Main content container missing.');
    return;
  }

  // Clear top progress tracking bar layout safely
  const bar = document.getElementById("grade-progress-bar");
  if (bar) bar.innerHTML = "";

  // Dynamic maximum data extraction - Updated with your custom values
  const pages = {
    9:  { Math: 20, Physics: 10, Chemistry: 10, Biology: 9, English: 9 },
    10: { Math: 17, Physics: 11, Chemistry: 14, Biology: 8, English: 9 },
    11: { Math: 18, Physics: 12, Chemistry: 12, Biology: 10, English: 6 },
    12: { Math: 18, Physics: 8, Chemistry: 12, Biology: 15, English: 7 }
  };

  const gradeDays = { 9: 18, 10: 22, 11: 27, 12: 23 };
  const dailyTargets = { 9: 58, 10: 59, 11: 58, 12: 60 };

  // ==========================================
  // UNIFIED BRIDGE-AWARE STATE CALCULATION
  // ==========================================
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Access Unified Bridge
  const masterData = window.DataService.get();
  const state = masterData.studyState || { startDate: todayStr, missedDays: 0, lastVisit: todayStr };

  const daysBetween = (a, b) => {
    const diff = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const missed = daysBetween(state.lastVisit || todayStr, todayStr);
  if (missed > 1) {
    state.missedDays = (state.missedDays || 0) + (missed - 1);
  }

  state.lastVisit = todayStr;
  
  // Save back to Unified Bridge
  masterData.studyState = state;
  window.DataService.set(masterData);

  // ===================================================
  // PRODUCTION UI COMPONENT RENDERING
  // ===================================================
  let rowsHtml = "";

  [9, 10, 11, 12].forEach(g => {
    const d = pages[g];
    const days = gradeDays[g] || 0;
    const dailyTarget = dailyTargets[g] || 0;
    
    const math = Number(d.Math) || 0;
    const physics = Number(d.Physics) || 0;
    const chemistry = Number(d.Chemistry) || 0;
    const biology = Number(d.Biology) || 0;
    const english = Number(d.English) || 0;
    const total = math + physics + chemistry + biology + english;

    rowsHtml += `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">Grade ${g}</td>
        <td style="color: #ffffff;">${days}</td>
        <td>${math}</td>
        <td>${physics}</td>
        <td>${chemistry}</td>
        <td>${biology}</td>
        <td>${english}</td>
        <td style="font-weight: 700; color: var(--primary); background: var(--primary-soft); text-align: center;">${dailyTarget}</td>
        <td style="color: var(--muted); font-weight: 600;">${total}</td>
      </tr>
    `;
  });

  const innerWrapper = document.createElement("div");
  innerWrapper.className = "timetable-view-container";
  innerWrapper.innerHTML = `
    <h2>📅 Adaptive Daily Distribution</h2>
    <div class="weekly-table-wrapper">
      <table class="weekly-table" style="min-width: 500px;">
        <thead>
          <tr>
            <th>Grade</th><th>Days</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Eng</th>
            <th style="text-align: center; background: #007acc;">Target</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  container.replaceChildren(innerWrapper);
}

window.loadWeeklyTimetable = loadWeeklyTimetable;
                          
