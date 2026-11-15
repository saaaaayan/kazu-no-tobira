import { expectedLessonAnswer, lessonCheckStart, lessonEnd, unitLessons, type LessonProgress } from './unitLessons.ts';
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
  lessons?: Partial<Record<string, LessonProgress>>;
}

export const emptyProgress: Progress = { version: 1, attempts: [], stages: {}, skills: {} };

function objectValue(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function decodeProgress(data: string | null): Progress {
  if (data === null) return emptyProgress;
  const saved: unknown = JSON.parse(data);
  if (!objectValue(saved) || saved.version !== 1 || !Array.isArray(saved.attempts) ||
      !objectValue(saved.skills) || !objectValue(saved.stages)) throw new Error('Unsupported progress data.');
  const progress = saved as unknown as Progress;
  if (!('lessons' in saved)) return progress;
  const raw = objectValue(saved.lessons) ? saved.lessons : {};
  const lessons = { ...raw } as NonNullable<Progress['lessons']>;
  for (const lesson of unitLessons) {
    const item = Object.hasOwn(raw, lesson.id) && raw[lesson.id];
    delete lessons[lesson.id];
    if (!objectValue(item) || typeof item.page !== 'number' || !Number.isInteger(item.page) ||
        item.page < 0 || item.page > lessonEnd(lesson) || !objectValue(item.checks)) continue;
    const checks: LessonProgress['checks'] = {};
    for (const check of lesson.checks) {
      const result = item.checks[check.id];
      if (objectValue(result) && typeof result.attempts === 'number' && Number.isInteger(result.attempts) && result.attempts > 0 &&
          typeof result.lastAnswer === 'number' && check.choices.includes(result.lastAnswer)) {
        checks[check.id] = { attempts: result.attempts, lastAnswer: result.lastAnswer, correct: result.lastAnswer === expectedLessonAnswer(check) };
      }
    }
    const pending = lesson.checks.findIndex(check => !checks[check.id]?.correct);
    const completedAt = typeof item.completedAt === 'string' && Number.isFinite(Date.parse(item.completedAt)) && pending === -1 ? item.completedAt : undefined;
    const maxPage = pending !== -1 ? lessonCheckStart(lesson) + pending : completedAt ? lessonEnd(lesson) : lessonEnd(lesson) - 1;
    if (!completedAt && pending === -1) delete checks[lesson.checks.at(-1)!.id];
    lessons[lesson.id] = { page: Math.min(item.page, maxPage), checks, ...(completedAt ? { completedAt } : {}) };
  }
  return { ...progress, lessons };
}

export function recordAttempt(progress: Progress, attempt: Attempt, cleared: boolean): Progress {
  const previous = progress.skills[attempt.skillId] ?? { answered: 0, correct: 0 };
  return {
    ...progress,
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
