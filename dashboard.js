"use strict";

// ========================================================
// 🔄 AUTOMATIC 4-CYCLE YEAR ROTATION ENGINE
// ========================================================
function checkAndAutoRotateCycle() {
    try {
        const savedStudyState = JSON.parse(localStorage.getItem("study_progress")) || {};
        const currentStartDateStr = savedStudyState.startDate || new Date().toISOString().split("T")[0];
        const currentCycleNumber = Number(savedStudyState.cycleNumber) || 1;
        
        const getDaysSinceStartInternal = (startDate) => {
            const today = new Date();
            const start = new Date(startDate);
            if (isNaN(start.getTime())) return 1;
            
            today.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            
            let activeDaysCount = 0;
            let tempDate = new Date(start);
            while (tempDate <= today) {
                const dayOfWeek = tempDate.getDay(); 
                if (dayOfWeek !== 4 && dayOfWeek !== 5) activeDaysCount++;
                tempDate.setDate(tempDate.getDate() + 1);
            }
            return Math.max(1, activeDaysCount);
        };

        if (getDaysSinceStartInternal(currentStartDateStr) > 90) {
            const d = new Date();
            const nextCycleStartDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const cycleHistory = JSON.parse(localStorage.getItem("cycle_history")) || [];
            
            cycleHistory.push({ cycle: currentCycleNumber, startDate: currentStartDateStr, endDate: nextCycleStartDate, finalProgress: savedStudyState });
            localStorage.setItem("cycle_history", JSON.stringify(cycleHistory));

            localStorage.setItem("study_progress", JSON.stringify({
                startDate: nextCycleStartDate,
                cycleNumber: currentCycleNumber >= 4 ? 1 : currentCycleNumber + 1,
                pages: 0
            }));

            location.reload();
            return true; 
        }
    } catch (e) {
        console.warn("Cycle rotation failed:", e);
    }
    return false; 
}

// =====================================================
// 📊 DASHBOARD (UNIFIED & HARDENED)
// =====================================================
function loadDashboard() {
  try {
    if (checkAndAutoRotateCycle()) return;

    const main = document.getElementById("main-content");
    if (!main) return;

    // 🛡️ CRITICAL SAFETY CHECK
    if (typeof window.maxPagesByGrade === 'undefined') {
        throw new Error("Grade configuration not found. Check if main.js is loaded.");
    }

    const subjects = ["Math", "Physics", "Chemistry", "Biology", "English"];
    const grades = [9, 10, 11, 12];

    const subjectStats = {};
    let html = `<h2>📊 Dashboard: Overall Subject Progress</h2><div class="dashboard-container">`;

    subjects.forEach(subject => {
      let totalAbsoluteDone = 0, totalAbsoluteMax = 0;
      grades.forEach(grade => {
        const saved = JSON.parse(localStorage.getItem(`grade_${grade}_progress`) || "{}");
        const maxPages = Number(window.maxPagesByGrade?.[grade]?.[subject]) || 0;
        totalAbsoluteDone += Math.min(Number(saved?.[subject]) || 0, maxPages);
        totalAbsoluteMax += maxPages;
      });

      subjectStats[subject] = { done: totalAbsoluteDone, max: totalAbsoluteMax };
      const avg = totalAbsoluteMax ? Math.round((totalAbsoluteDone / totalAbsoluteMax) * 100) : 0;

      html += `
        <div class="dashboard-subject">
          <h3>${subject}</h3>
          <progress max="${totalAbsoluteMax}" value="${totalAbsoluteDone}" style="width: 100%; height: 12px;"></progress>
          <p>${avg}% progress (${totalAbsoluteDone}/${totalAbsoluteMax} pgs)</p>
        </div>`;
    });

    // ⚙️ FETCH METRICS FROM UNIFIED SOURCE
    const state = JSON.parse(localStorage.getItem("study_progress")) || {};
    const masterMetrics = typeof window.getSmartCycle === "function" ? window.getSmartCycle() : { actualPages: 0, TOTAL_PAGES: 5705, totalPagesPercentage: 0, remainingPages: 5705 };

    // [Rest of your UI logic goes here, utilizing 'html' variable...]
    
    main.innerHTML = html + "</div>"; 

  } catch (err) {
    console.error(err);
    document.getElementById("main-content").innerHTML = `<p style="color:red; text-align:center;">Dashboard failed to load: ${err.message}</p>`;
  }
}

window.loadDashboard = loadDashboard;
