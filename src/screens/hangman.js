// Word blocks (hangman-style): blocks show each letter's height and dirt tail.
// Guess a letter -> answer tall/small + grass/dirt -> write it in its block.
import { h, pick, shuffle } from '../lib/dom.js';
import { Stage } from '../lib/stage.js';
import { byChar, letters } from '../lib/letters.js';
import { drawBlock, blockWidth, placeChild, placeModel } from '../lib/blocks.js';
import { store } from '../lib/store.js';
import { t, letterSpeak } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { sfx } from '../lib/sfx.js';
import { confetti } from '../lib/confetti.js';
import { btn, starsEl } from '../ui.js';
import { zonesOf } from './practice.js';
import { askTwo } from './quiz.js';
import { createWriter } from './writer.js';

export const WORDS = [
  ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['pig', '🐷'], ['hat', '🎩'], ['bed', '🛏️'], ['bug', '🐛'], ['fox', '🦊'], ['hen', '🐔'], ['jam', '🍓'],
  ['cup', '☕'], ['van', '🚐'], ['egg', '🥚'], ['owl', '🦉'], ['ant', '🐜'], ['fish', '🐟'], ['frog', '🐸'], ['duck', '🦆'], ['kite', '🪁'], ['moon', '🌙'], ['tree', '🌳'], ['ball', '⚽'],
];
const LIVES = 6;
const GAP = 0.3;

export default function hangman({ go }) {
  const profile = store.profile();
  let [word, emoji] = pick(WORDS);
  let blocks = [], guessed, lives, over, writer;

  const stage = new Stage({
    interactive: false,
    layout: (W, H) => {
      if (!blocks.length) return { L: 60, ox: 0, oy: 60 };
      const total = blocks.reduce((s, b) => s + b.w + GAP, -GAP);
      const L = Math.min(H / 4.6, (W - 24) / total) * 0.98;
      return { L, ox: (W - total * L) / 2, oy: (H - 4.6 * L) / 2 + L };
    },
    getZones: () => zonesOf(profile),
    drawGuide: (ctx) => blocks.forEach((b) => drawBlock(ctx, stage, { x: b.x, w: b.w, letter: b.letter, state: b.strokes ? 'filled' : 'open', strokes: b.strokes, glow: b.glow })),
  });
  const balloons = h('div', { class: 'balloons' });
  const keyboard = h('div', { class: 'keyboard' });
  const panel = h('div', { class: 'qpanel' });
  const title = h('div', { class: 'title small' });
  const host = h('div', { class: 'screen game side' },
    h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('games') }), title, h('div', { class: 'spacer' }), balloons),
    h('div', { class: 'stage-wrap' }, stage.el), panel);
  const el = host;

  function newGame() {
    [word, emoji] = pick(WORDS.filter(([w]) => w !== word));
    let x = 0;
    blocks = [...word].map((c) => {
      const letter = byChar[c];
      const w = blockWidth(letter);
      const b = { c, letter, x, w, strokes: null };
      x += w + GAP;
      return b;
    });
    guessed = new Set();
    lives = LIVES;
    over = false;
    title.textContent = emoji;
    renderBalloons();
    renderKeys();
    stage.resize();
    speak(`${word}`);
  }
  const renderBalloons = () => balloons.replaceChildren(...Array.from({ length: LIVES }, (_, i) => h('span', { class: i < lives ? '' : 'pop' }, '🎈')));
  function renderKeys() {
    keyboard.replaceChildren(...letters.map((l) => {
      const k = h('button', { class: `key ${guessed.has(l.char) ? 'used' : ''}`, type: 'button', onclick: () => guess(l.char, k) }, l.char);
      return k;
    }));
    panel.replaceChildren(h('div', { class: 'q' }, t('guess')), keyboard);
  }

  function guess(c, key) {
    if (over || guessed.has(c)) return;
    guessed.add(c);
    key.classList.add('used');
    if (!word.includes(c)) {
      key.classList.add('miss');
      lives--;
      renderBalloons();
      sfx.oops();
      if (lives <= 0) return lose();
      return;
    }
    key.classList.add('hit');
    const letter = byChar[c];
    blocks.forEach((b) => { b.glow = b.c === c; });
    stage.redrawGuide();
    speak(letterSpeak(letter));
    panel.replaceChildren(askTwo(letter, { onDone: () => writeIt(letter) }));
  }

  function writeIt(letter) {
    writer = createWriter(letter, {
      onCancel: () => closeWriter(),
      onDone: (strokes) => {
        blocks.forEach((b) => {
          b.glow = false;
          if (b.c === letter.char) b.strokes = placeChild(letter, strokes, b.x, b.w);
        });
        closeWriter();
        stage.redrawGuide();
        if (blocks.every((b) => b.strokes)) return win();
        renderKeys();
      },
    });
    writer.el.style.zIndex = 5;
    host.append(writer.el);
    writer.start();
  }
  function closeWriter() {
    writer?.destroy();
    writer?.el.remove();
    writer = null;
    blocks.forEach((b) => (b.glow = false));
    stage.redrawGuide();
    if (!over) renderKeys();
  }

  function win() {
    over = true;
    confetti();
    sfx.good(3);
    speak(`${t('youDidIt')} ${word}`);
    panel.replaceChildren(h('div', { class: 'qpanel' }, starsEl(lives >= 5 ? 3 : lives >= 3 ? 2 : 1, 3, 'big'), h('div', { class: 'q' }, `${emoji} ${word}`),
      h('div', { class: 'row' }, btn({ ico: 'replay', label: t('again'), onClick: newGame }), btn({ ico: 'home', label: t('games'), cls: 'go', onClick: () => go('games') }))));
  }
  function lose() {
    over = true;
    blocks.forEach((b) => { if (!b.strokes) b.strokes = placeModel(b.letter, b.x, b.w); });
    stage.redrawGuide();
    speak(`${t('wordWas')} ${word}`);
    panel.replaceChildren(h('div', { class: 'qpanel' }, h('div', { class: 'praise' }, t('niceTry')), h('div', { class: 'q' }, `${emoji} ${word}`),
      h('div', { class: 'row' }, btn({ ico: 'replay', label: t('again'), cls: 'accent', onClick: newGame }), btn({ ico: 'home', label: t('games'), onClick: () => go('games') }))));
  }

  el.__state = () => ({ word, stage, writer: writer?.el.__stage });
  return { el, mounted() { newGame(); }, destroy() { writer?.destroy(); stage.destroy(); } };
}
