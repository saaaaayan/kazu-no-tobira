import assert from 'node:assert/strict';
import test from 'node:test';
import { applyNumberPadKey } from '../src/domain/answerInput.ts';
import { gradeInteger } from '../src/domain/grading.ts';

test('digit panel: 3 + 5 = 8 can be answered with a single tap', () => {
  let input = '';
  input = applyNumberPadKey(input, '8');
  assert.equal(input, '8');
  assert.deepEqual(gradeInteger(3 + 5, input), { status: 'correct', submitted: 8 });
});

test('digit panel: multi-digit answers, deletion and clearing', () => {
  let input = '';
  input = applyNumberPadKey(input, '1');
  input = applyNumberPadKey(input, '2');
  assert.equal(input, '12');
  assert.deepEqual(gradeInteger(12, input), { status: 'correct', submitted: 12 });
  input = applyNumberPadKey(input, 'けす');
  assert.equal(input, '1');
  input = applyNumberPadKey(input, '全部消す');
  assert.equal(input, '');
  assert.equal(applyNumberPadKey(input, '8'), '8');
});

test('digit panel: only known keypad keys change the answer', () => {
  for (const key of ['', 'abc', '８', '12', 'すべて']) {
    assert.equal(applyNumberPadKey('8', key), '8');
  }
});
