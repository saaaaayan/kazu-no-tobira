import type { SkillId, StageId } from './curriculum.ts';

export interface Attempt {
  problemId: string;
  skillId: SkillId;
  stageId: StageId;
  submitted: number;
  correct: boolean;
  answeredAt: string;
}

export interface StageProgress {
  clearedAt: string;
}

export interface SkillProgress {
  answered: number;
  correct: number;
}

export interface Progress {
  version: 1;
  attempts: readonly Attempt[];
  stages: Partial<Record<StageId, StageProgress>>;
  skills: Partial<Record<SkillId, SkillProgress>>;
}

export const emptyProgress: Progress = { version: 1, attempts: [], stages: {}, skills: {} };

export function recordAttempt(progress: Progress, attempt: Attempt, cleared: boolean): Progress {
  const previous = progress.skills[attempt.skillId] ?? { answered: 0, correct: 0 };
  return {
    version: 1,
    attempts: [...progress.attempts, attempt],
    skills: {
      ...progress.skills,
      [attempt.skillId]: {
        answered: previous.answered + 1,
        correct: previous.correct + Number(attempt.correct),
      },
    },
    stages: cleared && !progress.stages[attempt.stageId]
      ? { ...progress.stages, [attempt.stageId]: { clearedAt: attempt.answeredAt } }
      : progress.stages,
  };
}
