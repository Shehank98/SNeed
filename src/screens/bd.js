// b or d? Mini lesson (bossy b vs dreamer d side by side) + mini game.
import { h, shuffle } from '../lib/dom.js';
import { Stage } from '../lib/stage.js';
import { byChar } from '../lib/letters.js';
import { drawSolid, drawArrows, letterSVG } from '../lib/guide.js';
import { playWatch } from '../lib/anim.js';
import { store, SIZE_FACTOR } from '../lib/store.js';
import { t, cueText } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { sfx } from '../lib/sfx.js';
import { confetti } from '../lib/confetti.js';
import { btn, cueCard, starsEl } from '../ui.js';
import { zonesOf } from './practice.js';

const B = byChar.b, D = byChar.d;
const DX = { b: -1.05, d: 0.25 }; // side-by-side offsets in line units
const ROUNDS = 8;

export default function bd({ go }) {
  const profile = store.profile();
  let view = 'lesson';
  let ctl = null;
  let dots = []; // game: start dot to show
  let showLetters = true;

  const stage = new Stage({
    interactive: false,
    layout: (W, H) => {
      const L = Math.min(H / 4.6, W / 3.2) * SIZE_FACTOR[profile.lineSize];
      return { L, ox: W / 2, oy: (H - 4.6 * L) / 2 + L };
    },
    getZones: () => zonesOf(profile),
    drawGuide: (ctx) => {
      if (view !== 'lesson' || !showLetters) return;
      for (const [c, dx] of [['b', DX.b], ['d', DX.d]]) {
        const shifted = { ...byChar[c], strokes: byChar[c].strokes.map((s) => ({ ...s, points: s.points.map((p) => [p[0] + dx, p[1]]) })) };
        drawSolid(ctx, stage, shifted);
        drawArrows(ctx, stage, shifted);
      }
    },
  });
  const body = h('div');
  const el = h('div', { class: 'screen game side' },
    h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('home') }), h('div', { class: 'title small' }, 'b  d'), h('div', { class: 'spacer' }),
      btn({ ico: 'replay', cls: 'round', title: t('replay'), onClick: () => lesson() })),
    h('div', { class: 'stage-wrap' }, stage.el), body);

  const startMarker = (c, dx) => ({ type: 'start', x: byChar[c].strokes[0].start[0] + dx, y: byChar[c].strokes[0].start[1], pulse: true });

  // ---------- lesson ----------
  async function lesson() {
    ctl?.cancel();
    view = 'lesson';
    showLetters = false;
    stage.setMarkers([]);
    stage.redrawGuide();
    body.replaceChildren(h('div', { class: 'qpanel' }, cueCard('bossy'), cueCard('dreamer'),
      btn({ ico: 'game', label: t('play'), cls: 'go', onClick: startGame })));
    const run = async (letter, dx, keep) => {
      stage.setMarkers([startMarker(letter.char, dx)]);
      speak(cueText(letter.char === 'b' ? 'bossy' : 'dreamer'));
      ctl = playWatch(stage, letter, { dx, keep, onStroke: () => {} });
      return ctl.promise;
    };
    const ok1 = await run(B, DX.b, []);
    if (!ok1) return;
    const keepB = B.strokes.map((s) => s.points.map((p) => [p[0] + DX.b, p[1]]));
    const ok2 = await run(D, DX.d, keepB);
    if (!ok2) return;
    showLetters = true;
    stage.setMarkers([startMarker('b', DX.b), startMarker('d', DX.d)]);
    stage.redrawGuide();
  }

  // ---------- game ----------
  function startGame() {
    ctl?.cancel();
    view = 'game';
    let round = 0, mistakes = 0;
    const deck = shuffle(Array.from({ length: ROUNDS }, (_, i) => ({ target: Math.random() < 0.5 ? 'b' : 'd', kind: i % 2 })));
    const next = () => {
      if (round >= ROUNDS) return finish();
      const { target, kind } = deck[round];
      stage.setMarkers([]);
      stage.redrawGuide();
      let q;
      if (kind === 0) {
        // a pulsing start dot: sky = b, clouds = d
        const y = target === 'b' ? 0 : 1.15;
        stage.setMarkers([{ type: 'start', x: 0, y, pulse: true }]);
        q = t('whichLetter');
      } else {
        q = target === 'b' ? t('bossyQ') : t('dreamerQ');
      }
      speak(kind === 0 ? `${t('whichLetter')} ${target === 'b' ? t('startsAtSky') : t('startsAtClouds')}` : q);
      const choices = ['b', 'd'].map((c) => {
        const btn_ = h('button', { class: 'choice', type: 'button', onclick: () => {
          if (c === target) {
            btn_.classList.add('right');
            sfx.good(2);
            speak(cueText(c === 'b' ? 'bossy' : 'dreamer'));
            setTimeout(() => { round++; next(); }, 1300);
          } else {
            mistakes++;
            btn_.classList.add('wrong');
            sfx.oops();
            speak(cueText(target === 'b' ? 'bossy' : 'dreamer'));
            setTimeout(() => btn_.classList.remove('wrong'), 400);
          }
        } }, letterSVG(byChar[c], { lines: false, tail: false }));
        return btn_;
      });
      body.replaceChildren(h('div', { class: 'qpanel' },
        h('div', { class: 'progress-dots' }, Array.from({ length: ROUNDS }, (_, i) => h('i', { class: `dotp ${i < round ? 'on' : ''}` }))),
        h('div', { class: 'q' }, kind === 0 ? `${t('whichLetter')}` : q), h('div', { class: 'choices' }, choices)));
    };
    const finish = () => {
      stage.setMarkers([]);
      confetti();
      const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
      speak(t('superStar'));
      body.replaceChildren(h('div', { class: 'qpanel' }, starsEl(stars, 3, 'big'),
        h('div', { class: 'row' }, btn({ ico: 'eye', label: t('lesson'), onClick: lesson }), btn({ ico: 'replay', label: t('again'), cls: 'go', onClick: startGame }))));
    };
    next();
  }

  return { el, mounted() { stage.resize(); lesson(); }, destroy() { ctl?.cancel(); stage.destroy(); } };
}
