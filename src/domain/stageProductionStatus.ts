/** ステージ全体の制作・評価状態。個別設問の審査・配信承認とは別物。 */
export const stageProductionLabels = {
  not_started:'未作成',
  ten_created:'10問作成済み',
  creator_reviewed:'制作者による確認済み',
  hundred_created:'100問作成済み',
  final_creator_reviewed:'制作者による最終確認済み',
  child_tested:'子供によるテスト済み',
} as const;
export type StageProductionStatus = keyof typeof stageProductionLabels;
export const stageProductionOptions=Object.keys(stageProductionLabels) as StageProductionStatus[];
export type StageProductionEntry = {
  id:string;
  island_id:string;
  is_checkpoint:boolean;
  stage_title:string|null;
  status:StageProductionStatus;
  authored_count:number;
  reviewed_count:number;
  child_test_count:number;
  version:number;
  note:string;
  updated_at:string;
  updated_by:string;
};
export function productionStatusMinimum(status:StageProductionStatus):number {
  return status==='hundred_created'||status==='final_creator_reviewed'||status==='child_tested'
    ? 100 : status==='ten_created'||status==='creator_reviewed' ? 10 : 0;
}
export function productionStageIsReviewed(status:StageProductionStatus):boolean {
  return status==='creator_reviewed'||status==='final_creator_reviewed'||status==='child_tested';
}
