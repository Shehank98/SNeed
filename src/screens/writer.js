// "Write it in its block": a small single-letter writing pad used by the word-blocks game.
import { h } from '../lib/dom.js';
import { Stage } from '../lib/stage.js';
import { checkLetter, bbox } from '../lib/geometry.js';
import { drawBlock, blockWidth } from '../lib/blocks.js';
import { playWatch } from '../lib/anim.js';
import { store } from '../lib/store.js';
import { t, cueText, letterSpeak } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { sfx } from '../lib/sfx.js';
import { btn } from '../ui.js';
import { letterLayout, zonesOf } from './practice.js';

/** @returns {{el, destroy, start}}  onDone(strokesNormalisedToModel, stars) */
export function createWriter(letter, { onDone, onCancel }) {
  const profile = store.profile();
  let attempts = 0, busy = false, demo = null;
  const stage = new Stage({
    layout: letterLayout(letter, profile.lineSize),
    getZones: () => zonesOf(profile),
    drawGuide: (ctx) => {
      const w = blockWidth(letter);
      const c = (letter.bbox.minX + letter.bbox.maxX) / 2;
      drawBlock(ctx, stage, { x: c - w / 2, w, letter, state: 'open' });
    },
    onStrokeEnd: () => {
      if (busy || stage.strokes.length < letter.strokes.length) return;
      busy = true;
      attempts++;
      const res = checkLetter(letter, stage.strokes, { normalizeX: true });
      store.record(letter.char, 'copy', res.stars, res.issues);
      if (res.stars >= 2 || attempts >= 3) {
        const cb = bbox(stage.strokes), rb = letter.bbox;
        const dx = rb.minX - cb.minX;
        sfx.good(res.stars);
        onDone(stage.strokes.map((s) => s.map((p) => [p[0] + dx, p[1]])), Math.max(res.stars, 1));
      } else {
        sfx.oops();
        const hint = cueText(res.hintCue);
        speak(hint);
        msg.textContent = hint;
        showDemo();
      }
    },
  });
  const msg = h('div', { class: 'fb bad' });
  const el = h('div', { class: 'screen writer' },
    h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: onCancel }),
      h('div', { class: 'title small' }, `${letter.char}  ${letter.word.emoji}`), h('div', { class: 'spacer' }),
      btn({ ico: 'hear', cls: 'round', title: t('hear'), onClick: () => speak(`${letterSpeak(letter)}. ${cueText(letter.cues[0])}`) })),
    h('div', { class: 'stage-wrap' }, stage.el), msg,
    h('div', { class: 'actionbar' },
      btn({ ico: 'undo', label: t('undo'), onClick: () => { if (!busy) stage.undo(); } }),
      btn({ ico: 'clear', label: t('clear'), onClick: () => { if (!busy) stage.clear(); } })));

  el.__stage = stage; // test hook
  function showDemo() {
    stage.frozen = true;
    demo = playWatch(stage, letter);
    demo.promise.then((ok) => {
      if (!ok) return;
      demo = null;
      stage.clear();
      stage.frozen = false;
      busy = false;
      msg.textContent = '';
    });
  }
  return {
    el,
    start() { stage.resize(); speak(`${letterSpeak(letter)}`); },
    destroy() { demo?.cancel(); stage.destroy(); },
  };
}
