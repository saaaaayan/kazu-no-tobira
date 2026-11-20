import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewRound, uiPreviewBank, uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';
const code=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const island=worldIslands.find(g=>g.id==='preschool');

test('every one of the 65 preschool nodes yields ten actual, solvable prototype problems',()=>{
 assert.ok(island);
 assert.equal(island.stages.length,65);
 const allIds=new Set();
 let tracing=0;
 for(const stage of island.stages){
   const bank=uiPreviewBank(stage),round=uiPreviewRound(stage);
   assert.ok(bank.length>=10,stage.id);
   assert.equal(round.length,10,stage.id);
   assert.equal(new Set(bank.map(q=>q.id)).size,bank.length,stage.id);
   assert.ok(round.every(q=>bank.some(record=>record.id===q.id)),stage.id);
   for(const q of round){
     assert.ok(!allIds.has(q.id),q.id);allIds.add(q.id);
     assert.ok(q.question.trim().length>=5,q.id);
     assert.ok(q.prompt.trim().length>=4,q.id);
     assert.ok(!/[＋+＝=]/u.test(q.question),q.id);
     assert.ok(q.type==='choice',q.id);
     assert.ok(q.choices?.includes(q.answer),q.id);
     assert.equal(new Set(q.choices).size,q.choices.length,q.id);
     assert.equal(q.choices.filter(option=>checkMathAnswer(q,option)).length,1,q.id);
     assert.ok(q.hints?.length===3&&q.hints.every(h=>h.length>=5),q.id);
     assert.ok(q.explanation.length>=5,q.id);
     assert.ok(q.steps?.length>=1&&q.steps.every(step=>step.body),q.id);
     if(q.preschoolTrace){
       tracing++;
       assert.equal(q.format,'tracing',q.id);
       assert.equal(q.answer,'できた',q.id);
     }
   }
 }
 assert.equal(allIds.size,650);
 assert.equal(tracing,50,'5 tracing stages have 10 hands-on activities each');
});

test('all ten checkpoint lanes are playable without requiring an approved bank',()=>{
 for(let checkpoint=1;checkpoint<=10;checkpoint++){
   const round=uiPreviewPreschoolCheckpoint(checkpoint,()=>.34);
   assert.equal(round.length,10);
   assert.equal(new Set(round.map(q=>q.id)).size,10);
 }
 const scenes=code('src/components/WorldScenes780.tsx');
 const game=code('src/FullAdventure.tsx');
 assert.match(scenes,/const enabled=preview \? \(grade\.id==='preschool'\|\|grade\.id==='e1'\) && checkpoint\.number<=10/);
 assert.match(game,/item\.number===1\?uiPreviewPreschoolCheckpointOne\(\)/);
 assert.match(game,/uiPreviewPreschoolCheckpoint\(item\.number\)/);
 assert.match(game,/const problems=uiPreviewRound\(stage\)/);
 assert.match(game,/onPress=\{\(\)=>void submit\(\)\}/);
});

test('numeral tracing requires shape recognition and never credits merely moving the pen',()=>{
 const view=code('src/components/PreschoolTracePad.tsx');
 const game=code('src/FullAdventure.tsx');
 assert.match(view,/<InkSurface label=/);
 assert.match(view,/digitRecognizer\.recognize/);
 assert.match(view,/preschoolTraceInkQuality/);
 assert.match(view,/preschoolTraceMatches/);
 assert.match(view,/ぬりつぶさず、すうじの せんを かいてね/);
 assert.match(game,/<PreschoolTracePad key=\{question\.id\}/);
 assert.match(game,/traceActivity&&answer!=='できた'/);
});

test('no unreviewed prototype bank is treated as an approved published question bank',()=>{
 const src=code('src/domain/preschoolPlayableStages.ts');
 const kind=code('src/domain/uiPreviewRound.ts');
 assert.match(src,/Public prototype only/);
 assert.match(kind,/if \(kind==='preschool-activity'\) return preschoolPrototypeBank/);
 assert.doesNotMatch(src,/requestLiveRound|question_catalog\./);
});
