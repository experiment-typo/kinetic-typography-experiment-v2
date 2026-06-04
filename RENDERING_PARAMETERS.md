# Rendering Parameters — v2.0 Platform

This document records the exact rendering parameters used by the kinetic
typography experimental platform (v2.0), in a form that can be dropped
into the methods section of a manuscript. These values are preserved
here so that future replications or reviewers can reconstruct the
viewing experience without needing to re-engineer it from the source code.

---

## Apparatus

The platform is delivered as a static web application via GitHub Pages
and runs in the participant's browser. All stimuli are rendered live in
JavaScript at runtime; no pre-recorded video files are used.

| Parameter | Value | Notes |
|---|---|---|
| **Browser engine** | Chromium-based or Gecko-based (Chrome ≥ 90, Firefox ≥ 88, Safari ≥ 14) | Tested on Chrome and Firefox |
| **Refresh rate target** | 60 fps | Achieved via `requestAnimationFrame` |
| **Recommended display** | 13-inch or 15-inch laptop, full-screen browser | Stated in the welcome screen |
| **Background luminance** | `#000000` (RGB 0,0,0) | True black |
| **Text luminance** | `#FFFFFF` (RGB 255,255,255) | True white |
| **Contrast ratio** | 21:1 | WCAG maximum |

## Viewport and stimulus container

The application root is centred horizontally with a maximum width
constraint, ensuring consistent layout across monitor sizes.

| Parameter | Value | Notes |
|---|---|---|
| **App container width** | 1280 px, capped at 90% of viewport width | Whichever is smaller |
| **App container padding** | 32 px (2 rem) on each side | |
| **Stimulus container width** | 100% of app container (≈ 1180 px on a 1440 px display, 90 vw on smaller) | |
| **Stimulus container height** | 60% of viewport height (`60vh`), minimum 400 px | Adapts to viewport |
| **Stimulus container background** | `#000000` | |
| **Stimulus safety margin** | 5% of container width / height from each edge | Guarantees no word clipping |

## Typeface and font sizing

| Parameter | Value | Notes |
|---|---|---|
| **Typeface** | Kameron Bold (weight 700) | Loaded from Google Fonts |
| **Fallback** | `'Kameron Bold', serif` | |
| **Base font size** | 56 px | Auto-scaled down if necessary |
| **Minimum font size** | 28 px | Safety floor |
| **Font size mode** | Uniform across all motion conditions and trials within a session | Computed at session start (see below) |

**Font size selection algorithm.** At session start, after sub-framework
assignment, the platform pre-measures every sentence the participant will
see (3 practice + 11 experimental = 14 sentences total). It computes the
natural rendered width of each sentence at 56 px and identifies the
widest. If the widest sentence fits within 92% of the stimulus container's
width, the font size is 56 px; otherwise the font is scaled down
proportionally so that the widest sentence just fits. The same font size
is then used for every word in every motion condition for the rest of the
session. This guarantees visual uniformity across motion types
(particularly that Static one-line sentences and the words shown in
RSVP-style conditions have identical character size).

## Timing parameters

| Parameter | Value | Notes |
|---|---|---|
| **Word display duration** | 390 ms per word | Matches v1.0 reference video timing |
| **Total stimulus duration per trial** | 2.73 s (7 words × 390 ms) | |
| **Inter-trial interval** | Variable, participant-paced (MCQ response) | |
| **Flicker frequency** | 8 Hz | Square-wave between 100% and 15% opacity |
| **Vibration frequency** | 18 Hz | Sinusoidal in both x and y |
| **Vibration amplitude** | 7% of current font size (≈ 4 px at 56 px font) | Scales with font for proportional appearance |
| **Highlight fade duration** | 390 ms per word (linear from 100% to 0% opacity) | |
| **Break frequency** | After every 4th trial (optional) | Participant chooses Yes or No |

## Layout rules per motion condition

All eleven motions share the same font size (see above). Positional
layouts differ:

| Motion | Layout |
|---|---|
| **Static** | All 7 words on one centred horizontal line. Auto-shrinks font (within the session-wide font size) if a particular sentence would overflow. |
| **Static RSVP** | One word at a time, fixed at container centre. |
| **Dynamic RSVP Horizontal** | Each word at a fixed progressive horizontal position (1 of 7 evenly-spaced points across the container width, from left to right). Words do not move during their display window. |
| **Dynamic RSVP Vertical** | Each word at a fixed progressive vertical position (1 of 7 evenly-spaced points from top to bottom). |
| **Flicker Horizontal / Vertical** | Same progressive positioning as Dynamic RSVP H/V, with the active word's opacity oscillating at 8 Hz. |
| **RSVP Flicker** | One word at a time, fixed at container centre, with opacity oscillating at 8 Hz. |
| **Vibration Horizontal / Vertical** | Same progressive positioning as Dynamic RSVP H/V, with the active word vibrating at 18 Hz with a 4 px amplitude in both x and y. |
| **Highlight Horizontal / Vertical** | Same progressive positioning as Dynamic RSVP H/V, with the active word linearly fading from 100% to 0% opacity over its 390 ms display window. |

## Clip-safe positioning

For all horizontal and vertical progressive-position renderers (Dynamic
RSVP, Flicker, Vibration, Highlight in both orientations), each word's
position is computed individually so its bounding box stays fully within
[safetyMargin, containerSize − safetyMargin] regardless of its rendered
width or height. The first word's leading edge sits at the safety margin
from one container edge; the last word's trailing edge sits at the safety
margin from the opposite edge; intermediate words interpolate evenly
between those two anchors with individual width/height correction. This
guarantees no clipping at any viewport size down to 800 × 600 px.

## Stimulus characteristics

| Parameter | Value |
|---|---|
| **Trials per participant session** | 11 experimental + 3 practice = 14 |
| **Words per sentence** | 7 |
| **Total sentences** | 132 across 12 sub-frameworks (each participant sees 11 of these) |
| **Pseudoword length classes** | Short (3–4 char), Medium-Short (5 char), Medium-Long (6–7 char), Long (8+ char) |
| **Foils per trial** | 3 (two close orthographic neighbours + one distant foil, all length-matched to target) |

## Data export

Each session produces one JSON file submitted to a Google Apps Script
endpoint, which writes structured rows into three Google Sheets tabs:
Sessions, Trials, and Questionnaire.

Per-trial data fields: `trialNumber`, `motion`, `position`, `lengthClass`,
`targetWord`, `userAnswer`, `correct` (boolean), `question`,
`stimulusDuration` (seconds, measured from animation start to end), and
`timestamp` (ISO 8601).
