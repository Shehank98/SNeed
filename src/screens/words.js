// Words and sentences: write on the lines and keep three clouds between words.
import { h } from '../lib/dom.js';
import { Stage } from '../lib/stage.js';
import { byChar } from '../lib/letters.js';
import { inkGaps, judgeGap, gapForCircle, bbox, CLOUD_W, GAP_CLOUDS } from '../lib/geometry.js';
import { drawCloud } from '../lib/scene.js';
import { store, SIZE_FACTOR } from '../lib/store.js';
import { t, cueText } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { sfx } from '../lib/sfx.js';
import { confetti } from '../lib/confetti.js';
import { btn } from '../ui.js';
import { zonesOf } from './practice.js';

const TARGETS = ['cat', 'a big pig', 'my red hat', 'the cat sat', 'i can see a pig', 'we like to play'];

/** Rough width of a target in line units: used to size the lines so the sentence fits. */
export function unitsFor(text) {
  let u = 1.2;
  for (const w of text.split(' ')) {
    for (const c of w) u += (byChar[c] ? Math.max(0.3, byChar[c].bbox.maxX - byChar[c].bbox.minX) : 0.6) + 0.45;
    u += GAP_CLOUDS * CLOUD_W + 0.2;
  }
  return u;
}

export default function words({ go }) {
  const profile = store.profile();
  let target = TARGETS[1];
  let circleMode = false;
  let overlay = []; // [{gap, status}]

  const stage = new Stage({
    layout: (W, H) => {
      const L = Math.max(24, Math.min(H / 4.1, (W - 20) / unitsFor(target)) * SIZE_FACTOR[profile.lineSize]);
      return { L, ox: 14, oy: (H - 4.1 * L) / 2 + 0.75 * L };
    },
    getZones: () => zonesOf(profile),
    drawGuide: (ctx) => drawGaps(ctx),
    onStrokeEnd: (i, stroke, target_) => { if (target_ === 'marks') circled(stroke); else { overlay = []; stage.redrawGuide(); fb(''); } },
  });

  function drawGaps(ctx) {
    const { L } = stage.lay;
    for (const o of overlay) {
      const cw = CLOUD_W * L;
      const total = Math.max(GAP_CLOUDS, Math.floor(o.gap.clouds + 0.001));
      const startX = o.gap.x0 + (o.gap.width - GAP_CLOUDS * CLOUD_W) / 2;
      for (let i = 0; i < GAP_CLOUDS; i++) {
        const fits = i < Math.floor(o.gap.clouds + 0.001);
        const x = o.status === 'tight' ? o.gap.x0 + i * CLOUD_W + CLOUD_W / 2 : startX + i * CLOUD_W + CLOUD_W / 2;
        const [px, py] = stage.px(x, 1.5);
        ctx.globalAlpha = fits ? 1 : 0.55;
        drawCloud(ctx, px, py, cw * 0.9, fits ? '#d9ffe4' : '#ffe0e0', fits ? '#2fb84f' : '#e05252');
      }
      ctx.globalAlpha = 1;
      // bracket under the gap
      const [bx0, by] = stage.px(o.gap.x0, 2.12);
      const [bx1] = stage.px(o.gap.x1, 2.12);
      ctx.strokeStyle = o.status === 'good' ? '#2fb84f' : '#e05252';
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx0, by); ctx.lineTo(bx0, by + 8); ctx.lineTo(bx1, by + 8); ctx.lineTo(bx1, by); ctx.stroke();
    }
  }

  const feedback = h('div', { class: 'fb' });
  const fb = (msg, kind = '') => { feedback.textContent = msg; feedback.className = 'fb ' + kind; };
  const ruler = h('div', { class: 'cue-card ruler' }, h('span', { class: 'cue-fig twoClouds' }, [0, 1, 2].map((k) => h('span', { style: { '--k': k } }, '☁️'))), h('span', { class: 'cue-text' }, t('threeCloudsRule')));
  const chips = h('div', { class: 'words-pick top' }, TARGETS.map((w) => h('button', { class: `chip ${w === target ? 'on' : ''}`, type: 'button', onclick: (e) => pickTarget(w, e.currentTarget) }, w)));
  const targetEl = h('div', { class: 'target' }, target);
  const circleB = btn({ ico: 'circle', label: t('circleGaps'), onClick: toggleCircle });
  const checkB = btn({ ico: 'check', label: t('checkGaps'), cls: 'go', onClick: checkAll });
  const feedRow = h('div', { class: 'feedrow' }, feedback, ruler);
  const el = h('div', { class: 'screen game words' },
    h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('home') }), targetEl, chips,
      btn({ ico: 'hear', cls: 'round', title: t('hear'), onClick: () => speak(target) })),
    h('div', { class: 'stage-wrap' }, stage.el),
    feedRow,
    h('div', { class: 'actionbar' },
      btn({ ico: 'undo', label: t('undo'), onClick: () => { stage.undo(); overlay = []; stage.redrawGuide(); } }),
      btn({ ico: 'clear', label: t('clear'), onClick: reset }), circleB, checkB));

  const hintEl = h('div', { class: 'rotate-hint hidden' }, '↻ ' + t('rotate'));
  stage.overlay.append(hintEl);
  // narrow portrait screens make long sentences tiny: suggest landscape
  const rotateHint = () => hintEl.classList.toggle('hidden', !(stage.lay.H > stage.lay.W && stage.lay.L < 46));
  const onResize = () => setTimeout(rotateHint, 120);
  addEventListener('resize', onResize);
  function reset() { stage.clear(); overlay = []; fb(''); setCircle(false); }
  function pickTarget(w, chip) {
    target = w;
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === chip));
    targetEl.textContent = w;
    reset();
    stage.resize();
    speak(w);
    rotateHint();
  }
  function setCircle(on) {
    circleMode = on;
    stage.inkTarget = on ? 'marks' : 'ink';
    circleB.classList.toggle('active', on);
    circleB.style.background = on ? '#ff7a00' : '';
    circleB.style.color = on ? '#fff' : '';
    if (!on) stage.clearMarks();
  }
  function toggleCircle() {
    setCircle(!circleMode);
    if (circleMode) { fb(t('circleSpace')); speak(t('circleSpace')); }
  }

  function report(res) {
    const { status } = res;
    const msg = status === 'good' ? t('good3') : status === 'wide' ? t('wide') : t('tight');
    fb(msg, status === 'good' ? 'good' : 'bad');
    speak(status === 'tight' ? `${msg} ${cueText('threeClouds')}` : msg);
    status === 'good' ? sfx.good(3) : sfx.oops();
  }

  function circled(stroke) {
    const bb = bbox([stroke]);
    const { gaps } = inkGaps(stage.strokes);
    const gap = gapForCircle(gaps, bb);
    stage.clearMarks();
    if (!gap) { fb(t('circleSpace'), 'bad'); sfx.oops(); return; }
    const res = judgeGap(gap);
    overlay = [{ gap, status: res.status }];
    stage.redrawGuide();
    report(res);
    if (res.status === 'good') confetti(30);
  }

  function checkAll() {
    setCircle(false);
    const { gaps } = inkGaps(stage.strokes);
    const need = target.split(' ').length - 1;
    if (need === 0) { fb(t('good3'), 'good'); sfx.good(3); return; }
    // the widest (words - 1) gaps are the word gaps
    const wordGaps = [...gaps].sort((a, b) => b.width - a.width).slice(0, need).sort((a, b) => a.x0 - b.x0);
    if (wordGaps.length < need) { fb(t('tight'), 'bad'); sfx.oops(); speak(cueText('threeClouds')); return; }
    overlay = wordGaps.map((g) => ({ gap: g, status: judgeGap(g).status }));
    stage.redrawGuide();
    const worst = overlay.find((o) => o.status !== 'good');
    if (!worst) { report({ status: 'good' }); confetti(); } else report({ status: worst.status });
  }

  el.__stage = stage; // test hook
  return { el, mounted() { stage.resize(); rotateHint(); speak(`${target}. ${cueText('threeClouds')}`); }, destroy() { removeEventListener('resize', onResize); stage.destroy(); } };
}
