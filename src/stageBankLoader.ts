import type { BankStageId, StageBank } from './domain/questionBank';

export async function loadStageBank(stageId: BankStageId): Promise<StageBank> {
  switch (stageId) {
    case 'e1.forest': return require('../public/question-banks/e1.forest.v1.json') as StageBank;
    case 'e1.bridge': return require('../public/question-banks/e1.bridge.v1.json') as StageBank;
    case 'e1.tower': return require('../public/question-banks/e1.tower.v1.json') as StageBank;
  }
}
