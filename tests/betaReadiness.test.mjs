import assert from 'node:assert/strict';
import test from 'node:test';
import { betaReadiness } from '../server/beta-readiness.mjs';
import { worldIslands } from '../src/domain/worldCatalog.ts';

test('beta counts only playable ready questions and calculates shortages per stage',async()=>{
  const island=worldIslands[0];
  const [first,second,third]=island.stages;
  const valid={type:'choice',question:'どれが 2 かな？',choices:['1','2'],answer:'2',
    explanation:'2だよ。',hints:['かずに ちゅうもく。','1の つぎは？','ひとつ ふやそう。'],
    steps:[{title:'かぞえかた',body:'1の 次は 2。'}]};
  const rows=[
    {id:first.id,island:island.id,kind:first.kind,registered:12,verified:0,ready:12,payloads:Array.from({length:12},()=>valid)},
    {id:second.id,island:island.id,kind:second.kind,registered:12,verified:1,ready:11,payloads:[
      ...Array.from({length:9},()=>valid),{...valid,choices:['1','2','２']},{...valid,hints:['同じ','同じ','同じ']},
    ]},
    {id:third.id,island:'wrong-island',kind:third.kind,registered:1,verified:0,ready:1,payloads:[valid]},
  ];
  const totals=await betaReadiness({query:async()=>({rows})});
  assert.equal(totals.stageCount,1040);
  assert.equal(totals.target,10400);
  assert.equal(totals.registered,25);
  assert.equal(totals.verified,1);
  assert.equal(totals.ready,24);
  assert.equal(totals.playable,21);
  assert.equal(totals.complete,1);
  assert.equal(totals.missing,10381);
  assert.equal(totals.inventoryReady,false);
  assert.equal(totals.stages.find(stage=>stage.stageId===third.id).present,false);
});
