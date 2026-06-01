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

  const gradeBar = document.getElementById('grade-progress-bar');
  if (gradeBar) {
    gradeBar.innerHTML = '';
  }

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

    <!-- ================= NEW SECTION ADDED ================= -->
    <div class="top-student-card highlight-card">
      <h3>📘 SMART STUDY SYSTEM</h3>
      <p>This system helps you study with focus, clarity, and real results—not just reading without understanding.</p>

      <h4>1) 🎯 DAILY STUDY GOAL</h4>
      <p>Every study day must start with a clear target.</p>
      <ul>
        <li>What topic am I studying today?</li>
        <li>What will I achieve by the end?</li>
        <li>Example: Solve 20 math questions, summarize 1 chapter, memorize formulas</li>
      </ul>

      <h4>2) 🧱 IDENTIFY YOUR OBSTACLES</h4>
      <ul>
        <li>I don’t understand the topic</li>
        <li>I forget formulas easily</li>
        <li>I get distracted</li>
        <li>I feel tired or unmotivated</li>
      </ul>

      <h4>3) 🛠️ REMOVE OBSTACLES</h4>
      <ul>
        <li>Turn off distractions</li>
        <li>Watch short explanations first</li>
        <li>Write formulas before solving</li>
        <li>Start with easy questions</li>
      </ul>

      <h4>4) ⏱️ STUDY PROCESS</h4>
      <ul>
        <li>Quick Recall (2–5 min)</li>
        <li>Learn (10–20 min)</li>
        <li>Practice problems</li>
        <li>Check & correct mistakes</li>
        <li>Final recall without notes</li>
      </ul>

      <h4>5) 📊 DAILY SUCCESS TARGET</h4>
      <ul>
        <li>1 topic mastered</li>
        <li>20–30 questions solved</li>
        <li>3 mistakes corrected</li>
        <li>Short summary written</li>
      </ul>

      <h4>6) 🔁 WEEKLY PLAN</h4>
      <ul>
        <li>Days 1–2: Learn concepts</li>
        <li>Days 3–4: Practice</li>
        <li>Day 5: Hard problems</li>
        <li>Day 6: Mixed test</li>
        <li>Day 7: Review weak areas</li>
      </ul>

      <h4>7) 🔄 IF YOU DON’T UNDERSTAND</h4>
      <ul>
        <li>Simplify topic</li>
        <li>Change learning method</li>
        <li>Start easier questions</li>
        <li>Retry later</li>
      </ul>

      <h4>8) 📌 END OF DAY REVIEW</h4>
      <ul>
        <li>Did I complete my goal?</li>
        <li>What stopped me?</li>
        <li>What did I learn?</li>
        <li>What will I improve tomorrow?</li>
      </ul>

      <p><strong>⚡ Final Message:</strong> Success comes from clarity, not long hours.</p>
    </div>
    <!-- ==================================================== -->

    <div class="top-student-card">
      <h3>⚙️ Systems & Environment</h3>
      <ul>
        <li><strong>Identity Shift:</strong> You don’t rise to goals — you fall to your systems. Build systems that reflect your identity.</li>
        <li><strong>Time Perception:</strong> The hurdle of a task feels larger before starting; starting immediately collapses that perception.</li>
        <li><strong>Environment Control:</strong> Remove distractions.</li>
        <li><strong>Progress Feedback:</strong> Tracking sustains effort.</li>
      </ul>
    </div>

    <div class="top-student-card">
      <h3>🔋 Performance & Sustainability</h3>
      <ul>
        <li><strong>Recovery Matters:</strong> Sleep consolidates memory.</li>
        <li><strong>Small Wins:</strong> Break tasks into micro units.</li>
        <li><strong>Goal Clarity:</strong> Clear targets guide focus.</li>
      </ul>
    </div>

    <div class="top-student-card highlight-card">
      <h3>🚀 Core Principle</h3>
      <p>
        Intelligence is not fixed. Systems, repetition, and disciplined action transform average students into top performers.
      </p>
    </div>
  `;

  mainContent.replaceChildren(container);
};
