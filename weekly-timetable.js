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
    // 2. SMART ENGINE (v3 COMPLETE INTEGRATION)
    // ===============================
    let mission = null;
    let progress = null;
    let weekly = null;
    let streak = 0;

    try {
        if (window.SmartEngine) {
            mission = window.SmartEngine.getDailyMission?.() || null;
            progress = window.SmartEngine.getProgress?.() || null;
            weekly = window.SmartEngine.getWeeklyPlanner?.() || null;
            streak = window.SmartEngine.getStudyStreak?.() || 0;
        }
    } catch (e) {
        console.error("SmartEngine error:", e);
    }

    // ===============================
    // 🔥 SAFE BREAKDOWN ACCESS
    // ===============================
    const safeBreakdown = mission?.breakdown || {
        Math: 0,
        Physics: 0,
        Chemistry: 0,
        Biology: 0
    };

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

            ${mission.isWeekend ? `
                <div style="
                    margin:12px 0;
                    padding:10px;
                    background:#ffcc0015;
                    border-radius:8px;
                    color:#ffcc00;
                    font-size:14px;
                    font-weight:600;
                    text-align:center;
                ">
                    🌟 Weekend boost! You have 20% more capacity today
                </div>
            ` : ''}

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
                Total: ${mission.total || 0} pages
            </div>

            ${mission.prediction ? `
                <div style="
                    margin-top:15px;
                    padding:12px;
                    background:${mission.prediction.riskLevel === 'HIGH' ? '#ff444415' : mission.prediction.riskLevel === 'MEDIUM' ? '#ffaa0015' : '#00d4ff15'};
                    border-radius:10px;
                    border-left:4px solid ${mission.prediction.riskLevel === 'HIGH' ? '#ff4444' : mission.prediction.riskLevel === 'MEDIUM' ? '#ffaa00' : '#00d4ff'};
                ">
                    <p style="margin:0 0 8px;font-weight:600;color:${mission.prediction.riskLevel === 'HIGH' ? '#ff4444' : mission.prediction.riskLevel === 'MEDIUM' ? '#ffaa00' : '#00d4ff'};">
                        ${mission.prediction.onTrack ? '✅' : '⚠️'} ${mission.prediction.riskMessage}
                    </p>
                    <p style="margin:0;font-size:14px;color:#8b949e;">
                        📅 Estimated completion: <strong style="color:#00d4ff;">${mission.prediction.estimatedCompletionDate}</strong>
                    </p>
                </div>
            ` : ''}

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

                <div style="margin-bottom:10px;">
                    📚 Total Pages Progress:
                    <strong>${progress?.pagesDone || 0} / ${progress?.pagesTotal || 0}</strong>
                    <progress 
                        value="${progress?.pagesDone || 0}" 
                        max="${progress?.pagesTotal || 1}"
                        style="width:100%;height:10px;">
                    </progress>
                    ${progress?.nextMilestone ? `
                        <p style="margin:6px 0 0 0;color:#00d4ff;font-size:13px;font-weight:600;">
                            🎯 Next milestone: ${progress.nextMilestone}%
                        </p>
                    ` : ''}
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
    // 3. WEEKLY PERFORMANCE CARD (NEW)
    // ===============================
    const weeklyHtml = weekly && weekly.status !== "NO_DATA" && weekly.status !== "ERROR" ? `
        <div style="
            margin-top:20px;
            background:#0d1117;
            padding:18px;
            border-radius:12px;
            border:1px solid #30363d;
            color:white;
        ">

            <h2 style="margin-top:0;color:#00d4ff;">
                📅 Weekly Performance
            </h2>

            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                <div><strong>Week:</strong> ${weekly.week}</div>
                <div><strong>Efficiency:</strong> <span style="color:#00d4ff;font-weight:bold;">${weekly.efficiency}%</span></div>
            </div>

            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#8b949e;">Planned</span>
                <span style="font-weight:600;">${weekly.planned} pages</span>
            </div>

            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                <span style="color:#8b949e;">Actual</span>
                <span style="font-weight:600;color:#00ff88;">${weekly.actual} pages</span>
            </div>

            <div style="
                padding:10px;
                background:${weekly.status === 'ON_TRACK' ? '#00ff8815' : weekly.status === 'SLIGHT_DELAY' ? '#ffaa0015' : weekly.status === 'BEHIND' ? '#ff444415' : '#ff000015'};
                border-radius:8px;
                text-align:center;
                font-weight:600;
                color:${weekly.status === 'ON_TRACK' ? '#00ff88' : weekly.status === 'SLIGHT_DELAY' ? '#ffaa00' : weekly.status === 'BEHIND' ? '#ff4444' : '#ff0000'};
            ">
                Status: ${weekly.status.replace('_', ' ')}
            </div>

            ${weekly.suggestedRestDay ? `
                <div style="
                    margin-top:12px;
                    padding:12px;
                    background:#00ff8815;
                    border-radius:10px;
                    border-left:4px solid #00ff88;
                ">
                    <p style="margin:0;font-weight:600;color:#00ff88;">
                        🏖️ ${weekly.restDayMessage}
                    </p>
                </div>
            ` : ''}
        </div>
    ` : '';

    // ===============================
    // 4. STUDY STREAK CARD (NEW)
    // ===============================
    const streakHtml = streak > 0 ? `
        <div style="
            margin-top:20px;
            background:#0d1117;
            padding:18px;
            border-radius:12px;
            border:1px solid #30363d;
            color:white;
        ">

            <h2 style="margin-top:0;color:#00d4ff;">
                🔥 Study Streak
            </h2>

            <div style="text-align:center;margin:16px 0;">
                <div style="
                    font-size:48px;
                    font-weight:800;
                    color:#00d4ff;
                    margin-bottom:8px;
                    line-height:1;
                ">
                    ${streak}
                </div>
                <p style="margin:0;color:#8b949e;font-size:14px;">
                    Consecutive days studied
                </p>
            </div>

            ${streak > 7 ? `
                <div style="
                    padding:12px;
                    background:#00ff8815;
                    border-radius:10px;
                    text-align:center;
                    font-weight:600;
                    color:#00ff88;
                ">
                    🎉 Amazing! You're on a ${streak}-day streak! Keep it up!
                </div>
            ` : streak > 3 ? `
                <div style="
                    padding:12px;
                    background:#00d4ff15;
                    border-radius:10px;
                    text-align:center;
                    font-weight:600;
                    color:#00d4ff;
                ">
                    🔥 Great momentum! Keep studying to build your streak!
                </div>
            ` : streak > 1 ? `
                <div style="
                    padding:12px;
                    background:#ffaa0015;
                    border-radius:10px;
                    text-align:center;
                    font-weight:600;
                    color:#ffaa00;
                ">
                   💪 Good start! Keep going to build your streak!
                </div>
            ` : ''}
        </div>
    ` : '';

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
            ${weeklyHtml}
            ${streakHtml}

        </div>
    `;
};
