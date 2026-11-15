import AsyncStorage from '@react-native-async-storage/async-storage';
import { dealAssessmentCycle } from './domain/balancedAssessment';
import type { PlayMode } from './domain/playMode';
import { decodeStageDeck, drawStageRound, stageDeckKey } from './domain/stageDeck';
import { hasStageBank, type StageBank } from './domain/questionBank';
import type { WorldStage } from './domain/worldCatalog';
import { generateWorldQuestions } from './domain/worldQuestions';
import { loadStageBank } from './stageBankLoader';

const pending = new Map<string, Promise<unknown>>();

export async function prepareStageRound(stage: WorldStage, mode: PlayMode, legacySeed: number) {
  if (!hasStageBank(stage.id)) return generateWorldQuestions(stage, legacySeed);

  const stageId = stage.id;
  const key = stageDeckKey(mode, stageId);
  const previous = pending.get(key);
  const prepared = (previous?.catch(() => undefined) ?? Promise.resolve())
    .then(async () => {
      const bank = await loadStageBank(stageId);
      validateHeader(stage, bank);
      const questions = new Map(bank.questions.map(q => [q.id, q]));
      const ids = [...questions.keys()];
      if (ids.length !== bank.questions.length) throw new Error('Duplicate stage question ID');

      // The new policy uses its own deck so older random draws are preserved.
      const storageKey = bank.selection === 'balanced' ? key + ':balanced' : key;
      const saved = decodeStageDeck(await AsyncStorage.getItem(storageKey), ids, bank.version);
      const deck = bank.selection === 'balanced' && !saved?.remaining.length
        ? dealAssessmentCycle(bank.questions.map(question => ({ id: question.id, topic: question.topic ?? '' })), saved, bank.version)
        : drawStageRound(ids, stage.questions, bank.version, saved);
      await AsyncStorage.setItem(storageKey, JSON.stringify(deck));
      return deck.lastRound.map(id => questions.get(id)!).sort((a, b) => a.difficulty - b.difficulty);
    });

  pending.set(key, prepared);
  try {
    return await prepared;
  } finally {
    if (pending.get(key) === prepared) pending.delete(key);
  }
}

function validateHeader(stage: WorldStage, bank: StageBank) {
  if (bank.stageId !== stage.id || bank.gradeId !== stage.gradeId ||
      bank.islandId !== stage.gradeId || !Number.isInteger(bank.version) ||
      bank.version < 1 || !Array.isArray(bank.questions) || bank.questions.length < 100) {
    throw new Error('Invalid stage bank: ' + stage.id);
  }
}
