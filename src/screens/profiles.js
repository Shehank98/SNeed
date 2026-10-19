import { h } from '../lib/dom.js';
import { store } from '../lib/store.js';
import { t } from '../lib/i18n.js';
import { btn } from '../ui.js';

const AVATARS = ['🦁', '🐯', '🐼', '🐸', '🦊', '🐰', '🐵', '🦄', '🐙', '🦖', '🐳', '🚀'];

export default function profiles({ params, go }) {
  const st = store.get();
  const creating = params[0] === 'new' || !st.profiles.length;
  let avatar = AVATARS[0];

  const list = h('div', { class: 'profile-list' },
    st.profiles.map((p) => h('button', { class: `profile-card ${p.id === st.currentId ? 'active' : ''}`, type: 'button', onclick: () => { store.select(p.id); go('home'); } },
      h('span', { class: 'avatar xl' }, p.avatar), h('span', {}, p.name))),
    h('button', { class: 'profile-card add', type: 'button', onclick: () => go('profiles/new') }, h('span', { class: 'avatar xl' }, '＋'), h('span', {}, t('newChild'))));

  const nameInput = h('input', { class: 'text', type: 'text', maxlength: 16, placeholder: t('name'), autocomplete: 'off', autocapitalize: 'words' });
  const picks = AVATARS.map((a, i) => h('button', { class: `avatar-pick ${i === 0 ? 'on' : ''}`, type: 'button', onclick: (e) => { avatar = a; picks.forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, a));
  const form = h('div', { class: 'form' },
    h('div', { class: 'title small' }, t('newChild')), nameInput,
    h('div', { class: 'label' }, t('pickAvatar')), h('div', { class: 'avatar-grid' }, picks),
    btn({ ico: 'check', label: t('save'), cls: 'go wide', onClick: () => { if (!nameInput.value.trim()) { nameInput.focus(); return; } store.addProfile(nameInput.value, avatar); go('home'); } }));

  const el = h('div', { class: 'screen profiles' },
    h('div', { class: 'topbar' }, st.profiles.length ? btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('home') }) : null, h('div', { class: 'title small' }, creating ? t('newChild') : t('whoIsWriting'))),
    h('div', { class: 'scroll pad' }, creating ? form : list));
  return { el };
}
