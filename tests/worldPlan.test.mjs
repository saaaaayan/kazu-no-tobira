import assert from 'node:assert/strict';
import test from 'node:test';
import { worldGrades, worldStages, stagesForGrade, stageTargets,
  perfectProgress, canUnlockSecrets, isSecretAccessible } from '../src/domain/worldPlan.ts';
import { getAchievements } from '../src/domain/achievements.ts';
import { emptyProgress } from '../src/domain/progress.ts';

test('12学年に各50+10+5の780ステージが存在する', () => {
  assert.equal(worldGrades.length, 12);
  assert.equal(worldStages.length, 780);
  assert.equal(new Set(worldStages.map(stage => stage.id)).size, 780);
  for (const grade of worldGrades) {
    assert.equal(grade.stages.length, 65);
    assert.equal(stagesForGrade(grade.id).length, 65);
    for (const kind of ['normal', 'extra', 'secret']) {
      const stages = grade.stages.filter(stage => stage.kind === kind);
      assert.equal(stages.length, stageTargets[kind].count);
      assert.ok(stages.every(stage => stage.targetQuestions === stageTargets[kind].questions));
    }
  }
});

test('未制作ステージは完成扱いしない', () => {
  const demos = worldStages.filter(stage => stage.implementation === 'demo');
  assert.deepEqual(demos.map(stage => stage.id), ['e1.forest', 'e1.bridge', 'e1.tower']);
  assert.equal(worldStages.filter(stage => stage.implementation === 'planned').length, 777);
  assert.equal(worldStages.filter(stage => stage.implementation === 'verified').length, 0);
});

test('同一島の通常50+EX10の全パーフェクトで隠しステージ解放', () => {
  const grade = worldGrades[1];
  const prerequisites = grade.stages.filter(stage => stage.kind !== 'secret');
  const full = {
    ...emptyProgress,
    stages: Object.fromEntries(prerequisites.map(stage => [stage.id, { clearedAt: '2026-01-01', perfectAt: '2026-01-01' }])),
  };
  assert.equal(perfectProgress(grade.id, emptyProgress), 0);
  assert.equal(canUnlockSecrets(grade.id, emptyProgress), false);
  assert.equal(canUnlockSecrets(grade.id, full), true);
  assert.equal(isSecretAccessible(grade.stages.at(-1), full), true);
  assert.equal(canUnlockSecrets(grade.id, {
    ...full,
    stages: { ...full.stages, [prerequisites[0].id]: { clearedAt: '2026-01-01' } },
  }), false);
});

test('称号は学習記録から導出し、未達成は付与しない', () => {
  assert.equal(getAchievements(emptyProgress).filter(item => item.earned).length, 0);
  const first = { ...emptyProgress, stages: { 'e1.forest': { clearedAt: '2026-01-01' } } };
  const earned = getAchievements(first).filter(item => item.earned).map(item => item.id);
  assert.deepEqual(earned.sort(), ['first-perfect', 'first-step'].sort());
});
