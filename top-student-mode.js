// ===============================
// top-student-mode.js (IMPROVED PWA SAFE)
// ===============================

"use strict";

function loadTopStudentMode() {
  const mainContent = document.getElementById('main-content');

  if (!mainContent) {
    console.error('Main content container not found');
    return;
  }

  // Clear the top progress bar safely
  const gradeBar = document.getElementById('grade-progress-bar');
  if (gradeBar) {
    gradeBar.innerHTML = '';
  }

  // Prevent accidental HTML injection issues (safe render wrapper)
  const container = document.createElement("div");

  container.innerHTML = `
    <div class="top-student-container">
      <h2>🎓 Top Student Mode</h2>

      <p class="top-student-intro">
        Academic excellence is built through neuroscience, habit systems, and disciplined execution.
      </p>

      <div class="top-student-card">
        <h3>🧠 Brain & Discipline</h3>
        <ul>
          <li><strong>Discipline & Brain Adaptation:</strong> The brain rewires itself through repetition. Every focused study session strengthens neural pathways, making the next session easier.</li>
          <li><strong>Starting is the Hardest Part:</strong> Resistance is highest before action. Once you begin, cognitive momentum reduces effort perception.</li>
          <li><strong>Consistency Over Motivation:</strong> Motivation fluctuates, but habits automate behavior. Repeated actions reduce reliance on willpower.</li>
          <li><strong>Habit Formation:</strong> Habits form when actions are repeated in stable contexts. Same time, same place — less decision, more execution.</li>
        </ul>
      </div>

      <div class="top-student-card">
        <h3>📚 Scientific Study Methods</h3>
        <ul>
          <li><strong>Active Recall:</strong> Testing yourself strengthens memory more than rereading. Retrieval is the engine of long-term retention.</li>
          <li><strong>Spaced Repetition:</strong> Information reviewed over spaced intervals is retained longer than massed study.</li>
          <li><strong>Deep Focus:</strong> Undistracted attention increases learning efficiency. Even 25 minutes of deep work outperforms hours of shallow study.</li>
          <li><strong>Difficulty = Growth:</strong> Struggle signals learning. Effortful processing strengthens understanding and recall.</li>
        </ul>
      </div>

      <div class="top-student-card">
        <h3>⚙️ Systems & Environment</h3>
        <ul>
          <li><strong>Identity Shift:</strong> You don’t rise to goals — you fall to your systems. Build systems that reflect the identity of a disciplined student.</li>
          <li><strong>Time Perception Trick:</strong> Starting reduces perceived duration. Tasks feel longer before you begin than after you engage.</li>
          <li><strong>Environment Control:</strong> Behavior is shaped by environment. Remove distractions and the brain defaults to focus.</li>
          <li><strong>Progress Feedback:</strong> Visible progress reinforces behavior. Tracking activates reward systems and sustains effort.</li>
        </ul>
      </div>

      <div class="top-student-card">
        <h3>🔋 Performance & Sustainability</h3>
        <ul>
          <li><strong>Recovery Matters:</strong> Sleep consolidates memory. Without rest, learning efficiency drops significantly.</li>
          <li><strong>Small Wins Strategy:</strong> Breaking tasks into small units reduces cognitive load and increases completion probability.</li>
          <li><strong>Goal Clarity:</strong> Clear, measurable goals improve performance by directing attention and effort.</li>
        </ul>
      </div>

      <div class="top-student-card">
        <h3>🧠⚖️ Performance & Body–Brain Balance</h3>
        <ul>
          <li><strong>Integrated Performance Principle:</strong> Top performance is not long sitting — it is cycles of focused learning, movement, and recovery that keep both brain and body strong.</li>

          <li><strong>Neuroscience of Focus Cycles:</strong> The brain performs best in short, intense focus sessions followed by recovery periods that restore attention and memory capacity.</li>

          <li><strong>Movement & Cognitive Function:</strong> Physical activity increases oxygen and glucose delivery to the brain, improving concentration, memory, and problem-solving speed.</li>

          <li><strong>Sitting Time Adaptation Principle:</strong> Long uninterrupted sitting reduces circulation efficiency and increases fatigue; regular movement resets cognitive performance.</li>

          <li><strong>Recovery = Learning Strengthening:</strong> Rest, sleep, and breaks are part of learning because they allow memory consolidation and neural strengthening.</li>
        </ul>
      </div>

      <div class="top-student-card highlight-card">
        <h3>🚀 Core Principle</h3>
        <p>
          Intelligence is not fixed. Systems, repetition, and disciplined action transform average students into top performers.
        </p>
      </div>

    </div>
  `;

  // safer DOM injection (prevents flicker + keeps performance stable)
  mainContent.replaceChildren(container);
}

// Global access
window.loadTopStudentMode = loadTopStudentMode;
