// ============================================================
// Practice.js (v2.0)
// ============================================================
// 3 practice trials with NO correctness feedback. After each answer,
// the participant simply moves on to the next trial (or to the
// "ready to start" screen after the last one).
//
// Rationale: the purpose of practice is to let participants experience
// the task format, not to test or judge them. Showing "correct/incorrect"
// would prime evaluation anxiety and could distort behaviour on the real
// experiment that follows.
//
// Practice answers are not logged to the experimental data.
// ============================================================

import { getRenderer } from './MotionRenderers.js';
import { questionTextFor } from './trialLoader.js';
import { showReadyToStart } from '../components/App.js';

export function runPracticeTrial(index, practiceTrials) {
  const app = document.getElementById('app');

  if (index >= practiceTrials.length) {
    showReadyToStart();
    return;
  }

  const trial = practiceTrials[index];

  app.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 0.95em; color: #aaa; margin-bottom: 8px;">
        Practice trial ${trial.practiceNumber} of ${practiceTrials.length}
      </div>
      <div id="stimulusContainer" style="
        width: 100%;
        height: 60vh;
        min-height: 400px;
        background: #000;
        position: relative;
        overflow: hidden;
        border-radius: 12px;
      "></div>
    </div>
  `;

  const container = document.getElementById('stimulusContainer');
  const renderer = getRenderer(trial.motion);

  renderer(container, trial.carrierSentence)
    .then(() => showPracticeMCQ(trial, index, practiceTrials))
    .catch(err => {
      console.error('Practice renderer error:', err);
      showPracticeMCQ(trial, index, practiceTrials);
    });
}

function showPracticeMCQ(trial, index, practiceTrials) {
  const app = document.getElementById('app');
  // Build the 4-choice list (target + 3 foils) and shuffle
  const choices = [trial.targetWord, ...trial.foils];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  const question = questionTextFor(trial.position);

  app.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 0.95em; color: #aaa; margin-bottom: 16px;">
        Practice trial ${trial.practiceNumber} of ${practiceTrials.length}
      </div>
      <h2>${question}</h2>
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px; margin: 20px auto;">
        ${choices.map(c => `<button class="choiceBtn" data-choice="${c}">${c}</button>`).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.choiceBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      // No feedback shown — just move directly to the next trial.
      // The participant's selection is intentionally not displayed back to
      // them and is not stored anywhere.
      runPracticeTrial(index + 1, practiceTrials);
    }, { once: true });
  });
}
