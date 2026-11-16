import type { BankStageId, StageBank } from './domain/questionBank';

export async function loadStageBank(_stageId: BankStageId): Promise<StageBank> {
  throw new Error('Open the DB-backed game preview on the project preview server.');
}
