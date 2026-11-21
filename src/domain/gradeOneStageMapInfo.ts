import type {WorldStage} from './worldCatalog.ts';
import {gradeOnePreviewStageInfo} from './gradeOnePreviewCurriculum.ts';
/** All 65 first-grade map pins have a short individual title.
 * EX and secret-stage goals remain *proposals* until their 10 problems have
 * been reviewed. This file never changes stage IDs or unlock conditions.
 */
const extra=[
  ['かずの めいろ','かずの きまりを みつけよう。'],
  ['すうじを さがせ','かずの じゅんばんを たしかめよう。'],
  ['10を つかおう','10の まとまりを つかおう。'],
  ['たしざんの なぞ','たしざんを くふうして とこう。'],
  ['ひきざんの なぞ','ひきざんの こたえを たしかめよう。'],
  ['ならびの ひみつ','かずの ならびから きまりを みつけよう。'],
  ['100の たんけん','100までの かずで あそぼう。'],
  ['かたちパズル','かたちの くみあわせを ためそう。'],
  ['とけいの ひみつ','とけいの はりを よく みよう。'],
  ['えグラフの なぞ','えグラフを みて かんがえよう。'],
] as const;
const secret=[
  ['まほうの かず','いろいろな かずの きまりを かんがえよう。'],
  ['10の ふしぎ','10の くみあわせを くふうしよう。'],
  ['かたちの ぼうけん','かたちの ひみつを みつけよう。'],
  ['きまりの とびら','かずや かたちの きまりを みつけよう。'],
  ['おもちゃの でんせつ','いままでの まなびを つかおう。'],
] as const;
export function gradeOneStageMapInfo(stage:WorldStage):{title:string;goal:string;provisional:boolean}|undefined {
  if(stage.gradeId!=='e1')return undefined;
  const normal=gradeOnePreviewStageInfo(stage);
  if(normal)return {title:normal.title,goal:normal.goal,provisional:false};
  const item=stage.kind==='extra'?extra[stage.order-50]:secret[stage.order-60];
  if(!item)return undefined;
  return {title:item[0],goal:item[1],provisional:true};
}
