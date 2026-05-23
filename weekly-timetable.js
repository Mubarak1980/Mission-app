"use strict";

// =====================================================
// 📅 WEEKLY TIMETABLE (REPETITIVE HEADER STRIPPED)
// =====================================================

function loadWeeklyTimetable() {

  const pages = window.maxPagesByGrade || {};

  const gradeDays = {
    9: 17,
    10: 22,
    11: 27,
    12: 24
  };

  const container = document.getElementById("main-content");
  if (!container) return;

  // ===============================
  // SAFE STATE CALCULATION ENGINE
  // ===============================
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let state;

  try {
    state = JSON.parse(localStorage.getItem("studyState") || "{}");
  } catch {
    state = {};
  }

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

  try {
    localStorage.setItem("studyState", JSON.stringify(state));
  } catch {}

  const BASE_TARGET = 64;
  const DAILY_TARGET = BASE_TARGET + ((state.missedDays || 0) * 8);

  // ===================================================
  // UI START (REPETITIVE LABELS & HEADINGS TRUNCATED)
  // ===================================================
  let html = `
    <div class="weekly-table-wrapper" style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
      <table class="weekly-table" style="width: 100%; border-collapse: collapse; text-align: left; min-width: 600px;">
        <thead>
          <tr style="background-color: #00a8ff; color: #fff;">
            <th style="padding: 10px;">Grade</th>
            <th style="padding: 10px;">Days</th>
            <th style="padding: 10px;">Math</th>
            <th style="padding: 10px;">Physics</th>
            <th style="padding: 10px;">Chemistry</th>
            <th style="padding: 10px;">Biology</th>
            <th style="padding: 10px;">English</th>
            <th style="padding: 10px;">Total/Day</th>
            <th style="padding: 10px;">Total Pages</th>
          </tr>
        </thead>
        <tbody>
  `;

  // ===============================
  // TABLE LOGIC (UNTOUCHED)
  // ===============================
  [9, 10, 11, 12].forEach(g => {

    const d = pages[g];

    // Safe protection layout if state fails loading
    if (!d) {
      html += `
        <tr style="border-bottom: 1px solid #222;">
          <td style="padding: 10px;"><b>${g}</b></td>
          <td colspan="8" style="color:red; padding: 10px;">No data available</td>
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
      html += `
        <tr style="border-bottom: 1px solid #222;">
          <td style="padding: 10px;"><b>${g}</b></td>
          <td style="padding: 10px;">${days}</td>
          <td colspan="7" style="padding: 10px; color: #888;">No subject data</td>
        </tr>
      `;
      return;
    }

    const mathP = Math.round((math / total) * DAILY_TARGET);
    const physicsP = Math.round((physics / total) * DAILY_TARGET);
    const chemistryP = Math.round((chemistry / total) * DAILY_TARGET);
    const biologyP = Math.round((biology / total) * DAILY_TARGET);

    let englishP = DAILY_TARGET - (mathP + physicsP + chemistryP + biologyP);
    if (englishP < 0) englishP = 0;

    html += `
      <tr style="border-bottom: 1px solid #222;">
        <td style="padding: 10px; font-weight: bold; color: #00d4ff;">Grade ${g}</td>
        <td style="padding: 10px; color: #fff;">${days} days</td>
        <td style="padding: 10px;">${mathP} p.</td>
        <td style="padding: 10px;">${physicsP} p.</td>
        <td style="padding: 10px;">${chemistryP} p.</td>
        <td style="padding: 10px;">${biologyP} p.</td>
        <td style="padding: 10px;">${englishP} p.</td>
        <td style="padding: 10px; font-weight: bold; color: #00d4ff;">${DAILY_TARGET}</td>
        <td style="padding: 10px; font-weight: bold; color: #888;">${total}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;

  // Clean persistent tracking layout wrappers
  const bar = document.getElementById("grade-progress-bar");
  if (bar) bar.innerHTML = "";
}

// ===============================
// EXPORT
// ===============================
window.loadWeeklyTimetable = loadWeeklyTimetable;
