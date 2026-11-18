import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {allWorldStages,worldIslands} from '../src/domain/worldCatalog.ts';
import {checkpointsFor} from '../src/domain/stageStructure.ts';
import {uiPreviewPreschoolCheckpointOne,uiPreviewBank} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const stages=Array.from({length:5},(_,i)=>'preschool.n0'+(i+1));
const makeRng=(seed)=>()=>{
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  return (seed>>>0)/4294967296;
};

test('preschool checkpoint 1 draws two distinct questions from each of the 5 preceding stages in order',()=>{
  const preschool=worldIslands.find(island=>island.id==='preschool');
  const checkpoints=checkpointsFor(preschool);
  assert.equal(checkpoints[0].id,'preschool.checkpoint1');
  assert.equal(checkpoints[0].number,1);
  assert.deepEqual(checkpoints[0].sourceStageIds,stages);
  const allowed=stages.map(id=>new Set(uiPreviewBank(allWorldStages.find(x=>x.id===id)).map(q=>q.id)));
  const fingerprints=new Set();
  for(let seed=1;seed<=40;seed++){
    const round=uiPreviewPreschoolCheckpointOne(makeRng(seed));
    assert.equal(round.length,10);
    assert.equal(new Set(round.map(q=>q.id)).size,10);
    for(let group=0;group<5;group++){
      const pair=round.slice(2*group,2*group+2);
      assert.equal(pair.length,2);
      assert.ok(pair.every(q=>q.id.startsWith('ui-preview-'+stages[group]+'-')),
        'questions must be ordered by stage 01,02,03,04,05');
      assert.ok(pair.every(q=>allowed[group].has(q.id)));
      assert.ok(Number(pair[0].answer)<=Number(pair[1].answer),
        'within each stage, use increasing counting difficulty');
      for(const q of pair){
        assert.equal(q.type,'choice');
        assert.equal(q.diagram?.kind,'countingBoard');
        assert.equal(q.diagram?.guide,true);
        assert.equal(q.hints.length,3);
        assert.ok(q.choices.includes(q.answer));
        assert.equal(q.choices.filter(choice=>checkMathAnswer(q,choice)).length,1);
        const visible=q.diagram.rows.flatMap(row=>row.tokens);
        assert.equal(Number(q.answer),visible.filter(t=>!q.diagram.targetToken||t===q.diagram.targetToken).length);
        if(q.diagram.layoutComparison){
          assert.equal(q.diagram.layoutComparison.beforeRows.reduce((a,b)=>a+b,0),Number(q.answer));
        }
      }
    }
    fingerprints.add(round.map(q=>q.id).join(','));
  }
  assert.ok(fingerprints.size>1,'each attempt should be able to draw different questions');
});

test('checkpoint 1 preview map is playable without unlocking all 5 normal stages',()=>{
  const source=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');
  assert.match(source,/const enabled=preview \? grade\.id==='preschool' && checkpoint\.number===1/);
  assert.match(source,/onPress=\{\(\)=>onCheckpoint\(checkpoint\)\}/);
  assert.match(app,/item\.id!=='preschool\.checkpoint1'/);
  assert.match(app,/const problems=uiPreviewPreschoolCheckpointOne\(\)/);
  assert.match(app,/checkpoint:\{id:item\.id,number:item\.number\}/);
  assert.match(app,/const specialRound=Boolean\(round\?\.checkpoint/);
  assert.match(app,/const nextStage = round && !round\.checkpoint/);
  assert.match(app,/round\.checkpoint \? 'かくにんテスト '/);
});
