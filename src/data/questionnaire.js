// ============================================================
// questionnaire.js (v2.0)
// ============================================================
// Slider questions are now 5-point Likert radio scales. This avoids
// the anchoring bias of a slider that defaults to the middle, and
// matches the ordinal nature of Likert data better than continuous
// sliders. No default option is preselected, forcing an active choice.
// ============================================================

// A neutral pseudoword sentence used for previews. Same length as
// experimental sentences (7 words), composed of words NOT in the
// experimental stimulus bank to avoid any priming effects.
export const PREVIEW_SENTENCE = "talvi murket fendor brastik celum vorpex ralvit";

// Motion preview options shared by the "best" and "worst" questions.
// `motion` must match a key in MOTION_RENDERERS.
export const MOTION_PREVIEW_OPTIONS = [
  { label: "Static",                              motion: "Static" },
  { label: "Static Rapid Presentation",                         motion: "Static RSVP" },
  { label: "Dynamic Presentation — Horizontal",           motion: "Dynamic RSVP Horizontal" },
  { label: "Dynamic Presentation — Vertical",             motion: "Dynamic RSVP Vertical" },
  { label: "Flicker — Horizontal",                motion: "Flicker Horizontal" },
  { label: "Flicker — Vertical",                  motion: "Flicker Vertical" },
  { label: "Rapid Presentation Flicker",                        motion: "RSVP Flicker" },
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
    type: "likert",
    text: "Did the task feel easier over time?",
    options: ["Not at all", "Slightly", "Neutral", "Mostly", "Definitely"]
  },
  {
    type: "likert",
    text: "Compared to static text, how much did you like the movement?",
    options: ["Disliked it", "Somewhat disliked", "Neutral", "Somewhat liked", "Loved it"]
  },
  {
    type: "likert",
    text: "Compared to static text, did you think that the movement held your attention better?",
    options: ["Not at all", "Somewhat less", "Neutral", "Somewhat more", "Much more"]
  },
  {
    type: "likert",
    text: "How difficult was the test overall?",
    options: ["Very easy", "Easy", "Neutral", "Hard", "Very challenging"]
  },
  {
    type: "short",
    text: "Do you have any additional feedback or thoughts?"
  }
];
