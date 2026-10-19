// "Find best size": the child writes the same name/sentence at small, medium and large line sizes;
// the teacher then picks the most legible. The choice is saved on the child's profile.
import { h } from '../lib/dom.js';
import { Stage } from '../lib/stage.js';
import { store, SIZE_FACTOR } from '../lib/store.js';
import { t } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { btn } from '../ui.js';
import { zonesOf } from './practice.js';
import { unitsFor } from './words.js';

const SIZES = ['small', 'medium', 'large'];

export default function findsize({ go }) {
  const profile = store.profile();
  let text = profile.name;
  let step = -1;
  const shots = [];
  let stage = null;
  const root = h('div', { class: 'screen game' });
  const topbar = (title) => h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('teacher') }), h('div', { class: 'title small' }, title));

  function intro() {
    const input = h('input', { class: 'text', type: 'text', value: text, maxlength: 40, autocomplete: 'off' });
    root.replaceChildren(topbar(t('findBest')), h('div', { class: 'scroll pad' }, h('div', { class: 'form' },
      h('p', { class: 'label' }, t('sizeTestIntro')), input,
      btn({ ico: 'next', label: t('start'), cls: 'go wide', onClick: () => { text = input.value.trim() || profile.name; step = 0; shots.length = 0; writing(); } }))));
  }

  function writing() {
    stage?.destroy();
    const size = SIZES[step];
    stage = new Stage({
      layout: (W, H) => {
        const base = Math.min(H / 4.6, (W - 20) / unitsFor(text));
        const L = Math.max(24, base * SIZE_FACTOR[size]);
        return { L, ox: 14, oy: (H - 4.6 * L) / 2 + L };
      },
      getZones: () => zonesOf(profile),
    });
    const s = stage;
    root.replaceChildren(
      h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('teacher') }),
        h('div', { class: 'title small' }, `${step + 1}/3`), h('div', { class: 'target' }, text), h('div', { class: 'spacer' }),
        btn({ ico: 'hear', cls: 'round', title: t('hear'), onClick: () => speak(text) })),
      h('div', { class: 'stage-wrap' }, s.el),
      h('div', { class: 'actionbar' },
        btn({ ico: 'undo', label: t('undo'), onClick: () => s.undo() }),
        btn({ ico: 'clear', label: t('clear'), onClick: () => s.clear() }),
        btn({ ico: 'check', label: t('done'), cls: 'go', onClick: () => { shots[step] = s.snapshot(); if (step < 2) { step++; writing(); } else compare(); } })));
    requestAnimationFrame(() => s.resize());
    speak(text);
  }

  function compare() {
    stage?.destroy();
    stage = null;
    const btns = SIZES.map((sz, i) => h('button', { type: 'button', onclick: () => {
      store.update(profile.id, { lineSize: sz, sizeTest: { date: Date.now(), text, chosen: sz } });
      btns.forEach((b) => b.classList.remove('on'));
      btns[i].classList.add('on');
      setTimeout(() => go('teacher'), 600);
    } }, h('img', { src: shots[i], alt: sz }), `${t(sz)}${sz === profile.lineSize ? ' ✓' : ''}`));
    root.replaceChildren(topbar(t('best')), h('div', { class: 'scroll pad' }, h('p', { class: 'label' }, t('lineSizeHelp')), h('div', { class: 'size-cmp' }, btns)));
  }

  return { el: root, mounted() { intro(); }, destroy() { stage?.destroy(); } };
}
