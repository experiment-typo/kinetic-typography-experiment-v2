// ============================================================
// MotionRenderers.js  —  v2.0
// ============================================================
// All renderers share a single font size for the main stimulus stage
// (computed at session start via setupStageFontSize()), and use clip-safe
// positioning so no word ever overflows the container — regardless of
// word length, container size, or viewport.
// ============================================================

const PARAMS = {
  fontFamily: 'Kameron, "Kameron Bold", serif',
  fontSize: 56,             // px — base size; auto-scaled to fit
  minFontSize: 28,          // px — safety floor for unusually narrow viewports
  fontWeight: 700,
  textColor: '#FFFFFF',
  backgroundColor: '#000000',

  wordDuration: 390,        // ms per word — matches v1.0 reference timing
  flickerHz: 8,
  flickerOpacityLow: 0.15,
  vibrationHz: 18,
  vibrationAmplitudeRatio: 0.07,  // amplitude as fraction of font size

  highlightFadeStart: 1.0,
  highlightFadeEnd: 0.0,

  containerWidthFraction: 0.92, // sentence may use up to 92% of container width
  safetyMarginRatio: 0.05,      // 5% safety margin on each edge (no clipping)
};

// ============================================================
// Module-level state: precomputed font size for the main stage
// ============================================================
// Set once at session start by setupStageFontSize() so every renderer in
// every trial uses the same font size. This is the source of "uniformity"
// across motions.
let _stageFontSize = null;

/**
 * Precompute the largest font size at which every supplied sentence fits
 * on one line within `container` (using up to containerWidthFraction of its
 * width). Caches the result for all subsequent main-stage renderers.
 *
 * Call once at session start, passing ALL sentences the participant will see
 * (practice + experimental). Safe to re-call if the viewport changes.
 */
export function setupStageFontSize(container, sentences) {
  const containerWidth = container.offsetWidth || container.clientWidth;
  if (!containerWidth || !sentences || sentences.length === 0) {
    _stageFontSize = PARAMS.fontSize;
    return _stageFontSize;
  }
  const maxAllowed = containerWidth * PARAMS.containerWidthFraction;

  const measurer = document.createElement('span');
  measurer.style.fontFamily = PARAMS.fontFamily;
  measurer.style.fontSize = PARAMS.fontSize + 'px';
  measurer.style.fontWeight = PARAMS.fontWeight;
  measurer.style.position = 'absolute';
  measurer.style.visibility = 'hidden';
  measurer.style.whiteSpace = 'nowrap';
  document.body.appendChild(measurer);

  let maxNaturalWidth = 0;
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    let total = 0;
    for (const w of words) {
      measurer.textContent = w;
      total += measurer.offsetWidth;
    }
    total += (words.length - 1) * (PARAMS.fontSize * 0.4); // inter-word gap
    if (total > maxNaturalWidth) maxNaturalWidth = total;
  }
  document.body.removeChild(measurer);

  let size = PARAMS.fontSize;
  if (maxNaturalWidth > maxAllowed) {
    size = Math.max(PARAMS.minFontSize,
                    Math.floor(PARAMS.fontSize * (maxAllowed / maxNaturalWidth)));
  }
  _stageFontSize = size;
  return size;
}

/**
 * Returns the font size to use for `container`. Main stage (tall) uses
 * the cached stage size set by setupStageFontSize(); small containers
 * (preview tiles in the questionnaire) use a height-scaled size.
 */
function fontSizeForContainer(container) {
  const h = container.offsetHeight || 400;
  if (h >= 300 && _stageFontSize !== null) {
    return _stageFontSize;
  }
  // Preview tiles: scale font to ~22% of container height (11-22 px range)
  return Math.max(11, Math.min(22, Math.floor(h * 0.22)));
}

// ============================================================
// DOM helpers
// ============================================================

function splitWords(sentence) {
  return sentence.trim().split(/\s+/).filter(w => w.length > 0);
}

function makeWordSpan(word, fontSize) {
  const span = document.createElement('span');
  span.textContent = word;
  span.style.fontFamily = PARAMS.fontFamily;
  span.style.fontSize = fontSize + 'px';
  span.style.fontWeight = PARAMS.fontWeight;
  span.style.color = PARAMS.textColor;
  span.style.position = 'absolute';
  span.style.whiteSpace = 'nowrap';
  span.style.userSelect = 'none';
  return span;
}

function clearContainer(container) {
  container.innerHTML = '';
  if (!container.style.position) container.style.position = 'relative';
  container.style.backgroundColor = PARAMS.backgroundColor;
  container.style.overflow = 'hidden';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function measureWords(container, words, fontSize) {
  const measurer = document.createElement('span');
  measurer.style.fontFamily = PARAMS.fontFamily;
  measurer.style.fontSize = fontSize + 'px';
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

// ============================================================
// Clip-safe position helpers
// ============================================================
//
// Each word's bounding box is guaranteed to stay fully inside
// [safetyMargin, container - safetyMargin] regardless of word size or
// container size. The first word's leading edge sits at the margin,
// the last word's trailing edge sits at (container - margin), and
// intermediate words interpolate evenly between those two anchors.

function horizontalPositions(numWords, containerWidth, wordWidthsPx) {
  const safetyMargin = Math.max(8, containerWidth * PARAMS.safetyMarginRatio);
  const positions = [];
  for (let i = 0; i < numWords; i++) {
    const fraction = numWords === 1 ? 0.5 : i / (numWords - 1);
    const w = wordWidthsPx[i];
    const minCenter = safetyMargin + w / 2;
    const maxCenter = containerWidth - safetyMargin - w / 2;
    const center = (maxCenter <= minCenter)
      ? containerWidth / 2   // word too wide to spread — centre it
      : minCenter + fraction * (maxCenter - minCenter);
    positions.push(center - w / 2);
  }
  return positions;
}

function verticalPositions(numWords, containerHeight, wordHeightPx) {
  const safetyMargin = Math.max(8, containerHeight * PARAMS.safetyMarginRatio);
  const positions = [];
  const minTop = safetyMargin;
  const maxTop = containerHeight - safetyMargin - wordHeightPx;
  for (let i = 0; i < numWords; i++) {
    const fraction = numWords === 1 ? 0.5 : i / (numWords - 1);
    const top = (maxTop <= minTop)
      ? (containerHeight - wordHeightPx) / 2
      : minTop + fraction * (maxTop - minTop);
    positions.push(top);
  }
  return positions;
}

// ===============================================================
// 1. STATIC — whole sentence in one centred line
// ===============================================================
export async function renderStatic(container, sentence) {
  clearContainer(container);
  const words = splitWords(sentence);
  const fontSize = fontSizeForContainer(container);
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const isPreview = containerHeight < 200;
  const maxWidth = containerWidth * PARAMS.containerWidthFraction;

  // Pre-measure at stage font size. Since setupStageFontSize already picked
  // a size that fits the widest sentence, this should normally not overflow.
  // Local shrink is a safety net for unexpected cases.
  const { widths } = measureWords(container, words, fontSize);
  const gap = fontSize * 0.4;
  const naturalWidth = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);

  let actualFontSize = fontSize;
  let allowWrap = false;
  if (naturalWidth > maxWidth) {
    const scale = maxWidth / naturalWidth;
    if (isPreview) {
      // Preview tiles: always stay on one line — shrink as far as needed.
      actualFontSize = Math.max(6, Math.floor(fontSize * scale));
    } else if (scale < 0.5) {
      allowWrap = true; // pathological case: fall back to wrapping
    } else {
      actualFontSize = Math.max(PARAMS.minFontSize, Math.floor(fontSize * scale));
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
  wrapper.style.maxWidth = (PARAMS.containerWidthFraction * 100) + '%';

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
// HELPERS: progressive RSVP (horizontal / vertical)
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
  const amplitude = Math.max(2, Math.round(fontSize * PARAMS.vibrationAmplitudeRatio));

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

async function progressiveVerticalRSVP(container, sentence, opts = {}) {
  clearContainer(container);
  const words = splitWords(sentence);
  const fontSize = fontSizeForContainer(container);
  const { widths, height } = measureWords(container, words, fontSize);
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const positions = verticalPositions(words.length, containerHeight, height);
  const amplitude = Math.max(2, Math.round(fontSize * PARAMS.vibrationAmplitudeRatio));

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

// ============================================================
// Per-word effects
// ============================================================

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

function runVibration(span, durationMs, baseLeft, baseTop, amplitude) {
  const amp = amplitude;
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

// ============================================================
// Exported renderers
// ============================================================

export async function renderDynamicRSVPHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, {});
}
export async function renderDynamicRSVPVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, {});
}
export async function renderFlickerHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, { flicker: true });
}
export async function renderFlickerVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, { flicker: true });
}

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

export async function renderVibrationHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, { vibrate: true });
}
export async function renderVibrationVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, { vibrate: true });
}
export async function renderHighlightHorizontal(container, sentence) {
  await progressiveHorizontalRSVP(container, sentence, { highlight: true });
}
export async function renderHighlightVertical(container, sentence) {
  await progressiveVerticalRSVP(container, sentence, { highlight: true });
}

// ============================================================
// MOTION DISPATCH TABLE
// ============================================================
export const MOTION_RENDERERS = {
  "Static":                              renderStatic,
  "Static RSVP":                         renderStaticRSVP,
  "Dynamic RSVP Horizontal":             renderDynamicRSVPHorizontal,
  "Dynamic RSVP Vertical":               renderDynamicRSVPVertical,
  "Flicker Horizontal":                  renderFlickerHorizontal,
  "Flicker Vertical":                    renderFlickerVertical,
  "RSVP Flicker":                        renderRSVPFlicker,
  "Vibration Horizontal":                renderVibrationHorizontal,
  "Vibration Vertical":                  renderVibrationVertical,
  "Highlight Horizontal (redesigned)":   renderHighlightHorizontal,
  "Highlight Vertical (redesigned)":     renderHighlightVertical,
};

export function getRenderer(motionName) {
  const renderer = MOTION_RENDERERS[motionName];
  if (!renderer) {
    console.error(`No renderer found for motion: "${motionName}"`);
    return renderStatic;
  }
  return renderer;
}

// Expose params for documentation/debugging
export function getRenderParams() {
  return { ...PARAMS, currentStageFontSize: _stageFontSize };
}
