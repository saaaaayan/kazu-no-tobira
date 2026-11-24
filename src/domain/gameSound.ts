type Cue = 'tap' | 'correct' | 'incorrect' | 'clear';
type Note = readonly [number, number, number];
const cues: Record<Cue, readonly Note[]> = {
  tap: [[660, 0, .075]],
  correct: [[784, 0, .22], [1046.5, .19, .42]],
  incorrect: [[349.2, 0, .15], [261.6, .15, .24]],
  clear: [[523.3, 0, .16], [659.3, .15, .16], [784, .30, .16], [1046.5, .45, .42]],
};
const key = 'kazu.soundEffects.enabled';
let enabled = true;
let context: AudioContext | undefined;
let active: GainNode | undefined;
try { if (typeof window !== 'undefined') enabled = window.localStorage.getItem(key) !== 'false'; } catch {}
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
  if (!enabled || typeof window === 'undefined' || document.hidden) return;
  unlockSound();
  const ctx = context;
  if (!ctx) return;
  const play = () => {
    if (!enabled || ctx.state !== 'running' || document.hidden) return;
    try {
      const now = ctx.currentTime;
      if (active) active.gain.setValueAtTime(0, now);
      const output = ctx.createGain();
      active = output;
      output.gain.value = cue === 'tap' ? .10 : cue === 'incorrect' ? .19 : .30;
      output.connect(ctx.destination);
      const notes = cues[cue];
      notes.forEach(([frequency, delay, duration], index) => {
        const oscillator = ctx.createOscillator();
        const envelope = ctx.createGain();
        const start = now + delay;
        oscillator.type = cue === 'correct' || cue === 'clear' ? 'triangle' : 'sine';
        oscillator.frequency.value = frequency;
        envelope.gain.setValueAtTime(.001, start);
        envelope.gain.exponentialRampToValueAtTime(.85, start + .008);
        envelope.gain.exponentialRampToValueAtTime(.32, start + duration * .45);
        envelope.gain.exponentialRampToValueAtTime(.001, start + duration);
        oscillator.connect(envelope);
        envelope.connect(output);
        oscillator.onended = () => {
          oscillator.disconnect(); envelope.disconnect();
          if (index === notes.length - 1) { output.disconnect(); if (active === output) active = undefined; }
        };
        oscillator.start(start);
        oscillator.stop(start + duration + .01);
      });
    } catch {}
  };
  if (ctx.state === 'running') play();
  else void ctx.resume().then(play).catch(() => {});
}
