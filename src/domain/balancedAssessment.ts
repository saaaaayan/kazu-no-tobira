import { shuffle, type StageDeck } from './stageDeck.ts';

export type TopicQuestion = { id: string; topic: string };

/**
 * Deal one complete cycle at a time. Each topic is distributed across
 * all rounds with counts differing by at most one.
 */
export function dealAssessmentCycle(
  questions: readonly TopicQuestion[],
  previous: StageDeck | undefined,
  version: number,
  random: () => number = Math.random,
): StageDeck {
  const roundCount = 10;
  if (questions.length !== 100 || new Set(questions.map(q => q.id)).size !== 100) {
    throw new Error('An assessment requires 100 distinct questions');
  }

  const topics = new Map<string, string[]>();
  for (const { id, topic } of questions) {
    if (!topic.trim()) throw new Error('Missing assessment topic');
    const group = topics.get(topic) ?? [];
    group.push(id);
    topics.set(topic, group);
  }
  if (topics.size < 2) throw new Error('An assessment requires multiple topics');

  const rounds: string[][] = Array.from({ length: roundCount }, () => []);
  const last = new Set(previous?.lastRound);
  // Rotate assignments between topics so each round receives exactly ten
  // slots, including when a topic count is not divisible by ten.
  let slot = 0;
  for (const [, ids] of shuffle([...topics], random)) {
    const group = shuffle(ids, random);
    const indices = group.map((_, i) => (slot + i) % roundCount);
    const firstCount = indices.filter(index => index === 0).length;
    const freshFirst = group.filter(id => !last.has(id)).slice(0, firstCount);
    const reserved = new Set(freshFirst);
    // If the topic cannot fill its first-round quota entirely with fresh
    // questions, keep the forced overlap within that topic.
    const remaining = group.filter(id => !reserved.has(id));
    const first = [...freshFirst, ...remaining.splice(0, firstCount - freshFirst.length)];
    for (const index of indices) rounds[index].push((index === 0 ? first : remaining).shift()!);
    slot += group.length;
  }

  const [lastRound, ...remainingRounds] = rounds.map(round => shuffle(round, random));
  return { version, cycle: (previous?.cycle ?? 0) + 1, lastRound, remaining: remainingRounds.flat() };
}
