import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecognitionQueue, recognitionDelayMs } from '../src/recognition/recognitionQueue.ts';

test('次の筆画で待機時間をリセットし、最後の筆画だけを認識する', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const oldInk = [];
  const latestInk = [{ drawing: [], size: { width: 90, height: 90 } }];
  const calls = [];
  const results = [];
  const queue = createRecognitionQueue(async ink => {
    calls.push(ink);
    return { status: 'recognized', value: '12' };
  }, result => results.push(result));
  queue.schedule(oldInk);
  t.mock.timers.tick(500);
  queue.schedule(latestInk);
  t.mock.timers.tick(recognitionDelayMs - 1);
  assert.deepEqual(calls, []);
  t.mock.timers.tick(1);
  await Promise.resolve();
  assert.deepEqual(calls, [latestInk]);
  assert.deepEqual(results, [{ status: 'recognized', value: '12' }]);
});

test('新しい筆画や手動修正の後に遅着した候補を破棄する', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const completions = [];
  const results = [];
  const queue = createRecognitionQueue(() => new Promise(resolve => completions.push(resolve)), result => results.push(result));
  queue.schedule([]);
  t.mock.timers.tick(recognitionDelayMs);
  queue.schedule([]);
  t.mock.timers.tick(recognitionDelayMs);
  completions[1]({ status: 'recognized', value: '100' });
  completions[0]({ status: 'recognized', value: '10' });
  await Promise.resolve();
  assert.deepEqual(results.map(result => result.value), ['100']);
  queue.schedule([]);
  t.mock.timers.tick(recognitionDelayMs);
  queue.cancel();
  completions[2]({ status: 'recognized', value: '7' });
  await Promise.resolve();
  assert.deepEqual(results.map(result => result.value), ['100']);
});
