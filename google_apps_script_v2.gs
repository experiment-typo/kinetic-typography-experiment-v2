// ============================================================
// Google Apps Script — Kinetic Typography v2.0 Endpoint
// ============================================================
//
// SETUP INSTRUCTIONS
// ============================================================
// 1. Create a new Google Sheet (call it something like
//    "Kinetic Typography v2.0 Results" — keep it separate from
//    your v1.0 pilot data).
// 2. In the Sheet, click Extensions → Apps Script.
// 3. Delete any boilerplate code in the editor and paste THIS file.
// 4. Save the project (give it a name like "v2.0 Endpoint").
// 5. Click Deploy → New deployment.
//      - Type: "Web app"
//      - Description: "v2.0 Endpoint"
//      - Execute as: "Me"
//      - Who has access: "Anyone"
// 6. Click Deploy. Authorise the script when prompted.
// 7. Copy the deployment URL it gives you (it ends in /exec).
// 8. Paste that URL into src/logic/Questionnaire.js, replacing
//    the placeholder ENDPOINT_URL.
//
// HOW IT WORKS
// ============================================================
// Each submission from the experiment platform is a JSON payload.
// This script writes:
//   - One row to the "Trials" sheet for every trial in the session
//     (11 rows per participant).
//   - One row to the "Sessions" sheet per session (with metadata).
//   - One row to the "Questionnaire" sheet per session (with all
//     questionnaire responses serialised).
//
// The three sheets are auto-created on first submission if they
// don't exist yet.
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const results = data.results || data;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    writeSessionRow(ss, data, results);
    writeTrialRows(ss, data, results);
    writeQuestionnaireRow(ss, data, results);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function writeSessionRow(ss, data, results) {
  const headers = [
    'submission_timestamp', 'participant_id', 'version',
    'participant_group', 'participant_order', 'subframework',
    'session_timestamp', 'num_trials', 'num_breaks'
  ];
  const sheet = getOrCreateSheet(ss, 'Sessions', headers);
  sheet.appendRow([
    new Date().toISOString(),
    data.participant_id || '',
    results.version || '',
    results.participant_group || '',
    results.participant_order || '',
    results.subframework || '',
    results.timestamp || '',
    (results.trials || []).length,
    (results.breaks || []).length
  ]);
}

function writeTrialRows(ss, data, results) {
  const headers = [
    'submission_timestamp', 'participant_id',
    'participant_group', 'participant_order', 'subframework',
    'trial_number', 'motion', 'position', 'length_class',
    'target_word', 'user_answer', 'correct',
    'question', 'stimulus_duration', 'trial_timestamp'
  ];
  const sheet = getOrCreateSheet(ss, 'Trials', headers);
  const submissionTime = new Date().toISOString();

  const trials = results.trials || [];
  trials.forEach(function(t) {
    sheet.appendRow([
      submissionTime,
      data.participant_id || '',
      results.participant_group || '',
      results.participant_order || '',
      results.subframework || '',
      t.trialNumber || '',
      t.motion || '',
      t.position || '',
      t.lengthClass || '',
      t.targetWord || '',
      t.userAnswer || '',
      t.correct === true ? 'TRUE' : (t.correct === false ? 'FALSE' : ''),
      t.question || '',
      t.stimulusDuration || '',
      t.timestamp || ''
    ]);
  });
}

function writeQuestionnaireRow(ss, data, results) {
  const responses = results.questionnaire || [];
  // Build a flat row: one column per question text + metadata columns
  const baseHeaders = [
    'submission_timestamp', 'participant_id',
    'participant_group', 'participant_order', 'subframework'
  ];
  const questionHeaders = responses.map(function(r) { return r.question; });
  const headers = baseHeaders.concat(questionHeaders);
  const sheet = getOrCreateSheet(ss, 'Questionnaire', headers);

  // If the sheet's existing header row has fewer columns than this submission
  // (because new questions were added later), expand it.
  const lastCol = sheet.getLastColumn();
  if (lastCol < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  const row = [
    new Date().toISOString(),
    data.participant_id || '',
    results.participant_group || '',
    results.participant_order || '',
    results.subframework || ''
  ].concat(responses.map(function(r) { return r.answer; }));

  sheet.appendRow(row);
}

// Optional: a GET handler for sanity-checking the endpoint is alive.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    message: 'Kinetic Typography v2.0 endpoint is active. Use POST to submit data.'
  })).setMimeType(ContentService.MimeType.JSON);
}
