"use strict";

window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // 1. Fixed Curriculum Data (Reference)
    const planData = [
        { grade: 9, total: 876, days: 18, math: 20, phys: 10, chem: 10, bio: 9, target: 49 },
        { grade: 10, total: 1116, days: 22, math: 18, phys: 10, chem: 12, bio: 12, target: 52 },
        { grade: 11, total: 1422, days: 27, math: 18, phys: 10, chem: 12, bio: 13, target: 53 },
        { grade: 12, total: 1234, days: 23, math: 18, phys: 10, chem: 12, bio: 14, target: 54 }
    ];

    let rowsHtml = planData.map(row => `
        <tr style="border-bottom: 1px solid #30363d;">
            <td style="font-weight: 700; color: #00d4ff; padding: 8px;">${row.grade}</td>
            <td style="padding: 8px;">${row.total.toLocaleString()}</td>
            <td style="padding: 8px;">${row.days}</td>
            <td style="padding: 8px;">${row.math}</td>
            <td style="padding: 8px;">${row.phys}</td>
            <td style="padding: 8px;">${row.chem}</td>
            <td style="padding: 8px;">${row.bio}</td>
            <td style="color: #00d4ff; font-weight: bold; padding: 8px;">${row.target}</td>
        </tr>
    `).join("");

    // 2. Fetch Dynamic Adaptive Metrics
    const stats = window.SmartEngine.getOverallStats();
    const adaptive = window.SmartEngine.getAdaptiveTarget();

    // 3. Render Module
    container.innerHTML = `
        <div style="background: #121821; padding: 15px; border-radius: 10px; color: white;">
            <h2 style="margin-top: 0;">🚀 Adaptive Cycle Command</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div style="background: #0d1117; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="color: #8b949e; font-size: 12px; margin: 0;">Required Today</p>
                    <span style="font-size: 28px; font-weight: bold; color: #00d4ff;">${adaptive.dailyTarget}</span>
                    <span style="font-size: 14px;">pages</span>
                </div>
                <div style="background: #0d1117; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="color: #8b949e; font-size: 12px; margin: 0;">Days Left</p>
                    <span style="font-size: 28px; font-weight: bold; color: #ffffff;">${adaptive.daysRemaining}</span>
                    <span style="font-size: 14px;">/ 90</span>
                </div>
            </div>

            <div style="border-top: 1px solid #30363d; padding-top: 15px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #00d4ff;">🧠 Smart Engine Status</h3>
                <p style="margin: 5px 0;">Cycle Mastery: <strong>${stats.pagePercent}%</strong></p>
                <progress value="${stats.pagePercent}" max="100" style="width: 100%; height: 8px; margin-bottom: 10px;"></progress>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <p style="margin: 0;">System Status:</p>
                    <strong style="color: ${adaptive.status.includes('🚨') ? '#ff4d4d' : '#00ffa6'};">
                        ${adaptive.status}
                    </strong>
                </div>
            </div>

            <h2 style="font-size: 18px; margin-top: 0;">📅 Curriculum Reference</h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: center; color: white;">
                    <thead>
                        <tr style="border-bottom: 2px solid #30363d; color: #8b949e;">
                            <th style="padding: 8px;">Gr</th><th style="padding: 8px;">Pgs</th><th style="padding: 8px;">Dys</th>
                            <th style="padding: 8px;">M</th><th style="padding: 8px;">Ph</th><th style="padding: 8px;">Ch</th><th style="padding: 8px;">Bi</th>
                            <th style="padding: 8px;">Tgt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                        <tr style="border-top: 2px solid #30363d; font-weight: bold; color: #00d4ff;">
                            <td style="padding: 8px;">Sum</td><td style="padding: 8px;">4,648</td><td style="padding: 8px;">90</td>
                            <td colspan="4" style="padding: 8px;">—</td><td style="padding: 8px;">≈52/d</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
};
