"use strict";

window.loadWeeklyTimetable = function() {
    const container = document.getElementById("main-content");
    if (!container) return;

    // ===============================
    // 1. FIXED CURRICULUM DATA
    // ===============================
    const totalPages = 3654;
    const totalCycles = 5;
    const totalDays = 60;
    const totalSystemDays = totalCycles * totalDays;
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

    const dayInCycle = (new Date().getDate() - 1) % 4;

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
    // 2. SMART ENGINE
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
    // 3. SAFE MISSION DATA
    // ===============================
    const safeBreakdown = mission?.breakdown &&
        Object.keys(mission.breakdown).length
        ? mission.breakdown
        : dailyBreakdown;

    const displayedMissionTotal =
        Object.values(safeBreakdown)
            .reduce((sum, value) => sum + Number(value || 0), 0);

    const displayedCycle =
        mission?.cycle || 1;

    const displayedDay =
        mission?.day || 1;

    const displayedSystemDays =
        mission?.totalDays || totalSystemDays;

    const displayedCycleDays =
        mission?.totalDays
            ? Math.min(totalDays, mission.totalDays)
            : totalDays;

    // ===============================
    // 4. MISSION HTML
    // ===============================
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
                <div>
                    <strong>Cycle:</strong>
                    ${displayedCycle} / ${totalCycles}
                </div>

                <div>
                    <strong>Day:</strong>
                    ${displayedDay} / ${displayedCycleDays}
                </div>
            </div>

            <div style="color:#8b949e;margin-bottom:10px;">
                Total System:
                ${displayedSystemDays} Days
                (${totalCycles} Cycles × ${totalDays} Days)
            </div>

            <h3 style="margin:10px 0;">🎯 Today's Mission</h3>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-bottom:10px;
            ">
                <div>
                    Math:
                    <strong>${safeBreakdown.Math}</strong>
                </div>

                <div>
                    Physics:
                    <strong>${safeBreakdown.Physics}</strong>
                </div>

                <div>
                    Chemistry:
                    <strong>${safeBreakdown.Chemistry}</strong>
                </div>

                <div>
                    Biology:
                    <strong>${safeBreakdown.Biology}</strong>
                </div>
            </div>

            <div style="
                font-size:18px;
                font-weight:bold;
                color:#00d4ff;
                border-top:1px solid #30363d;
                padding-top:10px;
            ">
                Total: ${displayedMissionTotal} pages
            </div>

            <div style="margin-top:15px;">

                <div style="margin-bottom:10px;">
                    📅 Days Progress:
                    <strong>
                        ${progress?.day || 0} / ${displayedCycleDays}
                    </strong>

                    <progress
                        value="${progress?.day || 0}"
                        max="${displayedCycleDays}"
                        style="width:100%;height:10px;">
                    </progress>
                </div>

                <div>
                    📚 Total Pages Progress:
                    <strong>
                        ${progress?.pagesDone || 0} / ${totalPages}
                    </strong>

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
    // 5. FINAL RENDER
    // ===============================
    container.innerHTML = `
        <div style="background:#121821;padding:15px;border-radius:10px;color:white;">

            <h2>📅 Curriculum Reference</h2>

            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;text-align:center;color:white;">
                    <thead>
                        <tr style="color:#8b949e;border-bottom:2px solid #30363d;">
                            <th>Gr</th>
                            <th>Pgs</th>
                            <th>Dys</th>
                            <th>M</th>
                            <th>Ph</th>
                            <th>Ch</th>
                            <th>Bi</th>
                            <th>Tgt</th>
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
