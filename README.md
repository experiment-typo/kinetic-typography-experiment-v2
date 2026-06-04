# Kinetic Typography Experiment v2.0

Complete rewrite of the experimental platform. **No video files required** — all
motion stimuli are generated in real-time via JavaScript animations.

## Latest revision changes

This version (post-supervisor-review) adds:

- **Uniform font sizing across all motion types.** A single optimal font size
  is computed at session start so the Static one-line sentence and the
  individual words shown in vertical/horizontal motions all appear at the
  same size, regardless of viewport.
- **Clip-safe positioning.** The first and last words in vertical and
  horizontal layouts can no longer clip at the container edge.
- **Likert radio scales replace sliders** for the four subjective-rating
  questions, eliminating anchoring bias from a slider defaulting to the
  middle. No option is preselected — participants must actively choose.
- **Rebalanced Short-class target densities.** The Short-target Coltheart's N
  is now balanced across motion conditions (spread reduced from 26 to 8.7)
  via per-ordering rotation. Latin Square structural constraints preserved.
- **Updated participant-facing text** per supervisor feedback (welcome,
  instructions, practice intro, ready-to-start).
- **Practice intro screen** before the 3 practice trials with arrow button.
- **No correctness feedback** during practice trials.

## What's new in v2.0

- **No videos** — all 11 motion types are rendered live in the browser
- **132 trials in a CSV** — 4 groups × 3 orderings × 11 motions, balanced via Latin Square
- **Random sub-framework assignment** at session start (12 possible sub-frameworks)
- **Code-based stimulus generation** using the Kameron typeface from Google Fonts
- **Redesigned Highlight condition** — sentence shown statically with sequential coloured highlight
- **Updated data export** including `participant_group`, `participant_order`, `subframework`

## File structure

```
kinetic_typography_v2/
├── index.html
├── README.md
├── public/
│   └── data/
│       └── master_trial_list.csv      ← 132 trials
└── src/
    ├── main.js                         ← entry point
    ├── components/
    │   └── App.js                      ← screen flow + sub-framework assignment
    ├── data/
    │   └── questionnaire.js            ← post-experiment questionnaire structure
    ├── logic/
    │   ├── MotionRenderers.js          ← 11 motion animation functions  ★ NEW
    │   ├── trialLoader.js              ← CSV parsing and trial retrieval ★ NEW
    │   ├── Trial.js                    ← trial display + MCQ + break logic
    │   └── Questionnaire.js            ← post-experiment data collection
    └── styles/
        └── style.css                   ← stylesheet + flicker keyframe
```

## Motion renderers (the heart of v2.0)

Each of the 11 motion types is a function that takes a stimulus container and a
carrier sentence string, then returns a Promise that resolves when the animation
is complete. They are all in `src/logic/MotionRenderers.js`:

| Motion type | Function |
|---|---|
| Static | `renderStatic` |
| Static RSVP | `renderStaticRSVP` |
| Dynamic RSVP Horizontal | `renderDynamicRSVPHorizontal` |
| Dynamic RSVP Vertical | `renderDynamicRSVPVertical` |
| Flicker Horizontal | `renderFlickerHorizontal` |
| Flicker Vertical | `renderFlickerVertical` |
| RSVP Flicker | `renderRSVPFlicker` |
| Vibration Horizontal | `renderVibrationHorizontal` |
| Vibration Vertical | `renderVibrationVertical` |
| Highlight Horizontal (redesigned) | `renderHighlightHorizontal` |
| Highlight Vertical (redesigned) | `renderHighlightVertical` |

### Animation parameters (constant across renderers)

```javascript
rsvpWordDuration: 200ms     // per word
flickerHz: 60               // flicker frequency
flickerOpacityLow: 10%      // flicker low opacity
vibrationHz: 50             // vibration frequency
vibrationAmplitude: 30px    // vibration amplitude
fontSize: 54px
fontWeight: 700
fontFamily: 'Kameron'
textColor: #FFFFFF on #000000 (21:1 contrast)
```

## Highlight redesign rationale

In v1.0, Highlight performed worst (12% horizontal, 28% vertical) and disadvantaged
myopic readers. In v2.0, the redesigned Highlight:

1. Shows the entire sentence statically so the reader can use normal saccadic reading
2. Sequentially highlights each word with **both** a luminance boost (white at 100%) **and** a yellow background tint
3. Holds each highlight for the full 200ms word duration
4. Dims non-highlighted words to 55% opacity to enhance contrast

The hypothesis is that the v1.0 implementation failed because the highlight
competed with horizontal motion. The v2.0 implementation uses a stationary layout
where the highlight is the only kinetic element.

## How sub-framework assignment works

When a participant starts a session, `App.js`:

1. Loads the list of all available sub-frameworks (A-1, A-2, ..., D-3) from the CSV
2. Defaults to **Random assignment** in the dropdown
3. On click of "Next", picks a random sub-framework and stores it in localStorage
4. After consent and instructions, loads the 11 trials for that sub-framework
5. Trials are presented in their numbered order (already constraint-shuffled)

For testing or debugging, the dropdown also lists all 12 sub-frameworks individually.

## Google Sheets endpoint setup (REQUIRED before deployment)

The v2.0 data schema is different from v1.0, so you must create a new endpoint
specifically for v2.0 data. Do NOT reuse the v1.0 Apps Script endpoint — it
expects different fields and will either lose data or crash.

Setup steps:

1. Create a new Google Sheet (e.g., "Kinetic Typography v2.0 Results"). Keep
   it separate from your v1.0 pilot data.
2. In the Sheet: Extensions → Apps Script.
3. Replace any boilerplate code with the contents of `google_apps_script_v2.gs`
   from this repository.
4. Save and click Deploy → New deployment.
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
5. Authorise the script when prompted, then copy the deployment URL.
6. Open `src/logic/Questionnaire.js` and replace the `ENDPOINT_URL` placeholder
   with the URL you just copied.
7. Reload your platform and run a single test session to verify rows appear in
   the Sheet's Trials, Sessions, and Questionnaire tabs.

The script auto-creates three tabs in the Sheet on first submission:
- **Sessions** — one row per participant with metadata (group, order, etc.)
- **Trials** — one row per trial × participant (so 11 rows per participant)
- **Questionnaire** — one row per participant with all survey responses

This three-tab structure is much easier to analyse than a single JSON column.

## Data export

Each session produces a JSON file with the following structure:

```json
{
  "version": "v2.0",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "participant_group": "A",
  "participant_order": "1",
  "subframework": "Group A — Order 1",
  "framework": "Group A — Order 1",
  "trials": [
    {
      "trialNumber": 1,
      "motion": "Vibration Horizontal",
      "position": "Shortest",
      "lengthClass": "Short",
      "targetWord": "trun",
      "userAnswer": "trun",
      "correct": true,
      "question": "Which was the shortest word?",
      "stimulusDuration": 1.42,
      "timestamp": "2026-04-27T10:30:42.000Z"
    },
    ...
  ],
  "breaks": [
    { "entryType": "BREAK", "breakDuration": 4.2, "timestamp": "..." }
  ],
  "questionnaire": [
    { "question": "What is your age group?", "answer": "25–34" },
    ...
  ]
}
```

The same JSON is also POSTed to the existing Google Apps Script endpoint, so your
Google Sheets backend continues to work without any server-side changes.

## Local testing

```bash
# Serve the directory locally (required for ES modules and CSV fetch)
cd kinetic_typography_v2
python3 -m http.server 8000
# Then open http://localhost:8000 in a browser
```

You cannot test by opening `index.html` directly in the browser (`file://` protocol)
because ES module imports and `fetch()` require an HTTP server.

## Browser requirements

- Modern browser with ES modules support (Chrome 61+, Firefox 60+, Safari 11+)
- JavaScript enabled
- No additional libraries required (no React, no jQuery — vanilla JS)

## Updating the trial set

To regenerate the master trial list (e.g., after adding new pseudowords), update
`public/data/master_trial_list.csv`. The schema is:

| Column | Type | Description |
|---|---|---|
| Sub-framework | string | Display label like "Group A — Order 1" |
| Group | string | A, B, C, or D |
| Order | int | 1, 2, or 3 |
| Trial # | int | 1–11, presentation order within the session |
| Motion | string | Must match a key in `MOTION_RENDERERS` |
| Position | string | "Second", "Penultimate", "Longest", or "Shortest" |
| Length class | string | "Short", "Medium-Short", "Medium-Long", or "Long" |
| Target word | string | The correct answer |
| Foil 1, Foil 2, Foil 3 | string | Three distractor options |
| Carrier sentence | string | 7 space-separated words |

Columns can be reordered as long as the headers are correct. The CSV parser handles
quoted fields with commas correctly.
