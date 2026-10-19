// The two cover-game questions, reused by the Cover game and the word-blocks game:
//   "Tall or small?"  and  "Sits on the grass or goes in the dirt?"
import { h } from '../lib/dom.js';
import { t, cueText } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { sfx } from '../lib/sfx.js';

const miniBlock = (tall) =>
  `<svg viewBox="0 0 30 46" width="30" height="46"><rect x="4" y="${tall ? 2 : 24}" width="22" height="${tall ? 42 : 20}" rx="5" fill="none" stroke="#8a5cf6" stroke-width="4" stroke-dasharray="6 4"/></svg>`;

export function askTwo(letter, { onDone, onMistake, onStep } = {}) {
  const tall = letter.group === 'tall';
  const dirt = letter.group === 'dirt';
  const steps = [
    { q: t('tallOrSmall'), correct: tall ? 'tall' : 'small', hint: tall ? 'tallSky' : 'smallStay',
      opts: [{ v: 'tall', label: t('tall'), html: miniBlock(true) }, { v: 'small', label: t('small'), html: miniBlock(false) }] },
    { q: t('grassOrDirt'), correct: dirt ? 'dirt' : 'grass', hint: dirt ? 'muddy' : 'smallStay',
      opts: [{ v: 'grass', label: t('onGrass'), html: '<span style="font-size:38px">🌱</span>' }, { v: 'dirt', label: t('inDirt'), html: '<span style="font-size:38px">🪱</span>' }] },
  ];
  let i = 0, mistakes = 0;
  const el = h('div', { class: 'qpanel' });
  function render() {
    const s = steps[i];
    onStep?.(i);
    speak(s.q);
    el.replaceChildren(
      h('div', { class: 'q', onclick: () => speak(s.q) }, s.q),
      h('div', { class: 'choices' }, s.opts.map((o) => {
        const b = h('button', { class: 'choice', type: 'button', onclick: () => answer(b, o, s) }, h('span', { html: o.html }), o.label);
        return b;
      })));
  }
  function answer(b, o, s) {
    if (o.v === s.correct) {
      b.classList.add('right');
      sfx.good(1);
      setTimeout(() => { i++; i < steps.length ? render() : onDone?.(mistakes); }, 600);
    } else {
      mistakes++;
      b.classList.add('wrong');
      sfx.oops();
      speak(cueText(s.hint));
      onMistake?.(s.hint);
      setTimeout(() => b.classList.remove('wrong'), 400);
    }
  }
  render();
  return el;
}
