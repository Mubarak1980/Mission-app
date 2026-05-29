"use strict";

window.loadWeeklyTimetable = (grade) => {
  const container = document.getElementById("main-content");
  if (!container) return;

  // 🛡️ Ensure clean slate
  container.innerHTML = ""; 

  // 1. Unified State Access (Bridge-Aware)
  const masterData = window.DataService.get();
  const state = masterData.studyState || { 
      startDate: new Date().toISOString().split("T")[0], 
      missedDays: 0, 
      lastVisit: new Date().toISOString().split("T")[0] 
  };

  // 2. Calculation Logic
  const todayStr = new Date().toISOString().split("T")[0];
  const diffTime = Math.abs(new Date() - new Date(state.lastVisit));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 1) {
      state.missedDays = (state.missedDays || 0) + (diffDays - 1);
  }
  state.lastVisit = todayStr;

  // 3. Save state back to Unified Bridge
  masterData.studyState = state;
  window.DataService.set(masterData);

  const DAILY_TARGET = 64 + ((state.missedDays || 0) * 8);
  const pages = window.maxPagesByGrade?.[grade] || { Math: 0, Physics: 0, Chemistry: 0, Biology: 0, English: 0 };
  const total = Object.values(pages).reduce((a, b) => a + b, 0);

  // 4. Generate UI (with dynamic grade context)
  const mathP = Math.round((pages.Math / total) * DAILY_TARGET) || 0;
  const physicsP = Math.round((pages.Physics / total) * DAILY_TARGET) || 0;
  const chemistryP = Math.round((pages.Chemistry / total) * DAILY_TARGET) || 0;
  const biologyP = Math.round((pages.Biology / total) * DAILY_TARGET) || 0;
  const englishP = Math.max(0, DAILY_TARGET - (mathP + physicsP + chemistryP + biologyP));

  container.innerHTML = `
    <h2>📅 Adaptive Distribution (Grade ${grade})</h2>
    <div class="weekly-table-wrapper" style="overflow-x: auto;">
      <p>Target: <strong>${DAILY_TARGET} pages/day</strong> | Missed: <strong>${state.missedDays}</strong></p>
      <table class="weekly-table" style="width: 100%; min-width: 400px; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Subject</th><th>Pages</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Math</td><td>${mathP}</td></tr>
          <tr><td>Physics</td><td>${physicsP}</td></tr>
          <tr><td>Chemistry</td><td>${chemistryP}</td></tr>
          <tr><td>Biology</td><td>${biologyP}</td></tr>
          <tr><td>English</td><td>${englishP}</td></tr>
        </tbody>
      </table>
    </div>
  `;
};
