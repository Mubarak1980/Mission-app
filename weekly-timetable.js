"use strict";

window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // ===============================
    // 1. FIXED CURRICULUM DATA
    // ===============================
    const totalPages = 3654;
    const totalDays = 60;
    const dailyTarget = 61;

    const gradePages = [
        { grade: 9, total: 754 },
        { grade: 10, total: 904 },
        { grade: 11, total: 966 },
        { grade: 12, total: 1030 }
    ];

    const gradeDays = [12, 15, 16, 17];

    const planData = gradePages.map((row, index) => ({
        ...row,
        days: gradeDays[index],
        math: 15,
        phys: 15,
        chem: 15,
        bio: 15,
        target: dailyTarget
    }));

    const dayInCycle = new Date().getDate() % 4;

    const dailyBreakdown = [
        { Math: 16, Physics: 15, Chemistry: 15, Biology: 15 },
        { Math: 15, Physics: 16, Chemistry: 15, Biology: 15 },
        { Math: 15, Physics: 15, Chemistry: 16, Biology: 15 },
        { Math: 15, Physics: 15, Chemistry: 15, Biology: 16 }
    ][dayInCycle];

    let rowsHtml = planData.map(row => `
        <tr style="border-bottom: 1px solid #30363d;">
            <td style="font-weight:700;color:#00d4ff;padding:8px;">${row.grade}</td>
            <td style="padding:8px;">${row.total.toLocaleString()}</td>
            <td style="padding:8px;">${row.days}</td>
            <td style="padding:8px;">${row.math}</td>
            <td style="padding:8px;">${row.phys}</td>
            <td style="padding:8px;">${row.chem}</td>
            <td style="padding:8px;">${row.bio}</td>
            <td style="padding:8px;color:#00d4ff;font-weight:bold;">${row.target}</td>
        </tr>
    `).join("");

    // ===============================
    // 2. SMART ENGINE (v2 SAFE INTEGRATION)
    // ===============================
    let mission = null;
    let progress = null;

    try {
        if (window.SmartEngine) {
            mission = window.SmartEngine.getDailyMission?.() || null;
            progress = window.SmartEngine.getProgress?.() || null;
        }
    } catch (e) {
        console.error("SmartEngine error:", e);
    }

    // ===============================
    // PWA SAFE FIX: Guard breakdown access
    // ===============================
    const safeBreakdown = dailyBreakdown;

    const missionHtml = mission ? `
        <div style="
            margin-top:20px;
            background:#0d1117;
            padding:18px;
            border-radius:12px;
            border:1px solid #30363d;
            color:white;
        ">

            <h2 style="margin-top:0;color:#00d4ff;">
                🧠 Smart Cycle Engine (60-Day System)
            </h2>

            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <div><strong>Cycle:</strong> ${mission.cycle} / 4</div>
                <div><strong>Day:</strong> ${mission.day} / ${totalDays}</div>
            </div>

            <div style="color:#8b949e;margin-bottom:10px;">
                Total System: 240 Days (4 Cycles × 60 Days)
            </div>

            <h3 style="margin:10px 0;">🎯 Today's Mission</h3>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-bottom:10px;
            ">
                <div>Math: <strong>${safeBreakdown.Math}</strong></div>
                <div>Physics: <strong>${safeBreakdown.Physics}</strong></div>
                <div>Chemistry: <strong>${safeBreakdown.Chemistry}</strong></div>
                <div>Biology: <strong>${safeBreakdown.Biology}</strong></div>
            </div>

            <div style="
                font-size:18px;
                font-weight:bold;
                color:#00d4ff;
                border-top:1px solid #30363d;
                padding-top:10px;
            ">
                Total: ${dailyTarget} pages
            </div>

            <div style="margin-top:15px;">

                <div style="margin-bottom:10px;">
                    📅 Days Progress:
                    <strong>${progress?.day || 0} / ${totalDays}</strong>
                    <progress 
                        value="${progress?.day || 0}" 
                        max="${totalDays}"
                        style="width:100%;height:10px;">
                    </progress>
                </div>

                <div>
                    📚 Total Pages Progress:
                    <strong>${progress?.pagesDone || 0} / ${totalPages}</strong>
                    <progress 
                        value="${progress?.pagesDone || 0}" 
                        max="${totalPages}"
                        style="width:100%;height:10px;">
                    </progress>
                </div>

            </div>
        </div>
    ` : `
        <div style="
            margin-top:20px;
            padding:15px;
            background:#0d1117;
            border-radius:10px;
            border:1px solid #30363d;
            color:#8b949e;
        ">
            🧠 Smart Cycle Engine not available
        </div>
    `;

    // ===============================
    // 3. FINAL RENDER
    // ===============================
    container.innerHTML = `
        <div style="background:#121821;padding:15px;border-radius:10px;color:white;">

            <h2>📅 Curriculum Reference</h2>

            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;text-align:center;color:white;">
                    <thead>
                        <tr style="color:#8b949e;border-bottom:2px solid #30363d;">
                            <th>Gr</th><th>Pgs</th><th>Dys</th>
                            <th>M</th><th>Ph</th><th>Ch</th><th>Bi</th><th>Tgt</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rowsHtml}

                        <tr style="border-top:2px solid #30363d;font-weight:bold;color:#00d4ff;">
                            <td>Sum</td>
                            <td>${totalPages.toLocaleString()}</td>
                            <td>${totalDays}</td>
                            <td colspan="4">—</td>
                            <td>≈${dailyTarget}/d</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            ${missionHtml}

        </div>
    `;
};
