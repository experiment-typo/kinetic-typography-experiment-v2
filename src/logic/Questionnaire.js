// ============================================================
// Questionnaire.js (v2.0)
// ============================================================
// Renders the post-experiment questionnaire. Changes vs v1.0:
// - Motion-preference questions show looping live previews (multiplePreview)
// - Subjective rating questions use 5-point Likert radio buttons (likert)
//   instead of sliders — no default selected (eliminates anchoring bias)
// - Data export includes participant_group, participant_order, subframework
// ============================================================

import { finalQuestions, PREVIEW_SENTENCE } from '../data/questionnaire.js';
import { getRenderer } from './MotionRenderers.js';

// Tracks per-preview animation loops so we can stop them on submit
// (otherwise they'd keep running invisibly after the user moves on).
const _previewControllers = [];

export function renderQuestionnaire(log) {
  const app = document.getElementById('app');
  let responses = [];

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

    // 5-point Likert as a row of radio buttons. No option preselected:
    // participants must make an active choice (eliminates anchoring bias
    // from a slider that defaults to the middle).
    else if (q.type === "likert") {
      const optsHtml = q.options.map((label, i) => {
        const id = `q${idx}_lk_${i}`;
        return `
          <label class="likert-option">
            <input type="radio" name="q${idx}" id="${id}" value="${label}">
            <span class="likert-label">${label}</span>
          </label>
        `;
      }).join('');
      qDiv.innerHTML += `<div class="likert-row">${optsHtml}</div>`;
    }

    // Motion preview grid (best/worst questions)
    else if (q.type === "multiplePreview") {
      const gridId = `q${idx}_grid`;
      qDiv.innerHTML += `<div id="${gridId}" class="preview-grid"></div>`;
      form.appendChild(qDiv);

      const grid = document.getElementById(gridId);
      q.options.forEach((opt, i) => {
        const containerId = `q${idx}_preview_${i}`;
        const tile = document.createElement('label');
        tile.className = 'preview-tile';
        tile.innerHTML = `
          <input type="radio" name="q${idx}" value="${opt.label}" />
          <div class="preview-label">${opt.label}</div>
          <div class="preview-stage" id="${containerId}"></div>
        `;
        grid.appendChild(tile);

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
    // ⚠ This URL must point at your v2.0 Google Apps Script Web App deployment.
    // After downloading this file you MUST replace the placeholder below with
    // your real deployment URL (the same one you used in the prior version).
    const ENDPOINT_URL = 'hhttps://script.google.com/macros/s/AKfycbxERIiYw0op_ZRrvy_sgQCdVPh3xfxw5BDYCKK-2GptO2AJu5TJ9MUUtgR6Eu-GtYE3/exec';
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
    stopAllPreviews();

    finalQuestions.forEach((q, idx) => {
      let answer = "";

      if (q.type === "multiple" || q.type === "multiplePreview" || q.type === "likert") {
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
      else if (q.type === "short") {
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
      framework: localStorage.getItem("subframework"), // backward-compat field
      trials,
      breaks,
      questionnaire: responses
    };

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${localStorage.getItem("participantGroup")}-${localStorage.getItem("participantOrder")}_${Date.now()}.json`;
    a.click();

    saveResultsToGoogle({
      framework: localStorage.getItem('subframework'),
      participant_id: Date.now(),
      results: fullData
    });

    app.innerHTML = "<h2>Thank you for participating!</h2><p>Your results have been saved.</p>";
  });
}

/**
 * Run a renderer in a loop on the given stage element. Registers a
 * controller so the loop can be cancelled before navigation.
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
