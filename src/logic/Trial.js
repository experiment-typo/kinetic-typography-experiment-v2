// ============================================================
// Trial.js (v2.0)
// ============================================================
// Replaces video playback with code-based motion rendering.
// Reads trial data from the master CSV via trialLoader.js.
// ============================================================

import { renderQuestionnaire } from './Questionnaire.js';
import { getRenderer } from './MotionRenderers.js';
import { generateChoices, questionTextFor } from './trialLoader.js';

export function runTrial(index, trials, log) {
  const app = document.getElementById('app');

  // If we've shown all trials, go to questionnaire
  if (index >= trials.length) {
    renderQuestionnaire(log);
    return;
  }

  const trial = trials[index];
  if (!trial) {
    runTrial(index + 1, trials, log);
    return;
  }

  // Render the stimulus container
  app.innerHTML = `
    <div id="stimulusContainer" style="
      width: 100%;
      height: 60vh;
      min-height: 400px;
      background: #000;
      position: relative;
      overflow: hidden;
      border-radius: 12px;
    "></div>
  `;

  const container = document.getElementById('stimulusContainer');
  const motion = trial['Motion'];
  const sentence = trial['Carrier sentence'];
  const renderer = getRenderer(motion);

  // Run the motion renderer, then proceed to MCQ
  const startTime = performance.now();
  renderer(container, sentence)
    .then(() => {
      const stimulusDuration = (performance.now() - startTime) / 1000;
      showMCQ(trial, index, trials, log, stimulusDuration);
    })
    .catch(err => {
      console.error('Renderer error:', err);
      // Even if rendering fails, advance so the participant isn't stuck
      showMCQ(trial, index, trials, log, 0);
    });
}

function showMCQ(trial, index, trials, log, stimulusDuration) {
  const app = document.getElementById('app');
  const choices = generateChoices(trial);
  const question = questionTextFor(trial['Position']);

  app.innerHTML = `
    <h2>${question}</h2>
    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px; margin: 20px auto;">
      ${choices.map(c => `<button class="choiceBtn">${c}</button>`).join('')}
    </div>
  `;

  document.querySelectorAll('.choiceBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userAnswer = btn.innerText;
      const correctAnswer = trial['Target word'];
      const correct = userAnswer === correctAnswer;
      const timestamp = new Date().toISOString();

      const newEntry = {
        trialNumber: parseInt(trial['Trial #'], 10),
        motion: trial['Motion'],
        position: trial['Position'],
        lengthClass: trial['Length class'],
        targetWord: correctAnswer,
        userAnswer,
        correct,
        question,
        stimulusDuration,
        timestamp
      };

      const nextIndex = index + 1;
      const newLog = [...log, newEntry];

      // Show a break AFTER every 4th trial as long as more trials remain
      const completedCount = nextIndex;
      const shouldShowBreak = (completedCount % 4 === 0) && (nextIndex < trials.length);

      if (shouldShowBreak) {
        renderBreakScreen(nextIndex, trials, newLog);
      } else {
        runTrial(nextIndex, trials, newLog);
      }
    }, { once: true });
  });
}

function renderBreakScreen(nextIndex, trials, log) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>Would you like a break?</h2>
    <button id='breakYes'>Yes</button>
    <button id='breakNo'>No, continue</button>
  `;
  const breakStart = Date.now();

  document.getElementById("breakYes").addEventListener("click", () => {
    app.innerHTML = `
      <h2>Take your time.</h2>
      <p>Click when you're ready to continue.</p>
      <button id='readyBtn'>I'm Ready</button>
    `;
    document.getElementById("readyBtn").addEventListener("click", () => {
      const breakDuration = (Date.now() - breakStart) / 1000;
      const updatedLog = [
        ...log,
        { entryType: "BREAK", breakDuration, timestamp: new Date().toISOString() }
      ];
      runTrial(nextIndex, trials, updatedLog);
    }, { once: true });
  }, { once: true });

  document.getElementById("breakNo").addEventListener("click", () => {
    const breakDuration = (Date.now() - breakStart) / 1000;
    const updatedLog = [
      ...log,
      { entryType: "BREAK_SKIPPED", breakDuration, timestamp: new Date().toISOString() }
    ];
    runTrial(nextIndex, trials, updatedLog);
  }, { once: true });
}
