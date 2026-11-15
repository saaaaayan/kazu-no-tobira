import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeCtc } from '../src/recognition/ctc.ts';
import { recognizeLine } from '../src/recognition/recognizeLine.ts';

const emission = (label, score = 18) => Array.from({ length: 11 }, (_, i) => i === label ? score : -18);

test('CTCは連続フレームをまとめ、blankを挟んだ同じ数字は別の桁として扱う', () => {
  const frames = [emission(10), emission(1), emission(1), emission(0), emission(10), emission(0), emission(10)];
  assert.equal(decodeCtc(frames)[0].value, '100');
});

test('重なった筆跡の短い誤読はそのまま解答欄に入れず候補にする', () => {
  const size = { width: 200, height: 110 };
  const stroke = points => points.map(([x, y]) => ({ x: x / size.width, y: y / size.height }));
  const drawing = [
    stroke([[32, 16], [16, 40], [10, 71], [22, 84], [39, 78], [43, 62], [34, 49], [20, 50], [14, 61]]),
    stroke([[61, 16], [48, 40], [39, 71], [49, 86], [66, 79], [72, 61], [63, 49], [49, 50], [42, 63]]),
  ];
  const result = recognizeLine({ drawing, size });
  assert.ok(result.status !== 'recognized' || result.value.length === 2);
});
