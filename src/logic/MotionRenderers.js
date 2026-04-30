// ============================================================
// MotionRenderers.js  —  v2.0 (matched to v1.0 reference videos)
// ============================================================
// Each renderer takes a stimulus container and a carrier sentence,
// and returns a Promise that resolves when the animation completes.
//
// PARAMETERS — calibrated against v1.0 reference videos
// (~390ms per word, 7 words ≈ 2.75 seconds total exposure)
// ============================================================
const PARAMS = {
  fontFamily: 'Kameron, "Kameron Bold", serif',
  fontSize: 56,             // px
  fontWeight: 700,
  textColor: '#FFFFFF',
  backgroundColor: '#000000',

  wordDuration: 390,        // ms per word — matches v1.0 reference timing
  flickerHz: 8,             // visible flicker rate (~5 cycles per word at 390ms)
  flickerOpacityLow: 0.15,
  vibrationHz: 18,          // visible jitter rate
  vibrationAmplitude: 4,    // pixels — small enough to read but visibly trembling

  // Highlight fade: word starts at 100% brightness, fades to ~0 by end
  highlightFadeStart: 1.0,
  highlightFadeEnd: 0.0,

  // Position spread for Horizontal/Vertical RSVP
  positionMargin: 0.10,     // 10% margin from each edge
};

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────
function splitWords(sentence) {
  return sentence.split(/\s+/).filter(w => w.length > 0);
}

function makeWordSpan(word, fontSize) {
  const span = document.createElement('span');
  span.textContent = word;
  span.style.fontFamily = PARAMS.fontFamily;
  span.style.fontSize = (fontSize || PARAMS.fontSize) + 'px';
  span.style.fontWeight = PARAMS.fontWeight;
  span.style.color = PARAMS.textColor;
  span.style.position = 'absolute';
  span.style.whiteSpace = 'nowrap';
  span.style.userSelect = 'none';
  return span;
}

/**
 * Determine an appropriate font size for the given container.
 * For the main experiment stage we use PARAMS.fontSize. For small
 * preview tiles we scale down based on container height.
 */
function fontSizeForContainer(container) {
  const h = container.offsetHeight || 400;
  if (h >= 400) return PARAMS.fontSize;        // experiment stage
  // For preview tiles: scale font to ~22% of container height,
  // capped at 22px for legibility at small sizes.
  return Math.max(11, Math.min(22, Math.floor(h * 0.22)));
}

function clearContainer(container) {
  container.innerHTML = '';
  // Only set the position and overflow; let the host control width/height
  // so renderers can be reused for both the main stage and small previews.
  if (!container.style.position) container.style.position = 'relative';
  container.style.backgroundColor = PARAMS.backgroundColor;
  container.style.overflow = 'hidden';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * For N words spread horizontally across container width W, return the
 * x-position (left in px) for the i-th word. Words are centered at evenly-
 * spaced fractions, with a margin reserved on each side.
 */
function horizontalPositions(numWords, containerWidth, wordWidthsPx) {
  const margin = containerWidth * PARAMS.positionMargin;
  const usable = containerWidth - 2 * margin;
  const positions = [];
  for (let i = 0; i < numWords; i++) {
    const fraction = numWords === 1 ? 0.5 : i / (numWords - 1);
    const centerX = margin + fraction * usable;
    const leftX = centerX - wordWidthsPx[i] / 2;
    positions.push(leftX);
  }
  return positions;
}

function verticalPositions(numWords, containerHeight, wordHeightPx) {
  const margin = containerHeight * PARAMS.positionMargin;
  const usable = containerHeight - 2 * margin;
  const positions = [];
  for (let i = 0; i < numWords; i++) {
    const fraction = numWords === 1 ? 0.5 : i / (numWords - 1);
    const centerY = margin + fraction * usable;
    const topY = centerY - wordHeightPx / 2;
    positions.push(topY);
  }
  return positions;
}

/** Measure each word's rendered width by inserting hidden into container. */
function measureWords(container, words, fontSize) {
  const measurer = document.createElement('span');
  measurer.style.fontFamily = PARAMS.fontFamily;
  measurer.style.fontSize = (fontSize || PARAMS.fontSize) + 'px';
  measurer.style.fontWeight = PARAMS.fontWeight;
  measurer.style.position = 'absolute';
  measurer.style.visibility = 'hidden';
  measurer.style.whiteSpace = 'nowrap';
  container.appendChild(measurer);
  const widths = words.map(w => {
    measurer.textContent = w;
    return measurer.offsetWidth;
  });
  const height = measurer.offsetHeight;
  container.removeChild(measurer);
  return { widths, height };
}

// ===============================================================
// 1. STATIC — whole sentence shown simultaneously, centred, single line
//    (auto-shrinks font; falls back to wrapping if container is too narrow)
// ===============================================================
export async function renderStatic(container, sentence) {
  clearContainer(container);
  const words = splitWords(sentence);
  const fontSize = fontSizeForContainer(container);
  const containerWidth = container.offsetWidth;
  const maxWidth = containerWidth * 0.92;

  // Pre-measure: compute total natural width at the candidate font size
  const { widths: wordWidths } = measureWords(container, words, fontSize);
  const gap = fontSize * 0.4;
  const naturalWidth = wordWidths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);

  // Decide actual font size: shrink if natural width would overflow
  let actualFontSize = fontSize;
  let allowWrap = false;
  if (naturalWidth > maxWidth) {
    const scale = maxWidth / naturalWidth;
    // If we'd have to shrink below ~40% of original, allow wrapping instead.
    // This mostly affects very small preview containers.
    if (scale < 0.4) {
      allowWrap = true;
      actualFontSize = fontSize;
    } else {
      actualFontSize = Math.max(11, Math.floor(fontSize * scale));
    }
  }
  const actualGap = actualFontSize * 0.4;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.top = '50%';
  wrapper.style.left = '50%';
  wrapper.style.transform = 'translate(-50%, -50%)';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'row';
  wrapper.style.flexWrap = allowWrap ? 'wrap' : 'nowrap';
  wrapper.style.justifyContent = 'center';
  wrapper.style.alignItems = 'baseline';
  wrapper.style.gap = actualGap + 'px';
  wrapper.style.whiteSpace = 'nowrap';
  wrapper.style.maxWidth = '92%';

  words.forEach(w => {
    const s = makeWordSpan(w, actualFontSize);
    s.style.position = 'static';
    s.style.whiteSpace = 'nowrap';
    wrapper.appendChild(s);
  });
  container.appendChild(wrapper);

  await sleep(words.length * PARAMS.wordDuration);
}

// ===============================================================
// 2. STATIC RSVP — words one at a time, centred, no motion
// ===============================================================
export async function renderStaticRSVP(container, sentence) {
  clearContainer(container);
  const words = splitWords(sentence);
  const fontSize = fontSizeForContainer(container);
  const span = makeWordSpan('', fontSize);
  span.style.top = '50%';
  span.style.left = '50%';
  span.style.transform = 'translate(-50%, -50%)';
  container.appendChild(span);
  for (const word of words) {
    span.textContent = word;
    await sleep(PARAMS.wordDuration);
  }
  span.textContent = '';
}

// ===============================================================
// HELPER: progressive horizontal RSVP
// Each word appears at progressive horizontal position, replacing the
// previous one. Used by Dynamic RSVP, Flicker, Vibration, Highlight (H).
// ===============================================================
async function progressiveHorizontalRSVP(container, sentence, opts = {}) {
  clearContainer(container);
  const words = splitWords(sentence);
  const fontSize = fontSizeForContainer(container);
  const { widths, height } = measureWords(container, words, fontSize);
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const positions = horizontalPositions(words.length, containerWidth, widths);
  const centerY = (containerHeight - height) / 2;

  // Scale vibration amplitude proportionally to font size
  const amplitude = Math.max(2, Math.round(PARAMS.vibrationAmplitude * (fontSize / PARAMS.fontSize)));

  for (let i = 0; i < words.length; i++) {
    const span = makeWordSpan(words[i], fontSize);
    span.style.left = positions[i] + 'px';
    span.style.top = centerY + 'px';
    container.appendChild(span);

    if (opts.flicker)        await runFlicker(span, PARAMS.wordDuration);
    else if (opts.vibrate)   await runVibration(span, PARAMS.wordDuration, positions[i], centerY, amplitude);
    else if (opts.highlight) await runHighlightFade(span, PARAMS.wordDuration);
    else                      await sleep(PARAMS.wordDuration);

    container.removeChild(span);
  }
}

// ===============================================================
// HELPER: progressive vertical RSVP
// ===============================================================
async function progressiveVerticalRSVP(container, sentence, opts = {}) {
  clearContainer(container);
  const words = splitWords(sentence);
  const fontSize = fontSizeForContainer(container);
  const { widths, height } = measureWords(container, words, fontSize);
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const positions = verticalPositions(words.length, containerHeight, height);

  const amplitude = Math.max(2, Math.round(PARAMS.vibrationAmplitude * (fontSize / PARAMS.fontSize)));

  for (let i = 0; i < words.length; i++) {
    const span = makeWordSpan(words[i], fontSize);
    const leftX = (containerWidth - widths[i]) / 2;
    span.style.left = leftX + 'px';
    span.style.top = positions[i] + 'px';
    container.appendChild(span);

    if (opts.flicker)        await runFlicker(span, PARAMS.wordDuration);
    else if (opts.vibrate)   await runVibration(span, PARAMS.wordDuration, leftX, positions[i], amplitude);
    else if (opts.highlight) await runHighlightFade(span, PARAMS.wordDuration);
    else                      await sleep(PARAMS.wordDuration);

    container.removeChild(span);
  }
}

// ───────────────────────────────────────────────────────────────
// Per-word effects
// ───────────────────────────────────────────────────────────────

/** Opacity oscillation: square-wave between 1.0 and flickerOpacityLow */
function runFlicker(span, durationMs) {
  return new Promise(resolve => {
    const start = performance.now();
    const periodMs = 1000 / PARAMS.flickerHz;
    let rafId;
    function tick() {
      const elapsed = performance.now() - start;
      if (elapsed >= durationMs) {
        span.style.opacity = '1';
        cancelAnimationFrame(rafId);
        resolve();
        return;
      }
      const phase = (elapsed / periodMs) % 1;
      span.style.opacity = phase < 0.5 ? '1' : String(PARAMS.flickerOpacityLow);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  });
}

/** Small high-frequency oscillation in x and y. */
function runVibration(span, durationMs, baseLeft, baseTop, amplitude) {
  const amp = amplitude || PARAMS.vibrationAmplitude;
  return new Promise(resolve => {
    const start = performance.now();
    let rafId;
    function tick() {
      const elapsed = performance.now() - start;
      if (elapsed >= durationMs) {
        span.style.left = baseLeft + 'px';
        span.style.top = baseTop + 'px';
        cancelAnimationFrame(rafId);
        resolve();
        return;
      }
      const phase = (elapsed / 1000) * PARAMS.vibrationHz * 2 * Math.PI;
      const dx = Math.sin(phase) * amp;
      const dy = Math.cos(phase * 1.3) * amp;
      span.style.left = (baseLeft + dx) + 'px';
      span.style.top = (baseTop + dy) + 'px';
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  });
}

/** Linear opacity fade from highlightFadeStart to highlightFadeEnd. */
function runHighlightFade(span, durationMs) {
  return new Promise(resolve => {
    const start = performance.now();
    let rafId;
    function tick() {
      const elapsed = performance.now() - start;
      if (elapsed >= durationMs) {
        cancelAnimationFrame(rafId);
        resolve();
        return;
      }
      const t = elapsed / durationMs;
      const opacity = PARAMS.highlightFadeStart -
                      (PARAMS.highlightFadeStart - PARAMS.highlightFadeEnd) * t;
      span.style.opacity = String(opacity);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  });
}

// ===============================================================
// 3, 4. DYNAMIC RSVP — Horizontal / Vertical
// ===============================================================
export async function renderDynamicRSVPHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, {});
}
export async function renderDynamicRSVPVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, {});
}

// ===============================================================
// 5, 6. FLICKER — Horizontal / Vertical
// ===============================================================
export async function renderFlickerHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, { flicker: true });
}
export async function renderFlickerVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, { flicker: true });
}

// ===============================================================
// 7. RSVP FLICKER — stationary, centred, opacity flicker
// ===============================================================
export async function renderRSVPFlicker(container, sentence) {
  clearContainer(container);
  const words = splitWords(sentence);
  const fontSize = fontSizeForContainer(container);
  const span = makeWordSpan('', fontSize);
  span.style.top = '50%';
  span.style.left = '50%';
  span.style.transform = 'translate(-50%, -50%)';
  container.appendChild(span);
  for (const word of words) {
    span.textContent = word;
    await runFlicker(span, PARAMS.wordDuration);
  }
  span.textContent = '';
}

// ===============================================================
// 8, 9. VIBRATION — Horizontal / Vertical
// ===============================================================
export async function renderVibrationHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, { vibrate: true });
}
export async function renderVibrationVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, { vibrate: true });
}

// ===============================================================
// 10, 11. HIGHLIGHT — Horizontal / Vertical (matches v1.0 reference)
// Each word appears at full brightness at its progressive position,
// then fades to invisible over the word duration. The brief peak of
// brightness is the "highlight pulse"; subsequent words appear at
// new positions and the cycle repeats.
// ===============================================================
export async function renderHighlightHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, { highlight: true });
}
export async function renderHighlightVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, { highlight: true });
}

// ===============================================================
// MOTION DISPATCH TABLE
// ===============================================================
export const MOTION_RENDERERS = {
  "Static": renderStatic,
  "Static RSVP": renderStaticRSVP,
  "Dynamic RSVP Horizontal": renderDynamicRSVPHorizontal,
  "Dynamic RSVP Vertical": renderDynamicRSVPVertical,
  "Flicker Horizontal": renderFlickerHorizontal,
  "Flicker Vertical": renderFlickerVertical,
  "RSVP Flicker": renderRSVPFlicker,
  "Vibration Horizontal": renderVibrationHorizontal,
  "Vibration Vertical": renderVibrationVertical,
  "Highlight Horizontal (redesigned)": renderHighlightHorizontal,
  "Highlight Vertical (redesigned)": renderHighlightVertical,
};

export function getRenderer(motionName) {
  const renderer = MOTION_RENDERERS[motionName];
  if (!renderer) {
    console.error(`No renderer found for motion: "${motionName}"`);
    return renderStatic;
  }
  return renderer;
}
