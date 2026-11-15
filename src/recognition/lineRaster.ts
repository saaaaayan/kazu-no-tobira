import { toPixels, type Point } from '../domain/ink.ts';
import type { DigitInk } from './contracts.ts';

export const lineHeight = 28;

export interface LineImage {
  width: number;
  pixels: Float32Array;
}

export function rasterizeLine({ drawing, size }: DigitInk): LineImage | undefined {
  const strokes = drawing.map(stroke => stroke.map(point => toPixels(point, size)));
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const stroke of strokes) {
    for (const { x, y } of stroke) {
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (!Number.isFinite(left) || Math.max(right - left, bottom - top) < 10) return undefined;

  const scale = Math.min(22 / Math.max(10, bottom - top), 752 / Math.max(1, right - left));
  const width = Math.max(28, Math.ceil(((right - left) * scale + 14) / 2) * 2);
  const pixels = new Float32Array(lineHeight * width);

  function stamp(x: number, y: number) {
    for (let row = Math.max(0, Math.floor(y - 2)); row <= Math.min(lineHeight - 1, Math.ceil(y + 2)); row++) {
      for (let col = Math.max(0, Math.floor(x - 2)); col <= Math.min(width - 1, Math.ceil(x + 2)); col++) {
        const index = row * width + col;
        const coverage = Math.max(0, Math.min(1, 1.75 - Math.hypot(col - x, row - y)));
        pixels[index] = Math.max(pixels[index], coverage);
      }
    }
  }

  for (const stroke of strokes) {
    let previous: Point | undefined;
    for (const { x, y } of stroke) {
      const point = { x: (x - left) * scale + 7, y: (y - (top + bottom) / 2) * scale + 13.5 };
      if (!previous) stamp(point.x, point.y);
      else {
        const dx = point.x - previous.x;
        const dy = point.y - previous.y;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 2));
        for (let step = 1; step <= steps; step++) {
          stamp(previous.x + dx * step / steps, previous.y + dy * step / steps);
        }
      }
      previous = point;
    }
  }
  return { width, pixels };
}
