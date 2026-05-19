// ===============================
// WEEKLY TIMETABLE (STABLE VERSION)
// ===============================

function loadWeeklyTimetable() {

  const pages = window.maxPagesByGrade || {};

  const gradeDays = {
    9: 17,
    10: 22,
    11: 27,
    12: 24
  };

  const container = document.getElementById("main-content");
  if (!container) return;

  // ===============================
  // SAFE STATE
  // ===============================
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let state;

  try {
    state = JSON.parse(localStorage.getItem("studyState") || "{}");
  } catch {
    state = {};
  }

  if (!state.startDate) {
    state.startDate = todayStr;
    state.missedDays = 0;
  }

  const daysBetween = (a, b) => {
    const diff = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const missed = daysBetween(state.lastVisit || todayStr, todayStr);

  if (missed > 1) {
    state.missedDays = (state.missedDays || 0) + (missed - 1);
  }

  state.lastVisit = todayStr;

  try {
    localStorage.setItem("studyState", JSON.stringify(state));
  } catch {}

  const BASE_TARGET = 64;
  const DAILY_TARGET = BASE_TARGET + ((state.missedDays || 0) * 8);

  // ===============================
  // UI START
  // ===============================
  let html = `
    <h2>📊 Smart 90-Day Study Plan</h2>

    <div class="weekly-info">
      <p>📅 Today: ${today.toDateString()}</p>
      <p>🔥 Catch-up Level: ${state.missedDays || 0}</p>
      <p>📈 Daily Target: ${DAILY_TARGET} pages</p>
    </div>

    <div class="weekly-table-wrapper">
      <table class="weekly-table">
        <thead>
          <tr>
            <th>Grade</th>
            <th>Days</th>
            <th>Math</th>
            <th>Physics</th>
            <th>Chemistry</th>
            <th>Biology</th>
            <th>English</th>
            <th>Total/Day</th>
            <th>Total Pages</th>
          </tr>
        </thead>
        <tbody>
  `;

  // ===============================
  // TABLE LOGIC (SAFE)
  // ===============================
  [9, 10, 11, 12].forEach(g => {

    const d = pages[g];

    // FIX: don't break entire table if missing
    if (!d) {
      html += `
        <tr>
          <td><b>${g}</b></td>
          <td colspan="8" style="color:red;">No data available</td>
        </tr>
      `;
      return;
    }

    const days = gradeDays[g] || 0;

    const math = Number(d.Math) || 0;
    const physics = Number(d.Physics) || 0;
    const chemistry = Number(d.Chemistry) || 0;
    const biology = Number(d.Biology) || 0;
    const english = Number(d.English) || 0;

    const total = math + physics + chemistry + biology + english;

    if (total === 0) {
      html += `
        <tr>
          <td><b>${g}</b></td>
          <td>${days}</td>
          <td colspan="7">No subject data</td>
        </tr>
      `;
      return;
    }

    const mathP = Math.round((math / total) * DAILY_TARGET);
    const physicsP = Math.round((physics / total) * DAILY_TARGET);
    const chemistryP = Math.round((chemistry / total) * DAILY_TARGET);
    const biologyP = Math.round((biology / total) * DAILY_TARGET);

    let englishP =
      DAILY_TARGET - (mathP + physicsP + chemistryP + biologyP);

    if (englishP < 0) englishP = 0;

    html += `
      <tr>
        <td><b>${g}</b></td>
        <td>${days}</td>
        <td>${mathP}</td>
        <td>${physicsP}</td>
        <td>${chemistryP}</td>
        <td>${biologyP}</td>
        <td>${englishP}</td>
        <td><b>${DAILY_TARGET}</b></td>
        <td><b>${total}</b></td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

// ===============================
// EXPORT (IMPORTANT FIX)
// ===============================
window.loadWeeklyTimetable = loadWeeklyTimetable;
