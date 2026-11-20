import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const island=worldIslands.find(g=>g.id==='preschool');
const stage=n=>island?.stages.find(s=>s.id==='preschool.n'+String(n).padStart(2,'0'));

test('stage 34 asks children to transfer an actual rotation, not merely name the triangle',()=>{
  const shapeStage=stage(34);
  assert.ok(shapeStage);
  const questions=uiPreviewBank(shapeStage);
  assert.equal(questions.length,10);
  assert.equal(new Set(questions.map(q=>q.question)).size,10);
  const orientation=['▲','▶','▼','◀'];
  const shifts=new Set();
  for(const q of questions){
    const matched=q.question.match(/^おてほん：([▲▶▼◀]) → ([▲▶▼◀])\nおなじように まわすと？　([▲▶▼◀]) → ？$/u);
    assert.ok(matched,'worked example and new orientation are both present: '+q.id+' '+q.question);
    const [,exampleFrom,exampleTo,from]=matched;
    assert.notEqual(exampleFrom,from,'the new turn must not simply copy the example');
    const shift=(orientation.indexOf(exampleTo)-orientation.indexOf(exampleFrom)+4)%4;
    assert.ok([1,2,3].includes(shift),q.id);
    shifts.add(shift);
    const expected=orientation[(orientation.indexOf(from)+shift)%4];
    assert.equal(q.answer,expected,q.id);
    assert.ok(q.choices?.length===3);
    assert.ok(q.choices?.every(choice=>orientation.includes(choice)),q.id);
    assert.equal(q.choices.filter(choice=>checkMathAnswer(q,choice)).length,1,q.id);
    assert.equal(q.hints.length,3,q.id);
    assert.ok(q.hints[0].includes(exampleFrom) && q.hints[0].includes(exampleTo),q.id);
    assert.ok(q.explanation.includes(from) && q.explanation.includes(expected),q.id);
    assert.notEqual(q.answer,'さんかく');
  }
  assert.deepEqual([...shifts].sort(),[1,2,3]);
});

test('preschool checkpoint 7 inherits the actual rotation puzzles from stage 34',()=>{
  const checkpoint=uiPreviewPreschoolCheckpoint(7,()=>0.4);
  assert.equal(checkpoint.length,10);
  const fromStage34=checkpoint.filter(q=>q.id.includes('preschool.n34'));
  assert.equal(fromStage34.length,2);
  assert.ok(fromStage34.every(q=>q.question.includes('おてほん：') &&
    q.choices?.includes(q.answer) && q.answer!=='さんかく'));
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
