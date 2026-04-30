// ============================================================
// trialLoader.js
// ============================================================
// Loads the master trial list CSV and provides functions to
// retrieve trials for a specific group + ordering.
//
// CSV columns (from master_trial_list.csv):
//   Sub-framework, Group, Order, Trial #, Motion, Position,
//   Length class, Target word, Foil 1, Foil 2, Foil 3, Carrier sentence
// ============================================================

let _trialCache = null;

/**
 * Parse a CSV string into an array of objects.
 * Handles quoted fields containing commas.
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  
  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  };
  
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const fields = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = fields[i] || ''; });
    return obj;
  });
}

/**
 * Load the master trial list (cached after first call).
 */
export async function loadTrials() {
  if (_trialCache) return _trialCache;
  
  const response = await fetch('public/data/master_trial_list.csv');
  if (!response.ok) {
    throw new Error(`Failed to load trial data: ${response.status}`);
  }
  const csvText = await response.text();
  _trialCache = parseCSV(csvText);
  return _trialCache;
}

/**
 * Get the 11 trials for a specific group + ordering.
 * Returns trials sorted by Trial # in their assigned order.
 */
export async function getTrialsForSubframework(group, order) {
  const allTrials = await loadTrials();
  const filtered = allTrials.filter(t =>
    t.Group === group && parseInt(t.Order, 10) === parseInt(order, 10)
  );
  filtered.sort((a, b) => parseInt(a['Trial #'], 10) - parseInt(b['Trial #'], 10));
  return filtered;
}

/**
 * List all available sub-frameworks (Group + Order combinations).
 */
export async function listSubframeworks() {
  const allTrials = await loadTrials();
  const seen = new Set();
  const subframeworks = [];
  for (const t of allTrials) {
    const key = `${t.Group}-${t.Order}`;
    if (!seen.has(key)) {
      seen.add(key);
      subframeworks.push({ group: t.Group, order: parseInt(t.Order, 10), label: t['Sub-framework'] });
    }
  }
  return subframeworks.sort((a, b) =>
    a.group.localeCompare(b.group) || a.order - b.order
  );
}

/**
 * Generate the 4-choice answer set for a trial: target + 3 foils, randomised order.
 */
export function generateChoices(trial) {
  const choices = [
    trial['Target word'],
    trial['Foil 1'],
    trial['Foil 2'],
    trial['Foil 3'],
  ];
  // Fisher-Yates shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

/**
 * Generate the question text for a trial based on its position type.
 */
export function questionTextFor(position) {
  const map = {
    'Second': 'Which was the second word?',
    'Penultimate': 'Which was the second-to-last word?',
    'Longest': 'Which was the longest word?',
    'Shortest': 'Which was the shortest word?',
  };
  return map[position] || `Which was the ${position} word?`;
}
