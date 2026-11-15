import type { Progress, Attempt } from './progress.ts';
import type { WorldStage } from './worldCatalog.ts';
import { worldIslands } from './worldCatalog.ts';
import { canAccessStage, type UserPlan } from './access.ts';

export interface SkillAnalysis {
  skillId: string;
  title: string;
  total: number;
  correct: number;
  accuracy: number;
  cause: string;
  latestAt: string;
  reviewDue: boolean;
  stage?: WorldStage;
}

function relevantStage(attempt: Attempt): WorldStage | undefined {
  return worldIslands.flatMap(g => g.stages).find(s => s.id === attempt.stageId);
}
function repeatDelayDays(count: number, accuracy: number): number {
  if (accuracy < 0.6) return 1;
  if (count < 4) return 2;
  if (accuracy < 0.85) return 3;
  return count >= 10 ? 14 : 7;
}

export function analyzeWeakness(progress: Progress, now = new Date()): SkillAnalysis[] {
  const grouped = new Map<string, Attempt[]>();
  progress.attempts.forEach(a => grouped.set(a.skillId, [...(grouped.get(a.skillId) ?? []), a]));
  return [...grouped.entries()].map(([skillId, attempts]): SkillAnalysis => {
    const recent = attempts.slice(-30);
    const correct = recent.filter(a => a.correct).length;
    const accuracy = recent.length ? correct / recent.length : 0;
    const latest = attempts[attempts.length - 1];
    const stage = relevantStage(latest);
    const interval = repeatDelayDays(recent.length, accuracy);
    const dueAt = Date.parse(latest.answeredAt) + interval * 86400000;
    const cause = accuracy >= 0.85
      ? '概ね定着しています。期間を空けて確認しましょう。'
      : accuracy < 0.5
      ? '基本的な理解に不安がある可能性。学習ページの例題から確認しましょう。'
      : '手順の取り違えや計算ミスの可能性。解答の途中を確認しましょう。';
    return {
      skillId, title: stage?.subtitle ?? skillId, total: recent.length, correct, accuracy,
      cause, latestAt: latest.answeredAt, reviewDue: Number.isFinite(dueAt) && dueAt <= now.getTime(), stage,
    };
  }).sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
}

export function recommendedStages(progress: Progress, plan: UserPlan, purpose: 'weak' | 'daily' | 'review'): WorldStage[] {
  const insights = analyzeWeakness(progress);
  const available = insights.filter(a => a.stage && canAccessStage(plan, a.stage));
  const focus = purpose === 'review' ? available.filter(a => a.reviewDue)
    : purpose === 'weak' ? available.filter(a => a.accuracy < 0.85) : available;
  const candidates = focus.map(a => a.stage!).filter((stage, i, all) => all.findIndex(s => s.id === stage.id) === i);
  if (candidates.length) return candidates.slice(0, 4);
  const cleared = worldIslands.filter(g => g.id !== 'sage').flatMap(g => g.stages)
    .filter(stage => stage.kind === 'normal' && Boolean(progress.stages[stage.id]?.clearedAt));
  if (cleared.length) return cleared.slice(-3);
  return [worldIslands[0].stages[0]];
}
export interface GrowthSnapshot {
  attempted: number; correct: number; accuracy: number; activeDays: number;
  stagesCleared: number; lessonsCompleted: number; previousAccuracy: number;
  reviewDue: number; weakSkills: number;
}
export function growthSnapshot(progress: Progress, now = new Date()): GrowthSnapshot {
  const recent = progress.attempts.filter(a => Date.parse(a.answeredAt) > now.getTime() - 14 * 86400000);
  const older = progress.attempts.filter(a => Date.parse(a.answeredAt) <= now.getTime() - 14 * 86400000 &&
    Date.parse(a.answeredAt) > now.getTime() - 28 * 86400000);
  const insights = analyzeWeakness(progress, now);
  return {
    attempted: recent.length, correct: recent.filter(a => a.correct).length,
    accuracy: recent.length ? Math.round(recent.filter(a => a.correct).length / recent.length * 100) : 0,
    previousAccuracy: older.length ? Math.round(older.filter(a => a.correct).length / older.length * 100) : 0,
    activeDays: new Set(recent.map(a => a.answeredAt.slice(0, 10))).size,
    stagesCleared: Object.values(progress.stages).filter(s => Boolean(s?.clearedAt)).length,
    lessonsCompleted: Object.keys(progress.lessons ?? {}).length,
    reviewDue: insights.filter(i => i.reviewDue).length,
    weakSkills: insights.filter(i => i.accuracy < 0.85).length,
  };
}
