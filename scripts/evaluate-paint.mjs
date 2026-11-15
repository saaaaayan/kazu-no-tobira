import { readFileSync } from 'node:fs';
import { digitScores } from '../src/recognition/recognizeDigits.ts';
import { decideSequence, rankLine } from '../src/recognition/sequenceRecognizer.ts';

const source = process.argv[2];
if (!source) throw new Error('Pass the prepared Telkom Test images.');
const samples = JSON.parse(readFileSync(source, 'utf8'));

function render(samples, margin) {
  const width = Math.max(28, Math.ceil((samples.reduce((sum, glyph) => sum + glyph.width, 0) + margin * (samples.length - 1) + 14) / 2) * 2);
  const pixels = new Float32Array(width * 28);
  let start = Math.floor((width - (samples.reduce((sum, glyph) => sum + glyph.width, 0) + margin * (samples.length - 1))) / 2);
  for (const glyph of samples) {
    glyph.pixels.forEach((pixel, i) => {
      const offset = (Math.floor(i / glyph.width) + 2) * width + i % glyph.width + start;
      pixels[offset] = Math.max(pixels[offset], pixel / 255);
    });
    start += glyph.width + margin;
  }
  return { width, pixels };
}

function previousSingle(sample) {
  const image = render([sample], 0);
  const scaled = new Float32Array(784);
  const scale = 20 / Math.max(23, sample.width);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
    const sx = Math.round((x - 13.5) / scale + (image.width - 1) / 2);
    const sy = Math.round((y - 13.5) / scale + 13);
    if (sx >= 0 && sy >= 0 && sx < image.width && sy < 28) scaled[y * 28 + x] = image.pixels[sy * image.width + sx];
  }
  const ranked = digitScores(scaled).map((score, digit) => ({ score, digit })).sort((a,b) => b.score-a.score);
  const accepted = ranked[0].score >= .70 && ranked[0].score - ranked[1].score >= .25;
  return { value: String(ranked[0].digit), accepted };
}

for (const length of [1, 2, 3]) {
  const counts = { exact: 0, correctAuto: 0, wrongAuto: 0, oldExact: 0, oldCorrectAuto: 0, oldWrongAuto: 0 };
  const wrong = [];
  for (const [i, sample] of samples.entries()) {
    const digits = [sample];
    for (let j = 1; j < length; j++) digits.push(samples[(i * (j === 1 ? 29 : 73) + j * 17) % samples.length]);
    const expected = digits.map(digit => digit.label).join('');
    const ranking = rankLine(render(digits, i % 11 - 3));
    const best = ranking[0].value;
    const decision = decideSequence(ranking);
    if (best === expected) counts.exact++;
    else wrong.push(`${expected}→${best || '未認識'}`);
    if (decision.status === 'recognized') counts[decision.value === expected ? 'correctAuto' : 'wrongAuto']++;
    if (length === 1) {
      const previous = previousSingle(sample);
      if (previous.value === expected) counts.oldExact++;
      if (previous.accepted) counts[previous.value === expected ? 'oldCorrectAuto' : 'oldWrongAuto']++;
    }
  }
  if (length !== 1) for (const name of ['oldExact', 'oldCorrectAuto', 'oldWrongAuto']) delete counts[name];
  console.log(JSON.stringify({ length, count: samples.length, ...counts, examples: wrong.slice(0, 12) }));
}
