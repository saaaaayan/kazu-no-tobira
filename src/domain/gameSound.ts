type Cue = 'tap' | 'correct' | 'incorrect' | 'clear';
type Note = readonly [number, number, number];
const cues: Record<Cue, readonly Note[]> = {
  tap: [[660, 0, .075]],
  correct: [[1046.5, 0, .34], [784, .28, .78]],
  incorrect: [[349.2, 0, .15], [261.6, .15, .24]],
  clear: [[523.3, 0, .16], [659.3, .15, .16], [784, .30, .16], [1046.5, .45, .42]],
};
const key = 'kazu.soundEffects.enabled';
const volumeKey = 'kazu.soundEffects.volume';
const defaultVolume = 80;
let enabled = true;
let volume = defaultVolume;
let context: AudioContext | undefined;
let active: GainNode | undefined;
let activeLevel = 0;
const clampVolume = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : defaultVolume;
try {
  if (typeof window !== 'undefined') {
    enabled = window.localStorage.getItem(key) !== 'false';
    const saved = window.localStorage.getItem(volumeKey);
    if (saved !== null) volume = clampVolume(Number(saved));
  }
} catch {}
export function soundVolume() { return volume; }
export function setSoundVolume(value: number) {
  volume = clampVolume(value);
  if (enabled && active && context) active.gain.setValueAtTime(activeLevel * volume / 100, context.currentTime);
  try { if (typeof window !== 'undefined') window.localStorage.setItem(volumeKey, String(volume)); } catch {}
}
export function soundEnabled() { return enabled; }
export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!value && context && active) active.gain.setValueAtTime(0, context.currentTime);
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, String(value)); } catch {}
}
export function unlockSound() {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return;
    context ??= new Constructor();
    if (context.state === 'suspended') void context.resume().catch(() => {});
  } catch {}
}
export function playSound(cue: Cue) {
  if (!enabled || volume === 0 || typeof window === 'undefined' || document.hidden) return;
  unlockSound();
  const ctx = context;
  if (!ctx) return;
  const play = () => {
    if (!enabled || volume === 0 || ctx.state !== 'running' || document.hidden) return;
    try {
      const now = ctx.currentTime;
      if (active) active.gain.setValueAtTime(0, now);
      const output = ctx.createGain();
      active = output;
      activeLevel = cue === 'tap' ? .22 : cue === 'incorrect' ? .48 : .88;
      output.gain.value = activeLevel * volume / 100;
      output.connect(ctx.destination);
      const notes = cues[cue];
      // A high, short "ping" followed by a lower, longer "pong".
      // Bell partials decay more quickly than the fundamental, giving a
      // recognisable quiz chime rather than a pair of plain synth beeps.
      const partials = cue === 'correct' ? [
        { ratio: 1, weight: .72, decay: 1 },
        { ratio: 2.01, weight: .20, decay: .45 },
        { ratio: 3.02, weight: .08, decay: .25 },
      ] : [{ ratio: 1, weight: 1, decay: 1 }];
      let remaining = notes.length * partials.length;
      notes.forEach(([frequency, delay, duration]) => {
        partials.forEach(({ratio, weight, decay}) => {
          const oscillator = ctx.createOscillator();
          const envelope = ctx.createGain();
          const start = now + delay;
          const length = duration * decay;
          const peak = .85 * weight;
          oscillator.type = cue === 'clear' ? 'triangle' : 'sine';
          oscillator.frequency.value = frequency * ratio;
          envelope.gain.setValueAtTime(.0001, start);
          envelope.gain.exponentialRampToValueAtTime(peak, start + .006);
          envelope.gain.exponentialRampToValueAtTime(peak * (cue === 'correct' ? .55 : .38), start + length * .38);
          envelope.gain.exponentialRampToValueAtTime(.0001, start + length);
          oscillator.connect(envelope);
          envelope.connect(output);
          oscillator.onended = () => {
            oscillator.disconnect(); envelope.disconnect();
            if (--remaining === 0) { output.disconnect(); if (active === output) active = undefined; }
          };
          oscillator.start(start);
          oscillator.stop(start + length + .01);
        });
      });
    } catch {}
  };
  if (ctx.state === 'running') play();
  else void ctx.resume().then(play).catch(() => {});
}
