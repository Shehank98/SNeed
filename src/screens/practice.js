// Practice one letter in three modes: Watch, Trace, Copy.
import { h } from '../lib/dom.js';
import { Stage } from '../lib/stage.js';
import { byChar, nextLetter, cues } from '../lib/letters.js';
import { checkLetter } from '../lib/geometry.js';
import { drawDotted, drawSolid, drawArrows, letterSVG } from '../lib/guide.js';
import { playWatch } from '../lib/anim.js';
import { store, SIZE_FACTOR } from '../lib/store.js';
import { t, cueText, letterSpeak } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { sfx } from '../lib/sfx.js';
import { confetti } from '../lib/confetti.js';
import { btn, starsEl, cueCard } from '../ui.js';
import { icon } from '../lib/icons.js';

export const letterLayout = (letter, sizeKey) => (W, H) => {
  const bb = letter.bbox;
  const wUnits = Math.max(1.8, bb.maxX - bb.minX + 1.1);
  const L = Math.min(H / 4.6, W / wUnits) * SIZE_FACTOR[sizeKey];
  return { L, ox: W / 2 - ((bb.minX + bb.maxX) / 2) * L, oy: (H - 4.6 * L) / 2 + L };
};
export const zonesOf = (p) => ({ showZones: p.showZones, showDirt: p.showDirt, highlightGrass: p.highlightGrass, threeLine: p.threeLine });

export default function practice({ params, go }) {
  const char = params[0] in byChar ? params[0] : 'a';
  let mode = ['watch', 'trace', 'copy'].includes(params[1]) ? params[1] : 'watch';
  const letter = byChar[char];
  const profile = store.profile();
  let nextStroke = 0;
  let watchCtl = null;
  let busy = false; // result shown or demo playing
  let evaluated = false;

  const stage = new Stage({
    layout: letterLayout(letter, profile.lineSize),
    getZones: () => zonesOf(profile),
    drawGuide: (ctx) => paintGuide(ctx),
    onStrokeEnd: (i) => strokeDone(i),
  });

  // ---------- DOM ----------
  const modeBtns = ['watch', 'trace', 'copy'].map((m) =>
    btn({ ico: m === 'watch' ? 'eye' : m === 'trace' ? 'trace' : 'pencil', label: t(m), cls: 'tab', onClick: () => go(`practice/${char}/${m}`) }));
  modeBtns[['watch', 'trace', 'copy'].indexOf(mode)].classList.add('active');

  const glyph = h('button', { class: 'glyph', type: 'button', onclick: hear, title: t('hear') }, letterSVG(letter, { lines: false }), h('span', { class: 'word' }, `${letter.word.emoji}`));
  let best = starsEl(profile.letters[char]?.best || 0, 3, 'small');
  const cueRow = h('div', { class: 'cue-row' });
  const resultEl = h('div', { class: 'result hidden' });
  const modelEl = h('div', { class: 'model hidden' });
  stage.overlay.append(cueRow, resultEl, modelEl);

  const undoB = btn({ ico: 'undo', label: t('undo'), onClick: () => { if (!busy) { stage.undo(); syncNext(); } } });
  const clearB = btn({ ico: 'clear', label: t('clear'), onClick: () => { if (!busy) reset(); } });
  const replayB = btn({ ico: 'replay', label: t('replay'), cls: 'accent', onClick: () => startWatch() });
  const hearB = btn({ ico: 'hear', label: t('hear'), onClick: hear });
  const nextB = btn({ ico: 'next', label: t('next'), cls: 'go', onClick: () => go(`practice/${nextLetter(char)}/${mode}`) });
  const backB = btn({ ico: 'back', label: t('back'), onClick: () => go('letters') });

  const actions = h('div', { class: 'actionbar' }, backB, mode === 'watch' ? replayB : [undoB, clearB], hearB, nextB);
  const el = h('div', { class: 'screen practice' },
    h('div', { class: 'topbar' }, h('div', { class: 'brand' }, glyph, best), h('div', { class: 'tabs' }, modeBtns)),
    h('div', { class: 'stage-wrap' }, stage.el),
    actions);

  // ---------- guide painting ----------
  function paintGuide(ctx) {
    if (mode === 'trace') drawDotted(ctx, stage, letter, nextStroke);
    else if (mode === 'watch' && !watchCtl && watchDone) {
      drawSolid(ctx, stage, letter);
      drawArrows(ctx, stage, letter);
    }
  }
  let watchDone = false;

  function traceMarkers() {
    const items = [];
    if (nextStroke < letter.strokes.length) {
      const s = letter.strokes[nextStroke];
      items.push({ type: s.dot ? 'dot' : 'start', x: s.start[0], y: s.start[1], n: nextStroke + 1, pulse: true });
      (s.cloudTaps || []).forEach((c) => items.push({ type: 'cloud', x: c[0], y: c[1] }));
    }
    stage.setMarkers(items);
  }
  function staticMarkers() {
    const items = [];
    letter.strokes.forEach((s, i) => {
      items.push({ type: s.dot ? 'dot' : 'start', x: s.start[0], y: s.start[1], n: i + 1 });
      (s.cloudTaps || []).forEach((c) => items.push({ type: 'cloud', x: c[0], y: c[1] }));
    });
    stage.setMarkers(items);
  }

  // ---------- modes ----------
  function showCues(speakIt) {
    cueRow.replaceChildren(...letter.cues.slice(0, 2).map((k) => cueCard(k)));
    cueRow.classList.remove('hidden');
    if (speakIt) speak(`${letterSpeak(letter)}. ${letter.cues.slice(0, 2).map(cueText).join(' ')}`);
  }

  function startWatch() {
    stopWatch();
    reset(true);
    stage.frozen = true;
    watchDone = false;
    showCues(true);
    stage.setMarkers([]);
    stage.redrawGuide();
    watchCtl = playWatch(stage, letter, {
      onStroke: (i) => {
        const s = letter.strokes[i];
        stage.setMarkers([{ type: s.dot ? 'dot' : 'start', x: s.start[0], y: s.start[1], n: i + 1, pulse: true }, ...(s.cloudTaps || []).map((c) => ({ type: 'cloud', x: c[0], y: c[1] }))]);
      },
    });
    watchCtl.promise.then((ok) => {
      if (!ok) return;
      watchCtl = null;
      watchDone = true;
      stage.frozen = mode === 'watch';
      staticMarkers();
      stage.redrawGuide();
      afterDemo?.();
      afterDemo = null;
    });
  }
  let afterDemo = null;
  function stopWatch() {
    watchCtl?.cancel();
    watchCtl = null;
    stage.frozen = mode === 'watch';
  }

  function reset(keepGuide = false) {
    evaluated = false;
    busy = false;
    stage.frozen = mode === 'watch';
    nextStroke = 0;
    resultEl.classList.add('hidden');
    stage.strokes = [];
    stage.redrawInk();
    if (!keepGuide) {
      if (mode === 'trace') { traceMarkers(); stage.redrawGuide(); }
      else if (mode === 'copy') { stage.setMarkers([]); stage.redrawGuide(); }
    }
    syncNext();
  }
  function syncNext() {
    nextStroke = Math.min(stage.strokes.length, letter.strokes.length);
    if (mode === 'trace') { traceMarkers(); stage.redrawGuide(); }
  }

  function strokeDone() {
    if (evaluated) return;
    nextStroke = Math.min(stage.strokes.length, letter.strokes.length);
    sfx.pop();
    if (mode === 'trace') { traceMarkers(); stage.redrawGuide(); }
    if (stage.strokes.length >= letter.strokes.length) evaluate();
  }

  function evaluate() {
    evaluated = true;
    busy = true;
    stage.frozen = true;
    const res = checkLetter(letter, stage.strokes, { normalizeX: mode === 'copy' });
    store.record(char, mode, res.stars, res.issues);
    const nb = starsEl(store.profile().letters[char]?.best || 0, 3, 'small');
    best.replaceWith(nb);
    best = nb;
    showResult(res);
  }

  function showResult(res) {
    const hint = res.hintCue ? cueText(res.hintCue) : '';
    const praise = res.stars === 3 ? t('superStar') : res.stars === 2 ? t('great') : t('niceTry');
    const retry = btn({ ico: 'undo', label: t('again'), cls: res.stars < 3 ? 'accent' : '', onClick: retryNow });
    const nxt = btn({ ico: 'next', label: t('next'), cls: 'go', onClick: () => go(`practice/${nextLetter(char)}/${mode}`) });
    resultEl.replaceChildren(
      h('div', { class: 'result-card' },
        starsEl(res.stars, 3, 'big'),
        h('div', { class: 'praise' }, praise),
        hint ? h('div', { class: 'hint' }, hint) : null,
        h('div', { class: 'row' }, retry, res.stars >= 2 ? nxt : null)));
    resultEl.classList.remove('hidden');
    res.stars === 3 ? (sfx.good(3), confetti()) : res.stars === 2 ? sfx.good(2) : sfx.oops();
    speak(hint ? `${praise} ${hint}` : praise);
    function retryNow() {
      resultEl.classList.add('hidden');
      if (res.stars <= 1) {
        // kindly show the Watch demo again, then let the child try once more
        afterDemo = () => reset();
        startWatch();
      } else {
        reset();
      }
    }
  }

  function hear() { showCues(false); speak(`${letterSpeak(letter)}. ${letter.cues.slice(0, 2).map(cueText).join(' ')}`); }

  function setupMode() {
    modelEl.classList.add('hidden');
    cueRow.classList.add('hidden');
    if (mode === 'watch') {
      startWatch();
    } else if (mode === 'trace') {
      showCues(false);
      cueRow.classList.add('compact');
      traceMarkers();
      stage.redrawGuide();
      speak(`${letterSpeak(letter)}. ${cueText(letter.cues[0])}`);
    } else {
      modelEl.replaceChildren(letterSVG(letter, { lines: true, numbers: true, tail: true }));
      modelEl.classList.remove('hidden');
      stage.setMarkers([]);
      stage.redrawGuide();
      speak(letterSpeak(letter));
    }
  }

  el.__stage = stage; // handy for automated tests
  return {
    el,
    mounted() { stage.resize(); setupMode(); },
    destroy() { stopWatch(); stage.destroy(); },
  };
}
