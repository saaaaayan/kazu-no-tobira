import type { Progress } from './progress.ts';
import { worldGrades } from './worldCatalog.ts';
import { gradeProgress, unlockSummary } from './worldProgress.ts';

export type AdventureTitle = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  category: 'ぼうけん' | 'たつじん' | 'ひみつ' | 'せかい';
};

const gradeMilestones = [
  { id: 'first', name: 'はじめの一歩', description: '冒険の道を1つクリア', key: 'cleared', min: 1, category: 'ぼうけん' },
  { id: 'trail', name: '小さな探検家', description: '冒険の道を10個クリア', key: 'regularCleared', min: 10, category: 'ぼうけん' },
  { id: 'middle', name: '島の案内人', description: '冒険の道を25個クリア', key: 'regularCleared', min: 25, category: 'ぼうけん' },
  { id: 'normal', name: '島の冒険王', description: '冒険の道を50個クリア', key: 'regularCleared', min: 50, category: 'ぼうけん' },
  { id: 'extra', name: 'EXの勇者', description: '試練の道を10個クリア', key: 'extrasCleared', min: 10, category: 'ぼうけん' },
  { id: 'firstperfect', name: 'はじめての満点', description: 'パーフェクトを1つ達成', key: 'perfect', min: 1, category: 'たつじん' },
  { id: 'perfect10', name: 'きらめく10', description: 'パーフェクトを10個達成', key: 'perfect', min: 10, category: 'たつじん' },
  { id: 'perfect30', name: '輝く努力家', description: 'パーフェクトを30個達成', key: 'perfect', min: 30, category: 'たつじん' },
  { id: 'perfect60', name: 'ひみつの扉を開く者', description: '冒険の道と試練の道の60ステージをパーフェクト', key: 'mainPerfect', min: 1, category: 'ひみつ' },
  { id: 'secret1', name: '不思議の発見者', description: '伝説のトビラを1つクリア', key: 'secret', min: 1, category: 'ひみつ' },
  { id: 'secret5', name: 'ひみつの島の博士', description: '伝説のトビラを5つクリア', key: 'secret', min: 5, category: 'ひみつ' },
] as const;

const worldMilestones = [
  { key: 'cleared', thresholds: [1, 10, 25, 50, 100, 200, 300, 400, 500, 600, 700, 780], title: '冒険の足あと', category: 'せかい' },
  { key: 'perfect', thresholds: [1, 10, 25, 50, 100, 200, 300, 400, 500, 600, 700, 780], title: '星を集める人', category: 'たつじん' },
  { key: 'hiddenUnlocked', thresholds: [1, 3, 6, 9, 12], title: 'ひみつの門番', category: 'ひみつ' },
] as const;

export function adventureTitles(progress: Progress): AdventureTitle[] {
  const local = worldGrades.flatMap(grade => {
    const status = gradeProgress(progress, grade.id);
    const secret = grade.stages.slice(60).filter(stage => Boolean(progress.stages[stage.id]?.clearedAt)).length;
    return gradeMilestones.map(award => {
      const score = award.key === 'secret' ? secret
        : award.key === 'mainPerfect' ? Number(status.mainPerfect)
        : status[award.key];
      return {
        id: `${grade.id}-${award.id}`,
        name: `${grade.island}の${award.name}`,
        description: `${grade.title}：${award.description}`,
        unlocked: score >= award.min,
        category: award.category,
      } satisfies AdventureTitle;
    });
  });
  const summary = unlockSummary(progress);
  const global = worldMilestones.flatMap(milestone =>
    milestone.thresholds.map(count => ({
      id: `world-${milestone.key}-${count}`,
      name: `${milestone.title}・${count}`,
      description: `世界全体で${count}を達成`,
      unlocked: summary[milestone.key] >= count,
      category: milestone.category,
    } satisfies AdventureTitle)),
  );
  return [...local, ...global];
}
