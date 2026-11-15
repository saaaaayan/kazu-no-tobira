import { firstGradeStages, type AdditionStage } from './curriculum.ts';
import type { Progress } from './progress.ts';

export type StageReward = {
  stageId: AdditionStage['id'];
  name: string;
  color: string;
  highlight: string;
  clue: string;
};

// Rewards are derived from the existing stage-clear record. There is no
// second inventory that can go out of sync or erase children's progress.
const rewardMap: Record<AdditionStage['id'], StageReward> = {
  'e1.forest': {
    stageId: 'e1.forest',
    name: 'もりの しずく',
    color: '#46a99c',
    highlight: '#b1fbe4',
    clue: 'はじまりの森の たからもの',
  },
  'e1.bridge': {
    stageId: 'e1.bridge',
    name: 'つきの かけら',
    color: '#8e82db',
    highlight: '#e9daff',
    clue: '月あかりの橋の たからもの',
  },
  'e1.tower': {
    stageId: 'e1.tower',
    name: 'ほしの ひかり',
    color: '#dc9b42',
    highlight: '#fff1aa',
    clue: '星の塔の たからもの',
  },
};

export function rewardForStage(stageId: AdditionStage['id']): StageReward {
  return rewardMap[stageId];
}

export function earnedRewards(progress: Progress): StageReward[] {
  return firstGradeStages
    .filter(stage => Boolean(progress.stages[stage.id]))
    .map(stage => rewardForStage(stage.id));
}

export function consecutiveCorrect(results: readonly ('correct' | 'incorrect')[]): number {
  let count = 0;
  for (let index = results.length - 1; index >= 0; index--) {
    if (results[index] !== 'correct') break;
    count++;
  }
  return count;
}
