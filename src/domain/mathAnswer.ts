import type { MathQuestion } from './worldQuestions.ts';

export function checkMathAnswer(problem: MathQuestion, typed: string): boolean {
  const normalized = typed.normalize('NFKC').trim().replaceAll('−', '-');
  if (problem.type === 'choice') return typed.trim() === problem.answer || normalized === problem.answer.normalize('NFKC');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return false;
  const actual = Number(normalized);
  const expected = Number(problem.answer);
  return Number.isFinite(actual) && Math.abs(actual - expected) < 0.000001;
}

export function isValidMathAnswer(problem: MathQuestion, typed: string): boolean {
  const normalized = typed.normalize('NFKC').trim().replaceAll('−', '-');
  if (problem.type === 'choice') return problem.choices?.includes(typed.trim()) ?? false;
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) && Number.isFinite(Number(normalized));
}
