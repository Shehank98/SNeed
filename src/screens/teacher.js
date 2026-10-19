// Teacher view (PIN protected): per-child line size + remediation toggles + printable progress.
import { h } from '../lib/dom.js';
import { store } from '../lib/store.js';
import { t, cueText, LANGS } from '../lib/i18n.js';
import { letters, cues } from '../lib/letters.js';
import { icon } from '../lib/icons.js';
import { btn } from '../ui.js';

let unlocked = false;
const stars = (n) => (n ? '★'.repeat(n) + '☆'.repeat(3 - n) : '–');

export default function teacher({ go }) {
  const root = h('div', { class: 'screen' });
  const topbar = (title, backTo = 'home') => h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => { unlocked = false; go(backTo); } }), h('div', { class: 'title small' }, title));

  // ---------- PIN ----------
  function pinScreen(mode, first, note) {
    let pin = '';
    const dots = h('div', { class: 'pin-dots' }, [0, 1, 2, 3].map(() => h('i')));
    const msg = h('div', { class: 'label', style: { textAlign: 'center' } }, note || (mode === 'create' ? (first ? t('confirmPin') : t('createPin')) : t('enterPin')));
    const paint = () => [...dots.children].forEach((d, i) => d.classList.toggle('on', i < pin.length));
    const press = (d) => {
      if (pin.length >= 4) return;
      pin += d;
      paint();
      if (pin.length < 4) return;
      setTimeout(() => {
        if (mode === 'enter') {
          if (store.checkPin(pin)) { unlocked = true; main(); } else { pin = ''; paint(); msg.textContent = t('enterPin') + ' ✗'; }
        } else if (!first) pinScreen('create', pin);
        else if (pin === first) { store.setPin(pin); unlocked = true; main(); }
        else pinScreen('create', null, t('wrongPin'));
      }, 150);
    };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => k === '' ? h('span') : btn({ label: k, onClick: () => { if (k === '⌫') { pin = pin.slice(0, -1); paint(); } else press(k); } }));
    root.replaceChildren(topbar(t('teacher')), h('div', { class: 'scroll pad' }, h('div', { class: 'form' }, h('div', { style: { textAlign: 'center' } }, icon('lock', 'xl')), msg, dots, h('div', { class: 'keypad' }, keys))));
  }

  // ---------- main ----------
  function main() {
    const st = store.get();
    const p = store.profile();
    if (!p) { go('profiles/new'); return; }
    const refresh = () => main();

    const kids = h('div', { class: 'words-pick' }, st.profiles.map((c) => h('button', { class: `chip ${c.id === p.id ? 'on' : ''}`, type: 'button', onclick: () => { store.select(c.id); refresh(); } }, `${c.avatar} ${c.name}`)),
      h('button', { class: 'chip', type: 'button', onclick: () => go('profiles/new') }, '＋ ' + t('newChild')));

    const toggle = (key, ico, label) => {
      const b = h('button', { class: `toggle ${p[key] ? 'on' : ''}`, type: 'button', onclick: () => { store.update(p.id, { [key]: !p[key] }); b.classList.toggle('on', !!store.profile()[key]); } }, icon(ico), label, h('span', { class: 'sw' }));
      return b;
    };
    const sizeBtns = ['small', 'medium', 'large'].map((s) => btn({ ico: 'ruler', label: t(s), cls: p.lineSize === s ? 'active' : '', onClick: () => { store.update(p.id, { lineSize: s }); refresh(); } }));

    const needs = (e) => Object.entries(e?.needs || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => `${cues[k] ? cueText(k).split(/[.!]/)[0] : k} ×${n}`).join('; ');
    const done = letters.filter((l) => store.letterStatus(p, l.char) === 'done').length;
    const rows = letters.map((l) => { const e = p.letters[l.char]; return h('tr', {}, h('td', {}, l.char), h('td', {}, stars(e?.trace || 0)), h('td', {}, stars(e?.copy || 0)), h('td', {}, e?.plays || 0), h('td', { style: { textAlign: 'left' } }, needs(e))); });
    const table = (cls) => h('table', { class: cls }, h('thead', {}, h('tr', {}, ['', t('trace'), t('copy'), '#', t('needsRepeat')].map((x) => h('th', {}, x)))), h('tbody', {}, rows.map((r) => r.cloneNode(true))));

    const printSection = h('div', { class: 'print-only' },
      h('h1', {}, `${t('appName')} – ${p.name}`),
      h('div', {}, `${t('lineSize')}: ${t(p.lineSize)}   |   ${t('stars')}: ${p.totalStars}   |   ${t('streak')}: ${p.streak.count}   |   ${t('lettersDone')}: ${done}/26`),
      h('div', {}, new Date().toLocaleDateString()), table(''));

    root.replaceChildren(topbar(t('teacher')),
      h('div', { class: 'scroll pad' },
        kids,
        h('div', { class: 'card' }, h('h3', {}, `${t('lineSize')} (${p.name})`), h('div', { class: 'seg' }, sizeBtns), h('p', { class: 'muted' }, t('lineSizeHelp')),
          btn({ ico: 'eye', label: t('findBest'), cls: 'accent wide', onClick: () => go('findsize') })),
        h('div', { class: 'card' }, h('h3', {}, t('settings')),
          toggle('showZones', 'eye', t('showZones')), toggle('highlightGrass', 'star', t('highlightGrass')), toggle('showDirt', 'circle', t('showDirt')), toggle('threeLine', 'ruler', t('threeLine')),
          h('button', { class: `toggle ${st.voice ? 'on' : ''}`, type: 'button', onclick: (e) => { store.set({ voice: !store.get().voice }); e.currentTarget.classList.toggle('on', store.get().voice); } }, icon('hear'), t('voice'), h('span', { class: 'sw' })),
          h('div', { class: 'seg' }, Object.entries(LANGS).map(([k, name]) => btn({ label: name, cls: st.lang === k ? 'active' : '', onClick: () => { store.set({ lang: k }); location.reload(); } })))),
        h('div', { class: 'card' }, h('h3', {}, `${t('progress')} – ${p.name}`),
          h('div', { class: 'muted' }, `${t('stars')}: ${p.totalStars}  ·  ${t('streak')}: ${p.streak.count}  ·  ${t('lettersDone')}: ${done}/26`),
          h('div', { style: { overflowX: 'auto' } }, table('prog')),
          btn({ ico: 'print', label: t('printSummary'), cls: 'wide', onClick: () => window.print() })),
        h('div', { class: 'card' },
          btn({ ico: 'lock', label: t('changePin'), cls: 'wide', onClick: () => pinScreen('create', null) }),
          h('div', { style: { height: '10px' } }),
          btn({ ico: 'undo', label: t('resetProgress'), cls: 'wide', onClick: () => { if (confirm(t('confirmReset'))) { store.resetProgress(p.id); refresh(); } } }),
          h('div', { style: { height: '10px' } }),
          btn({ ico: 'clear', label: t('deleteChild'), cls: 'wide', onClick: () => { if (confirm(t('confirmDelete'))) { store.removeProfile(p.id); refresh(); } } }))),
      printSection);
  }

  return { el: root, mounted() { if (unlocked) main(); else pinScreen(store.hasPin() ? 'enter' : 'create', null); } };
}
