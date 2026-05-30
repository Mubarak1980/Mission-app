"use strict";

window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // 1. Fetch Dynamic Data from Smart Engine
    const time = window.SmartEngine.getCycleTimeRemaining();
    const workload = window.SmartEngine.getSuggestedDailyWorkload();
    const stats = window.SmartEngine.getOverallStats();

    // 2. Render
    container.innerHTML = `
        <div style="background: #121821; padding: 15px; border-radius: 10px; color: white;">
            <h2 style="margin-top: 0;">📅 Daily Distribution</h2>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #1c222d; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #00d4ff;">⏳ Cycle Progress</h3>
                <p>Days remaining in cycle: <strong>${time.remaining}</strong></p>
                <progress value="${time.percent}" max="100" style="width: 100%; height: 8px;"></progress>
                
                <h3 style="margin-top: 20px; color: #00d4ff;">🎯 Daily Optimized Target</h3>
                <p>To stay on track, aim for <strong>${workload.totalTarget} pages/day</strong>:</p>
                <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #8b949e;">
                    <span>Math: ${workload.Math}</span>
                    <span>Phys: ${workload.Physics}</span>
                    <span>Chem: ${workload.Chemistry}</span>
                    <span>Bio: ${workload.Biology}</span>
                </div>
            </div>

            <div style="border-top: 1px solid #30363d; padding-top: 15px;">
                <h3 style="margin-top: 0; color: #00d4ff;">🧠 Smart Engine Metrics</h3>
                <p style="margin: 5px 0;">Workload Status: <strong>${window.SmartEngine.getWorkloadStatus(stats.pagePercent, stats.timePercent)}</strong></p>
            </div>
        </div>
    `;
};
