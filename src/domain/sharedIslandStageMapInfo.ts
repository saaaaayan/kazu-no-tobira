import type {WorldGrade,WorldStage} from './worldCatalog.ts';
import {preschoolStageMapInfo} from './preschoolStageMapInfo.ts';
import {gradeOneStageMapInfo} from './gradeOneStageMapInfo.ts';

/** Map copy only. No stage IDs, curricula, or question content are altered.
 * Normal stage labels combine the official unit with a concise stage step,
 * rather than showing one generic sentence repeated five times.
 */
const STEP_LABELS=['はじめ','きほん','れんしゅう','ちょうせん','まとめ'] as const;
export function sharedIslandStageMapInfo(grade:WorldGrade,stage:WorldStage):{
  title:string;goal:string;provisional:boolean;
}{
  if(grade.id!==stage.gradeId)throw new Error('Stage and island do not match');
  if(stage.gradeId==='preschool'){
    const info=preschoolStageMapInfo(stage);
    return {title:info.title,goal:info.goal,provisional:false};
  }
  if(stage.gradeId==='e1'){
    const info=gradeOneStageMapInfo(stage);
    if(info)return info;
  }
  if(stage.kind==='normal'){
    const unit=grade.units[stage.unitIndex]?.title??stage.subtitle;
    const suffix=STEP_LABELS[stage.part]??'まとめ';
    const title=grade.id==='sage'?stage.title:unit+'・'+suffix;
    return {title,goal:stage.title+'に とりくもう。',provisional:true};
  }
  if(stage.kind==='extra'){
    const base=grade.units[stage.unitIndex]?.title??stage.subtitle;
    return {title:grade.id==='sage'?'分野融合 '+String(stage.order-49):base+' EX',
      goal:stage.title+'。応用に ちょうせんしよう。',provisional:true};
  }
  return {title:stage.title.replace(/^ひみつ・/,''),
    goal:stage.title+'。学んだことを いかして 探究しよう。',provisional:true};
}
