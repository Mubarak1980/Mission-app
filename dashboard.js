"use strict";

// ========================================================
// 🔄 AUTOMATIC 4-CYCLE YEAR ROTATION ENGINE
// ========================================================
function checkAndAutoRotateCycle() {
    try {
        const safeNum = (value, fallback = 0) => {
            const n = Number(value);
            return isNaN(n) ? fallback : n;
        };

        let savedStudyState = JSON.parse(localStorage.getItem("study_progress")) || {};
        
        const currentStartDateStr = savedStudyState.startDate || new Date().toISOString().split("T")[0];
        const currentCycleNumber = safeNum(savedStudyState.cycleNumber, 1);
        
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

        if (daysSinceStart > maxCycleDays) {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const nextCycleStartDate = `${year}-${month}-${day}`;

            const nextCycleNumber = currentCycleNumber >= 4 ? 1 : currentCycleNumber + 1;

            const cycleHistory = JSON.parse(localStorage.getItem("cycle_history")) || [];
            cycleHistory.push({
                cycle: currentCycleNumber,
                startDate: currentStartDateStr,
                endDate: nextCycleStartDate,
                finalProgress: { ...savedStudyState }
            });
            localStorage.setItem("cycle_history", JSON.stringify(cycleHistory));

            const freshCycleState = {
                startDate: nextCycleStartDate,
                cycleNumber: nextCycleNumber,
                pages: 0
            };

            localStorage.setItem("study_progress", JSON.stringify(freshCycleState));

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

    if (checkAndAutoRotateCycle()) return;

    const main = document.getElementById("main-content");

    if (!main) return;

    if (!window.maxPagesByGrade) {

      main.innerHTML = `
        <p style="color:red; text-align:center; padding:20px;">
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

    const loadProgress = (grade) => {
      try {
        const data = JSON.parse(
          localStorage.getItem(`grade_${grade}_progress`) || "{}"
        );
        return (data && typeof data === "object") ? data : {};
      } catch {
        return {};
      }
    };

    // Keep track of total pages per subject for priority math calculations later
    const subjectStats = {};

    let html = `
      <h2>📊 Dashboard: Overall Subject Progress</h2>
      <div class="dashboard-container">
    `;

    subjects.forEach(subject => {
      let totalAbsoluteDone = 0;
      let totalAbsoluteMax = 0;

      grades.forEach(grade => {
        const saved = loadProgress(grade);
        const maxPages = Number(window.maxPagesByGrade?.[grade]?.[subject]) || 0;
        const done = Math.min(Number(saved?.[subject]) || 0, maxPages);

        totalAbsoluteDone += done;
        totalAbsoluteMax += maxPages;
      });

      // Retain tracking data memory parameters for priority scaling blocks
      subjectStats[subject] = {
        done: totalAbsoluteDone,
        max: totalAbsoluteMax
      };

      const accurateAvg = totalAbsoluteMax
        ? Math.round((totalAbsoluteDone / totalAbsoluteMax) * 100)
        : 0;

      html += `
        <div class="dashboard-subject">
          <h3>${subject}</h3>
          <progress value="${accurateAvg}" max="100"></progress>
          <p>
            ${accurateAvg}% progress
            <span style="font-size:0.85em; color:#888;">
              (${totalAbsoluteDone}/${totalAbsoluteMax} pages)
            </span>
          </p>
        </div>
      `;
    });

    html += `</div>`;

    // =====================================================
    // FETCH LIVE TIMELINES
    // =====================================================
    const currentStudyData = JSON.parse(localStorage.getItem("study_progress")) || {};
    const runningCycleNum = Number(currentStudyData.cycleNumber) || 1;
    
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
    
    const totalYearDaysElapsed = ((runningCycleNum - 1) * 90) + cleanCycleDay;
    const yearTotalTargetWindow = 360;

    let baseTargetValue = 63;
    if (typeof window.getSmartCycle === "function") {
      const smart = window.getSmartCycle();
      baseTargetValue = Number(smart?.baseTarget ?? 63);
    }

    // =====================================================
    // 🧮 EXPONENTIAL SUBJECT WEIGHTING CALCULATION LOOP
    // =====================================================
    let exponentialWeights = {};
    let totalWeightFactor = 0;

    subjects.forEach(subject => {
      const stats = subjectStats[subject] || { done: 0, max: 0 };
      
      // Calculate perfect expected pages completion parameter for today's specific timeline position
      const expectedCompletionRate = totalYearDaysElapsed / yearTotalTargetWindow;
      const expectedPagesToday = Math.round(stats.max * expectedCompletionRate);
      
      // Deficit footprint detection gap
      const currentDeficit = Math.max(0, expectedPagesToday - stats.done);
      
      // 🔥 EXPONENTIAL TRANSFORM: Squaring the deficit shifts dynamic priority to lagging fields
      const calculatedWeight = Math.pow(currentDeficit, 2) + 1; 
      
      exponentialWeights[subject] = calculatedWeight;
      totalWeightFactor += calculatedWeight;
    });

    // Generate neat string blocks containing our smart targets
    let structuralPriorityHTML = `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border);">
        <label style="color: #00d4ff; font-weight:700; font-size:13px; display:block; margin-bottom: 6px;">
          🎯 Exponential Daily Priorities (Allocated out of ${baseTargetValue} pgs)
        </label><ul style="list-style: none; padding: 0; margin: 0; font-size: 12px;">`;

    let checkSumAllocatedPages = 0;
    const individualTargets = [];

    // First round distribution pass parsing loop
    subjects.forEach((subject, idx) => {
      const portion = exponentialWeights[subject] / totalWeightFactor;
      let targetForSubject = Math.floor(portion * baseTargetValue);
      
      individualTargets.push({ subject, target: targetForSubject });
      checkSumAllocatedPages += targetForSubject;
    });

    // Remainder calculation safety validation to prevent rounding drop discrepancies
    let missingRemainder = baseTargetValue - checkSumAllocatedPages;
    while (missingRemainder > 0) {
      individualTargets.sort((a, b) => exponentialWeights[b.subject] - exponentialWeights[a.subject]);
      individualTargets[0].target += 1;
      missingRemainder--;
    }

    // Build the clean string presentation fields inside the template panel block
    individualTargets.forEach(item => {
      const weightScore = exponentialWeights[item.subject];
      let priorityAlertIndicator = "";
      
      if (weightScore > 1000) {
         priorityAlertIndicator = `<b style="color: #ff4d4d; float: right;">🔥 High Priority</b>`;
      } else if (weightScore > 1) {
         priorityAlertIndicator = `<b style="color: #00d4ff; float: right;">📈 Stepping Up</b>`;
      } else {
         priorityAlertIndicator = `<span style="color: #888; float: right;">✅ Ahead / Safe</span>`;
      }

      structuralPriorityHTML += `
        <li style="margin: 6px 0; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 4px;">
          <strong>${item.subject}:</strong> <span style="color:#00d4ff; font-weight:bold;">${item.target}</span> pages
          ${priorityAlertIndicator}
        </li>
      `;
    });
    structuralPriorityHTML += `</ul></div>`;

    // =====================================================
    // 🧠 SMART STUDY ENGINE & CYCLE INFO (SHORT & CLEAN)
    // =====================================================
    html += `
      <div class="smart-cycle-section" style="padding: 15px; margin-top: 20px;">
        <h2>🧠 Smart Study Engine</h2>
        <h3>⏱️ Cycle ${runningCycleNum} Info</h3>

        <p style="margin: 6px 0;">📅 <strong>Current Cycle Day:</strong> ${cleanCycleDay}/90</p>
        <p style="margin: 6px 0;">📉 <strong>Cycle Remaining:</strong> ${cleanRemainingDays} Days</p>
        <p style="margin: 6px 0;">📌 <strong>Base Target:</strong> ${baseTargetValue}</p>

        ${structuralPriorityHTML}

        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border);">
            <label style="color: var(--primary); font-weight:600; font-size:13px; display:block; margin-bottom: 6px;">
              📊 Overall Year Timeline Progress
            </label>
            <progress max="${yearTotalTargetWindow}" value="${totalYearDaysElapsed}"></progress>
            <p style="text-align: left; font-size: 12px; margin-top: 4px; color: var(--muted); margin-bottom: 0;">
              <strong>Total Elapsed:</strong> ${totalYearDaysElapsed} / ${yearTotalTargetWindow} Days
            </p>
        </div>
      </div>
    `;

    // ===============================
    // RENDER
    // ===============================
    main.innerHTML = html;

    // ===============================
    // CLEANUP GRADE BAR
    // ===============================
    const bar = document.getElementById("grade-progress-bar");
    if (bar) {
      bar.innerHTML = "";
    }

  } catch (err) {
    console.error("Dashboard crash:", err);
  }
}

// =====================================================
// EXPORT
// =====================================================
window.loadDashboard = loadDashboard;
          
