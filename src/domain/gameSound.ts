type Cue = 'tap' | 'correct' | 'incorrect' | 'clear' | 'walk';
type Note = readonly [number, number, number];
const cues: Record<Cue, readonly Note[]> = {
  tap: [[660, 0, .075]],
  walk: [],
  correct: [[1046.5, 0, .34], [784, .28, .78]],
  incorrect: [[220, 0, .17], [164.8, .23, .48]],
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
// Three short, dry footfalls, with a soft heel impact and a brighter
// shoe-on-ground texture. No melody or external sound files.
let walkBuffer: AudioBuffer | undefined;
function footsteps(ctx: AudioContext): AudioBuffer {
  if (walkBuffer && walkBuffer.sampleRate === ctx.sampleRate) return walkBuffer;
  const rate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.ceil(rate * .45), rate);
  const data = buffer.getChannelData(0);
  let seed = 7219;
  [0, .135, .27].forEach((delay, step) => {
    let low = 0, smooth = 0;
    const offset = Math.round(delay * rate);
    for (let i = 0; i < Math.floor(rate * .095); i++) {
      const t = i / rate;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      low += (1 - Math.exp(-2 * Math.PI * 230 / rate)) * (noise - low);
      smooth += (1 - Math.exp(-2 * Math.PI * 2900 / rate)) * (noise - smooth);
      const attack = Math.min(1, t / .003);
      const release = Math.min(1, (.095 - t) / .012);
      const heel = Math.sin(2 * Math.PI * (150 - 30 * step / 2) * t) * Math.exp(-t * 62);
      const scuff = (smooth - low) * Math.exp(-t * 46);
      data[offset + i] = attack * release * (.48 * heel + 1.05 * scuff) * (step === 1 ? .83 : 1);
    }
  });
  let peak = 0;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0) for (let i = 0; i < data.length; i++) data[i] *= .85 / peak;
  walkBuffer = buffer;
  return buffer;
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
      activeLevel = cue === 'tap' ? .22 : cue === 'walk' ? .68 : cue === 'incorrect' ? .66 : .88;
      output.gain.value = activeLevel * volume / 100;
      output.connect(ctx.destination);
      if (cue === 'walk') {
        const source = ctx.createBufferSource();
        source.buffer = footsteps(ctx);
        source.connect(output);
        source.onended = () => {
          source.disconnect(); output.disconnect();
          if (active === output) active = undefined;
        };
        source.start(now);
        return;
      }
      const notes = cues[cue];
      // A high, short "ping" followed by a lower, longer "pong".
      // Bell partials decay more quickly than the fundamental, giving a
      // recognisable quiz chime rather than a pair of plain synth beeps.
      const partials = cue === 'correct' ? [
        { ratio: 1, weight: .72, decay: 1 },
        { ratio: 2.01, weight: .20, decay: .45 },
        { ratio: 3.02, weight: .08, decay: .25 },
      ] : cue === 'incorrect' ? [
        // A mildly raspy, descending two-part buzzer; not a harsh alarm.
        { ratio: 1, weight: .60, decay: 1 },
        { ratio: 1.06, weight: .26, decay: 1 },
        { ratio: 2, weight: .14, decay: .8 },
      ] : [{ ratio: 1, weight: 1, decay: 1 }];
      let remaining = notes.length * partials.length;
      notes.forEach(([frequency, delay, duration]) => {
        partials.forEach(({ratio, weight, decay}) => {
          const oscillator = ctx.createOscillator();
          const envelope = ctx.createGain();
          const start = now + delay;
          const length = duration * decay;
          const peak = .85 * weight;
          oscillator.type = cue === 'clear' || cue === 'incorrect' ? 'triangle' : 'sine';
          oscillator.frequency.value = frequency * ratio;
          if (cue === 'incorrect') {
            oscillator.frequency.setValueAtTime(frequency * ratio, start);
            oscillator.frequency.exponentialRampToValueAtTime(frequency * ratio * .86, start + length);
          }
          envelope.gain.setValueAtTime(.0001, start);
          envelope.gain.exponentialRampToValueAtTime(peak, start + .006);
          envelope.gain.exponentialRampToValueAtTime(peak * (cue === 'incorrect' ? .74 : cue === 'correct' ? .55 : .38), start + length * .38);
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
