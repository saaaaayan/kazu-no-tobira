import { canAccessStage, freeAccess, type Entitlement } from './accessPlan.ts';
import { hasStageBank } from './questionBank.ts';
import { recordAttempt, type Attempt, type Progress } from './progress.ts';
import { lessonForStage } from './unitLessons.ts';
import { hasGeneratedWorldQuestions, isPlannedIsland, type WorldStage } from './worldCatalog.ts';
import { finishWorldStage, isWorldStageUnlocked } from './worldProgress.ts';

export type PlayMode = 'normal' | 'test';

export function worldStageAction(mode: PlayMode, progress: Progress, stage: WorldStage, access: Entitlement = freeAccess): 'play' | 'learn' | 'locked' | 'premium' {
  if (isPlannedIsland(stage.gradeId)) return 'locked';
  if (!canAccessStage(access, stage)) return 'premium';
  if (!hasGeneratedWorldQuestions(stage.gradeId) && !hasStageBank(stage.id)) return 'locked';
  if (mode === 'test' || progress.stages[stage.id]?.clearedAt) return 'play';
  if (!isWorldStageUnlocked(progress, stage)) return 'locked';
  const lesson = lessonForStage(stage.id);
  return lesson && !progress.lessons?.[lesson.id]?.completedAt ? 'learn' : 'play';
}

export function canPlayWorldStage(mode: PlayMode, progress: Progress, stage: WorldStage, access: Entitlement = freeAccess): boolean {
  return worldStageAction(mode, progress, stage, access) === 'play';
}

export function progressAfterWorldAnswer(
  mode: PlayMode,
  progress: Progress,
  attempt: Attempt,
  completion?: { stage: WorldStage; correct: number; usedHint: boolean },
): Progress | undefined {
  if (mode === 'test') return undefined;
  const attempted = recordAttempt(progress, attempt, false);
  return completion
    ? finishWorldStage(attempted, completion.stage, completion.correct, completion.usedHint, attempt.answeredAt)
    : attempted;
}
