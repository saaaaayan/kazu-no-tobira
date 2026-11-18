import type {WorldGrade,WorldStage} from './worldCatalog.ts';
import {checkpointsFor} from './stageStructure.ts';

/**
 * Use the actual subject attached to each stage, not a guessed row number.
 * Particularly important for the first-grade legacy banks, whose unit
 * indexes were deliberately retained when the route was reordered.
 */
export function stageCategoryName(grade:WorldGrade,stage:WorldStage):string {
  if(stage.gradeId!==grade.id)throw new Error('Stage and island do not match: '+stage.id);
  if(stage.kind==='secret')return stage.title.replace(/^ひみつ・/,'');
  if(stage.kind==='normal'&&stage.subtitle.trim()&&
    stage.subtitle!=='おうよう もんだい')return stage.subtitle;
  if(grade.id==='sage'&&stage.kind==='extra')return stage.title.replace(/^EX・/,'');
  return grade.units[stage.unitIndex]?.title??stage.subtitle;
}

export function islandCurriculum(grade:WorldGrade) {
  return {
    units:grade.units.map((unit,index)=>({
      number:index+1,
      unit,
      stages:grade.stages.filter(stage=>stage.kind==='normal'&&stage.unitIndex===index),
      trial:grade.stages.find(stage=>stage.kind==='extra'&&stage.unitIndex===index),
    })),
    trials:grade.stages.filter(stage=>stage.kind==='extra'),
    legends:grade.stages.filter(stage=>stage.kind==='secret'),
    checkpoints:checkpointsFor(grade),
  };
}
