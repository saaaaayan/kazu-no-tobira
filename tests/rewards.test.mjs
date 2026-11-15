import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, recordAttempt } from '../src/domain/progress.ts';
import { consecutiveCorrect, earnedRewards, rewardForStage } from '../src/domain/rewards.ts';
import { firstGradeStages } from '../src/domain/curriculum.ts';

test('5問中の連続正解数は不正解で途切れる', () => {
  assert.equal(consecutiveCorrect([]), 0);
  assert.equal(consecutiveCorrect(['correct']), 1);
  assert.equal(consecutiveCorrect(['correct', 'correct', 'correct']), 3);
  assert.equal(consecutiveCorrect(['correct', 'incorrect']), 0);
  assert.equal(consecutiveCorrect(['correct', 'incorrect', 'correct', 'correct']), 2);
  assert.equal(consecutiveCorrect(['correct', 'correct', 'correct', 'correct', 'correct']), 5);
  assert.equal(consecutiveCorrect(['incorrect', 'correct', 'incorrect', 'correct']), 1);
});

test('ステージごとに違う宝物が割り当てられている', () => {
  const rewards = firstGradeStages.map(stage => rewardForStage(stage.id));
  assert.deepEqual(rewards.map(reward => reward.stageId), firstGradeStages.map(stage => stage.id));
  assert.equal(new Set(rewards.map(reward => reward.name)).size, rewards.length);
  assert.equal(new Set(rewards.map(reward => reward.color)).size, rewards.length);
  for (const reward of rewards) {
    assert.ok(reward.name.trim().length > 0);
    assert.match(reward.color, /^#[\da-f]{6}$/i);
    assert.match(reward.highlight, /^#[\da-f]{6}$/i);
  }
});

test('クリアしたステージの宝物だけ表示され、従来の記録をそのまま使える', () => {
  assert.deepEqual(earnedRewards(emptyProgress), []);
  const stageId = firstGradeStages[0].id;
  const attempt = {
    problemId: 'e1.add.within-9:1+1', skillId: 'e1.add.within-9', stageId,
    submitted: 2, correct: true, answeredAt: '2026-11-15T00:00:00Z',
  };
  const ordinary = recordAttempt(emptyProgress, attempt, false);
  assert.deepEqual(earnedRewards(ordinary), []);
  const cleared = recordAttempt(ordinary, attempt, true);
  assert.deepEqual(earnedRewards(cleared).map(reward => reward.stageId), [stageId]);
  assert.equal(earnedRewards(recordAttempt(cleared, { ...attempt, correct: false }, false)).length, 1);
  assert.equal(earnedRewards(emptyProgress).length, 0);
});
