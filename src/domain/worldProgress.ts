import type { Progress, StageProgress } from './progress.ts';
import { worldIslands, worldGrades, allWorldStagesById, isPlannedIsland, type WorldStage } from './worldCatalog.ts';

export type FullStageProgress = StageProgress & {
  perfectAt?: string;
  bestCorrect?: number;
  bestTotal?: number;
  plays?: number;
};

const legacyPerfect = new Set(['e1.forest', 'e1.bridge', 'e1.tower']);

export function gradeProgress(progress: Progress, gradeId: string) {
  const grade = worldIslands.find(item => item.id === gradeId);
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

export function isIslandUnlocked(progress: Progress, islandId: string): boolean {
  const index = worldIslands.findIndex(island => island.id === islandId);
  if (index < 0 || isPlannedIsland(worldIslands[index].id)) return false;
  if (islandId === 'e1') return true;
  const previous = gradeProgress(progress, worldIslands[index - 1].id);
  // Earlier releases unlocked ordinary islands via EX clears. Honor those saves.
  return islandId === 'sage' ? previous.regularCleared === 50 && previous.extrasCleared === 10
    : previous.regularCleared === 50 || previous.extrasCleared === 10;
}

export function isWorldStageUnlocked(progress: Progress, stage: WorldStage): boolean {
  const grade = worldIslands.find(island => island.id === stage.gradeId);
  if (!grade) return false;
  if (progress.stages[stage.id]?.clearedAt) return true;
  if (!isIslandUnlocked(progress, stage.gradeId)) return false;
  if (stage.kind === 'secret') {
    if (!gradeProgress(progress, stage.gradeId).mainPerfect) return false;
    const previousSecret = stage.order > 60 ? grade.stages[stage.order - 1] : undefined;
    return !previousSecret || Boolean(progress.stages[previousSecret.id]?.clearedAt);
  }
  if (stage.order === 0) return true;
  // Moved landmarks may already be cleared in old saves. Keep the other route prerequisite too.
  if (stage.id === 'e1.n06' && !progress.stages['e1.n05']?.clearedAt) return false;
  if (stage.id === 'e1.n16' && !progress.stages['e1.n15']?.clearedAt) return false;
  if (stage.id === 'e1.n26' && !progress.stages['e1.n25']?.clearedAt) return false;
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
  const priorCorrect = past?.bestCorrect;
  const priorTotal = past?.bestTotal;
  const priorWasBetter = priorCorrect !== undefined && priorTotal !== undefined && priorTotal > 0 &&
    priorCorrect * stage.questions > correct * priorTotal;
  const updated: FullStageProgress = {
    ...past,
    ...(cleared && !past?.clearedAt ? { clearedAt: completedAt } : {}),
    ...(perfect && !past?.perfectAt ? { perfectAt: completedAt } : {}),
    bestCorrect: priorWasBetter ? priorCorrect : correct,
    bestTotal: priorWasBetter ? priorTotal : stage.questions,
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
  return allWorldStagesById.get(id);
}
