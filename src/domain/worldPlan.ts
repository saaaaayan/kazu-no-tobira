import { firstGradeStages, gradeIds, type GradeId, type StageId } from './curriculum.ts';
import type { Progress } from './progress.ts';

// Structural plan only: 'planned' does NOT indicate reviewed curriculum content.
export type StageKind = 'normal' | 'extra' | 'secret';
export type Implementation = 'planned' | 'demo' | 'verified';

export interface WorldStage {
  id: StageId;
  gradeId: GradeId;
  kind: StageKind;
  index: number;
  title: string;
  targetQuestions: number;
  implementation: Implementation;
}

export interface WorldGrade {
  id: GradeId;
  title: string;
  stages: readonly WorldStage[];
}

export const stageTargets = {
  normal: { count: 50, questions: 10 },
  extra: { count: 10, questions: 8 },
  secret: { count: 5, questions: 4 },
} as const;

const schoolNames = { e: '小学', j: '中学', h: '高校' } as const;

function stageName(kind: StageKind, index: number): string {
  if (kind === 'normal') return '通常 ' + index + '（単元未割当）';
  if (kind === 'extra') return 'EX ' + index + '（応用問題制作予定）';
  return 'SECRET ' + index + '（数学の発見を準備中）';
}

function makeStages(gradeId: GradeId, kind: StageKind): WorldStage[] {
  const { count, questions } = stageTargets[kind];
  const code = { normal: 'n', extra: 'ex', secret: 'secret' }[kind];
  return Array.from({ length: count }, (_, i): WorldStage => {
    const index = i + 1;
    const legacy = gradeId === 'e1' && kind === 'normal' ? firstGradeStages[i] : undefined;
    return {
      id: legacy?.id ?? (gradeId + '.' + code + String(index).padStart(2, '0')) as StageId,
      gradeId,
      kind,
      index,
      title: legacy?.title ?? stageName(kind, index),
      targetQuestions: questions,
      implementation: legacy ? 'demo' : 'planned',
    };
  });
}

export const worldGrades: readonly WorldGrade[] = gradeIds.map(id => ({
  id,
  title: schoolNames[id[0] as keyof typeof schoolNames] + id.slice(1) + '年生',
  stages: [...makeStages(id, 'normal'), ...makeStages(id, 'extra'), ...makeStages(id, 'secret')],
}));

export const worldStages: readonly WorldStage[] = worldGrades.flatMap(grade => grade.stages);

export function stagesForGrade(gradeId: GradeId): readonly WorldStage[] {
  return worldGrades.find(grade => grade.id === gradeId)?.stages ?? [];
}

export function isPlayable(stage: WorldStage): boolean {
  return stage.implementation === 'demo' || stage.implementation === 'verified';
}

// Existing demo clears were granted only for a perfect round.
// New stages must store perfectAt explicitly; a mere clear never qualifies.
export function isPerfect(stage: WorldStage, progress: Progress): boolean {
  const record = progress.stages[stage.id];
  return Boolean(record?.perfectAt || (stage.implementation === 'demo' && record?.clearedAt));
}

export function perfectProgress(gradeId: GradeId, progress: Progress): number {
  return stagesForGrade(gradeId)
    .filter(stage => stage.kind !== 'secret' && isPerfect(stage, progress)).length;
}

export function canUnlockSecrets(gradeId: GradeId, progress: Progress): boolean {
  const prerequisites = stagesForGrade(gradeId).filter(stage => stage.kind !== 'secret');
  return prerequisites.length === 60 && prerequisites.every(stage => isPerfect(stage, progress));
}

export function isSecretAccessible(stage: WorldStage, progress: Progress): boolean {
  return stage.kind !== 'secret' || canUnlockSecrets(stage.gradeId, progress);
}
