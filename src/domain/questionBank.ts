import type { MathQuestion } from './worldQuestions.ts';

export type AdditionDiagram = { kind: 'tenFrame'; first: number; second?: number };
export type BankQuestion = MathQuestion & {
  format: 'calculation' | 'missingPart' | 'story' | 'decomposition' | 'comparison';
  difficulty: 1 | 2 | 3;
  hints: readonly [string, string, string];
  steps: readonly { title: string; body: string }[];
  mistakes: readonly { answer?: string; explanation: string }[];
  diagram?: AdditionDiagram;
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

export const bankStageIds = ['e1.forest', 'e1.bridge', 'e1.tower'] as const;
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
