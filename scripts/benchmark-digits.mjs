import { readFileSync } from 'node:fs';
import { digitScores } from '../src/recognition/recognizeDigits.ts';

const [penPath, previousModelPath] = process.argv.slice(2);
if (!penPath || !previousModelPath) throw new Error('Pass prepared pen samples and the previous MLP JSON.');
const samples = JSON.parse(readFileSync(penPath, 'utf8')).filter(sample => sample.writer.startsWith('tst_'));
const previous = JSON.parse(readFileSync(previousModelPath, 'utf8').replace(/^\uFEFF/, ''));

function oldScores(image) {
  let values = new Float32Array(196);
  for (let i = 0; i < image.length; i++) {
    values[Math.floor(i / 56) * 14 + Math.floor((i % 28) / 2)] += image[i] / 4;
  }
  for (const [index, { weights, bias }] of previous.entries()) {
    values = Float32Array.from(weights, (row, i) => {
      let sum = bias[i];
      for (let j = 0; j < row.length; j++) sum += row[j] * values[j];
      return index === 0 ? Math.max(0, sum) : sum;
    });
  }
  const max = Math.max(...values);
  const exp = Array.from(values, value => Math.exp(value - max));
  return exp.map(value => value / exp.reduce((sum, score) => sum + score, 0));
}

function ranked(scores, threshold, margin) {
  const digits = scores.map((score, digit) => ({ score, digit })).sort((a, b) => b.score - a.score);
  return {
    digit: digits[0].digit,
    accepted: digits[0].score >= threshold && digits[0].score - digits[1].score >= margin,
  };
}

function distort(image, index) {
  const angle = (index % 2 ? 1 : -1) * (0.22 + (index % 5) * 0.045);
  const scale = 0.82 + (index % 9) * 0.04;
  const skew = (index % 3 - 1) * 0.22;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const pixel = (x, y) => x < 0 || x >= 28 || y < 0 || y >= 28 ? 0 : image[y * 28 + x];
  return Float32Array.from(image, (_, i) => {
    const x = (i % 28 - 13.5) * scale;
    const y = (Math.floor(i / 28) - 13.5) / scale;
    const fx = c * x + (s + skew) * y + 13.5 + Math.sin(y * 0.5) * 0.9;
    const fy = -s * x + c * y + 13.5 + Math.cos(x * 0.4) * 0.7;
    const xx = Math.floor(fx);
    const yy = Math.floor(fy);
    const dx = fx - xx;
    const dy = fy - yy;
    return (1 - dy) * ((1 - dx) * pixel(xx, yy) + dx * pixel(xx + 1, yy)) +
      dy * ((1 - dx) * pixel(xx, yy + 1) + dx * pixel(xx + 1, yy + 1));
  });
}

function measure(name, images, infer, threshold, margin) {
  infer(images[0]);
  const times = [];
  const wrong = new Map();
  const predictions = new Map();
  let hits = 0;
  let accepted = 0;
  let acceptedCorrect = 0;
  for (const [i, sample] of samples.entries()) {
    const start = performance.now();
    const result = ranked(infer(images[i]), threshold, margin);
    times.push(performance.now() - start);
    const expected = sample.digit;
    if (result.digit === expected) hits++;
    else {
      const pair = `${expected}→${result.digit}`;
      wrong.set(pair, (wrong.get(pair) ?? 0) + 1);
    }
    if (result.accepted) {
      accepted++;
      if (result.digit === expected) acceptedCorrect++;
    }
    predictions.set(`${sample.writer}:${expected}`, result);
  }
  console.log(name, { hits, total: samples.length, accepted, acceptedCorrect,
    commonErrors: [...wrong.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    relatedErrors: Object.fromEntries(['0→6', '6→0', '1→7', '7→1', '3→8', '8→3'].map(pair => [pair, wrong.get(pair) ?? 0])),
  });
  const sorted = times.sort((a, b) => a - b);
  console.log('Inference ms median/p95:', sorted[Math.floor(sorted.length / 2)].toFixed(2),
    sorted[Math.floor(sorted.length * 0.95)].toFixed(2));
  const writers = [...new Set(samples.map(sample => sample.writer))];
  console.log('Composed strings exact match and automatically accepted, out of', writers.length, 'per value:');
  for (const value of ['10', '12', '20', '100', '367', '806']) {
    let exact = 0;
    let auto = 0;
    for (const writer of writers) {
      const otherRun = writer.endsWith('-01') ? writer.replace(/-01$/, '-02') : writer.replace(/-02$/, '-01');
      const digits = [...value].map((digit, index) => predictions.get(`${value.indexOf(digit) === index ? writer : otherRun}:${digit}`));
      if (digits.map(result => result.digit).join('') === value) {
        exact++;
        if (digits.every(result => result.accepted)) auto++;
      }
    }
    console.log(value, exact, auto);
  }
}

const original = samples.map(sample => Float32Array.from(sample.pixels, value => value / 255));
const warped = original.map(distort);
for (const [label, images] of [['UJI stylus', original], ['UJI stylus + geometric distortion', warped]]) {
  measure(`${label} / previous MLP`, images, oldScores, 0.65, 0.20);
  measure(`${label} / new CNN`, images, digitScores, 0.70, 0.25);
}
