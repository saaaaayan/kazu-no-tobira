import type { WorldGrade, WorldStage } from './worldCatalog.ts';

export const stageLabels = { normal:'冒険の道', extra:'試練の道', secret:'伝説のトビラ' } as const;
export function stageDisplayTitle(stage:Pick<WorldStage,'kind'|'title'>) {
  return stage.title.replace(/^EX・|^ひみつ・/,stageLabels[stage.kind]+'・');
}

export type Checkpoint = {
  id:string;
  number:number;
  after:WorldStage;
  sourceStageIds:readonly WorldStage['id'][];
};

export function checkpointsFor(island: WorldGrade): Checkpoint[] {
  const route=island.stages.filter(stage=>stage.kind==='normal');
  const checkpoints: Checkpoint[]=[];
  for (let start=0;start+5<=route.length;start+=5) {
    const group=route.slice(start,start+5);
    const number=start/5+1;
    checkpoints.push({id:island.id+'.checkpoint'+number,number,after:group[4],sourceStageIds:group.map(stage=>stage.id)});
  }
  return checkpoints;
}
