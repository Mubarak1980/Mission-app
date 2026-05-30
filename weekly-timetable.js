"use strict";

function loadWeeklyTimetable() {
  const container = document.getElementById("main-content");
  if (!container) return;

  const bar = document.getElementById("grade-progress-bar");
  if (bar) bar.innerHTML = "";

  // 1. Fetch State (Using Smart Engine if available, otherwise defaulting)
  const smart = (typeof window.getSmartCycle === "function") ? window.getSmartCycle() : {
    cycleNumber: JSON.parse(localStorage.getItem("study_progress") || "{}").cycleNumber || 1,
    dailyTarget: Math.round(4638 / 90),
    totalPagesPercentage: "0.0"
  };

  // 2. Verified Data Matrix
  const planData = [
    { grade: 9, total: 876, days: 18, math: 20, phys: 10, chem: 10, bio: 9 },
    { grade: 10, total: 1116, days: 22, math: 18, phys: 10, chem: 12, bio: 12 },
    { grade: 11, total: 1422, days: 27, math: 18, phys: 10, chem: 12, bio: 13 },
    { grade: 12, total: 1234, days: 23, math: 18, phys: 10, chem: 12, bio: 14 }
  ];

  let rowsHtml = planData.map(row => `
    <tr>
      <td style="font-weight: 700; color: #00d4ff;">${row.grade}</td>
      <td>${row.total.toLocaleString()}</td>
      <td>${row.days}</td>
      <td>${row.math}</td>
      <td>${row.phys}</td>
      <td>${row.chem}</td>
      <td>${row.bio}</td>
      <td style="color: #00d4ff;">${smart.dailyTarget}</td>
    </tr>
  `).join("");

  // 3. Render Table + Smart Engine Metrics Below
  const innerWrapper = document.createElement("div");
  innerWrapper.className = "timetable-view-container";
  innerWrapper.innerHTML = `
    <h2>📅 Adaptive Daily Distribution (Cycle ${smart.cycleNumber}/4)</h2>
    <div class="weekly-table-wrapper" style="overflow-x: auto; margin-bottom: 20px;">
      <table class="weekly-table" style="width: 100%; border-collapse: collapse; text-align: center; color: white;">
        <thead>
          <tr style="border-bottom: 1px solid #30363d;">
            <th>Grade</th><th>Pages</th><th>Days</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Target</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="border-top: 2px solid #30363d; font-weight: bold;">
            <td>Total</td><td>4,638</td><td>90</td><td>—</td><td>—</td><td>—</td><td>—</td><td>≈${smart.dailyTarget}/day</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background: #121821; padding: 15px; border-radius: 10px; border-left: 4px solid #00d4ff;">
      <h3 style="margin-top: 0; color: #00d4ff;">🧠 Smart Engine Metrics</h3>
      <p style="margin: 5px 0;">Current Objective: <strong>4,638 pages</strong> per 90-day cycle.</p>
      <p style="margin: 5px 0;">Daily Performance Goal: <strong>${smart.dailyTarget} pages/day</strong>.</p>
      <p style="margin: 5px 0;">Rotation Status: <strong>Cycle ${smart.cycleNumber} of 4</strong> active.</p>
      <p style="margin: 5px 0;">Yearly Mastery: <strong>${smart.totalPagesPercentage}%</strong> of annual goal reached.</p>
    </div>
  `;

  container.replaceChildren(innerWrapper);
}

window.loadWeeklyTimetable = loadWeeklyTimetable;
