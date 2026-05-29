"use strict";

window.loadWeeklyTimetable = (grade) => {
  const container = document.getElementById("main-content");
  if (!container) return;
  container.innerHTML = ""; // Clear existing UI

  // 1. Get unified state from the bridge
  const masterData = window.DataService.get();
  // Ensure studyState exists within the unified master object
  const state = masterData.studyState || { 
      startDate: new Date().toISOString().split("T")[0], 
      missedDays: 0, 
      lastVisit: new Date().toISOString().split("T")[0] 
  };

  // 2. Logic to calculate missed days
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const diffTime = Math.abs(today - new Date(state.lastVisit));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 1) {
      state.missedDays = (state.missedDays || 0) + (diffDays - 1);
  }
  state.lastVisit = todayStr;

  // 3. Save back to the Unified Bridge
  masterData.studyState = state;
  window.DataService.set(masterData);

  // 4. Render UI
  const DAILY_TARGET = 64 + ((state.missedDays || 0) * 8);
  
  container.innerHTML = `
    <h2>📅 Adaptive Daily Distribution (Grade ${grade})</h2>
    <div class="weekly-table-wrapper">
        <p>Current Daily Target: <strong>${DAILY_TARGET} pages</strong></p>
        <p>Missed Days: ${state.missedDays}</p>
        </div>
  `;
};
