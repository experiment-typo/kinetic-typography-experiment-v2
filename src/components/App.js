// ============================================================
// App.js (v2.0)
// ============================================================
// Screen flow:
//   sub-framework → welcome → consent → instructions →
//   practice intro → 3 practice trials (no feedback) →
//   "ready to start" → 11 experimental trials → questionnaire
// ============================================================

import { runTrial } from '../logic/Trial.js';
import { runPracticeTrial } from '../logic/Practice.js';
import { listSubframeworks, getTrialsForSubframework } from '../logic/trialLoader.js';

// Three practice trials chosen to span motion families. Pseudowords here
// are deliberately disjoint from the experimental stimulus bank.
export const PRACTICE_TRIALS = [
  {
    practiceNumber: 1,
    motion: 'Static',
    position: 'Second',
    targetWord: 'pelvi',
    foils: ['palvi', 'penvi', 'tolvi'],
    carrierSentence: 'minar pelvi sornak verbil quinok ralvit dronkim',
  },
  {
    practiceNumber: 2,
    motion: 'Dynamic RSVP Horizontal',
    position: 'Longest',
    targetWord: 'crampolen',
    foils: ['crompolen', 'crampelen', 'frampoten'],
    carrierSentence: 'mira tolun ralpe crampolen velnu sodok pirma',
  },
  {
    practiceNumber: 3,
    motion: 'Flicker Vertical',
    position: 'Shortest',
    targetWord: 'pic',
    foils: ['pec', 'pid', 'tac'],
    carrierSentence: 'tampor velnik pic strolanok mirvunke porlind cravoneb',
  },
];

// Holds the sentences this participant will see (practice + experimental).
// Used by Trial.js / Practice.js to compute a uniform stage font size
// before the first stimulus renders.
let _sessionSentences = null;
export function getSessionSentences() { return _sessionSentences; }

export function startApp() {
  renderFrameworkSelector();
}

async function renderFrameworkSelector() {
  const app = document.getElementById('app');

  let subframeworks = [];
  try {
    subframeworks = await listSubframeworks();
  } catch (err) {
    app.innerHTML = `<h2>Error loading trial data</h2><p>${err.message}</p>`;
    console.error(err);
    return;
  }

  app.innerHTML = `
    <h1>Kinetic Typography Experiment v2.0</h1>
    <p style="margin-bottom: 24px;">Sub-framework assignment</p>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 400px; margin: 0 auto;">
      <select id="subframeworkSelect" style="width: 100%; padding: 12px; border-radius: 10px; font-size: 1.05em;">
        <option value="RANDOM">Random assignment (recommended)</option>
        ${subframeworks.map(sf => `<option value="${sf.group}-${sf.order}">${sf.label}</option>`).join('')}
      </select>
      <button id="nextBtn">Next</button>
    </div>
    <p class="screen-note" style="margin-top: 28px;">
      For production use, leave "Random assignment" selected. The system will randomly assign you
      to one of 12 sub-frameworks. Manual selection is provided for testing only.
    </p>
  `;

  document.getElementById('nextBtn').addEventListener('click', async () => {
    let selected = document.getElementById('subframeworkSelect').value;
    if (selected === 'RANDOM') {
      const random = subframeworks[Math.floor(Math.random() * subframeworks.length)];
      selected = `${random.group}-${random.order}`;
    }
    const [group, order] = selected.split('-');
    localStorage.setItem('participantGroup', group);
    localStorage.setItem('participantOrder', order);
    localStorage.setItem('subframework', `Group ${group} — Order ${order}`);

    // Preload trials so we have every sentence in advance — needed by the
    // stimulus stage to pre-compute a uniform font size across all motions.
    try {
      const trials = await getTrialsForSubframework(group, order);
      const experimentSentences = trials.map(t => t['Carrier sentence']);
      const practiceSentences = PRACTICE_TRIALS.map(p => p.carrierSentence);
      _sessionSentences = [...practiceSentences, ...experimentSentences];
    } catch (err) {
      console.error('Failed to preload trials for font sizing', err);
      _sessionSentences = PRACTICE_TRIALS.map(p => p.carrierSentence);
    }

    renderWelcome();
  });
}

function renderWelcome() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Welcome to the Kinetic Typography Experiment</h1>
    <p style="margin-top:12px; margin-bottom:28px;">
      Thank you for participating!
      In this study, you'll view short sequences of moving words
      and you need to answer the questions quickly.
      Your input will help us better understand
      how kinetic typography affects word recognition.
    </p>
    <p class="screen-note">
      This experiment is optimized for a 13–15" laptop. On larger monitors, text may appear smaller.
      Please view in full screen.
    </p>
    <button id="startBtn">Continue</button>
  `;
  document.getElementById('startBtn').addEventListener('click', renderConsent);
}

function renderConsent() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="left-align">
      <h1>Letter of Consent</h1>
      <p>
        From the research group READSEARCH, led by Prof. Bessemans at PXL-MAD School
        of Arts/University of Hasselt, we are currently conducting a study on how kinetic
        typography could influence word recognizability of myopic readers.
      </p>
      <p>
        You are kindly invited to participate in this research. During the study, you will
        be shown short sequences of pseudoword sentences, presented in different
        kinetic typography representations. You will then be asked to answer a question
        regarding the sentence. We will then ask you which typography representation you find
        to be the most comfortable to follow. Your participation is voluntary, and your responses
        will be treated confidentially and anonymously.
      </p>
      <p>
        Completing the reading and questions will take approximately 8-12 minutes. You may stop
        participating in the research at any time. By participating in this study, you declare
        that you have read and understood this information and voluntarily agree to participate.
        If you agree, we kindly ask you to click the button below to start the test.
      </p>
      <p>
        Best regards,<br>
        Monica Hutama
      </p>
      <p>
        We highly value the protection of everyone's privacy! The data we ask for prior to the
        test are not contact details and are included in the database for analytical purposes only.
        If you change your mind at a later time, you can always leave your personal details
        (ann.bessemans@uhasselt.be, monica.hutama@uhasselt.be) to change your decision.
        I hereby confirm that I am aware of the content of the study and grant permission to be part of the research.
      </p>
      <button id="agreeBtn">I Agree</button>
    </div>
  `;
  document.getElementById('agreeBtn').addEventListener('click', renderInstructions);
}

function renderInstructions() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="left-align">
      <h1>General Instructions</h1>
      <p>
        During this experiment, you will view 11 short sequences, each lasting just a few seconds.
        Each sequence will display a sentence composed of pseudowords (words that look and
        sound like real words but have no meaning). Your task is to focus on these words
        and try to identify each one as it appears.
      </p>
      <h2>Task</h2>
      <p>For each sequence:</p>
        <ul>
          <li>Watch the sequence carefully.</li>
          <li>After each sequence, you will be asked a multiple-choice question about the words you saw.</li>
          <li>After every few sequences, you will be prompted with a break screen. If you wish to take a rest, please do so at that time.</li>
        </ul>
      <p>Press the button below when you are ready to continue.</p>
      <button id="goToPracticeIntroBtn">Continue</button>
    </div>
  `;
  document.getElementById('goToPracticeIntroBtn').addEventListener('click', renderPracticeIntro);
}

function renderPracticeIntro() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="text-align: center; padding-top: 60px;">
      <h1>We will begin with 3 practice trials</h1>
      <p style="margin-top: 18px; max-width: 560px; margin-left: auto; margin-right: auto;">
        These practice trials are here to help you get used to the task before the real experiment starts.
        There's no right or wrong here — we're testing the experiment, not you.
      </p>
      <button id="startPracticeBtn" class="arrow-button" style="margin-top: 36px;">
        Start practice
        <span class="arrow-icon" aria-hidden="true">→</span>
      </button>
    </div>
  `;
  document.getElementById('startPracticeBtn').addEventListener('click', () => {
    runPracticeTrial(0, PRACTICE_TRIALS);
  });
}

// Called by Practice.js after the last practice trial finishes.
export function showReadyToStart() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="text-align: center; padding-top: 40px;">
      <h1>Practice complete</h1>
      <p style="margin-top: 16px; margin-bottom: 36px; max-width: 600px; margin-left: auto; margin-right: auto;">
        You'll now begin the real experiment.
        Your responses from this point on will be saved to help us understand how kinetic typography affects reading.
      </p>
      <p style="margin-bottom: 28px;">Ready to start?</p>
      <button id="launchTestBtn" class="arrow-button" style="font-size: 1.1em; padding: 14px 36px;">
        Launch the test
        <span class="arrow-icon" aria-hidden="true">→</span>
      </button>
    </div>
  `;
  document.getElementById('launchTestBtn').addEventListener('click', async () => {
    const group = localStorage.getItem('participantGroup');
    const order = localStorage.getItem('participantOrder');
    try {
      const trials = await getTrialsForSubframework(group, order);
      runTrial(0, trials, []);
    } catch (err) {
      const app = document.getElementById('app');
      app.innerHTML = `<h2>Error loading trials</h2><p>${err.message}</p>`;
      console.error(err);
    }
  });
}
