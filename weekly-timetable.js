"use strict";

window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // 1. Fetch Dynamic Data from Smart Engine
    const time = window.SmartEngine.getCycleTimeRemaining();
    const workload = window.SmartEngine.getSuggestedDailyWorkload();
    const stats = window.SmartEngine.getOverallStats();

    // 2. Render the Table and Guidance
    container.innerHTML = `
        <div style="background: #121821; padding: 15px; border-radius: 10px; color: white;">
            <h2 style="margin-top: 0; color: #00d4ff;">📅 Daily Distribution</h2>
            
            <div style="margin-bottom: 20px; padding: 10px; background: #1c222d; border-radius: 8px;">
                <p style="margin: 0;">Days remaining in cycle: <strong>${time.remaining}</strong></p>
                <progress value="${time.percent}" max="100" style="width: 100%; height: 8px; margin-top: 5px;"></progress>
            </div>

            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: center; color: white; margin-bottom: 20px;">
                    <thead>
                        <tr style="border-bottom: 1px solid #30363d; color: #8b949e;">
                            <th style="padding: 8px;">Math</th>
                            <th style="padding: 8px;">Phys</th>
                            <th style="padding: 8px;">Chem</th>
                            <th style="padding: 8px;">Bio</th>
                            <th style="padding: 8px;">Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-top: 2px solid #30363d; background: #1c222d;">
                            <td style="padding: 12px;">${workload.Math}</td>
                            <td style="padding: 12px;">${workload.Physics}</td>
                            <td style="padding: 12px;">${workload.Chemistry}</td>
                            <td style="padding: 12px;">${workload.Biology}</td>
                            <td style="padding: 12px; color: #00d4ff; font-weight: bold;">${workload.totalTarget}</td>
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
