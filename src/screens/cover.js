// Cover game: a letter block sits on the lines. Tall or small? Grass or dirt? Then the letter is revealed.
import { h, shuffle } from '../lib/dom.js';
import { Stage } from '../lib/stage.js';
import { letters } from '../lib/letters.js';
import { drawBlock, placeModel, blockWidth } from '../lib/blocks.js';
import { store } from '../lib/store.js';
import { t, letterSpeak } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { confetti } from '../lib/confetti.js';
import { btn, starsEl } from '../ui.js';
import { letterLayout, zonesOf } from './practice.js';
import { askTwo } from './quiz.js';

const ROUNDS = 6;

export default function cover({ go }) {
  const profile = store.profile();
  let deck = shuffle(letters).slice(0, ROUNDS);
  let round = 0, mistakes = 0, revealed = false, cur = deck[0];

  const stage = new Stage({
    interactive: false,
    layout: (W, H) => letterLayout(cur, profile.lineSize)(W, H),
    getZones: () => zonesOf(profile),
    drawGuide: (ctx) => {
      const w = blockWidth(cur);
      const c = (cur.bbox.minX + cur.bbox.maxX) / 2;
      const x = c - w / 2;
      drawBlock(ctx, stage, { x, w, letter: cur, state: revealed ? 'filled' : 'hidden', strokes: revealed ? placeModel(cur, x, w) : null });
    },
  });
  const dots = h('div', { class: 'progress-dots' });
  const panel = h('div');
  const el = h('div', { class: 'screen game side' },
    h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('games') }), h('div', { class: 'title small' }, t('cover')), h('div', { class: 'spacer' }), dots),
    h('div', { class: 'stage-wrap' }, stage.el), panel);

  function drawDots() { dots.replaceChildren(...deck.map((_, i) => h('i', { class: `dotp ${i < round ? 'on' : ''}` }))); }

  function startRound() {
    cur = deck[round];
    revealed = false;
    drawDots();
    stage.resize();
    panel.replaceChildren(askTwo(cur, { onMistake: () => mistakes++, onDone: reveal }));
  }
  function reveal() {
    revealed = true;
    stage.redrawGuide();
    confetti(40);
    speak(`${letterSpeak(cur)}! ${t('great')}`);
    panel.replaceChildren(h('div', { class: 'qpanel' },
      h('div', { class: 'q' }, `${cur.char} ${cur.word.emoji}`),
      h('div', { class: 'row' },
        btn({ ico: 'pencil', label: t('copy'), onClick: () => go(`practice/${cur.char}/copy`) }),
        btn({ ico: 'next', label: t('next'), cls: 'go', onClick: () => { round++; round < ROUNDS ? startRound() : finish(); } }))));
  }
  function finish() {
    const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
    drawDots();
    confetti();
    speak(t('superStar'));
    panel.replaceChildren(h('div', { class: 'qpanel' }, starsEl(stars, 3, 'big'),
      h('div', { class: 'row' }, btn({ ico: 'replay', label: t('again'), onClick: () => { deck = shuffle(letters).slice(0, ROUNDS); round = 0; mistakes = 0; startRound(); } }), btn({ ico: 'home', label: t('games'), cls: 'go', onClick: () => go('games') }))));
  }

  el.__state = () => ({ cur });
  return { el, mounted() { startRound(); }, destroy() { stage.destroy(); } };
}
