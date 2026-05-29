// ==========================================================
// 📊 CENTRAL METRIC DASHBOARD ENGINE (REPAIR OPTIMIZED)
// ==========================================================

"use strict";

function loadDashboard() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error("[System Error] Critical layout root '#main-content' is missing.");
    return;
  }

  // 🔒 FIXED: Safety gate to read state from the centralized storage layer smoothly
  const state = window.Storage 
    ? window.Storage.get("studyState", { startDate: "Not Started", cycleNumber: 1 }) 
    : { startDate: "Not Started", cycleNumber: 1 };

  // 🔒 FIXED: Robust fallback metric schema to guarantee the UI renders even during async script delays
  const defaultMetrics = {
    status: "SYSTEM INITIALIZING",
    cycleDay: 0,
    remainingDays: 90,
    expectedPages: 0,
    actualPages: 0,
    gap: 0,
    baseTarget: 64,
    catchUpPerDay: 0,
    dailyTarget: 64,
    TOTAL_PAGES: 1422, // Automatically paired to match your overall curriculum limits
    totalPagesPercentage: 0
  };

  let metrics = defaultMetrics;

  try {
    if (typeof window.getSmartCycle === "function") {
      metrics = window.getSmartCycle();
    } else {
      console.warn("[System Warn] 'window.getSmartCycle' engine missing. Utilizing core layout fallbacks.");
      
      // Dynamic fallback calculations to keep the UI active if the engine is temporarily unlinked
      if (state.startDate && state.startDate !== "Not Started") {
        const start = new Date(state.startDate);
        const today = new Date();
        const diffTime = Math.abs(today - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        metrics.cycleDay = Math.min(90, diffDays);
        metrics.remainingDays = Math.max(0, 90 - metrics.cycleDay);
        metrics.expectedPages = metrics.cycleDay * metrics.baseTarget;
        
        // Safely extract cross-grade progress if available
        let aggregatePages = 0;
        [9, 10, 11, 12].forEach(g => {
          const prog = window.Storage ? window.Storage.get(`grade_${g}_progress`, {}) : {};
          Object.values(prog).forEach(v => { aggregatePages += (Number(v) || 0); });
        });
        
        metrics.actualPages = aggregatePages;
        metrics.gap = metrics.actualPages - metrics.expectedPages;
        metrics.totalPagesPercentage = Math.min(100, parseFloat(((metrics.actualPages / metrics.TOTAL_PAGES) * 100).toFixed(1))) || 0;
        
        if (metrics.gap < -150) metrics.status = "CRITICAL DELAY DETECTED";
        else if (metrics.gap < 0) metrics.status = "BEHIND TARGET SCHEDULE";
        else metrics.status = "OPTIMAL STABLE PACE";
      }
    }
  } catch (err) {
    console.error("[System Engine Exception] Failed to evaluate smart cycle calculation paths:", err);
  }

  // Assign metric notification tags matching your design variables
  let statusColor = "#00ffa6"; 
  if (metrics.status.includes("CRITICAL")) statusColor = "#ff4d4d";
  else if (metrics.status.includes("BEHIND")) statusColor = "#ff9f43";

  const container = document.createElement("div");
  container.className = "dashboard-wrapper";

  container.innerHTML = `
    <h2>📊 Strategic Metrics Dashboard</h2>
    
    <div class="subject" style="border-left: 5px solid var(--primary); background: rgba(0, 212, 255, 0.02);">
      <h3>🔄 Active Plan Configuration</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 12px;">
        <div>
          <span style="color: var(--muted); font-size: 12px; display:block; text-transform: uppercase;">Tracking Cycle</span>
          <strong style="font-size: 18px; color: #ffffff;">Quarterly Cycle #${state.cycleNumber || 1}</strong>
        </div>
        <div>
          <span style="color: var(--muted); font-size: 12px; display:block; text-transform: uppercase;">Plan Commencement</span>
          <strong style="font-size: 16px; color: var(--primary);">${state.startDate || "N/A"}</strong>
        </div>
        <div>
          <span style="color: var(--muted); font-size: 12px; display:block; text-transform: uppercase;">Temporal Pace Status</span>
          <strong style="font-size: 16px; color: ${statusColor};">${metrics.status}</strong>
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <div class="dashboard-subject">
        <h3>📅 Velocity Pacing</h3>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Day Allocation: <strong style="color:#fff;">${metrics.cycleDay} / 90 Days</strong>
        </p>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Remaining Window: <strong style="color:var(--primary);">${metrics.remainingDays} Days Left</strong>
        </p>
      </div>

      <div class="dashboard-subject">
        <h3>📈 Absolute Target Index</h3>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Milestone Target: <strong style="color:#fff;">${metrics.expectedPages} Pages</strong>
        </p>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Actual Coverage: <strong style="color:var(--primary);">${metrics.actualPages} Pages Done</strong>
        </p>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Realized Deficit/Gain: <strong style="color:${metrics.gap >= 0 ? '#00ffa6' : '#ff4d4d'};">${metrics.gap >= 0 ? '+' : ''}${metrics.gap} Pages</strong>
        </p>
      </div>

      <div class="dashboard-subject">
        <h3>🧠 Daily Backlog Balancer</h3>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Base Run Rate: <strong style="color:#fff;">${metrics.baseTarget} Pages / Day</strong>
        </p>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Backlog Amortization: <strong style="color:#ff9f43;">+${metrics.catchUpPerDay || 0} Pages / Day</strong>
        </p>
        <p style="text-align: left; margin-bottom: 8px; font-size: 14px;">
          Required Target: <strong style="color:var(--primary); font-size: 16px;">${metrics.dailyTarget} Pages / Day</strong>
        </p>
      </div>
    </div>

    <div class="subject" style="margin-top: 20px;">
      <h3>📊 Total Cross-Curriculum Progress Overview</h3>
      <progress max="${metrics.TOTAL_PAGES}" value="${metrics.actualPages}"></progress>
      <div style="display:flex; justify-content: space-between; font-size:12px; color: var(--muted); margin-top:4px;">
        <span>${metrics.actualPages} / ${metrics.TOTAL_PAGES} Master Pages</span>
        <span>${metrics.totalPagesPercentage}% Complete</span>
      </div>
    </div>

    <div class="top-student-card" style="margin-top: 24px; border: 1px dashed var(--border); text-align: center; padding: 24px;">
      <h3 style="color: #ff4d4d;">⚠️ Strategic Reset & Rotation Management</h3>
      <p style="text-align: center; margin-bottom: 16px; color: var(--muted);">
        Resetting starts a new 90-day cycle. This action keeps your tracked study page records safe while updating the calendar schedule.
      </p>
      <button 
        style="background: #1f141a; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; -webkit-tap-highlight-color: transparent;"
        onmouseover="this.style.background='#ff4d4d'; this.style.color='#fff';"
        onmouseout="this.style.background='#1f141a'; this.style.color='#ff4d4d';"
        onclick="window.rotateStrategicQuarterlyCycle()"
      >
        Execute Advanced Cycle Rotation
      </button>
    </div>
  `;

  // Safe DOM swapping injection to secure display outputs instantly
  mainContent.replaceChildren(container);
}

function rotateStrategicQuarterlyCycle() {
  const confirmation = confirm("Confirm System Rotation:\n\nThis will shift the calendar timeline into the next 90-day tracking window. Page progress records will be preserved.");
  if (!confirmation || !window.Storage) return;

  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayISO = `${year}-${month}-${day}`;

  const currentState = window.Storage.get("studyState", { cycleNumber: 1 });
  const nextCycleNumber = (Number(currentState.cycleNumber) || 1) + 1;

  const newCycleState = {
    startDate: todayISO,
    cycleNumber: nextCycleNumber,
    missedDays: 0,
    lastVisit: todayISO
  };

  window.Storage.set("studyState", newCycleState);
  alert(`🚀 Success! Commenced Cycle #${nextCycleNumber} on launch date: ${todayISO}.`);
  loadDashboard();
}

// Global runtime execution matrix exposure
window.loadDashboard = loadDashboard;
window.rotateStrategicQuarterlyCycle = rotateStrategicQuarterlyCycle;
              
