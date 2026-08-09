"use strict";

window.loadWeeklyTimetable = function () {
    const container =
        document.getElementById("main-content");

    if (!container) return;

    // ======================================================
    // 1. SYSTEM CONSTANTS
    // ======================================================
    const totalPages = 3654;
    const totalCycles = 5;
    const cycleDays = 60;

    const totalSystemDays =
        totalCycles * cycleDays;

    const totalReadingPages =
        totalPages * totalCycles;

    const dailyTarget = 61;

    const gradePages = [
        { grade: 9, total: 754 },
        { grade: 10, total: 904 },
        { grade: 11, total: 966 },
        { grade: 12, total: 1030 }
    ];

    const gradeDays = [
        12,
        15,
        16,
        17
    ];

    const planData = gradePages.map(
        (row, index) => ({
            ...row,
            days: gradeDays[index],
            math: 15,
            phys: 15,
            chem: 15,
            bio: 15,
            target: dailyTarget
        })
    );

    // ======================================================
    // 2. SMART ENGINE DATA
    // ======================================================
    let mission = null;
    let progress = null;

    try {
        if (window.SmartEngine) {
            mission =
                window.SmartEngine
                    .getDailyMission?.() ?? null;

            progress =
                window.SmartEngine
                    .getProgress?.() ?? null;
        }
    } catch (error) {
        console.error(
            "SmartEngine error:",
            error
        );
    }

    // ======================================================
    // 3. SAFE DATA
    // ======================================================
    const fallbackBreakdown = {
        Math: 16,
        Physics: 15,
        Chemistry: 15,
        Biology: 15
    };

    const safeBreakdown =
        mission?.breakdown &&
        Object.keys(
            mission.breakdown
        ).length > 0
            ? mission.breakdown
            : fallbackBreakdown;

    const displayedMissionTotal =
        Object.values(
            safeBreakdown
        ).reduce(
            (sum, value) => {
                return sum +
                    Number(value ?? 0);
            },
            0
        );

    const displayedCycle =
        Number(
            mission?.cycle ?? 1
        );

    const displayedCycleDay =
        Number(
            mission?.day ?? 1
        );

    const displayedGlobalDay =
        Number(
            mission?.globalDay ??
            progress?.day ??
            1
        );

    const displayedTotalDays =
        Number(
            mission?.totalDays ??
            progress?.totalDays ??
            totalSystemDays
        );

    const displayedCycleDays =
        Number(
            mission?.daysPerCycle ??
            cycleDays
        );

    const displayedPagesDone =
        Number(
            progress?.readingPagesDone ??
            0
        );

    const displayedPagesTotal =
        Number(
            progress?.readingPagesTotal ??
            totalReadingPages
        );

    // Keep progress-bar values valid.
    const safeDayProgress =
        Math.min(
            Math.max(
                displayedGlobalDay,
                0
            ),
            displayedTotalDays
        );

    const safePagesProgress =
        Math.min(
            Math.max(
                displayedPagesDone,
                0
            ),
            displayedPagesTotal
        );

    const formatNumber = value => {
        return Number(value ?? 0)
            .toLocaleString("en-US");
    };

    // ======================================================
    // 4. CURRICULUM TABLE
    // ======================================================
    const rowsHtml =
        planData.map(row => `
            <tr style="
                border-bottom:1px solid #30363d;
            ">
                <td style="
                    font-weight:700;
                    color:#00d4ff;
                    padding:8px;
                ">
                    ${row.grade}
                </td>

                <td style="padding:8px;">
                    ${formatNumber(row.total)}
                </td>

                <td style="padding:8px;">
                    ${row.days}
                </td>

                <td style="padding:8px;">
                    ${row.math}
                </td>

                <td style="padding:8px;">
                    ${row.phys}
                </td>

                <td style="padding:8px;">
                    ${row.chem}
                </td>

                <td style="padding:8px;">
                    ${row.bio}
                </td>

                <td style="
                    padding:8px;
                    color:#00d4ff;
                    font-weight:bold;
                ">
                    ${row.target}
                </td>
            </tr>
        `).join("");

    // ======================================================
    // 5. SMART MISSION HTML
    // ======================================================
    const missionHtml = mission ? `
        <div style="
            margin-top:20px;
            background:#0d1117;
            padding:18px;
            border-radius:12px;
            border:1px solid #30363d;
            color:white;
        ">

            <h2 style="
                margin-top:0;
                color:#00d4ff;
            ">
                🧠 Smart Cycle Engine
            </h2>

            <div style="
                color:#8b949e;
                margin-bottom:12px;
            ">
                System:
                ${cycleDays} days
                (${totalCycles} cycle ×
                ${totalPages} pages)
            </div>

            <div style="
                display:flex;
                justify-content:space-between;
                margin-bottom:8px;
            ">
                <div>
                    <strong>Cycle:</strong>
                    ${displayedCycle} /
                    ${totalCycles}
                </div>

                <div>
                    <strong>Day:</strong>
                    ${displayedCycleDay} /
                    ${displayedCycleDays}
                </div>
            </div>

            <h3 style="margin:10px 0;">
                🎯 Today's Mission
            </h3>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-bottom:10px;
            ">
                <div>
                    Math:
                    <strong>
                        ${safeBreakdown.Math ?? 0}
                    </strong>
                </div>

                <div>
                    Physics:
                    <strong>
                        ${safeBreakdown.Physics ?? 0}
                    </strong>
                </div>

                <div>
                    Chemistry:
                    <strong>
                        ${safeBreakdown.Chemistry ?? 0}
                    </strong>
                </div>

                <div>
                    Biology:
                    <strong>
                        ${safeBreakdown.Biology ?? 0}
                    </strong>
                </div>
            </div>

            <div style="
                font-size:18px;
                font-weight:bold;
                color:#00d4ff;
                border-top:1px solid #30363d;
                padding-top:10px;
            ">
                Total:
                ${displayedMissionTotal}
                pages
            </div>

            <div style="
                margin-top:15px;
            ">
                <div style="
                    margin-bottom:10px;
                ">
                    📅 Days Progress:
                    <strong>
                        ${displayedGlobalDay} /
                        ${displayedTotalDays}
                    </strong>

                    <progress
                        value="${safeDayProgress}"
                        max="${displayedTotalDays}"
                        style="
                            width:100%;
                            height:10px;
                        "
                    >
                    </progress>
                </div>

                <div>
                    📚 Total Pages Progress:
                    <strong>
                        ${formatNumber(
                            displayedPagesDone
                        )}
                        /
                        ${formatNumber(
                            displayedPagesTotal
                        )}
                    </strong>

                    <progress
                        value="${safePagesProgress}"
                        max="${displayedPagesTotal}"
                        style="
                            width:100%;
                            height:10px;
                        "
                    >
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

    // ======================================================
    // 6. FINAL RENDER
    // ======================================================
    container.innerHTML = `
        <div style="
            background:#121821;
            padding:15px;
            border-radius:10px;
            color:white;
        ">

            <h2>📅 Curriculum Reference</h2>

            <div style="overflow-x:auto;">
                <table style="
                    width:100%;
                    border-collapse:collapse;
                    text-align:center;
                    color:white;
                ">
                    <thead>
                        <tr style="
                            color:#8b949e;
                            border-bottom:2px solid #30363d;
                        ">
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

                        <tr style="
                            border-top:2px solid #30363d;
                            font-weight:bold;
                            color:#00d4ff;
                        ">
                            <td>Sum</td>

                            <td>
                                ${formatNumber(
                                    totalPages
                                )}
                            </td>

                            <td>
                                ${cycleDays}
                            </td>

                            <td colspan="4">
                                —
                            </td>

                            <td>
                                ≈${dailyTarget}/d
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            ${missionHtml}
        </div>
    `;
};
