"use strict";

window.loadWeeklyTimetable = function() {
    console.log("Loading Weekly Timetable...");
    const container = document.getElementById("main-content");
    
    // 1. Safety Guard: Stop if container is missing
    if (!container) {
        console.error("Weekly Timetable: #main-content not found!");
        return;
    }

    // 2. Logic: Ensure Engine is initialized before accessing methods
    if (!window.SmartEngine || !window.DataService) {
        container.innerHTML = `<div style="color:orange;">Engine loading... please wait.</div>`;
        return;
    }

    const masterData = window.DataService.get();
    const stats = window.SmartEngine.getOverallStats();
    const dist = window.SmartEngine.getSubjectDistribution();
    const dynamicTarget = window.SmartEngine.calculateDynamicTarget();

    // 3. Define the Table Data
    const planData = [
        { grade: 9, total: 876, days: 18, math: dist.Math, phys: dist.Physics, chem: dist.Chemistry, bio: dist.Biology },
        { grade: 10, total: 1116, days: 22, math: dist.Math, phys: dist.Physics, chem: dist.Chemistry, bio: dist.Biology },
        { grade: 11, total: 1422, days: 27, math: dist.Math, phys: dist.Physics, chem: dist.Chemistry, bio: dist.Biology },
        { grade: 12, total: 1234, days: 23, math: dist.Math, phys: dist.Physics, chem: dist.Chemistry, bio: dist.Biology }
    ];

    let rowsHtml = planData.map(row => `
        <tr>
            <td style="font-weight: 700; color: #00d4ff;">${row.grade}</td>
            <td>${row.total.toLocaleString()}</td>
            <td>${row.days}</td>
            <td>${row.math}</td><td>${row.phys}</td><td>${row.chem}</td><td>${row.bio}</td>
            <td style="color: #00d4ff;">${dynamicTarget}</td>
        </tr>
    `).join("");

    // 4. Final Render: Build the full string to avoid partial rendering
    container.innerHTML = `
        <h2>📅 Adaptive Daily Distribution (Cycle ${masterData.cycleNumber || 1}/4)</h2>
        <div style="overflow-x: auto; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: center; color: white; background: #0d1117;">
                <thead>
                    <tr style="border-bottom: 1px solid #30363d; color: #8b949e;">
                        <th>Grade</th><th>Pages</th><th>Days</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Target</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>

        <div style="background: #121821; padding: 15px; border-radius: 10px; border-left: 4px solid #00d4ff;">
            <h3 style="margin-top: 0; color: #00d4ff;">🧠 Smart Engine Metrics</h3>
            <p>Daily Goal: <strong>${dynamicTarget} pages/day</strong></p>
            <p>Yearly Mastery: <strong>${stats.pagePercent}%</strong></p>
            <progress value="${stats.pagePercent}" max="100" style="width: 100%; height: 8px;"></progress>
            <p style="margin-top: 10px;">Status: <strong>${window.SmartEngine.getWorkloadStatus(stats.pagePercent, stats.timePercent)}</strong></p>
        </div>
    `;
    
    console.log("Weekly Timetable rendered successfully.");
};
         
