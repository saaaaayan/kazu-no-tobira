import { recordAttempt, type Attempt, type Progress } from './progress.ts';
import type { WorldStage } from './worldCatalog.ts';
import { finishWorldStage, isWorldStageUnlocked } from './worldProgress.ts';

export type PlayMode = 'normal' | 'test';

export function canPlayWorldStage(mode: PlayMode, progress: Progress, stage: WorldStage): boolean {
  return mode === 'test' || isWorldStageUnlocked(progress, stage);
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
