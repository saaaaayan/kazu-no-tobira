import { canAccessStage, type Entitlement } from './domain/accessPlan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dealAssessmentCycle } from './domain/balancedAssessment';
import type { PlayMode } from './domain/playMode';
import { decodeStageDeck, drawStageRound, stageDeckKey } from './domain/stageDeck';
import { hasStageBank, type StageBank } from './domain/questionBank';
import { hasGeneratedWorldQuestions, type WorldStage } from './domain/worldCatalog';
import { generateWorldQuestions } from './domain/worldQuestions';
import { fetchPreviewDeck, fetchPreviewRound, previewApiOrigin, previewDeckChanged } from './domain/questionDbPreview';
import { loadStageBank } from './stageBankLoader';

const pending = new Map<string, Promise<unknown>>();

export async function prepareStageRound(stage: WorldStage, mode: PlayMode, legacySeed: number, access: Entitlement) {
  if (!canAccessStage(access, stage)) throw new Error('Stage requires premium access');
  if (!hasStageBank(stage.id)) {
    if (!hasGeneratedWorldQuestions(stage.gradeId)) throw new Error('Stage bank is not available');
    return generateWorldQuestions(stage, legacySeed);
  }

  const stageId = stage.id;
  const key = stageDeckKey(mode, stageId);
  const previous = pending.get(key);
  const prepared = (previous?.catch(() => undefined) ?? Promise.resolve())
    .then(async () => {
      const api = previewApiOrigin(typeof window==='undefined' ? undefined : window.location,__DEV__,
        process.env.EXPO_PUBLIC_KAZU_NATIVE_PREVIEW_PORT);
      if (api) return prepareRemoteRound(api,stage,key);
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

async function prepareRemoteRound(api:string,stage:WorldStage,key:string) {
  for (let attempt=0;;attempt++) {
    const remote=await fetchPreviewDeck(api,stage.id);
    const ids=remote.cards.map(card=>card.id);
    const balanced=remote.selection==='balanced' && ids.length===100;
    const storageKey=balanced ? key+':balanced' : key;
    const raw=await AsyncStorage.getItem(storageKey);
    let saved;
    try {
      saved=decodeStageDeck(raw,ids,remote.version);
    } catch {
      // Moderation can invalidate a previously valid card without changing the bank version.
      saved=undefined;
    }
    const deck=balanced && !saved?.remaining.length
      ? dealAssessmentCycle(remote.cards,saved,remote.version)
      : drawStageRound(ids,stage.questions,remote.version,saved);
    try {
      const round=await fetchPreviewRound(api,stage.id,deck.lastRound);
      if (round.length!==stage.questions || new Set(round.map(q=>q.id)).size!==stage.questions ||
          round.some(q=>!deck.lastRound.includes(q.id))) throw new Error('Invalid stage round');
      await AsyncStorage.setItem(storageKey,JSON.stringify(deck));
      return round;
    } catch (error) {
      if (attempt>0 || !previewDeckChanged(error)) throw error;
    }
  }
}

function validateHeader(stage: WorldStage, bank: StageBank) {
  if (bank.stageId !== stage.id || bank.gradeId !== stage.gradeId ||
      bank.islandId !== stage.gradeId || !Number.isInteger(bank.version) ||
      bank.version < 1 || !Array.isArray(bank.questions) || bank.questions.length < 100) {
    throw new Error('Invalid stage bank: ' + stage.id);
  }
}
