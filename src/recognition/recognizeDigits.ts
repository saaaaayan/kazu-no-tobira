import { toPixels, type Point } from '../domain/ink.ts';
import type { DigitInk, RecognitionResult } from './contracts.ts';
import model from './digit-model.json' with { type: 'json' };

const side = 28;

function rasterize({ drawing, size }: DigitInk): Float32Array | undefined {
  const strokes = drawing.map(stroke => stroke.map(point => toPixels(point, size)));
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const stroke of strokes) {
    for (const { x, y } of stroke) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  const extent = Math.max(right - left, bottom - top);
  if (!Number.isFinite(extent) || extent < 10) return undefined;

  const scale = 18 / extent;
  const centerX = (right + left) / 2;
  const centerY = (top + bottom) / 2;
  const pixels = new Float32Array(side * side);

  function stamp(x: number, y: number) {
    for (let row = Math.max(0, Math.floor(y - 2)); row <= Math.min(side - 1, Math.ceil(y + 2)); row++) {
      for (let col = Math.max(0, Math.floor(x - 2)); col <= Math.min(side - 1, Math.ceil(x + 2)); col++) {
        const coverage = Math.max(0, Math.min(1, 1.85 - Math.hypot(col - x, row - y)));
        const index = row * side + col;
        pixels[index] = Math.max(pixels[index], coverage);
      }
    }
  }

  for (const stroke of strokes) {
    let previous: Point | undefined;
    for (const { x, y } of stroke) {
      const point = { x: (x - centerX) * scale + 13.5, y: (y - centerY) * scale + 13.5 };
      if (previous) {
        const dx = point.x - previous.x;
        const dy = point.y - previous.y;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 2));
        for (let i = 1; i <= steps; i++) stamp(previous.x + dx * i / steps, previous.y + dy * i / steps);
      } else {
        stamp(point.x, point.y);
      }
      previous = point;
    }
  }
  let mass = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pixels.length; i++) {
    mass += pixels[i];
    cx += (i % side) * pixels[i];
    cy += Math.floor(i / side) * pixels[i];
  }
  if (!mass) return undefined;
  const shiftX = Math.round(13.5 - cx / mass);
  const shiftY = Math.round(13.5 - cy / mass);
  const pooled = new Float32Array(196);
  for (let i = 0; i < pixels.length; i++) {
    const x = i % side + shiftX;
    const y = Math.floor(i / side) + shiftY;
    if (x >= 0 && x < side && y >= 0 && y < side) {
      pooled[Math.floor(y / 2) * 14 + Math.floor(x / 2)] += pixels[i] / 4;
    }
  }
  return pooled;
}

function inferDigit(features: Float32Array): number | undefined {
  let values = features;
  for (const [index, { weights, bias }] of model.entries()) {
    values = Float32Array.from(weights, (row, i) => {
      let sum = bias[i];
      for (let j = 0; j < row.length; j++) sum += row[j] * values[j];
      return index === 0 ? Math.max(0, sum) : sum;
    });
  }
  const ranked = [...values.keys()].sort((a, b) => values[b] - values[a]);
  const best = ranked[0];
  const total = values.reduce((sum, value) => sum + Math.exp(value - values[best]), 0);
  const probability = 1 / total;
  const runnerUp = Math.exp(values[ranked[1]] - values[best]) / total;
  return probability >= 0.65 && probability - runnerUp >= 0.20 ? best : undefined;
}

export function recognizeDigits(cells: readonly DigitInk[]): RecognitionResult {
  const end = cells.findLastIndex(cell => cell.drawing.length > 0);
  if (end < 0) return { status: 'empty' };
  let value = '';
  for (const cell of cells.slice(0, end + 1)) {
    if (!cell.drawing.length) return { status: 'gap' };
    const pixels = rasterize(cell);
    const digit = pixels && inferDigit(pixels);
    if (digit === undefined) return { status: 'uncertain' };
    value += digit;
  }
  return { status: 'recognized', value };
}
