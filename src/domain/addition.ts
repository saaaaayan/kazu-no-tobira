import type { AdditionSkillId } from './curriculum.ts';

export interface AdditionProblem {
  id: string;
  skillId: AdditionSkillId;
  left: number;
  right: number;
  answer: number;
  explanation: string;
}

type Operands = readonly [number, number];

const digits = Array.from({ length: 10 }, (_, index) => index);
const pairs = digits.flatMap(left => digits.map(right => [left, right] as const));
const pools: Record<AdditionSkillId, readonly Operands[]> = {
  'e1.add.within-9': pairs.filter(([left, right]) => left + right <= 9),
  'e1.add.make-10': pairs.filter(([left, right]) => left + right === 10),
  'e1.add.cross-10': pairs.filter(([left, right]) => left + right > 10),
};

function explain(left: number, right: number, answer: number): string {
  if (left === 0 || right === 0) {
    return `0を たすと、かずは かわらないよ。こたえは ${answer}。`;
  }
  if (answer > 10) {
    const toTen = 10 - left;
    const rest = right - toTen;
    return `${right}を ${toTen}と ${rest}に わけよう。まず ${left} ＋ ${toTen} ＝ 10。のこりの ${rest}を たして、10 ＋ ${rest} ＝ ${answer}。`;
  }
  if (answer === 10) {
    return `${left}から 10まで、あと ${right}。だから ${left} ＋ ${right} ＝ 10。`;
  }
  return `${left}から ${right}つ すすもう。たどりつく かずは ${answer}。`;
}

export function generateAdditionRound(
  skillId: AdditionSkillId,
  count = 5,
  random: () => number = Math.random,
): AdditionProblem[] {
  const pool = [...pools[skillId]];
  if (!Number.isInteger(count) || count < 1 || count > pool.length) {
    throw new RangeError('Problem count is outside the available pool.');
  }
  return Array.from({ length: count }, (_, index) => {
    const sample = random();
    if (!(sample >= 0 && sample < 1)) {
      throw new RangeError('Random sample must be in [0, 1).');
    }
    const selected = index + Math.floor(sample * (pool.length - index));
    [pool[index], pool[selected]] = [pool[selected], pool[index]];
    const [left, right] = pool[index];
    const answer = left + right;
    return { id: `${skillId}:${left}+${right}`, skillId, left, right, answer, explanation: explain(left, right, answer) };
  });
}
