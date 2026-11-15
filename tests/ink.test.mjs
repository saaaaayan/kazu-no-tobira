import assert from 'node:assert/strict';
import test from 'node:test';
import { clearInk, commitInk, emptyInkHistory, eraseStrokes, normalizePoint, toPixels, undoInk } from '../src/domain/ink.ts';

const size = { width: 400, height: 300 };
const line = [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }];
const dot = [{ x: 0.2, y: 0.2 }];

test('タップと線を座標として保存し、1操作ずつ戻す', () => {
  const withLine = commitInk(emptyInkHistory, [line]);
  const withDot = commitInk(withLine, [...withLine.drawing, dot]);
  assert.deepEqual(undoInk(withDot).drawing, [line]);
  assert.deepEqual(undoInk(undoInk(withDot)).drawing, []);
  assert.deepEqual(emptyInkHistory.drawing, []);
});

test('消しゴムは移動経路と交差した線だけを消し、操作を戻せる', () => {
  const previous = commitInk(emptyInkHistory, [line, dot]);
  const erased = eraseStrokes(previous.drawing, { x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 }, size);
  assert.deepEqual(erased, [dot]);
  assert.deepEqual(undoInk(commitInk(previous, erased)).drawing, [line, dot]);
  assert.deepEqual(eraseStrokes(erased, dot[0], dot[0], size), []);
  assert.equal(eraseStrokes(erased, { x: 0, y: 0 }, { x: 0.1, y: 0 }, size), erased);
});

test('全部消すの取り消しで紙全体の線が復元される', () => {
  const before = commitInk(emptyInkHistory, [line, dot]);
  const cleared = clearInk(before);
  assert.deepEqual(cleared.drawing, []);
  assert.equal(clearInk(cleared), cleared);
  assert.deepEqual(undoInk(cleared).drawing, [line, dot]);
});

test('描画枠外の座標を端に収め、幅と高さが変わっても相対位置を再現する', () => {
  assert.deepEqual(normalizePoint({ x: -10, y: 800 }, size), { x: 0, y: 1 });
  const normalized = normalizePoint({ x: 100, y: 150 }, size);
  assert.deepEqual(toPixels(normalized, { width: 800, height: 600 }), { x: 200, y: 300 });
});
