// ============================================================
// questionnaire.js (v2.0)
// ============================================================
// The "best/worst movement" questions now use motion previews instead
// of plain text labels. Each option includes a small live preview that
// loops the motion using a neutral example sentence, so participants
// can recognise the motion they're rating without relying on memory of
// the textual label.
// ============================================================

// A neutral pseudoword sentence used for previews. Same length as
// experimental sentences (7 words), but composed of words not in the
// experimental stimulus bank to avoid any priming effects.
export const PREVIEW_SENTENCE = "talvi murket fendor brastik celum vorpex ralvit";

// Motion preview options shared by both "best" and "worst" questions.
// `motion` must match a key in MOTION_RENDERERS.
export const MOTION_PREVIEW_OPTIONS = [
  { label: "Static",                              motion: "Static" },
  { label: "Static RSVP",                         motion: "Static RSVP" },
  { label: "Dynamic RSVP — Horizontal",           motion: "Dynamic RSVP Horizontal" },
  { label: "Dynamic RSVP — Vertical",             motion: "Dynamic RSVP Vertical" },
  { label: "Flicker — Horizontal",                motion: "Flicker Horizontal" },
  { label: "Flicker — Vertical",                  motion: "Flicker Vertical" },
  { label: "RSVP Flicker",                        motion: "RSVP Flicker" },
  { label: "Vibration — Horizontal",              motion: "Vibration Horizontal" },
  { label: "Vibration — Vertical",                motion: "Vibration Vertical" },
  { label: "Highlight — Horizontal",              motion: "Highlight Horizontal (redesigned)" },
  { label: "Highlight — Vertical",                motion: "Highlight Vertical (redesigned)" },
];

export const finalQuestions = [
  {
    type: "multiple",
    text: "What is your age group?",
    options: ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"]
  },
  {
    type: "multipleWithOptional",
    text: "What best describes your vision?",
    options: ["Myopic (nearsighted)", "Normal vision", "Not sure", "Other"],
    optionalPrompt: "Please specify (optional):"
  },
  {
    type: "short",
    text: "If myopic, what is your degree of correction? (e.g. -2.50). If unknown, write 'I don't know'."
  },
  {
    type: "multiple",
    text: "Are you wearing your prescription glasses or lenses?",
    options: ["Yes", "No"]
  },
  {
    type: "multiplePreview",
    text: "In which movement type did you think you performed best?",
    options: MOTION_PREVIEW_OPTIONS,
  },
  {
    type: "multiplePreview",
    text: "In which movement type did you think you performed worst?",
    options: MOTION_PREVIEW_OPTIONS,
  },
  {
    type: "slider",
    text: "Did the task feel easier over time?",
    labels: ["Not at all", "Slightly", "Neutral", "Mostly", "Definitely"]
  },
  {
    type: "slider",
    text: "Compared to static text, how much did you like the movement?",
    labels: ["Disliked it", "Somewhat disliked", "Neutral", "Somewhat liked", "Loved it"]
  },
  {
    type: "slider",
    text: "Compared to static text, did you think that the movement held your attention better?",
    labels: ["Not at all", "Somewhat less", "Neutral", "Somewhat more", "Much more"]
  },
  {
    type: "slider",
    text: "How difficult was the test overall?",
    labels: ["Very easy", "Easy", "Neutral", "Hard", "Very challenging"]
  },
  {
    type: "short",
    text: "Do you have any additional feedback or thoughts?"
  }
];
