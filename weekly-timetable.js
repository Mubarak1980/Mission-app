"use strict";

// =====================================================================
// 📅 WEEKLY TIMETABLE (BRIDGE-INTEGRATED & GRADE-AWARE)
// =====================================================================

window.loadWeeklyTimetable = (grade) => {
  const container = document.getElementById("main-content");
  if (!container) return;

  // 🛡️ Ensure clean slate to prevent layout mixing
  container.innerHTML = ""; 

  // 1. Unified State Access (Bridge-Aware)
  // We access the master data object to get the shared studyState
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

  // 4. Data Extraction
  const DAILY_TARGET = 64 + ((state.missedDays || 0) * 8);
  // Fallback to empty object if grade is invalid to prevent crash
  const pages = window.maxPagesByGrade?.[grade] || { Math: 0, Physics: 0, Chemistry: 0, Biology: 0, English: 0 };
  const total = Object.values(pages).reduce((a, b) => a + b, 0);

  // 5. Pacing Allocations
  const mathP = total > 0 ? Math.round((pages.Math / total) * DAILY_TARGET) : 0;
  const physicsP = total > 0 ? Math.round((pages.Physics / total) * DAILY_TARGET) : 0;
  const chemistryP = total > 0 ? Math.round((pages.Chemistry / total) * DAILY_TARGET) : 0;
  const biologyP = total > 0 ? Math.round((pages.Biology / total) * DAILY_TARGET) : 0;
  const englishP = Math.max(0, DAILY_TARGET - (mathP + physicsP + chemistryP + biologyP));

  // 6. Generate UI
  container.innerHTML = `
    <h2>📅 Adaptive Distribution (Grade ${grade || 'N/A'})</h2>
    <div class="weekly-table-wrapper" style="overflow-x: auto;">
      <p>Target: <strong>${DAILY_TARGET} pages/day</strong> | Missed: <strong>${state.missedDays}</strong></p>
      <table class="weekly-table" style="width: 100%; min-width: 400px; border-collapse: collapse;">
        <thead>
          <tr style="background: #1f242c; text-align: left;">
            <th style="padding: 10px;">Subject</th>
            <th style="padding: 10px;">Pages</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px;">Math</td><td style="padding: 8px;">${mathP}</td></tr>
          <tr><td style="padding: 8px;">Physics</td><td style="padding: 8px;">${physicsP}</td></tr>
          <tr><td style="padding: 8px;">Chemistry</td><td style="padding: 8px;">${chemistryP}</td></tr>
          <tr><td style="padding: 8px;">Biology</td><td style="padding: 8px;">${biologyP}</td></tr>
          <tr><td style="padding: 8px;">English</td><td style="padding: 8px;">${englishP}</td></tr>
        </tbody>
      </table>
    </div>
  `;
};
        
