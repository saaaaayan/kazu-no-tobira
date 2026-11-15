import assert from 'node:assert/strict';
import test from 'node:test';
import { canPlayWorldStage, progressAfterWorldAnswer, worldStageAction } from '../src/domain/playMode.ts';
import { emptyProgress } from '../src/domain/progress.ts';
import { worldGrades } from '../src/domain/worldCatalog.ts';
import { isWorldStageUnlocked, unlockSummary } from '../src/domain/worldProgress.ts';
import { adventureTitles } from '../src/domain/titles.ts';

test('テストモードで12学年780ステージを選べ、通常モードは最初の学習から始まる', () => {
  const stages = worldGrades.flatMap(grade => grade.stages);
  assert.equal(stages.filter(stage => canPlayWorldStage('test', emptyProgress, stage)).length, 600);
  const premium = { plan:'premium', verifiedUntil: Infinity };
  assert.equal(stages.filter(stage => canPlayWorldStage('test', emptyProgress, stage, premium)).length, 780);
  assert.deepEqual(stages.filter(stage => ['play','learn'].includes(worldStageAction('normal', emptyProgress, stage))),
    stages.filter(stage => isWorldStageUnlocked(emptyProgress, stage)));
  assert.equal(worldStageAction('normal', emptyProgress, worldGrades[0].stages[0]), 'learn');
  assert.equal(canPlayWorldStage('normal', emptyProgress, worldGrades[11].stages[64]), false);
  assert.equal(canPlayWorldStage('test', emptyProgress, worldGrades[11].stages[64], premium), true);
});

test('テスト回答とテスト完了は保存対象を生成せず、通常のクリア・称号・記録に影響しない', () => {
  const stage = worldGrades[0].stages[0];
  const attempt = {
    stageId: stage.id, problemId: stage.id + '.test', skillId: 'e1.number-order', submitted: 1,
    correct: true, answeredAt: '2026-11-15T00:00:00Z',
  };
  const completion = { stage, correct: stage.questions, usedHint: false };
  const normal = progressAfterWorldAnswer('normal', emptyProgress, attempt, completion);
  assert.equal(normal.attempts.length, 1);
  assert.ok(normal.stages[stage.id].perfectAt);
  assert.equal(unlockSummary(normal).cleared, 1);

  const snapshot = structuredClone(normal);
  assert.equal(progressAfterWorldAnswer('test', normal, attempt), undefined);
  assert.equal(progressAfterWorldAnswer('test', normal, attempt, completion), undefined);
  assert.deepEqual(normal, snapshot);
  assert.deepEqual(unlockSummary(normal), unlockSummary(snapshot));
  assert.deepEqual(adventureTitles(normal), adventureTitles(snapshot));
});
