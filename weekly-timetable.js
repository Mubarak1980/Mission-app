// =====================================================================
// 📅 WEEKLY TIMETABLE (TIMEZONE-SAFE PRODUCTION MATRIX - COMPLETE)
// =====================================================================

"use strict";

function loadWeeklyTimetable() {
  const container = document.getElementById("main-content");
  if (!container) {
    console.error('[System] Main content container missing.');
    return;
  }

  // Clear top progress tracking bar layout safely
  const bar = document.getElementById("grade-progress-bar");
  if (bar) bar.innerHTML = "";

  // Dynamic maximum data extraction from global schema tracking tables
  const pages = window.maxPagesByGrade || {
    9:  { Math: 300, Physics: 200, Chemistry: 200, Biology: 200, English: 200 },
    10: { Math: 300, Physics: 200, Chemistry: 200, Biology: 200, English: 200 },
    11: { Math: 300, Physics: 200, Chemistry: 200, Biology: 200, English: 200 },
    12: { Math: 300, Physics: 200, Chemistry: 200, Biology: 200, English: 200 }
  };

  const gradeDays = { 9: 17, 10: 22, 11: 27, 12: 24 };

  // ==========================================
  // SAFE BACKGROUND STATE CALCULATION ENGINE
  // ==========================================
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const defaultState = { startDate: todayStr, missedDays: 0, lastVisit: todayStr };
  const state = window.Storage ? window.Storage.get("studyState", defaultState) : defaultState;

  if (!state.startDate) {
    state.startDate = todayStr;
    state.missedDays = 0;
  }

  const daysBetween = (a, b) => {
    const diff = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const missed = daysBetween(state.lastVisit || todayStr, todayStr);
  if (missed > 1) {
    state.missedDays = (state.missedDays || 0) + (missed - 1);
  }

  state.lastVisit = todayStr;
  if (window.Storage) {
    window.Storage.set("studyState", state);
  }

  const BASE_TARGET = 64;
  const DAILY_TARGET = BASE_TARGET + ((state.missedDays || 0) * 8);

  // ===================================================
  // PRODUCTION UI COMPONENT RENDERING
  // ===================================================
  let rowsHtml = "";

  [9, 10, 11, 12].forEach(g => {
    const d = pages[g];

    if (!d) {
      rowsHtml += `
        <tr>
          <td style="font-weight: 700; color: var(--primary);">Grade ${g}</td>
          <td colspan="8" style="color: #ff4d4d; font-style: italic;">No core track data available</td>
        </tr>
      `;
      return;
    }

    const days = gradeDays[g] || 0;
    const math = Number(d.Math) || 0;
    const physics = Number(d.Physics) || 0;
    const chemistry = Number(d.Chemistry) || 0;
    const biology = Number(d.Biology) || 0;
    const english = Number(d.English) || 0;

    const total = math + physics + chemistry + biology + english;

    if (total === 0) {
      rowsHtml += `
        <tr>
          <td style="font-weight: 700; color: var(--primary);">Grade ${g}</td>
          <td>${days} days</td>
          <td colspan="7" style="color: var(--muted); font-style: italic;">No allocation values registered</td>
        </tr>
      `;
      return;
    }

    // Dynamic mathematical proportional pacing allocations
    const mathP = Math.round((math / total) * DAILY_TARGET);
    const physicsP = Math.round((physics / total) * DAILY_TARGET);
    const chemistryP = Math.round((chemistry / total) * DAILY_TARGET);
    const biologyP = Math.round((biology / total) * DAILY_TARGET);

    let englishP = DAILY_TARGET - (mathP + physicsP + chemistryP + biologyP);
    if (englishP < 0) englishP = 0;

    rowsHtml += `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">Grade ${g}</td>
        <td style="color: #ffffff;">${days} days</td>
        <td>${mathP} p.</td>
        <td>${physicsP} p.</td>
        <td>${chemistryP} p.</td>
        <td>${biologyP} p.</td>
        <td>${englishP} p.</td>
        <td style="font-weight: 700; color: var(--primary); background: var(--primary-soft); text-align: center;">${DAILY_TARGET}</td>
        <td style="color: var(--muted); font-weight: 600;">${total}</td>
      </tr>
    `;
  });

  // Structural design wrapping matching enterprise styles.css definitions
  const innerWrapper = document.createElement("div");
  innerWrapper.className = "timetable-view-container";
  innerWrapper.innerHTML = `
    <h2>📅 Adaptive Daily Distribution Projections</h2>
    <p style="color: var(--muted); text-align: center; font-size: 14px; margin-bottom: 20px;">
      Velocity metrics are calculated relative to missed-day variables using local timezone parameters.
    </p>
    <div class="weekly-table-wrapper">
      <table class="weekly-table" style="min-width: 500px;">
        <thead>
          <tr>
            <th>Grade Tree</th>
            <th>Duration</th>
            <th>Math</th>
            <th>Physics</th>
            <th>Chemistry</th>
            <th>Biology</th>
            <th>English</th>
            <th style="text-align: center; background: #007acc;">Target/Day</th>
            <th>Total Pages</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  container.replaceChildren(innerWrapper);
}

// Global runtime execution routing binding
window.loadWeeklyTimetable = loadWeeklyTimetable;
