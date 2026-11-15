import assert from 'node:assert/strict';
import test from 'node:test';
import { recognizeDigits } from '../src/recognition/recognizeDigits.ts';

const cell = (...strokes) => ({
  drawing: strokes.map(stroke => stroke.map(([x, y]) => ({ x, y }))),
  size: { width: 90, height: 90 },
});
const blank = cell();
const one = cell([[0.49, 0.20], [0.49, 0.50], [0.51, 0.80]]);
const two = cell([[0.25, 0.32], [0.32, 0.22], [0.49, 0.18], [0.66, 0.23],
  [0.71, 0.34], [0.60, 0.50], [0.44, 0.64], [0.24, 0.79], [0.77, 0.79]]);

test('実モデルが複数桁を左から順に認識し、末尾の未使用の枠を無視する', () => {
  assert.deepEqual(recognizeDigits([one, two, one, blank]), { status: 'recognized', value: '121' });
});

test('未入力・桁の空き・小さな点を数字として適用しない', () => {
  assert.deepEqual(recognizeDigits([blank, blank]), { status: 'empty' });
  assert.deepEqual(recognizeDigits([one, blank, two]), { status: 'gap' });
  assert.deepEqual(recognizeDigits([cell([[0.5, 0.5]])]), { status: 'uncertain' });
});

test('曖昧な筆跡は解答として確定せず、複数の修正候補を返す', () => {
  const ink = cell([[0.26, 0.42], [0.32, 0.74], [0.41, 0.57], [0.30, 0.80], [0.45, 0.78]]);
  const result = recognizeDigits([ink]);
  assert.equal(result.status, 'ambiguous');
  assert.equal(new Set(result.candidates).size, 3);
  assert.ok(result.candidates.every(candidate => /^[0-9]$/.test(candidate)));
});
