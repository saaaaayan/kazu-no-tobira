import type { Progress, StageProgress } from './progress.ts';
import { worldGrades, worldStageById, type WorldStage } from './worldCatalog.ts';

export type FullStageProgress = StageProgress & {
  perfectAt?: string;
  bestCorrect?: number;
  bestTotal?: number;
  plays?: number;
};

const legacyPerfect = new Set(['e1.forest', 'e1.bridge', 'e1.tower']);

export function gradeProgress(progress: Progress, gradeId: string) {
  const grade = worldGrades.find(item => item.id === gradeId);
  if (!grade) return { cleared: 0, perfect: 0, regularCleared: 0, extrasCleared: 0, mainPerfect: false };
  const main = grade.stages.slice(0, 60);
  const isPerfect = (stage: WorldStage) => {
    const item = progress.stages[stage.id] as FullStageProgress | undefined;
    return Boolean(item?.perfectAt || (item?.clearedAt && legacyPerfect.has(stage.id)));
  };
  return {
    cleared: grade.stages.filter(stage => Boolean(progress.stages[stage.id])).length,
    perfect: grade.stages.filter(isPerfect).length,
    regularCleared: main.slice(0, 50).filter(stage => Boolean(progress.stages[stage.id])).length,
    extrasCleared: main.slice(50).filter(stage => Boolean(progress.stages[stage.id])).length,
    mainPerfect: main.every(isPerfect),
  };
}

export function isWorldStageUnlocked(progress: Progress, stage: WorldStage): boolean {
  const gradeIndex = worldGrades.findIndex(grade => grade.id === stage.gradeId);
  if (gradeIndex < 0) return false;
  if (gradeIndex > 0 && gradeProgress(progress, worldGrades[gradeIndex - 1].id).extrasCleared < 10) return false;
  const grade = worldGrades[gradeIndex];
  if (stage.kind === 'secret') {
    if (!gradeProgress(progress, stage.gradeId).mainPerfect) return false;
    const previousSecret = stage.order > 60 ? grade.stages[stage.order - 1] : undefined;
    return !previousSecret || Boolean(progress.stages[previousSecret.id]?.clearedAt);
  }
  if (stage.order === 0) return true;
  return Boolean(progress.stages[grade.stages[stage.order - 1].id]?.clearedAt);
}

export function firstUnclearedWorldStage(progress: Progress): WorldStage | undefined {
  return worldGrades.flatMap(grade => grade.stages.slice(0, 60))
    .find(stage => isWorldStageUnlocked(progress, stage) && !progress.stages[stage.id]?.clearedAt);
}

export function finishWorldStage(
  progress: Progress,
  stage: WorldStage,
  correct: number,
  usedHint: boolean,
  completedAt: string,
): Progress {
  if (!Number.isInteger(correct) || correct < 0 || correct > stage.questions) throw new RangeError('Invalid score');
  const past = progress.stages[stage.id] as FullStageProgress | undefined;
  const cleared = correct >= Math.ceil(stage.questions * 0.8);
  const perfect = correct === stage.questions && !usedHint;
  const improved = Math.max(correct, past?.bestCorrect ?? -1);
  const updated: FullStageProgress = {
    ...past,
    ...(cleared && !past?.clearedAt ? { clearedAt: completedAt } : {}),
    ...(perfect && !past?.perfectAt ? { perfectAt: completedAt } : {}),
    bestCorrect: improved,
    bestTotal: stage.questions,
    plays: (past?.plays ?? 0) + 1,
  } as FullStageProgress;
  // The StageProgress type requires a clearedAt; don't treat failed attempts as clears.
  if (!cleared && !past?.clearedAt) return progress;
  return { ...progress, stages: { ...progress.stages, [stage.id]: updated } };
}

export function unlockSummary(progress: Progress) {
  const gradeClear = worldGrades.map(grade => gradeProgress(progress, grade.id));
  return {
    cleared: gradeClear.reduce((sum, item) => sum + item.cleared, 0),
    perfect: gradeClear.reduce((sum, item) => sum + item.perfect, 0),
    hiddenUnlocked: gradeClear.filter(item => item.mainPerfect).length,
    allPerfect: gradeClear.every(item => item.perfect === 65),
  };
}

export function getWorldStage(id: string) {
  return worldStageById.get(id);
}
