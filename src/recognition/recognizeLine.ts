import { toPixels, type Stroke } from '../domain/ink.ts';
import type { DigitInk, RecognitionResult } from './contracts.ts';
import { rasterize } from './rasterize.ts';
import { digitScores, recognizeDigits } from './recognizeDigits.ts';
import { groupByHorizontalSpan } from './segmentDigits.ts';
import { rasterizeLine } from './lineRaster.ts';
import { rankLine } from './sequenceRecognizer.ts';

type Candidate = { value: string; score: number };

function bounds(strokes: readonly Stroke[], { size }: DigitInk) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const stroke of strokes) for (const point of stroke) {
    const { x, y } = toPixels(point, size);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  return { left, right, height: bottom - top };
}

function rankPartitions(ink: DigitInk): Candidate[] {
  const whole = bounds(ink.drawing, ink);
  const strokes = ink.drawing.map(stroke => ({ stroke, ...bounds([stroke], ink) }))
    .sort((a, b) => (a.left + a.right) - (b.left + b.right));
  const beam: Candidate[][] = Array.from({ length: strokes.length + 1 }, () => []);
  beam[0].push({ value: '', score: 0 });

  for (let end = 1; end <= strokes.length; end++) {
    const paths: Candidate[] = [];
    for (let start = 0; start < end; start++) {
      if (!beam[start].length) continue;
      const drawing = strokes.slice(start, end).map(entry => entry.stroke);
      const box = bounds(drawing, ink);
      const width = box.right - box.left;
      if (box.height < whole.height * 0.47) continue;
      const shapePenalty = 1.75 * Math.max(0, width / Math.max(1, box.height) - 0.72);
      const overlap = start > 0 ? Math.max(0, strokes[start - 1].right - box.left) / whole.height : 0;
      if (overlap > 0.42) continue;
      const pixels = rasterize({ ...ink, drawing });
      if (!pixels) continue;
      const digits = digitScores(pixels).map((score, digit) => ({ score, digit }))
        .sort((a, b) => b.score - a.score).slice(0, 2);
      for (const path of beam[start]) for (const { score, digit } of digits) {
        paths.push({ value: path.value + digit, score: path.score + Math.log(score) - 0.27 - shapePenalty - overlap });
      }
    }
    beam[end] = uniqueBest(paths);
  }
  return beam.at(-1) ?? [];
}

function uniqueBest(paths: Candidate[]) {
  const seen = new Set<string>();
  return paths.sort((a, b) => b.score - a.score).filter(({ value }) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  }).slice(0, 6);
}

function bestText(result: RecognitionResult): string {
  return result.status === 'recognized' ? result.value : result.status === 'ambiguous' ? result.candidates[0] ?? '' : '';
}

export function recognizeLine(ink: DigitInk): RecognitionResult {
  const groups = groupByHorizontalSpan(ink);
  if (!groups.length) return { status: 'empty' };
  const isolated = recognizeDigits(groups);
  const suspicious = groups.map(group => {
    const box = bounds(group.drawing, group);
    return box.right - box.left >= Math.max(10, box.height * 0.82);
  });
  if (!suspicious.some(Boolean)) return isolated;

  const line = rasterizeLine(ink);
  if (!line) return isolated;
  const sequence = rankLine(line);
  const sequenceBest = sequence[0];
  let ranked: Candidate[] = [{ value: '', score: 0 }];
  for (const [i, group] of groups.entries()) {
    const paths = suspicious[i] && group.drawing.length <= 30 ? rankPartitions(group) : [];
    const fallback = bestText(recognizeDigits([group]));
    if (!paths.length && fallback) paths.push({ value: fallback, score: 0 });
    ranked = uniqueBest(ranked.flatMap(prefix => paths.map(path => ({
      value: prefix.value + path.value, score: prefix.score + path.score,
    }))));
  }

  const baseline = bestText(isolated);
  const partition = ranked[0]?.value;
  const ctc = sequenceBest.value;
  // Independent agreement can allow auto-fill. If the engines see different
  // lengths in a wide group, offer candidates rather than silently dropping digits.
  if (partition && partition === ctc && partition.length > baseline.length && sequenceBest.score >= 0.80) {
    return { status: 'recognized', value: partition };
  }
  const closeLongerPath = ranked.find(path =>
    path.value.length > baseline.length && path.score >= ranked[0].score - 0.40,
  );
  const conflict = closeLongerPath || Math.max(partition?.length ?? 0, ctc.length) > baseline.length;
  if (isolated.status === 'recognized' && !conflict) return isolated;

  const candidates = [...new Set([partition, ctc, closeLongerPath?.value, baseline, ...ranked.map(path => path.value)].filter(
    (value): value is string => !!value,
  ))].slice(0, 3);
  return candidates.length ? { status: 'ambiguous', candidates } : { status: 'uncertain' };
}
