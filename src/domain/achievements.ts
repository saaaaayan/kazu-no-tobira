import type { Progress } from './progress.ts';
import { worldGrades, worldStages, isPerfect } from './worldPlan.ts';

export type AchievementCategory = 'adventure' | 'mastery' | 'exploration';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  earned: boolean;
}

export function getAchievements(progress: Progress): Achievement[] {
  const cleared = worldStages.filter(stage => Boolean(progress.stages[stage.id])).length;
  const perfect = worldStages.filter(stage => isPerfect(stage, progress)).length;
  const secretCleared = worldStages.filter(stage =>
    stage.kind === 'secret' && Boolean(progress.stages[stage.id])).length;
  const finishedGrades = worldGrades.filter(grade =>
    grade.stages.every(stage => Boolean(progress.stages[stage.id]))).length;

  return [
    { id: 'first-step', title: 'はじめての冒険者', description: 'ステージを初めてクリア', category: 'adventure', earned: cleared >= 1 },
    { id: 'three', title: '森と橋と塔の友', description: '3ステージをクリア', category: 'adventure', earned: cleared >= 3 },
    { id: 'ten', title: '道しるべの旅人', description: '10ステージをクリア', category: 'adventure', earned: cleared >= 10 },
    { id: 'fifty', title: '島を駆ける者', description: '50ステージをクリア', category: 'adventure', earned: cleared >= 50 },
    { id: 'hundred', title: '百のトビラを開く者', description: '100ステージをクリア', category: 'adventure', earned: cleared >= 100 },
    { id: 'first-perfect', title: 'パーフェクトの卵', description: '初めてパーフェクト達成', category: 'mastery', earned: perfect >= 1 },
    { id: 'ten-perfect', title: '正確無比の冒険者', description: '10ステージでパーフェクト', category: 'mastery', earned: perfect >= 10 },
    { id: 'fifty-perfect', title: '星を集める者', description: '50ステージでパーフェクト', category: 'mastery', earned: perfect >= 50 },
    { id: 'first-secret', title: '秘密を知る者', description: '隠しステージを初めてクリア', category: 'exploration', earned: secretCleared >= 1 },
    { id: 'twenty-secrets', title: '数の探究者', description: '隠しステージを20個クリア', category: 'exploration', earned: secretCleared >= 20 },
    { id: 'first-island', title: '一島完全制覇', description: '1つの島の65ステージをクリア', category: 'adventure', earned: finishedGrades >= 1 },
    { id: 'all-islands', title: '十二島の大賢者', description: '12の島の全ステージをクリア', category: 'mastery', earned: finishedGrades === 12 },
  ];
}
