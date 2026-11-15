import type { BankStageId, StageBank } from './domain/questionBank';

export async function loadStageBank(stageId: BankStageId): Promise<StageBank> {
  const base = new URL('.', window.location.href);
  const response = await fetch(new URL('question-banks/' + stageId + '.v1.json', base));
  if (!response.ok) throw new Error('Stage bank is unavailable: ' + stageId);
  return response.json();
}
