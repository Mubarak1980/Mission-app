"use strict";

window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // ===============================
    // 1. FIXED CURRICULUM DATA
    // ===============================
    const planData = [
        { grade: 9, total: 876, days: 18, math: 20, phys: 10, chem: 10, bio: 9, target: 49 },
        { grade: 10, total: 1116, days: 22, math: 18, phys: 10, chem: 12, bio: 12, target: 52 },
        { grade: 11, total: 1422, days: 27, math: 18, phys: 10, chem: 12, bio: 13, target: 53 },
        { grade: 12, total: 1234, days: 23, math: 18, phys: 10, chem: 12, bio: 14, target: 54 }
    ];

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
            mission = window.SmartEngine.getDailyMission?.();
            progress = window.SmartEngine.getProgress?.();
        }
    } catch (e) {
        console.error("SmartEngine error:", e);
    }

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
                🧠 Smart Cycle Engine (90-Day System)
            </h2>

            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <div><strong>Cycle:</strong> ${mission.cycle} / 4</div>
                <div><strong>Day:</strong> ${mission.day} / 90</div>
            </div>

            <div style="color:#8b949e;margin-bottom:10px;">
                Total System: 360 Days (4 Cycles × 90 Days)
            </div>

            <h3 style="margin:10px 0;">🎯 Today's Mission</h3>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-bottom:10px;
            ">
                <div>Math: <strong>${mission.breakdown.Math}</strong></div>
                <div>Physics: <strong>${mission.breakdown.Physics}</strong></div>
                <div>Chemistry: <strong>${mission.breakdown.Chemistry}</strong></div>
                <div>Biology: <strong>${mission.breakdown.Biology}</strong></div>
            </div>

            <div style="
                font-size:18px;
                font-weight:bold;
                color:#00d4ff;
                border-top:1px solid #30363d;
                padding-top:10px;
            ">
                Total: ${mission.total} pages
            </div>

            <!-- =============================== -->
            <!-- 3. PROGRESS BARS (REQUIRED) -->
            <!-- =============================== -->

            <div style="margin-top:15px;">

                <div style="margin-bottom:10px;">
                    📅 Days Progress:
                    <strong>${progress?.day || 0} / 360</strong>
                    <progress 
                        value="${progress?.day || 0}" 
                        max="360"
                        style="width:100%;height:10px;">
                    </progress>
                </div>

                <div>
                    📚 Total Pages Progress:
                    <strong>${progress?.pagesDone || 0} / ${progress?.pagesTotal || 0}</strong>
                    <progress 
                        value="${progress?.pagesDone || 0}" 
                        max="${progress?.pagesTotal || 1}"
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
                            <td>4,648</td>
                            <td>90</td>
                            <td colspan="4">—</td>
                            <td>≈52/d</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            ${missionHtml}

        </div>
    `;
};
