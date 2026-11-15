import test from 'node:test';
import assert from 'node:assert/strict';
import { companionSpeech } from '../src/domain/companionSpeech.ts';

const moods = ['ready', 'correct', 'incorrect', 'clear', 'encourage'];

for (const mood of moods) {
  test(`ルミの${mood}のセリフは連続5問で重複しない`, () => {
    for (let start = 0; start < 20; start++) {
      const lines = Array.from({ length: 5 }, (_, i) => companionSpeech(mood, start + i));
      assert.equal(new Set(lines).size, lines.length);
      assert.ok(lines.every(line => typeof line === 'string' && line.trim().length >= 5));
    }
  });
}

test('正解のたびに違うセリフを表示する', () => {
  const lines = Array.from({ length: 5 }, (_, index) => companionSpeech('correct', index));
  assert.equal(lines.length, new Set(lines).size);
  assert.notEqual(lines[0], lines[1]);
});

test('画面の再描画では同じセリフを維持する', () => {
  assert.equal(companionSpeech('correct', 42), companionSpeech('correct', 42));
  assert.equal(companionSpeech('ready', 100), companionSpeech('ready', 100));
});

test('負のインデックスや特殊な値でも表示できる', () => {
  for (const index of [-11, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.ok(companionSpeech('correct', index).length > 0);
  }
});

test('修正版には以前の固定セリフを含めない', () => {
  for (let i = 0; i < 30; i++) {
    assert.notEqual(companionSpeech('correct', i), 'やったね！ そのちょうし！');
  }
});
