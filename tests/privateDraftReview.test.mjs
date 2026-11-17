import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { validatePrivateDraftPack } from '../src/domain/privateDraftReview.ts';

const makeQuestion=(stage,i)=>({
  id:stage+':draft:q'+i,question:'くまは いくつ？',
  answer:'1',choices:['1','2','3'],
  hints:['えを みよう','ひとつずつ','かぞえて えらぼう'],
  explanation:'くまは 1こ',diagram:{kind:'countingBoard',rows:[{tokens:['bear']}]},
});
const makeStage=(id)=>({
  stageId:id,title:'1を かぞえよう',reviewStatus:'draft',uiReady:false,
  questions:[makeQuestion(id,1),makeQuestion(id,2)],
});
const pack={
  schema:'kazu-private-preschool-review-v1',reviewOnly:true,totalQuestions:4,
  stages:[makeStage('preschool.n01'),makeStage('preschool.n02')],
};

test('owner-supplied private pack activates only validated stages, including the otherwise grey n02',()=>{
  const parsed=validatePrivateDraftPack(structuredClone(pack));
  assert.equal(parsed.totalQuestions,4);
  assert.deepEqual(parsed.stages.map(s=>s.stageId),['preschool.n01','preschool.n02']);
  assert.ok(parsed.stages.every(stage=>stage.reviewStatus==='draft' && stage.uiReady===false));
});
test('reject malformed, duplicate, or silently approved private drafts',()=>{
  const clone=()=>structuredClone(pack);
  let p=clone();p.schema='other';assert.throws(()=>validatePrivateDraftPack(p));
  p=clone();p.stages[1].stageId=p.stages[0].stageId;assert.throws(()=>validatePrivateDraftPack(p));
  p=clone();p.stages[1].questions[0].id=p.stages[0].questions[0].id;assert.throws(()=>validatePrivateDraftPack(p));
  p=clone();p.stages[1].questions[1].hints=[];assert.throws(()=>validatePrivateDraftPack(p));
  p=clone();p.stages[0].uiReady=true;assert.throws(()=>validatePrivateDraftPack(p));
  p=clone();p.stages[0].reviewStatus='ready';assert.throws(()=>validatePrivateDraftPack(p));
  p=clone();p.totalQuestions=5;assert.throws(()=>validatePrivateDraftPack(p));
  p=clone();p.stages[0].stageId='../admin';assert.throws(()=>validatePrivateDraftPack(p));
});
test('draft import never changes the default public sample bank, normal mode, or the official site origin',()=>{
  const app=readFileSync('src/FullAdventure.tsx','utf8');
  const map=readFileSync('src/components/WorldScenes780.tsx','utf8');
  const component=readFileSync('src/components/PrivateDraftReview.tsx','utf8');
  assert.match(app,/validatePrivateDraftPack\(JSON\.parse\(raw\)\)/);
  assert.match(app,/if \(!uiPreview \|\| typeof document === 'undefined'\) return/);
  assert.match(app,/setPrivatePack\(loaded\)/);
  assert.match(app,/privatePack\?\.stages\.find\(item=>item\.stageId===stage\.id\)/);
  assert.match(map,/draftStageIds\.includes\(stage\.id\)/);
  assert.match(map,/const unlocked=preview \? Boolean\(uiPreviewSampleKind\(stage\)\) \|\| privateDraft/);
  assert.match(component,/非公開・教材評価用の下書き/);
  assert.doesNotMatch(component,/fetch\(|localStorage|AsyncStorage|sendBeacon/);
});
