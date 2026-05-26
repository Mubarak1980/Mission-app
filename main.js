"use strict";

// =====================================================
// 📘 MAIN ENGINE (CASE-ALIGNED & TIMEZONE-SAFE PRODUCTION VERSION)
// =====================================================

(() => {

/* ===============================
   SAFETY WRAPPER
=============================== */
try {

/* ===============================
   MAX PAGES DATA
=============================== */
// Refined: Ensuring object keys do not get overwritten if data.js loads late
window.maxPagesByGrade = window.maxPagesByGrade && Object.keys(window.maxPagesByGrade).length ? window.maxPagesByGrade : {
  9: {
    Math: 363,
    Physics: 174,
    Chemistry: 175,
    Biology: 164,
    English: 223
  },

  10: {
    Math: 385,
    Physics: 249,
    Chemistry: 298,
    Biology: 174,
    English: 316
  },

  11: {
    Math: 479,
    Physics: 329,
    Chemistry: 330,
    Biology: 284,
    English: 283
  },

  12: {
    Math: 416,
    Physics: 177,
    Chemistry: 287,
    Biology: 354,
    English: 263
  }
};

/* ===============================
   CONSTANTS
=============================== */
const GRADES = [9, 10, 11, 12];

const SUBJECTS = [
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "English"
];

const TOTAL_DAYS = 90;

const TOTAL_PAGES = 5705;

/* ===============================
   STORAGE
=============================== */
const Storage = {

  get(key, fallback) {

    try {

      const raw = localStorage.getItem(key);

      if (!raw) return fallback;

      return JSON.parse(raw);

    } catch (err) {

      console.warn("Storage read failed:", key, err);

      return fallback;
    }
  },

  set(key, value) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    } catch (err) {

      console.warn("Storage write failed:", key, err);
    }
  }
};

/* ===============================
   DATE UTIL (LOCAL-SAFE TIMEZONE ADJUSTMENT)
=============================== */
function todayISO() {

  const d = new Date();
  
  // Fixed: Pulls local calendar dates directly to stop UTC rolling over early in East Africa Time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/* ===============================
   CYCLE ENGINE
=============================== */
function getCycleState() {

  const today = todayISO();

  const state = Storage.get(
    "cycleState",
    {
      startDate: today
    }
  );

  const start = new Date(state.startDate);

  const now = new Date(today);

  const diffDays = Math.floor(
    (
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ) -
      Date.UTC(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      )
    ) / 86400000
  );

  const cycleDay = Math.min(
    Math.max(1, diffDays + 1),
    TOTAL_DAYS
  );

  const result = {
    ...state,

    cycleDay,

    remainingDays: Math.max(
      0,
      TOTAL_DAYS - cycleDay
    )
  };

  Storage.set("cycleState", result);

  return result;
}

/* ===============================
   EXPECTED PROGRESS
=============================== */
function getExpectedProgress() {

  const cycle = getCycleState();

  return {

    cycleDay:
      Number(cycle.cycleDay) || 1,

    remainingDays:
      Number(cycle.remainingDays) || 0,

    expectedPages: Math.round(
      (
        (Number(cycle.cycleDay) || 1) /
        TOTAL_DAYS
      ) * TOTAL_PAGES
    )
  };
}

/* ===============================
   ACTUAL PROGRESS
=============================== */
function getActualProgress() {

  let total = 0;

  for (const grade of GRADES) {

    const saved = Storage.get(
      `grade_${grade}_progress`,
      {}
    );

    for (const subject of SUBJECTS) {

      const value = Number(
        saved?.[subject]
      );

      total += isNaN(value)
        ? 0
        : value;
    }
  }

  return Math.max(
    0,
    Math.round(total)
  );
}

/* ===============================
   DELAY STATUS
=============================== */
function getDelayStatus() {

  const expected =
    getExpectedProgress();

  const actual =
    getActualProgress();

  const gap =
    actual - expected.expectedPages;

  let status = "🟢 ON TRACK";

  if (gap >= 300) {

    status = "🟢 AHEAD 🚀";

  } else if (gap >= 0) {

    status = "🟢 ON TRACK";

  } else if (gap >= -150) {

    status = "🟡 SLIGHTLY BEHIND";

  } else if (gap >= -400) {

    status = "🟠 BEHIND";

  } else {

    status = "🔴 CRITICAL";
  }

  return {
    ...expected,
    actualPages: actual,
    gap,
    status
  };
}

/* ===============================
   SMART CYCLE ENGINE
=============================== */
function getSmartCycle() {

  const cycle =
    getDelayStatus();

  const remainingDays = Math.max(
    1,
    TOTAL_DAYS - cycle.cycleDay
  );

  const gap =
    Number(cycle.gap) || 0;

  const baseTarget =
    TOTAL_PAGES / TOTAL_DAYS;

  let catchUpPerDay = 0;

  if (gap < -50) {

    catchUpPerDay = Math.ceil(
      Math.abs(gap) /
      remainingDays
    );
  }

  catchUpPerDay = Math.min(
    catchUpPerDay,
    40
  );

  let dailyTarget =
    baseTarget + catchUpPerDay;

  dailyTarget = Math.max(
    25,
    Math.min(dailyTarget, 90)
  );

  let intensity = "SAFE";

  if (dailyTarget > 75) {

    intensity = "HIGH";

  } else if (dailyTarget > 60) {

    intensity = "MODERATE";
  }

  let pressure = "ON_TRACK";

  if (gap < -500) {

    pressure = "CRITICAL";

  } else if (gap < -250) {

    pressure = "HIGH";

  } else if (gap < -50) {

    pressure = "LOW_BACKLOG";
  }

  return {
    ...cycle,

    remainingDays,

    catchUpPerDay,

    dailyTarget: Math.round(
      dailyTarget
    ),

    intensity,

    pressure,

    baseTarget: Math.round(
      baseTarget
    )
  };
}

/* ===============================
   UI STATE
=============================== */
const UI = {

  currentGrade: 9,

  currentSection: "study",

  save() {

    Storage.set(
      "ui_state",
      {
        grade: this.currentGrade,
        section: this.currentSection
      }
    );
  },

  load() {

    const saved = Storage.get(
      "ui_state",
      null
    );

    if (!saved) return;

    this.currentGrade =
      Number(saved.grade) || 9;

    this.currentSection =
      saved.section || "study";
  }
};

/* ===============================
   NAVIGATION
=============================== */
const Nav = {

  nav: null,
  prev: null,
  next: null,

  init() {

    this.nav =
      document.getElementById(
        "grade-nav"
      );

    this.prev =
      document.getElementById(
        "prev-btn"
      );

    this.next =
      document.getElementById(
        "next-btn"
      );
  },

  update() {

    if (
      !this.nav ||
      !this.prev ||
      !this.next
    ) {
      return;
    }

    if (
      UI.currentSection === "study"
    ) {

      this.nav.style.display =
        "flex";

      this.prev.disabled =
        UI.currentGrade <= 9;

      this.next.disabled =
        UI.currentGrade >= 12;

    } else {

      this.nav.style.display =
        "none";
    }
  }
};

/* ===============================
   SAFE CALL
=============================== */
function safeCall(
  fnName,
  message
) {

  if (
    typeof window[fnName]
    !== "function"
  ) {

    const main =
      document.getElementById(
        "main-content"
      );

    if (main) {

      main.innerHTML = `
        <p style="
          padding:20px;
          color:red;
          text-align:center;
        ">
          ${message}
        </p>
      `;
    }

    console.error(
      `Missing function: ${fnName}`
    );

    return false;
  }

  return true;
}

/* ===============================
   SECTION MAP
=============================== */
const SectionMap = {

  study: () => {

    if (
      !safeCall(
        "loadStudySection",
        "Study Tracker failed to load"
      )
    ) return;

    window.loadStudySection(
      UI.currentGrade
    );
  },

  timetable: () => {

    if (
      !safeCall(
        "loadWeeklyTimetable",
        "Weekly Timetable failed to load"
      )
    ) return;

    window.loadWeeklyTimetable();
  },

  dashboard: () => {

    if (
      !safeCall(
        "loadDashboard",
        "Dashboard failed to load"
      )
    ) return;

    window.loadDashboard();
  },

  "top-student": () => {

    if (
      !safeCall(
        "loadTopStudentMode",
        "Top Student Mode failed to load"
      )
    ) return;

    window.loadTopStudentMode();
  },

  sunnah: () => {

    if (
      !safeCall(
        "loadSunnahTracker",
        "Sunnah Tracker failed to load"
      )
    ) return;

    window.loadSunnahTracker();
  }
};

/* ===============================
   LOAD SECTION
=============================== */
function loadSection(
  type,
  grade
) {

  if (
    typeof type !== "string"
  ) {
    type = "study";
  }

  UI.currentSection = type;

  const parsedGrade =
    Number(grade);

  if (
    !isNaN(parsedGrade)
  ) {

    UI.currentGrade =
      Math.min(
        12,
        Math.max(
          9,
          parsedGrade
        )
      );
  }

  UI.save();

  Nav.update();

  if (
    typeof SectionMap[type]
    === "function"
  ) {

    SectionMap[type]();

  } else {

    console.warn(
      "Unknown section:",
      type
    );
  }
}

/* ===============================
   NAVIGATION ACTIONS
=============================== */
function nextGrade() {

  if (
    UI.currentGrade < 12
  ) {

    loadSection(
      "study",
      UI.currentGrade + 1
    );
  }
}

function previousGrade() {

  if (
    UI.currentGrade > 9
  ) {

    loadSection(
      "study",
      UI.currentGrade - 1
    );
  }
}

/* ===============================
   INIT APP
=============================== */
let initialized = false;

function initApp() {

  if (initialized) return;

  initialized = true;

  UI.load();

  Nav.init();

  getCycleState();

  console.log(
    "✅ Mission App Ready"
  );

  requestAnimationFrame(() => {

    loadSection(
      UI.currentSection,
      UI.currentGrade
    );
  });
}

/* ===============================
   SERVICE WORKER UPDATE LISTENER
=============================== */
if (
  "serviceWorker" in navigator
) {

  navigator.serviceWorker.addEventListener(
    "message",
    (event) => {

      if (
        event.data?.type ===
        "SW_ACTIVATED"
      ) {

        console.log(
          "✅ Service Worker Updated"
        );
      }
    }
  );
}

/* ===============================
   ⚡ IMPLANTED: AUTOMATED NATIVE CHROMIUM INSTALL ACTION
=============================== */
let hasPromptedAutomatedInstall = false;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent older Chromium configurations from taking default pathing actions
  e.preventDefault();

  // Reference the native system prompt callback sequence
  const automaticDeferredPrompt = e;

  // Security Verification Guard: Ensure browser engine execution triggers once
  if (!hasPromptedAutomatedInstall) {
    hasPromptedAutomatedInstall = true;

    // Execute prompt sequence automatically upon application view visibility confirmation
    setTimeout(() => {
      automaticDeferredPrompt.prompt();

      automaticDeferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted automated native PWA installation.");
        } else {
          console.log("User rejected automated native PWA installation.");
        }
      });
    }, 800);
  }
});

/* ===============================
   BOOTSTRAP
=============================== */
if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initApp
  );

} else {

  initApp();
}

/* ===============================
   EXPORTS
=============================== */
window.loadSection =
  loadSection;

window.nextGrade =
  nextGrade;

window.previousGrade =
  previousGrade;

window.UI = UI;

window.getCurrentGradeSafe =
  () => UI.currentGrade || 9;

window.getSmartCycle =
  getSmartCycle;

window.getCycleState =
  getCycleState;

window.getExpectedProgress =
  getExpectedProgress;

window.getActualProgress =
  getActualProgress;

/* ===============================
   FORCE PWA STANDALONE DETECTION
=============================== */
window.isRunningStandalone =
  function () {

    return (
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches ||

      window.navigator.standalone === true ||

      document.referrer.includes(
        "android-app://"
      )
    );
  };

} catch (err) {

  console.error(
    "🔥 Main engine crashed:",
    err
  );
}

})();
     
