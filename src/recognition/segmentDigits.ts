import { toPixels, type Stroke } from '../domain/ink.ts';
import type { DigitInk } from './contracts.ts';
import { recognizeDigits } from './recognizeDigits.ts';

interface Span {
  left: number;
  right: number;
  order: number;
  stroke: Stroke;
}

export function groupByHorizontalSpan(ink: DigitInk): DigitInk[] {
  const spans: Span[] = [];
  for (const [order, stroke] of ink.drawing.entries()) {
    if (!stroke.length) continue;
    let left = Infinity;
    let right = -Infinity;
    for (const point of stroke) {
      const { x } = toPixels(point, ink.size);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    spans.push({ left, right, order, stroke });
  }

  // Horizontal gaps separate digits. Keep overlapping strokes together so a
  // multi-stroke digit still reaches the classifier as a single character.
  const groups: { right: number; spans: Span[] }[] = [];
  for (const span of spans.sort((a, b) => a.left - b.left)) {
    const group = groups.at(-1);
    if (group && span.left <= group.right + 1) {
      group.right = Math.max(group.right, span.right);
      group.spans.push(span);
    } else {
      groups.push({ right: span.right, spans: [span] });
    }
  }

  return groups.map(group => ({
    size: ink.size,
    drawing: group.spans.sort((a, b) => a.order - b.order).map(span => span.stroke),
  }));
}

export function recognizeFreeform(ink: DigitInk) {
  return recognizeDigits(groupByHorizontalSpan(ink));
}
