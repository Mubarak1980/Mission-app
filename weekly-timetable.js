"use strict";

function loadWeeklyTimetable() {
  const container = document.getElementById("main-content");
  if (!container) return;

  const bar = document.getElementById("grade-progress-bar");
  if (bar) bar.innerHTML = "";

  // Verified data matrix
  const planData = [
    { grade: 9, total: 876, days: 18, math: 20, phys: 10, chem: 10, bio: 9, target: 49 },
    { grade: 10, total: 1116, days: 22, math: 18, phys: 10, chem: 12, bio: 12, target: 52 },
    { grade: 11, total: 1422, days: 27, math: 18, phys: 10, chem: 12, bio: 13, target: 53 },
    { grade: 12, total: 1234, days: 23, math: 18, phys: 10, chem: 12, bio: 14, target: 54 }
  ];

  let rowsHtml = "";
  planData.forEach(row => {
    rowsHtml += `
      <tr>
        <td style="font-weight: 700; color: #00d4ff;">${row.grade}</td>
        <td>${row.total.toLocaleString()}</td>
        <td>${row.days}</td>
        <td>${row.math}</td>
        <td>${row.phys}</td>
        <td>${row.chem}</td>
        <td>${row.bio}</td>
        <td style="color: #00d4ff;">${row.target}</td>
      </tr>
    `;
  });

  const innerWrapper = document.createElement("div");
  innerWrapper.className = "timetable-view-container";
  innerWrapper.innerHTML = `
    <h2>📅 Adaptive Daily Distribution</h2>
    <div class="weekly-table-wrapper" style="overflow-x: auto;">
      <table class="weekly-table" style="width: 100%; border-collapse: collapse; text-align: center; color: white;">
        <thead>
          <tr style="border-bottom: 1px solid #30363d;">
            <th>Grade</th><th>Pages</th><th>Days</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Target</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="border-top: 2px solid #30363d; font-weight: bold;">
            <td>Total</td><td>4,648</td><td>90</td><td>—</td><td>—</td><td>—</td><td>—</td><td>≈52/day</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  container.replaceChildren(innerWrapper);
}

window.loadWeeklyTimetable = loadWeeklyTimetable;
