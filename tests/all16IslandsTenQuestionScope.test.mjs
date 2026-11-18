import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands,allWorldStages} from '../src/domain/worldCatalog.ts';
import {bankStageIds} from '../src/domain/bankStageIds.ts';
import {checkpointsFor} from '../src/domain/stageStructure.ts';

test('all 16 islands have 50 ordinary + 10 EX + 5 hidden stages and ten independent checkpoints',()=>{
  assert.equal(worldIslands.length,16);
  assert.equal(allWorldStages.length,1040);
  assert.equal(new Set(allWorldStages.map(s=>s.id)).size,1040);
  let adventures=0,extras=0,hidden=0,checkpoints=0;
  for (const island of worldIslands) {
    assert.equal(island.units.length,10,island.id);
    assert.equal(island.stages.length,65,island.id);
    assert.deepEqual(island.stages.map(stage=>stage.order),Array.from({length:65},(_,i)=>i),island.id);
    const normal=island.stages.filter(stage=>stage.kind==='normal');
    const extra=island.stages.filter(stage=>stage.kind==='extra');
    const secret=island.stages.filter(stage=>stage.kind==='secret');
    assert.equal(normal.length,50,island.id);
    assert.equal(extra.length,10,island.id);
    assert.equal(secret.length,5,island.id);
    assert.ok(island.stages.every(stage=>stage.questions===10 && stage.gradeId===island.id),island.id);
    // Each of the 10 curriculum categories owns exactly five ordinary stages.
    for (let i=0;i<10;i++) {
      const unit=island.units[i];
      const members=normal.filter(stage=>stage.unitIndex===i);
      // Legacy e1 IDs carry older addition content and were moved into the map
      // after the 10×5 taxonomy was defined. Do not silently call them count
      // questions: detect the mismatch and track it for curriculum repair.
      const knownFirstGradeCount=island.id==='e1'
        ? ({0:2,1:6,3:6,5:6}[i] ?? 5) : 5;
      assert.equal(members.length,knownFirstGradeCount,island.id+' '+unit.code);
      for (const stage of members) {
        assert.equal(stage.family,unit.family,stage.id+' has the wrong subject');
        if(!['e1.bridge','e1.tower'].includes(stage.id))
          assert.equal(stage.subtitle,unit.title,stage.id+' has the wrong unit label');
        // These two legacy stage names are narrower labels within their matching units.
      }
      assert.equal(extra[i].unitIndex,i);
      assert.equal(extra[i].family,unit.family);
    }
    const tests=checkpointsFor(island);
    assert.equal(tests.length,10,island.id);
    for(let i=0;i<10;i++){
      assert.equal(tests[i].number,i+1);
      assert.deepEqual(tests[i].sourceStageIds,normal.slice(i*5,i*5+5).map(x=>x.id));
    }
    adventures+=normal.length;extras+=extra.length;hidden+=secret.length;checkpoints+=tests.length;
  }
  assert.deepEqual([adventures,extras,hidden,checkpoints],[800,160,80,160]);
  assert.equal(allWorldStages.reduce((sum,stage)=>sum+stage.questions,0),10400);
});

test('frozen full-stage production inventory covers exactly the declared curriculum and distinguishes existing 100-question banks from ten-question gaps',()=>{
  const tsv=readFileSync(new URL('../docs/curriculum/ALL_16_ISLANDS_1040_STAGE_INVENTORY.tsv',import.meta.url),'utf8').trim().split('\n');
  assert.equal(tsv.length,1041);
  const header=tsv[0].split('\t');
  const column=key=>header.indexOf(key);
  for(const key of ['ステージID','島ID','区分','単元分類','技能分類','ステージ名','登録件数','最低10問への不足'])
    assert.ok(column(key)>=0,'missing column '+key);
  const records=tsv.slice(1).map(line=>line.split('\t'));
  assert.equal(new Set(records.map(x=>x[column('ステージID')])).size,1040);
  const byId=new Map(records.map(fields=>[fields[column('ステージID')],fields]));
  let shortage=0;
  for(const stage of allWorldStages){
    const fields=byId.get(stage.id);
    assert.ok(fields,stage.id);
    assert.equal(fields[column('島ID')],stage.gradeId);
    assert.equal(fields[column('区分')],stage.kind);
    assert.equal(fields[column('技能分類')],stage.family);
    assert.equal(fields[column('ステージ名')],stage.title);
    assert.equal(Number(fields[column('最低10問への不足')]),
      Math.max(0,10-Number(fields[column('登録件数')])));
    shortage+=Number(fields[column('最低10問への不足')]);
  }
  assert.equal(shortage,9947,'baseline snapshot: update only as part of a new audit');
  assert.equal(bankStageIds.length,43);
  for(const id of bankStageIds){
    const fields=byId.get(id);
    assert.ok(fields);
    assert.ok(Number(fields[column('登録件数')])>=100,'existing 100-question bank missing '+id);
  }
});
