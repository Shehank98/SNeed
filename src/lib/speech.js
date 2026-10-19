// Voice prompts via the Web Speech API. Falls back silently when unavailable.
import { store } from './store.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

export const speechAvailable = () => !!synth;

function voiceFor(langCode) {
  const pref = langCode === 'si' ? ['si'] : ['en-GB', 'en-US', 'en'];
  for (const p of pref) {
    const v = voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(p.toLowerCase()));
    if (v) return v;
  }
  return null;
}

/** Speak text. `langCode` defaults to the UI language; Sinhala falls back to the device default voice. */
export function speak(text, { langCode, rate = 0.88, pitch = 1.15 } = {}) {
  const st = store.get();
  if (!synth || !st.voice || !text) return;
  const code = langCode || st.lang;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(code);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = code === 'si' ? 'si-LK' : 'en-GB';
    u.rate = rate; u.pitch = pitch;
    synth.speak(u);
  } catch (e) { /* ignore */ }
}
export function stopSpeaking() { try { synth?.cancel(); } catch (e) { /* ignore */ } }
