// ============================================================
// Questionnaire.js (v2.0)
// ============================================================
// Same overall structure as v1.0, with two key changes:
// 1. The "best / worst movement" questions render small live motion
//    previews next to each option (multiplePreview type).
// 2. Data export includes participant_group, participant_order, and
//    subframework so v2.0 results stay distinguishable from v1.0.
// ============================================================

import { finalQuestions, PREVIEW_SENTENCE } from '../data/questionnaire.js';
import { getRenderer } from './MotionRenderers.js';

// Tracks the per-preview animation loops so we can stop them on submit
// (otherwise they'd keep running invisibly after the user moves on).
const _previewControllers = [];

export function renderQuestionnaire(log) {
  const app = document.getElementById('app');
  let responses = [];

  // Separate breaks from trials in the log
  const breaks = log.filter(entry => entry.entryType === "BREAK" || entry.entryType === "BREAK_SKIPPED");
  const trials = log.filter(entry => entry.entryType !== "BREAK" && entry.entryType !== "BREAK_SKIPPED");

  app.innerHTML = `
    <div class="left-align">
      <h2>Final Questionnaire</h2>
      <div id="questionnaireForm"></div>
      <button id="submitBtn">Submit</button>
    </div>
  `;

  const form = document.getElementById('questionnaireForm');

  finalQuestions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.classList.add('question-block');
    qDiv.innerHTML = `<p>${q.text}</p>`;

    if (q.type === "multiple") {
      q.options.forEach(option => {
        const id = `q${idx}_${option}`;
        qDiv.innerHTML += `
          <label>
            <input type="radio" name="q${idx}" id="${id}" value="${option}"> ${option}
          </label>`;
      });
    }

    else if (q.type === "multipleWithOptional") {
      q.options.forEach(option => {
        const id = `q${idx}_${option}`;
        qDiv.innerHTML += `
          <label>
            <input type="radio" name="q${idx}" id="${id}" value="${option}"> ${option}
          </label>`;
        if (option === "Other") {
          qDiv.innerHTML += `
            <input type="text" id="q${idx}_otherText" placeholder="${q.optionalPrompt || 'Specify...'}" style="margin-top:5px;width:95%;padding:6px;border-radius:6px;" />`;
        }
      });
    }

    else if (q.type === "short") {
      qDiv.innerHTML += `<input type="text" name="q${idx}" id="q${idx}" style="width: 90%; padding: 8px;" />`;
    }

    else if (q.type === "slider") {
      const labels = q.labels || ["1", "2", "3", "4", "5"];
      qDiv.innerHTML += `
        <div style="display: flex; justify-content: space-between; padding: 0 10px; font-size: 0.9em;">
          ${labels.map(l => `<span>${l}</span>`).join('')}
        </div>
        <input type="range" min="1" max="5" step="1" value="3" id="q${idx}" style="width: 100%; margin: 10px 0;">
      `;
    }

    // NEW: motion preview grid (replaces v1.0 multipleVideo)
    else if (q.type === "multiplePreview") {
      const gridId = `q${idx}_grid`;
      qDiv.innerHTML += `<div id="${gridId}" class="preview-grid"></div>`;
      form.appendChild(qDiv);

      // After insertion, build each preview tile
      const grid = document.getElementById(gridId);
      q.options.forEach((opt, i) => {
        const tileId = `q${idx}_tile_${i}`;
        const containerId = `q${idx}_preview_${i}`;
        const tile = document.createElement('label');
        tile.className = 'preview-tile';
        tile.innerHTML = `
          <input type="radio" name="q${idx}" value="${opt.label}" />
          <div class="preview-label">${opt.label}</div>
          <div class="preview-stage" id="${containerId}"></div>
        `;
        grid.appendChild(tile);

        // Start a looping preview animation in the inner stage
        const stage = document.getElementById(containerId);
        const renderer = getRenderer(opt.motion);
        startPreviewLoop(stage, renderer, PREVIEW_SENTENCE);
      });

      return; // already appended to form above
    }

    form.appendChild(qDiv);
  });

  // --------- Save handler ----------
  async function saveResultsToGoogle(data) {
    // ⚠ TODO: Replace this URL with the new v2.0 Google Apps Script endpoint
    // before deploying for data collection. The URL below is the v1.0 endpoint
    // and should NOT be used for v2.0 data.
    const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxERIiYw0op_ZRrvy_sgQCdVPh3xfxw5BDYCKK-2GptO2AJu5TJ9MUUtgR6Eu-GtYE3/exec';
    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      console.log('Data sent to Google Sheets');
    } catch (err) {
      console.error('Error sending data to Google Sheets:', err);
    }
  }

  document.getElementById('submitBtn').addEventListener('click', () => {
    // Stop all preview animations so we don't leak timers
    stopAllPreviews();

    finalQuestions.forEach((q, idx) => {
      let answer = "";

      if (q.type === "multiple" || q.type === "multiplePreview") {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        answer = selected ? selected.value : "";
      }
      else if (q.type === "multipleWithOptional") {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selected?.value === "Other") {
          const otherInput = document.getElementById(`q${idx}_otherText`);
          answer = otherInput?.value || "Other (not specified)";
        } else {
          answer = selected ? selected.value : "";
        }
      }
      else if (q.type === "short" || q.type === "slider") {
        const input = document.getElementById(`q${idx}`);
        answer = input ? input.value : "";
      }

      responses.push({ question: q.text, answer });
    });

    const fullData = {
      version: "v2.0",
      timestamp: new Date().toISOString(),
      participant_group: localStorage.getItem("participantGroup"),
      participant_order: localStorage.getItem("participantOrder"),
      subframework: localStorage.getItem("subframework"),
      framework: localStorage.getItem("subframework"), // kept for backward compatibility
      trials,
      breaks,
      questionnaire: responses
    };

    // Save locally as a downloadable JSON file
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${localStorage.getItem("participantGroup")}-${localStorage.getItem("participantOrder")}_${Date.now()}.json`;
    a.click();

    // Send to Google Sheets endpoint
    saveResultsToGoogle({
      framework: localStorage.getItem('subframework'),
      participant_id: Date.now(),
      results: fullData
    });

    app.innerHTML = "<h2>Thank you for participating!</h2><p>Your results have been saved.</p>";
  });
}

/**
 * Run a renderer in a loop on the given stage element. Returns a controller
 * that can be used to stop the loop. Loop is registered globally so it can
 * be cancelled before navigation.
 */
function startPreviewLoop(stage, renderer, sentence) {
  let cancelled = false;
  const ctl = { cancel: () => { cancelled = true; } };
  _previewControllers.push(ctl);

  (async () => {
    while (!cancelled) {
      try {
        await renderer(stage, sentence);
      } catch (err) {
        console.error('Preview error', err);
        break;
      }
      // Brief pause between loops so the start of each cycle is visible
      await new Promise(r => setTimeout(r, 250));
    }
    // Final cleanup
    if (stage && stage.innerHTML) stage.innerHTML = '';
  })();

  return ctl;
}

function stopAllPreviews() {
  while (_previewControllers.length) {
    const ctl = _previewControllers.pop();
    try { ctl.cancel(); } catch(_) {}
  }
}
