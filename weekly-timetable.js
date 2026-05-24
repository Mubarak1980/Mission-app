"use strict";

// =====================================================
// 📅 WEEKLY TIMETABLE (TIMEZONE-SAFE PRODUCTION METRICS)
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

  // ==========================================
  // SAFE BACKGROUND STATE CALCULATION ENGINE
  // ==========================================
  const today = new Date();
  
  // Fixed: Pulls local calendar dates directly to stay aligned with EAT timezone rules
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

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
    <div class="weekly-table-wrapper" style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; margin-top: 15px;">
      <table class="weekly-table" style="width: 100%; border-collapse: collapse; text-align: left; min-width: 600px;">
        <thead>
          <tr style="background-color: #00a8ff; color: #fff;">
            <th style="padding: 12px 10px;">Grade</th>
            <th style="padding: 12px 10px;">Days</th>
            <th style="padding: 12px 10px;">Math</th>
            <th style="padding: 12px 10px;">Physics</th>
            <th style="padding: 12px 10px;">Chemistry</th>
            <th style="padding: 12px 10px;">Biology</th>
            <th style="padding: 12px 10px;">English</th>
            <th style="padding: 12px 10px; background-color: #00d4ff; color: #000;">Total/Day</th>
            <th style="padding: 12px 10px;">Total Pages</th>
          </tr>
        </thead>
        <tbody>
  `;

  // ==========================================
  // TABLE DATA LOOPING
  // ==========================================
  [9, 10, 11, 12].forEach(g => {

    const d = pages[g];

    if (!d) {
      html += `
        <tr style="border-bottom: 1px solid #222;">
          <td style="padding: 10px;"><b>Grade ${g}</b></td>
          <td colspan="8" style="color:#ff4d4d; padding: 10px; font-style: italic;">No data available</td>
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
          <td style="padding: 10px;"><b>Grade ${g}</b></td>
          <td style="padding: 10px;">${days}</td>
          <td colspan="7" style="padding: 10px; color: #777;">No subject data available</td>
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
        <td style="padding: 12px 10px; font-weight: bold; color: #00d4ff;">Grade ${g}</td>
        <td style="padding: 12px 10px; color: #fff;">${days} days</td>
        <td style="padding: 12px 10px; color: #ccc;">${mathP} p.</td>
        <td style="padding: 12px 10px; color: #ccc;">${physicsP} p.</td>
        <td style="padding: 12px 10px; color: #ccc;">${chemistryP} p.</td>
        <td style="padding: 12px 10px; color: #ccc;">${biologyP} p.</td>
        <td style="padding: 12px 10px; color: #ccc;">${englishP} p.</td>
        <td style="padding: 12px 10px; font-weight: bold; color: #00d4ff; background-color: rgba(0, 212, 255, 0.05);">${DAILY_TARGET}</td>
        <td style="padding: 12px 10px; font-weight: bold; color: #888;">${total}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;

  const bar = document.getElementById("grade-progress-bar");
  if (bar) bar.innerHTML = "";
}

// ==========================================
// EXPORT
// ==========================================
window.loadWeeklyTimetable = loadWeeklyTimetable;
                          
