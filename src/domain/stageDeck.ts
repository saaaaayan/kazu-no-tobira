export type StageDeck = {
  version: number;
  cycle: number;
  remaining: string[];
  lastRound: string[];
};

export function shuffle<T>(values: readonly T[], random: () => number) {
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function decodeStageDeck(raw: string | null, ids: readonly string[], version: number): StageDeck | undefined {
  if (raw === null) return;
  const saved = JSON.parse(raw) as Partial<StageDeck> | null;
  if (saved?.version !== version) return;
  const validIds = new Set(ids);
  if (!Number.isSafeInteger(saved.cycle) || saved.cycle! < 1 ||
      !Array.isArray(saved.remaining) || !Array.isArray(saved.lastRound) ||
      saved.lastRound.length === 0 || saved.lastRound.length > ids.length ||
      saved.remaining.length + saved.lastRound.length > ids.length) {
    throw new Error('Invalid saved question deck');
  }
  const observed = [...saved.remaining, ...saved.lastRound];
  if (new Set(observed).size !== observed.length || !observed.every(id => validIds.has(id))) {
    throw new Error('Invalid saved question IDs');
  }
  return saved as StageDeck;
}

export function drawStageRound(ids: readonly string[], count: number, version: number,
  saved?: StageDeck, random: () => number = Math.random): StageDeck {
  if (!Number.isInteger(count) || count < 1 || ids.length < count || ids.length % count !== 0 ||
      new Set(ids).size !== ids.length) throw new Error('Invalid stage bank size');
  const previous = saved?.version === version ? saved : undefined;
  if (previous?.remaining.length && previous.remaining.length % count !== 0) {
    throw new Error('Saved deck and round size do not match');
  }

  if (previous?.remaining.length) {
    return { ...previous, remaining: previous.remaining.slice(count), lastRound: previous.remaining.slice(0, count) };
  }

  const lastRound = new Set(previous?.lastRound);
  const available = shuffle(ids, random);
  // At the cycle boundary, prefer anything outside the previous round and
  // keep the deferred IDs in the deck for later rounds.
  const preferred = available.filter(id => !lastRound.has(id));
  const first = [...preferred, ...available.filter(id => lastRound.has(id))].slice(0, count);
  const reserved = new Set(first);
  return {
    version,
    cycle: (previous?.cycle ?? 0) + 1,
    remaining: shuffle(available.filter(id => !reserved.has(id)), random),
    lastRound: first,
  };
}

export function stageDeckKey(mode: 'normal' | 'test', stageId: string) {
  return 'kazu-no-tobira:question-deck:' + mode + ':' + stageId;
}
