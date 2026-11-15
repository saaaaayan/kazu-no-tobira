import { readFileSync } from 'node:fs';
import { recognizeFreeform } from '../src/recognition/segmentDigits.ts';
import { recognizeSequence } from '../src/recognition/sequenceRecognizer.ts';

import { recognizeLine } from '../src/recognition/recognizeLine.ts';

const source = process.argv[2];
if (!source) throw new Error('Pass the original UJI ujipenchars2.txt file.');
const samples = [];
for (const match of readFileSync(source, 'latin1').matchAll(/^WORD ([0-9]) (tst_\S+)\r?\n\s*NUMSTROKES \d+\r?\n((?:[ \t]*POINTS [^\r\n]+(?:\r?\n|$))+)/gm)) {
  const [, digit, session, lines] = match;
  const strokes = lines.trim().split(/\r?\n/).map(line => {
    const coordinates = line.split('#')[1].trim().split(/\s+/).map(Number);
    return Array.from({ length: coordinates.length / 2 }, (_, i) => ({ x: coordinates[2 * i], y: coordinates[2 * i + 1] }));
  });
  samples.push({ digit, session, strokes });
}
if (samples.length !== 400) throw new Error(`Expected 400 test digits; found ${samples.length}.`);
const bySession = new Map(samples.map(sample => [`${sample.session}/${sample.digit}`, sample]));

function compose(digits, stress, sampleIndex) {
  let x = 15;
  const size = { width: 420, height: 150 };
  const drawing = [];
  for (const [index, digit] of digits.entries()) {
    const points = digit.strokes.flat();
    const left = Math.min(...points.map(point => point.x));
    const top = Math.min(...points.map(point => point.y));
    const height = Math.max(...points.map(point => point.y)) - top;
    const scale = (stress ? 48 + (sampleIndex * 5 + index * 17) % 35 : 59 + (sampleIndex + index * 7) % 12) / height;
    const shear = stress ? ((sampleIndex + index) % 7 - 3) * 0.105 : 0;
    const stretch = stress ? 0.74 + ((sampleIndex * 3 + index) % 8) * 0.075 : 1;
    const glyph = digit.strokes.map(stroke => stroke.map(({ x: px, y: py }) => {
      const dy = (py - top) * scale;
      return {
        x: (px - left) * scale * stretch + shear * dy + (stress ? 1.25 * Math.sin(dy * 0.31 + index) : 0),
        y: dy + (stress ? 2 * Math.cos((px - left) * scale * 0.17) : 0),
      };
    }));
    const min = Math.min(...glyph.flat().map(point => point.x));
    const max = Math.max(...glyph.flat().map(point => point.x));
    drawing.push(...glyph.map(stroke => stroke.map(point => ({
      x: (point.x - min + x) / size.width,
      y: (point.y + 30 + (stress ? ((sampleIndex + index * 3) % 9) - 4 : 0)) / size.height,
    }))));
    x += max - min + (stress ? -9 + (sampleIndex + index * 2) % 12 : 7 + (sampleIndex + index) % 9);
  }
  return { drawing, size };
}

function measure(examples, recognize) {
  recognize(examples[0].ink);
  const times = [];
  const digitHits = Array(10).fill(0);
  const digitCounts = Array(10).fill(0);
  const mistakes = new Map();
  let exact = 0;
  let acceptedCorrect = 0;
  let wrongAuto = 0;
  for (const { expected, ink } of examples) {
    const start = performance.now();
    const result = recognize(ink);
    times.push(performance.now() - start);
    const value = result.status === 'recognized' ? result.value : result.status === 'ambiguous' ? result.candidates[0] : undefined;
    if (value === expected) exact++;
    else {
      const pair = `${expected}→${value ?? '未認識'}`;
      mistakes.set(pair, (mistakes.get(pair) ?? 0) + 1);
    }
    if (result.status === 'recognized') {
      if (value === expected) acceptedCorrect++;
      else wrongAuto++;
    }
    if (expected.length === 1) {
      digitCounts[Number(expected)]++;
      if (value === expected) digitHits[Number(expected)]++;
    }
  }
  times.sort((a, b) => a - b);
  return {
    exact, acceptedCorrect, wrongAuto, intervention: examples.length - acceptedCorrect, count: examples.length,
    averageMs: +(times.reduce((sum, value) => sum + value, 0) / times.length).toFixed(2),
    p95Ms: +times[Math.floor(times.length * .95)].toFixed(2),
    maxMs: +times.at(-1).toFixed(2),
    ...(examples[0].expected.length === 1 && { errorsByDigit: digitCounts.map((count, digit) => count - digitHits[digit]) }),
    mistakes: [...mistakes].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

for (const stress of [false, true]) {
  for (const length of [1, 2, 3]) {
    const examples = samples.map((sample, index) => {
      const digits = [sample];
      for (let i = 1; i < length; i++) {
        const label = (index * (i === 1 ? 7 : 3) + Math.floor(index / 10) + i) % 10;
        const session = i === 1 ? sample.session.replace(/-(01|02)$/, (_, run) => run === '01' ? '-02' : '-01') : sample.session;
        digits.push(bySession.get(`${session}/${label}`));
      }
      return { expected: digits.map(digit => digit.digit).join(''), ink: compose(digits, stress, index) };
    });
    for (const [name, recognize] of [['old', recognizeFreeform], ['sequence', recognizeSequence], ['hybrid', recognizeLine]]) {
      console.log(JSON.stringify({ stress, length, name, ...measure(examples, recognize) }));
    }
  }
}
