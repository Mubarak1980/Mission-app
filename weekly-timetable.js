"use strict";

window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // 1. Data Matrix (Locked to your exact specifications)
    const planData = [
        { grade: 9, total: 876, days: 18, math: 20, phys: 10, chem: 10, bio: 9, target: 49 },
        { grade: 10, total: 1116, days: 22, math: 18, phys: 10, chem: 12, bio: 12, target: 52 },
        { grade: 11, total: 1422, days: 27, math: 18, phys: 10, chem: 12, bio: 13, target: 53 },
        { grade: 12, total: 1234, days: 23, math: 18, phys: 10, chem: 12, bio: 14, target: 54 }
    ];

    let rowsHtml = planData.map(row => `
        <tr>
            <td style="font-weight: 700; color: #00d4ff;">${row.grade}</td>
            <td>${row.total.toLocaleString()}</td>
            <td>${row.days}</td>
            <td>${row.math}</td><td>${row.phys}</td><td>${row.chem}</td><td>${row.bio}</td>
            <td style="color: #00d4ff;">${row.target}</td>
        </tr>
    `).join("");

    // 2. Metrics
    const stats = window.SmartEngine.getOverallStats();

    // 3. Final Render (Title restricted to Daily Distribution)
    container.innerHTML = `
        <div style="background: #121821; padding: 15px; border-radius: 10px;">
            <h2 style="margin-top: 0; color: white;">📅 Daily Distribution</h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: center; color: white; margin-bottom: 20px;">
                    <thead>
                        <tr style="border-bottom: 1px solid #30363d; color: #8b949e;">
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

            <div style="border-top: 1px solid #30363d; padding-top: 15px;">
                <h3 style="margin-top: 0; color: #00d4ff;">🧠 Smart Engine Metrics</h3>
                <p style="margin: 5px 0;">Yearly Mastery: <strong>${stats.pagePercent}%</strong></p>
                <progress value="${stats.pagePercent}" max="100" style="width: 100%; height: 8px; margin-bottom: 10px;"></progress>
                <p style="margin: 5px 0;">Workload Status: <strong>${window.SmartEngine.getWorkloadStatus(stats.pagePercent, stats.timePercent)}</strong></p>
            </div>
        </div>
    `;
};
