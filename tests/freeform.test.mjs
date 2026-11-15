import assert from 'node:assert/strict';
import test from 'node:test';
import { recognizeLine } from '../src/recognition/recognizeLine.ts';

const digits = {
  '0': [[[17, 4], [34, 5], [46, 19], [49, 42], [44, 62], [30, 71], [14, 67], [4, 51], [4, 27], [9, 12], [17, 4]]],
  '1': [[[18, 6], [18, 38], [21, 70]]],
  '2': [[[6, 20], [12, 9], [24, 5], [39, 7], [47, 16], [46, 26], [37, 39], [23, 51],
    [6, 66], [50, 67]]],
  '5': [[[47, 7], [10, 7]], [[12, 6], [7, 34], [20, 29], [34, 29], [46, 39], [47, 53],
    [40, 64], [27, 71], [16, 70], [5, 62]]],
  '8': [[[27, 7], [37, 6], [46, 12], [44, 23], [35, 32], [19, 42], [8, 52],
    [7, 64], [16, 71], [33, 73], [47, 64], [48, 54], [39, 44], [24, 35], [12, 23],
    [11, 14], [17, 7], [27, 7]]],
};

function writeInOneArea(text, { width, height }, scale = 1) {
  const drawing = [...text].flatMap((digit, index) => digits[digit].map(stroke => stroke.map(([x, y]) => ({
    x: (6 + (index * 57 + x) * scale) / width,
    y: (15 + y * scale) / height,
  }))));
  return { drawing, size: { width, height } };
}

test('ひとつの手書き欄から 5、12、108 を認識する', () => {
  for (const size of [{ width: 240, height: 150 }, { width: 530, height: 150 }]) {
    for (const value of ['5', '12', '108']) {
      assert.deepEqual(recognizeLine(writeInOneArea(value, size)), { status: 'recognized', value });
    }
  }
});

test('逆の筆記順でも左から読み、桁数を固定しない', () => {
  const ink = writeInOneArea('12805', { width: 540, height: 150 }, 1.3);
  assert.deepEqual(recognizeLine({ ...ink, drawing: [...ink.drawing].reverse() }),
    { status: 'recognized', value: '12805' });
});

test('空欄や孤立した点を答えに変換しない', () => {
  const size = { width: 300, height: 150 };
  assert.deepEqual(recognizeLine({ size, drawing: [] }), { status: 'empty' });
  assert.deepEqual(recognizeLine({ size, drawing: [[{ x: 0.2, y: 0.5 }]] }), { status: 'uncertain' });
});
