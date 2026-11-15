import type { DigitInk, RecognitionResult } from './contracts.ts';
import { rasterize } from './rasterize.ts';
import model from './digit-model.json' with { type: 'json' };

type Layer = { weights: number[][]; bias: number[] };

function convolutionPool(input: Float32Array, side: number, layer: Layer): Float32Array {
  const nextSide = side / 2;
  const output = new Float32Array(layer.bias.length * nextSide * nextSide);
  const plane = side * side;
  const channels = input.length / plane;
  for (const [channel, kernel] of layer.weights.entries()) {
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        let value = layer.bias[channel];
        for (let source = 0; source < channels; source++) {
          for (let row = 0; row < 3; row++) {
            const iy = y + row - 1;
            if (iy < 0 || iy >= side) continue;
            for (let col = 0; col < 3; col++) {
              const ix = x + col - 1;
              if (ix >= 0 && ix < side) value += input[source * plane + iy * side + ix] * kernel[source * 9 + row * 3 + col];
            }
          }
        }
        const index = (channel * nextSide + (y >> 1)) * nextSide + (x >> 1);
        if (value > output[index]) output[index] = value;
      }
    }
  }
  return output;
}

function dense(input: Float32Array, layer: Layer, relu = false) {
  return Float32Array.from(layer.weights, (row, i) => {
    let value = layer.bias[i];
    for (let j = 0; j < row.length; j++) value += input[j] * row[j];
    return relu ? Math.max(0, value) : value;
  });
}

export function digitScores(pixels: Float32Array): number[] {
  const [first, second, hidden, output] = model;
  const features = convolutionPool(convolutionPool(pixels, 28, first), 14, second);
  const logits = dense(dense(features, hidden, true), output);
  const maximum = Math.max(...logits);
  const scores = Array.from(logits, value => Math.exp(value - maximum));
  const total = scores.reduce((sum, score) => sum + score, 0);
  return scores.map(score => score / total);
}

export function recognizeDigits(cells: readonly DigitInk[]): RecognitionResult {
  const end = cells.findLastIndex(cell => cell.drawing.length > 0);
  if (end < 0) return { status: 'empty' };
  let candidates = [{ value: '', score: 1 }];
  let confident = true;
  for (const cell of cells.slice(0, end + 1)) {
    if (!cell.drawing.length) return { status: 'gap' };
    const pixels = rasterize(cell);
    if (!pixels) return { status: 'uncertain' };
    const ranked = digitScores(pixels).map((score, digit) => ({ score, digit })).sort((a, b) => b.score - a.score);
    const [best, second] = ranked;
    confident &&= best.score >= 0.70 && best.score - second.score >= 0.25;
    candidates = candidates.flatMap(candidate => ranked.slice(0, 3).map(({ score, digit }) => ({
      value: candidate.value + digit,
      score: candidate.score * score,
    }))).sort((a, b) => b.score - a.score).slice(0, 3);
  }
  return confident
    ? { status: 'recognized', value: candidates[0].value }
    : { status: 'ambiguous', candidates: candidates.map(candidate => candidate.value) };
}
