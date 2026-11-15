import { bankStageIds } from './bankStageIds.ts';
export { bankStageIds };
import type { MathQuestion } from './worldQuestions.ts';

export type BankDiagram = { kind: 'tenFrame'; first: number; second?: number; third?: number }
  | { kind: 'transferToTen'; inside: number; outside: number }
  | { kind: 'takeAway'; total: number; used: number };
export type BankQuestion = MathQuestion & {
  format: 'calculation' | 'missingPart' | 'story' | 'decomposition' | 'comparison' | 'position' | 'interval' | 'sequence' | 'line' | 'reverseTransfer'
    | 'joinThree' | 'target' | 'splitTotal' | 'compareGroups' | 'returnSome' | 'refill' | 'twoCollections'
    | 'takeAway' | 'takeTwice' | 'startAmount' | 'unknownLast' | 'compareAfter' | 'moveAway' | 'equalize' | 'comparedStart'
    | 'tenCompareGaps' | 'tenAfterRemoval' | 'tenSecondSource' | 'tenReserved' | 'tenEqualShare' | 'tenTrimAfterTwo' | 'tenShift'
    | 'twentyBundle' | 'twentyOnes' | 'twentyPosition' | 'twentyInner' | 'twentyMiddle' | 'twentyNearest' | 'twentyTwoMoves' | 'twentyOrder'
    | 'carryThenUse' | 'carryFindFirstGain' | 'carryCompare' | 'carryThreeGroups' | 'carryPackTarget';
  difficulty: 1 | 2 | 3;
  hints: readonly [string, string, string];
  steps: readonly { title: string; body: string }[];
  mistakes: readonly { answer?: string; explanation: string }[];
  diagram?: BankDiagram;
};

export type StageBank = {
  version: number;
  stageId: string;
  gradeId: string;
  islandId: string;
  unit: string;
  objective: string;
  questions: readonly BankQuestion[];
};

export type BankStageId = typeof bankStageIds[number];

export function hasStageBank(id: string): id is BankStageId {
  return bankStageIds.some(stageId => stageId === id);
}

export function isBankQuestion(question: MathQuestion): question is BankQuestion {
  return 'hints' in question;
}

export function mistakenReason(question: BankQuestion, answer: string): string | undefined {
  const parsed = Number(answer.normalize('NFKC').trim().replaceAll('−', '-'));
  return question.mistakes.find(item => item.answer !== undefined && Number(item.answer) === parsed)?.explanation;
}
