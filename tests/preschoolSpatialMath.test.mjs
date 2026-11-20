import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const island=worldIslands.find(g=>g.id==='preschool');
const stage=n=>island?.stages.find(s=>s.id==='preschool.n'+String(n).padStart(2,'0'));

test('checkpoint 7 uses practical rope and circle comparisons, never shape rotation',()=>{
  const checkpoint=uiPreviewPreschoolCheckpoint(7,()=>0.4);
  assert.equal(checkpoint.length,10);
  for(const num of [34,35]){
    const items=checkpoint.filter(q=>q.id.includes('preschool.n'+num));
    assert.equal(items.length,2);
    assert.ok(items.every(q=>q.diagram?.kind==='magnitudeCompare'));
  }
});

test('the one-to-one snack sharing questions explicitly use two separate counting groups',()=>{
  const sharing=stage(48);
  assert.ok(sharing);
  const questions=uiPreviewBank(sharing);
  assert.equal(questions.length,10);
  for(const q of questions){
    assert.equal(q.diagram?.kind,'countingBoard',q.id);
    assert.equal(q.diagram.arrangement,'side-by-side',q.id);
    assert.deepEqual(q.diagram.rows.map(row=>row.label),['ひだり','みぎ'],q.id);
    const [toys,snacks]=q.diagram.rows.map(row=>row.tokens.length);
    const correct=toys===snacks?'ぴったり':toys>snacks?'たりない':'あまる';
    assert.equal(q.answer,correct,q.id);
  }
  const checkpoint=uiPreviewPreschoolCheckpoint(10,()=>0.4);
  assert.equal(checkpoint.filter(q=>q.id.includes('preschool.n48')).length,2);
  const view=readFileSync(new URL('../src/components/QuestionSupport.tsx',import.meta.url),'utf8');
  assert.match(view,/const tapNumber = sideBySide \? countingTapNumberInRow\(selected,id\) : countingTapNumber\(selected,id\)/u);
});
