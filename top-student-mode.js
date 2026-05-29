"use strict";

// ==========================================================
// 🎓 TOP STUDENT MODE RUNTIME MODULE (ENTERPRISE STANDARD)
// ==========================================================

window.loadTopStudentMode = (grade) => {
  const mainContent = document.getElementById('main-content');

  if (!mainContent) {
    console.error('[System] Main content container not found');
    return;
  }

  // 1. Maintain consistent UI state
  // Even though this module is static/informative, we clear the progress bar 
  // to maintain visual cleanliness consistent with other modules.
  const gradeBar = document.getElementById('grade-progress-bar');
  if (gradeBar) {
    gradeBar.innerHTML = '';
  }

  // 2. Build the structural hierarchy
  const container = document.createElement("div");
  container.className = "top-student-container";

  container.innerHTML = `
    <h2>🎓 Top Student Mode</h2>

    <p class="top-student-intro">
      Academic excellence is built through neuroscience, habit systems, and disciplined execution.
    </p>

    <div class="top-student-card">
      <h3>🧠 Brain & Discipline</h3>
      <ul>
        <li><strong>Discipline & Brain Adaptation:</strong> The brain rewires itself through repetition. Every focused study session strengthens neural pathways.</li>
        <li><strong>Starting is the Hardest Part:</strong> Resistance is highest before action. Cognitive momentum reduces effort perception.</li>
        <li><strong>Consistency Over Motivation:</strong> Habits automate behavior, reducing reliance on fluctuating willpower.</li>
        <li><strong>Habit Formation:</strong> Actions repeated in stable contexts (time/place) minimize decision fatigue.</li>
      </ul>
    </div>

    <div class="top-student-card">
      <h3>📚 Scientific Study Methods</h3>
      <ul>
        <li><strong>Active Recall:</strong> Testing yourself strengthens memory more than passive re-reading.</li>
        <li><strong>Spaced Repetition:</strong> Information reviewed over intervals is retained significantly longer.</li>
        <li><strong>Deep Focus:</strong> 25 minutes of undistracted work outperforms hours of shallow, fragmented study.</li>
        <li><strong>Difficulty = Growth:</strong> Effortful processing is a signal that your brain is re-wiring for understanding.</li>
      </ul>
    </div>

    <div class="top-student-card">
      <h3>⚙️ Systems & Environment</h3>
      <ul>
        <li><strong>Identity Shift:</strong> You don’t rise to goals — you fall to your systems. Build systems that reflect your identity.</li>
        <li><strong>Time Perception:</strong> The hurdle of a task feels larger before starting; starting immediately collapses that perception.</li>
        <li><strong>Environment Control:</strong> Remove digital or physical distractions to force your brain into focus mode.</li>
        <li><strong>Progress Feedback:</strong> Visible tracking triggers reward systems that sustain long-term effort.</li>
      </ul>
    </div>

    <div class="top-student-card">
      <h3>🔋 Performance & Sustainability</h3>
      <ul>
        <li><strong>Recovery Matters:</strong> Sleep consolidates memory; learning efficiency drops without adequate rest.</li>
        <li><strong>Small Wins:</strong> Breaking tasks into micro-units reduces cognitive load and guarantees completion.</li>
        <li><strong>Goal Clarity:</strong> Clear, measurable targets act as a compass for directing daily focus.</li>
      </ul>
    </div>

    <div class="top-student-card">
      <h3>🧠⚖️ Performance & Body–Brain Balance</h3>
      <ul>
        <li><strong>Integrated Performance:</strong> Focus cycles + movement + recovery equals maximum neural efficiency.</li>
        <li><strong>Focus Cycles:</strong> Intense sessions followed by rest restores attention capacity.</li>
        <li><strong>Movement & Cognitive Function:</strong> Physical activity boosts oxygen/glucose delivery to the brain.</li>
        <li><strong>Recovery = Consolidation:</strong> Breaks are active parts of learning, allowing for memory consolidation.</li>
      </ul>
    </div>

    <div class="top-student-card highlight-card">
      <h3>🚀 Core Principle</h3>
      <p>
        Intelligence is not fixed. Systems, repetition, and disciplined action transform average students into top performers.
      </p>
    </div>
  `;

  // 3. Atomically update the DOM
  mainContent.replaceChildren(container);
};
