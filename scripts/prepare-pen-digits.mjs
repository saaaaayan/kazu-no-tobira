import { readFileSync, writeFileSync } from 'node:fs';
import { rasterize } from '../src/recognition/rasterize.ts';

const [source, output] = process.argv.slice(2);
if (!source || !output) throw new Error('Usage: node scripts/prepare-pen-digits.mjs ujipenchars2.txt output.json');

const samples = [];
for (const match of readFileSync(source, 'latin1').matchAll(/^WORD ([0-9]) ((?:trn|tst)_\S+)\r?\n\s*NUMSTROKES \d+\r?\n((?:[ \t]*POINTS [^\r\n]+(?:\r?\n|$))+)/gm)) {
  const [, digit, writer, lines] = match;
  const drawing = lines.trim().split(/\r?\n/).map(line => {
    const coordinates = line.split('#')[1].trim().split(/\s+/).map(Number);
    return Array.from({ length: coordinates.length / 2 }, (_, i) => ({
      x: coordinates[2 * i],
      y: coordinates[2 * i + 1],
    }));
  });
  const pixels = rasterize({ drawing, size: { width: 1, height: 1 } });
  if (!pixels) throw new Error(`Invalid ink sample: ${writer}, ${digit}`);
  samples.push({ digit: Number(digit), writer, pixels: Array.from(pixels, value => Math.round(value * 255)) });
}
if (samples.length !== 1200 || samples.filter(sample => sample.writer.startsWith('tst_')).length !== 400) {
  throw new Error(`Unexpected UJI digit counts: ${samples.length}`);
}
writeFileSync(output, JSON.stringify(samples));
