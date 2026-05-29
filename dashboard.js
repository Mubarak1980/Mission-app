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
                
                // 🔒 THURSDAY & FRIDAY COMPLIANCE DAYS FILTER
                let activeDaysCount = 0;
                let tempDate = new Date(start);
                
                while (tempDate <= today) {
                    const dayOfWeek = tempDate.getDay(); 
                    if (dayOfWeek !== 4 && dayOfWeek !== 5) {
                        activeDaysCount++;
                    }
                    tempDate.setDate(tempDate.getDate() + 1);
                }
                
                return Math.max(1, activeDaysCount);
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
// 📊 DASHBOARD (PROFESSIONAL MANAGEMENT STYLE)
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
          <div style="width: 100%; height: 6px; background: #1f2a36; border-radius: 4px; overflow: hidden; margin: 8px 0;">
            <div style="width: ${accurateAvg}%; height: 100%; background: #388bfd; border-radius: 4px;"></div>
          </div>
          <p style="margin: 8px 0 0 0; display: flex !important; align-items: center !important; justify-content: space-between !important; flex-wrap: nowrap !important; gap: 8px !important;">
            <span style="font-weight: 600; white-space: nowrap;">${accurateAvg}% progress</span>
            <span style="font-size:0.85em; color:#8b949e; white-space: nowrap; text-align: right;">
              (${totalAbsoluteDone}/${totalAbsoluteMax} pgs)
            </span>
          </p>
        </div>
      `;
    });

    html += `</div>`;

    // =====================================================
    // ⚙️ FETCH LIVE CORE ENGINE METRICS
    // =====================================================
    let masterMetrics = {
      actualPages: 0,
      TOTAL_PAGES: 5705,
      totalPagesPercentage: 0,
      remainingPages: 5705
    };

    if (typeof window.getSmartCycle === "function") {
      const liveCycleData = window.getSmartCycle();
      if (liveCycleData) {
        masterMetrics.actualPages = liveCycleData.actualPages || 0;
        masterMetrics.TOTAL_PAGES = liveCycleData.TOTAL_PAGES || 5705;
        masterMetrics.totalPagesPercentage = liveCycleData.totalPagesPercentage || 0;
        masterMetrics.remainingPages = liveCycleData.remainingPages || 0;
      }
    }

    // =====================================================
    // FETCH LIVE TIMELINES WITH COMPLIANCE EXCLUSIONS
    // =====================================================
    const currentStudyData = JSON.parse(localStorage.getItem("study_progress")) || {};
    const runningCycleNum = Number(currentStudyData.cycleNumber) || 1;
    const localStartStr = currentStudyData.startDate || new Date().toISOString().split("T")[0];
    
    const currentDayOfWeek = new Date().getDay();
    const isFreeTimeDay = (currentDayOfWeek === 4 || currentDayOfWeek === 5); // Thursday or Friday

    const rawDaysCount = (function(start) {
        try {
            const today = new Date(); const s = new Date(start);
            if(isNaN(s.getTime())) return 1;
            today.setHours(0,0,0,0); s.setHours(0,0,0,0);
            
            let activeDays = 0;
            let temp = new Date(s);
            while(temp <= today) {
                const dayW = temp.getDay();
                if(dayW !== 4 && dayW !== 5) {
                    activeDays++;
                }
                temp.setDate(temp.getDate() + 1);
            }
            return Math.max(1, activeDays);
        } catch { return 1; }
    })(localStartStr);

    const cleanCycleDay = Math.min(rawDaysCount, 90);
    const cleanRemainingDays = Math.max(0, 90 - cleanCycleDay);
    
    const totalYearDaysElapsed = ((runningCycleNum - 1) * 90) + cleanCycleDay;
    const yearTotalTargetWindow = 360;

    const yearProgressRawPct = (totalYearDaysElapsed / yearTotalTargetWindow) * 100;
    const yearProgressVisiblePct = totalYearDaysElapsed > 0 ? Math.max(1.5, yearProgressRawPct) : 0;
    const roundedYearProgressLabel = (totalYearDaysElapsed / yearTotalTargetWindow * 100).toFixed(1);

    let baseTargetValue = 63;
    if (typeof window.getSmartCycle === "function") {
      const smart = window.getSmartCycle();
      const extractedBase = Number(smart?.baseTarget);
      baseTargetValue = (!isNaN(extractedBase) && extractedBase > 0) ? extractedBase : 63;
    }

    // =====================================================
    // 🧮 EXPONENTIAL SUBJECT WEIGHTING & GLOBAL SURPLUS
    // =====================================================
    let exponentialWeights = {};
    let totalWeightFactor = 0;
    let globalTotalDone = 0;
    let globalTotalExpectedToday = 0;

    subjects.forEach(subject => {
      const stats = subjectStats[subject] || { done: 0, max: 0 };
      const expectedCompletionRate = totalYearDaysElapsed / yearTotalTargetWindow;
      const expectedPagesToday = Math.round(stats.max * expectedCompletionRate);
      const currentDeficit = Math.max(0, expectedPagesToday - stats.done);
      
      globalTotalDone += stats.done;
      globalTotalExpectedToday += expectedPagesToday;

      const calculatedWeight = Math.pow(currentDeficit, 2) + 1; 
      exponentialWeights[subject] = calculatedWeight;
      totalWeightFactor += calculatedWeight;
    });

    const globalSurplusGap = globalTotalDone - globalTotalExpectedToday;
    let originalBaseTargetValue = baseTargetValue;
    
    if (globalSurplusGap > 0 && cleanRemainingDays > 0) {
      const dailyReliefCredit = Math.floor(globalSurplusGap / cleanRemainingDays);
      baseTargetValue = Math.max(10, baseTargetValue - dailyReliefCredit);
    }

    if (isFreeTimeDay) {
      baseTargetValue = 0;
    }

    let targetSubtextLabel = `<span style="white-space: nowrap; color: #8b949e;">Allocation Window: ${baseTargetValue} pages</span>`;
    if (isFreeTimeDay) {
       targetSubtextLabel = `<span style="color: #2ecc71; font-weight: bold; white-space: nowrap;">⚡ SCHEDULED REST RECOVERY ACTIVE</span>`;
    } else if (baseTargetValue < originalBaseTargetValue) {
       targetSubtextLabel += ` <span style="color: #2ecc71; font-weight: 600; display: inline-block;">(Surplus Optimization: -${originalBaseTargetValue - baseTargetValue} pgs)</span>`;
    }

    let structuralPriorityHTML = `<div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #1f2a36;">
        <label style="color: #00d4ff; font-weight:700; font-size:0.9rem; display:block; margin-bottom: 10px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.5px;">
          📈 Operational Daily Priorities <br>${targetSubtextLabel}
        </label><ul style="list-style: none !important; padding: 0 !important; margin: 0 !important; display: flex !important; flex-direction: column !important; gap: 8px !important;">`;

    let checkSumAllocatedPages = 0;
    const individualTargets = [];

    subjects.forEach((subject, idx) => {
      const portion = totalWeightFactor ? (exponentialWeights[subject] / totalWeightFactor) : 0;
      let targetForSubject = isFreeTimeDay ? 0 : Math.floor(portion * baseTargetValue);
      
      individualTargets.push({ subject, target: targetForSubject });
      checkSumAllocatedPages += targetForSubject;
    });

    if (!isFreeTimeDay) {
      let missingRemainder = baseTargetValue - checkSumAllocatedPages;
      while (missingRemainder > 0) {
        individualTargets.sort((a, b) => exponentialWeights[b.subject] - exponentialWeights[a.subject]);
        individualTargets[0].target += 1;
        missingRemainder--;
      }
    }

    individualTargets.forEach(item => {
      const weightScore = exponentialWeights[item.subject];
      let priorityAlertIndicator = "";
      
      if (isFreeTimeDay) {
         priorityAlertIndicator = `<span style="color: #e5c158; font-weight: 600; white-space: nowrap !important; text-align: right; display: inline-block !important; letter-spacing: 0.3px;">🔋 Recharge</span>`;
      } else if (weightScore > 1000) {
         priorityAlertIndicator = `<span style="color: #ff4d4d; font-weight: bold; white-space: nowrap !important; text-align: right; display: inline-block !important; letter-spacing: 0.3px;">⚠️ Critical Deficit</span>`;
      } else if (weightScore > 1) {
         priorityAlertIndicator = `<span style="color: #00d4ff; font-weight: 600; white-space: nowrap !important; text-align: right; display: inline-block !important; letter-spacing: 0.3px;">📊 Behind Target</span>`;
      } else {
         priorityAlertIndicator = `<span style="color: #2ecc71; font-weight: 600; white-space: nowrap !important; text-align: right; display: inline-block !important; letter-spacing: 0.3px;">✅ Metrics Nominal</span>`;
      }

      structuralPriorityHTML += `
        <li style="margin: 0 !important; padding: 12px 14px !important; background: rgba(255,255,255,0.02) !important; border: 1px solid #1f2a36 !important; border-radius: 8px !important; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; width: 100% !important; box-sizing: border-box !important;">
          <div style="color: #e6edf3 !important; font-size: 0.9rem !important; font-weight: 500 !important; display: flex !important; align-items: center !important; gap: 6px !important; white-space: nowrap !important; flex-shrink: 0 !important;">
            <span style="color: #8b949e; font-weight: 600;">${item.subject}:</span>
            <span style="color: #00d4ff; font-weight: 700;">${item.target}</span>
            <span style="color: #8b949e; font-size: 0.8rem; font-weight: 400;">pages</span>
          </div>
          <div style="display: flex !important; align-items: center !important; justify-content: flex-end !important; flex-grow: 1 !important; text-align: right !important;">
            ${priorityAlertIndicator}
          </div>
        </li>
      `;
    });

    // Close the list element completely
    structuralPriorityHTML += `</ul>`;

    // ====================================================================
    // 🎛️ INTEGRATED PROGRESS TRACKS (MOVED INSIDE OPERATIONAL PRIORITIES)
    // ====================================================================
    structuralPriorityHTML += `
      <div style="margin-top: 20px; padding: 12px; background: rgba(0, 212, 255, 0.02); border: 1px solid #1f2a36; border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.82rem;">
          <span style="color: #8b949e; font-weight: 600;">🎯 Master Pages Completion</span>
          <span style="color: #00d4ff; font-weight: 700;">${masterMetrics.totalPagesPercentage}% Done</span>
        </div>
        <div style="width: 100%; height: 6px; background: #1f2a36; border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
          <div style="width: ${masterMetrics.totalPagesPercentage}%; height: 100%; background: linear-gradient(90deg, #005f73, #00d4ff); border-radius: 3px;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #8b949e;">
          <span>Completed: <strong>${masterMetrics.actualPages.toLocaleString()} / ${masterMetrics.TOTAL_PAGES.toLocaleString()}</strong> pgs</span>
          <span style="color: #e5c158;">${masterMetrics.remainingPages.toLocaleString()} left</span>
        </div>
      </div>

      <div style="margin-top: 12px; padding: 12px; background: rgba(46, 204, 113, 0.02); border: 1px solid #1f2a36; border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.82rem;">
          <span style="color: #8b949e; font-weight: 600;">📅 Overall Year Timeline</span>
          <span style="color: #2ecc71; font-weight: 700;">${roundedYearProgressLabel}% Elapsed</span>
        </div>
        <div style="width: 100%; height: 6px; background: #1f2a36; border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
          <div style="width: ${yearProgressVisiblePct}%; height: 100%; background: linear-gradient(90deg, #1e7e34, #2ecc71); border-radius: 3px;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #8b949e;">
          <span>Elapsed Time: <strong>${totalYearDaysElapsed.toLocaleString()} / ${yearTotalTargetWindow.toLocaleString()}</strong> days</span>
          <span style="color: #ff4d4d;">${Math.max(0, yearTotalTargetWindow - totalYearDaysElapsed)} left</span>
        </div>
      </div>
    </div>`; // Closes Operational Daily Priorities card wrapper

    // =====================================================
    // 🧠 SMART STUDY ENGINE CONTAINER ASSEMBLY
    // =====================================================
    html += `
      <div class="smart-cycle-section" style="padding: 16px; margin-top: 16px; background: #121821; border: 1px solid #1f2a36; border-radius: 14px;">
        <h2 style="margin-top: 0; margin-bottom: 14px; font-size: 1.15rem; color: #e6edf3; font-weight: 700; border: none; padding: 0; text-transform: uppercase; letter-spacing: 0.5px;">🧠 Smart Study Engine</h2>
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 0.95rem; color: #8b949e; font-weight: 600;">⏱️ Cycle ${runningCycleNum} Operations</h3>

        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem;">
          <p style="margin: 0; display: flex; justify-content: space-between; flex-wrap: nowrap; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 6px;">
            <span style="color: #8b949e;">📅 Current Cycle Day:</span> 
            <span style="color: #e5c158; font-weight: 700; white-space: nowrap;">${cleanCycleDay}/90</span>
          </p>
          <p style="margin: 0; display: flex; justify-content: space-between; flex-wrap: nowrap; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 6px;">
            <span style="color: #ff4d4d;">📉 Cycle Remaining:</span> 
            <span style="color: #ff4d4d; font-weight: 700; white-space: nowrap;">${cleanRemainingDays} Days</span>
          </p>
          <p style="margin: 0; display: flex; justify-content: space-between; flex-wrap: nowrap; padding-bottom: 4px;">
            <span style="color: #8b949e;">📌 Base Target:</span> 
            <span style="color: #00d4ff; font-weight: 700; white-space: nowrap;">
              ${isFreeTimeDay ? `${originalBaseTargetValue} pages (Reserved)` : `${originalBaseTargetValue} pages`}
            </span>
          </p>
        </div>

        ${structuralPriorityHTML}
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
            
