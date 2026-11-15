export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Stroke = readonly Point[];
export type Drawing = readonly Stroke[];

export function normalizePoint(point: Point, size: Size): Point {
  return {
    x: Math.max(0, Math.min(1, point.x / size.width)),
    y: Math.max(0, Math.min(1, point.y / size.height)),
  };
}

export function toPixels(point: Point, size: Size): Point {
  return { x: point.x * size.width, y: point.y * size.height };
}

function distanceToSegment(point: Point, from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared
    ? ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared
    : 0;
  const t = Math.min(1, Math.max(0, projection));
  return Math.hypot(point.x - (from.x + t * dx), point.y - (from.y + t * dy));
}

export function eraseStrokes(drawing: Drawing, from: Point, to: Point, size: Size): Drawing {
  const start = toPixels(from, size);
  const end = toPixels(to, size);
  const travel = Math.hypot(end.x - start.x, end.y - start.y);
  const steps = Math.max(1, Math.ceil(travel / 6));
  const remaining = drawing.filter(stroke => {
    let previous = toPixels(stroke[0], size);
    for (const point of stroke) {
      const current = toPixels(point, size);
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const sample = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
        if (distanceToSegment(sample, previous, current) <= 14) return false;
      }
      previous = current;
    }
    return true;
  });
  return remaining.length === drawing.length ? drawing : remaining;
}

export type InkHistory = { drawing: Drawing; previous: readonly Drawing[] };
export const emptyInkHistory: InkHistory = { drawing: [], previous: [] };

export function commitInk(history: InkHistory, drawing: Drawing): InkHistory {
  if (history.drawing === drawing) return history;
  return { drawing, previous: [...history.previous.slice(-49), history.drawing] };
}

export function undoInk(history: InkHistory): InkHistory {
  const drawing = history.previous.at(-1);
  return drawing ? { drawing, previous: history.previous.slice(0, -1) } : history;
}

export function clearInk(history: InkHistory): InkHistory {
  return history.drawing.length ? commitInk(history, []) : history;
}
