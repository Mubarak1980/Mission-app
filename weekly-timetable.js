"use strict";

function loadWeeklyTimetable() {
  const container = document.getElementById("main-content");
  if (!container) return;

  const bar = document.getElementById("grade-progress-bar");
  if (bar) bar.innerHTML = "";

  // Data matching your requirements
  const planData = [
    { grade: 9, totalPages: 1039, days: 18, math: 20, phys: 10, chem: 10, bio: 9, eng: 9, target: 58 },
    { grade: 10, totalPages: 1299, days: 22, math: 17, phys: 11, chem: 14, bio: 8, eng: 9, target: 59 },
    { grade: 11, totalPages: 1566, days: 27, math: 18, phys: 12, chem: 12, bio: 10, eng: 6, target: 58 },
    { grade: 12, totalPages: 1382, days: 23, math: 18, phys: 8, chem: 12, bio: 15, eng: 7, target: 60 }
  ];

  let rowsHtml = "";
  planData.forEach(row => {
    rowsHtml += `
      <tr>
        <td style="font-weight: 700; color: var(--primary);">Grade ${row.grade}</td>
        <td>${row.totalPages}</td>
        <td>${row.days}</td>
        <td>${row.math}</td>
        <td>${row.phys}</td>
        <td>${row.chem}</td>
        <td>${row.bio}</td>
        <td>${row.eng}</td>
        <td style="text-align: center; color: #00d4ff;">${row.target}</td>
      </tr>
    `;
  });

  const innerWrapper = document.createElement("div");
  innerWrapper.className = "timetable-view-container";
  innerWrapper.innerHTML = `
    <h2>📅 Adaptive Daily Distribution</h2>
    <div class="weekly-table-wrapper" style="overflow-x: auto;">
      <table class="weekly-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Grade</th><th>Total P.</th><th>Days</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Eng</th><th>Target</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="border-top: 2px solid #00d4ff; font-weight: bold;">
            <td>Total</td><td>5,286</td><td>90</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>≈59</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  container.replaceChildren(innerWrapper);
}

window.loadWeeklyTimetable = loadWeeklyTimetable;
