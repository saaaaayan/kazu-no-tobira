import assert from 'node:assert/strict';
import test from 'node:test';
import {liveQuestionService} from '../server/live-question-service.mjs';
import {checkpointsFor,stageLabels} from '../src/domain/stageStructure.ts';
import {worldIslands} from '../src/domain/worldCatalog.ts';

test('checkpoints are separate and cover the preceding five real routes including legacy IDs',()=>{
  assert.deepEqual(Object.values(stageLabels),['冒険の道','試練の道','伝説のトビラ']);
  assert.equal(worldIslands.flatMap(checkpointsFor).length,160);
  for (const island of worldIslands) {
    const points=checkpointsFor(island);
    assert.equal(points.length,10);
    assert.deepEqual(points.flatMap(item=>item.sourceStageIds),island.stages.slice(0,50).map(stage=>stage.id));
    assert.ok(points.every(item=>item.sourceStageIds.at(-1)===item.after.id));
    assert.ok(points.every(item=>!island.stages.some(stage=>stage.id===item.id)));
  }
  assert.ok(checkpointsFor(worldIslands.find(island=>island.id==='e1'))[0].sourceStageIds.includes('e1.forest'));
});

test('delivery omits secrets, checks the current release state and ignores client purchase flags',async()=>{
  const rows=Array.from({length:10},(_,i)=>({id:'e1.forest:'+i,stageId:'e1.forest',fingerprint:'version',
    payload:{id:'e1.forest:'+i,type:'number',question:'1＋1',prompt:'答え',answer:'2',alternatives:['02'],
      steps:['protected'],explanation:'基本',clock:{start:0,end:1,read:false}}}));
  let active=true;
  let time=1;
  const service=liveQuestionService({
    findCandidates:async ({premium})=>{ assert.equal(premium,false); return rows; },
    findCurrent:async ({id,readyOnly})=>{assert.equal(readyOnly,true);return active?rows.find(row=>row.id===id):undefined;},
    now:()=>time,
  });
  await assert.rejects(service.start({mode:'daily',skills:['e1.addition'],premium:true}),{status:403});
  const {token,questions}=await service.start({mode:'checkpoint',stageId:'e1.checkpoint1',premium:true});
  assert.ok(questions.every(card=>!('answer' in card) && !('alternatives' in card) && !('steps' in card) && !('end' in card.clock)));
  const first={token,id:questions[0].id,answer:'２'};
  await assert.rejects(service.grade({...first,id:questions[1].id}),{status:409});
  const score=await service.grade(first);
  assert.equal(score.correct,true);
  assert.equal('steps' in score,false);
  assert.deepEqual(await service.grade(first),score);
  await assert.rejects(service.grade({...first,answer:'4'}),{status:409});
  active=false;
  await assert.rejects(service.grade({...first,id:questions[1].id}),{status:404});
  time+=31*60*1000;
  await assert.rejects(service.grade(first),{status:410});
});
