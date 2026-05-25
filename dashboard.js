"use strict";

// ========================================================
// 🔄 AUTOMATIC 4-CYCLE YEAR ROTATION ENGINE
// ========================================================
function checkAndAutoRotateCycle() {
    try {
        // Safe number helper
        const safeNum = (value, fallback = 0) => {
            const n = Number(value);
            return isNaN(n) ? fallback : n;
        };

        let savedStudyState = JSON.parse(localStorage.getItem("study_progress")) || {};
        
        const currentStartDateStr = savedStudyState.startDate || new Date().toISOString().split("T")[0];
        const currentCycleNumber = safeNum(savedStudyState.cycleNumber, 1);
        
        // Days calculation helper built inline to guarantee zero dependency failures
        const getDaysSinceStartInternal = (startDate) => {
            try {
                const today = new Date();
                const start = new Date(startDate);
                if (isNaN(start.getTime())) return 1;
                today.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
                return Math.max(1, diff + 1);
            } catch {
                return 1;
            }
        };

        const daysSinceStart = getDaysSinceStartInternal(currentStartDateStr); 
        const maxCycleDays = 90;

        // AUTOMATIC SYSTEM: Trigger rotation silently if 90 days are exceeded
        if (daysSinceStart > maxCycleDays) {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const nextCycleStartDate = `${year}-${month}-${day}`;

            // Wraps back around to Cycle 1 after completing Cycle 4
            const nextCycleNumber = currentCycleNumber >= 4 ? 1 : currentCycleNumber + 1;

            // Archive completed metrics safely
            const cycleHistory = JSON.parse(localStorage.getItem("cycle_history")) || [];
            cycleHistory.push({
                cycle: currentCycleNumber,
                startDate: currentStartDateStr,
                endDate: nextCycleStartDate,
                finalProgress: { ...savedStudyState }
            });
            localStorage.setItem("cycle_history", JSON.stringify(cycleHistory));

            // Generate clean baseline data for the next 90 days
            const freshCycleState = {
                startDate: nextCycleStartDate,
                cycleNumber: nextCycleNumber,
                pages: 0
            };

            localStorage.setItem("study_progress", JSON.stringify(freshCycleState));

            // Silent UI reload
            if (typeof loadDashboard === "function") {
                loadDashboard();
            } else {
                location.reload();
            }
            return true; 
        }
    } catch (e) {
        console.warn("Cycle rotation check failed safely:", e);
    }
    return false; 
}

// =====================================================
// 📊 DASHBOARD (WEIGHTED PROGRESS FIXED)
// =====================================================

function loadDashboard() {

  try {

    // 🔥 RUN THE CYCLE TRACKING CHECK FIRST BEFORE RENDER
    if (checkAndAutoRotateCycle()) return;

    const main = document.getElementById("main-content");

    if (!main) return;

    if (!window.maxPagesByGrade) {

      main.innerHTML = `
        <p style="
          color:red;
          text-align:center;
          padding:20px;
        ">
          Error: grade data not loaded
        </p>
      `;

      return;
    }

    const subjects = [
      "Math",
      "Physics",
      "Chemistry",
      "Biology",
      "English"
    ];

    const grades = [9, 10, 11, 12];

    // ===============================
    // SAFE LOCAL PROGRESS
    // ===============================
    const loadProgress = (grade) => {

      try {

        const data = JSON.parse(
          localStorage.getItem(
            `grade_${grade}_progress`
          ) || "{}"
        );

        return (
          data &&
          typeof data === "object"
        )
          ? data
          : {};

      } catch {

        return {};
      }
    };

    // ===============================
    // BUILD SUBJECT PROGRESS
    // ===============================
    let html = `
      <h2>📊 Dashboard: Overall Subject Progress</h2>

      <div class="dashboard-container">
    `;

    subjects.forEach(subject => {

      let totalAbsoluteDone = 0;
      let totalAbsoluteMax = 0;

      grades.forEach(grade => {

        const saved = loadProgress(grade);

        const maxPages = Number(
          window.maxPagesByGrade?.[grade]?.[subject]
        ) || 0;

        const done = Math.min(
          Number(saved?.[subject]) || 0,
          maxPages
        );

        totalAbsoluteDone += done;
        totalAbsoluteMax += maxPages;
      });

      // ===============================
      // TRUE WEIGHTED PERCENTAGE
      // ===============================
      const accurateAvg = totalAbsoluteMax
        ? Math.round(
            (totalAbsoluteDone / totalAbsoluteMax) * 100
          )
        : 0;

      html += `
        <div class="dashboard-subject">

          <h3>${subject}</h3>

          <progress
            value="${accurateAvg}"
            max="100">
          </progress>

          <p>
            ${accurateAvg}% progress

            <span style="
              font-size:0.85em;
              color:#888;
            ">
              (${totalAbsoluteDone}/${totalAbsoluteMax} pages)
            </span>
          </p>

        </div>
      `;
    });

    html += `</div>`;

    // ===============================
    // FETCH LIVE AUTOMATED TIMELINES
    // ===============================
    const currentStudyData = JSON.parse(localStorage.getItem("study_progress")) || {};
    const runningCycleNum = Number(currentStudyData.cycleNumber) || 1;
    
    // Calculate precise day tracking based on stored date
    const localStartStr = currentStudyData.startDate || new Date().toISOString().split("T")[0];
    const rawDaysCount = (function(start) {
        try {
            const today = new Date(); const s = new Date(start);
            if(isNaN(s.getTime())) return 1;
            today.setHours(0,0,0,0); s.setHours(0,0,0,0);
            return Math.max(1, Math.floor((today - s) / (1000*60*60*24)) + 1);
        } catch { return 1; }
    })(localStartStr);

    const cleanCycleDay = Math.min(rawDaysCount, 90);
    const cleanRemainingDays = Math.max(0, 90 - cleanCycleDay);
    
    // 🧮 CUMULATIVE MATH ENGINE
    const totalYearDaysElapsed = ((runningCycleNum - 1) * 90) + cleanCycleDay;
    const yearTotalTargetWindow = 360;

    // ===============================
    // CYCLE INFO (UPDATED TO DISPLAY CUMULATIVE 360 DAYS)
    // ===============================
    html += `
      <div class="delay-section">

        <h2>⏱️ Cycle ${runningCycleNum} Info</h2>

        <p>
          📅 <strong>Current Cycle Day:</strong>
          ${cleanCycleDay}/90
        </p>

        <p>
          📉 <strong>Cycle Remaining:</strong>
          ${cleanRemainingDays} Days
        </p>
        
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
            <label style="color: var(--primary); font-weight:600; font-size:13px;">📊 Overall Year Timeline Progress</label>
            <progress max="${yearTotalTargetWindow}" value="${totalYearDaysElapsed}"></progress>
            <p style="text-align: left; font-size: 12px; margin-top: 4px; color: var(--muted);">
              <strong>Total Elapsed:</strong> ${totalYearDaysElapsed} / ${yearTotalTargetWindow} Days
            </p>
        </div>

      </div>
    `;

    // ===============================
    // SMART CYCLE
    // ===============================
    if (typeof window.getSmartCycle === "function") {

      const smart = window.getSmartCycle();

      // ===============================
      // HARD SAFETY NORMALIZATION
      // ===============================
      const safe = {

        expectedPages:
          Number(smart?.expectedPages ?? 0),

        actualPages:
          Number(smart?.actualPages ?? 0),

        gap:
          Number(smart?.gap ?? 0),

        remainingDays:
          Number(smart?.remainingDays ?? 0),

        catchUpPerDay:
          Number(smart?.catchUpPerDay ?? 0),

        dailyTarget:
          Number(smart?.dailyTarget ?? 0),

        intensity:
          smart?.intensity ?? "SAFE",

        pressure:
          smart?.pressure ?? "ON_TRACK",

        baseTarget:
          Number(smart?.baseTarget ?? 0)
      };

      html += `
        <div class="smart-cycle-section">

          <h2>🧠 Smart Study Engine</h2>

          <p>
            📊 Expected Pages:
            ${safe.expectedPages}
          </p>

          <p>
            📚 Actual Pages:
            ${safe.actualPages}
          </p>

          <p>
            ⚖️ Gap:
            ${safe.gap}
          </p>

          <hr style="
            border:0;
            border-top:1px solid var(--border);
            margin:12px 0;
          "/>

          <p>
            📉 Remaining Days:
            ${safe.remainingDays}
          </p>

          <p>
            🚀 Catch-up Per Day:
            ${safe.catchUpPerDay}
          </p>

          <p>
            📈 Daily Target:
            <b style="color:#00d4ff;">
              ${safe.dailyTarget}
            </b>
            pages
          </p>

          <p>
            ⚡ Intensity:
            <b style="
              color:
              ${safe.intensity === "CRITICAL"
                ? "#ff4d4d"
                : "#00d4ff"};
            ">
              ${safe.intensity}
            </b>
          </p>

          <p>
            🔥 Status:
            <b>
              ${safe.pressure}
            </b>
          </p>

          <p>
            📌 Base Target:
            ${safe.baseTarget}
          </p>

        </div>
      `;
    }

    // ===============================
    // RENDER
    // ===============================
    main.innerHTML = html;

    // ===============================
    // CLEANUP GRADE BAR
    // ===============================
    const bar =
      document.getElementById(
        "grade-progress-bar"
      );

    if (bar) {
      bar.innerHTML = "";
    }

  } catch (err) {

    console.error(
      "Dashboard crash:",
      err
    );
  }
}

// =====================================================
// EXPORT
// =====================================================
window.loadDashboard = loadDashboard;
          
