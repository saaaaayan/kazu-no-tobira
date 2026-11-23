import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer,isValidMathAnswer} from '../src/domain/mathAnswer.ts';
import {stage20SequenceFill,sequenceFillCorrect,sequenceFillChoices} from '../src/domain/preschoolSequenceFill.ts';

const preschool=worldIslands.find(grade=>grade.id==='preschool');
const bank=n=> {
  const stage=preschool?.stages.find(item=>item.id==='preschool.n'+String(n).padStart(2,'0'));
  assert.ok(stage);
  return uiPreviewBank(stage);
};
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('stage 19 tests predecessor/successor directly, unlike the 3-number holes in 18',()=>{
  const before=bank(18),neighbors=bank(19);
  assert.equal(before.length,10);
  assert.equal(neighbors.length,10);
  assert.ok(before.every(q=>q.question.includes('□')));
  const stems=new Set();
  for(const [index,q] of neighbors.entries()){
    assert.ok(!q.question.includes('□'),q.id);
    assert.match(q.question,/^(\d+)の (つぎ|まえ)の かずは？$/u,q.id);
    const match=q.question.match(/^(\d+)の (つぎ|まえ)/u);
    assert.ok(match);
    const origin=Number(match[1]),after=match[2]==='つぎ';
    assert.equal(after,index%2===0,q.id);
    assert.ok(origin>=1&&origin<=10,q.id);
    assert.equal(q.answer,String(origin+(after?1:-1)),q.id);
    assert.ok(q.choices?.includes(q.answer),q.id);
    assert.equal(q.choices.filter(option=>checkMathAnswer(q,option)).length,1,q.id);
    stems.add(q.question);
  }
  assert.equal(stems.size,10);
});

test('stage 20 increases in complexity: 7–10 numbers, then two gaps, then adjacent gaps',()=>{
  const questions=bank(20);
  assert.equal(questions.length,10);
  const patterns=new Set();
  for(const [index,q] of questions.entries()){
    const task=q.preschoolSequenceFill;
    assert.ok(task,q.id);
    assert.equal(q.type,'choice',q.id);
    assert.equal(q.format,'sequence',q.id);
    assert.deepEqual(task,stage20SequenceFill(index),q.id);
    assert.ok(task.length>=7&&task.length<=10,q.id);
    assert.ok(task.start>=1&&task.start+task.length-1<=10,q.id);
    assert.equal(task.missingIndices.length,index<3?1:2,q.id);
    if(index>=7)assert.equal(task.missingIndices[1],task.missingIndices[0]+1,q.id);
    else if(index>=3)assert.ok(task.missingIndices[1]>task.missingIndices[0]+1,q.id);
    assert.ok(task.missingIndices.every(i=>Number.isInteger(i)&&i>0&&i<task.length-1),q.id);
    assert.equal(task.options.length,index<3?3:4,q.id);
    assert.equal(new Set(task.options).size,task.options.length,q.id);
    assert.deepEqual(q.choices?.length,index<3?3:16,q.id);
    assert.equal(q.answer,sequenceFillCorrect(task),q.id);
    const choices=sequenceFillChoices(task);
    assert.deepEqual(new Set(q.choices),new Set(choices),q.id);
    assert.equal(choices.filter(option=>checkMathAnswer(q,option)).length,1,q.id);
    assert.ok(choices.every(option=>isValidMathAnswer(q,option)),q.id);
    assert.ok(q.hints.every(h=>!h.includes(''+q.answer)),q.id);
    patterns.add(task.start+':'+task.length+':'+task.missingIndices.join(','));
  }
  assert.equal(patterns.size,10);
  assert.ok(questions.some(q=>q.preschoolSequenceFill.start===2));
  assert.ok(questions.every(q=>!q.question.includes('あいている ところに はいる すうじは？')));
});

test('stage 20 interface has individually selectable gaps and only submits after all filled',()=>{
  const view=source('src/components/PreschoolSequenceFillPanel.tsx');
  const game=source('src/FullAdventure.tsx');
  const bankType=source('src/domain/questionBank.ts');
  assert.match(bankType,/preschoolSequenceFill\?: PreschoolSequenceFill/);
  assert.match(view,/testID="preschool-sequence-grid"/);
  assert.match(view,/testID=\{'sequence-blank-'\+slot\}/);
  assert.match(view,/testID=\{'sequence-card-'\+value\}/);
  assert.match(view,/setActive\(slot\)/);
  assert.match(view,/const complete=filled.every\(Boolean\)/);
  assert.match(view,/disabled=\{disabled\|\|!complete\}/);
  assert.match(view,/onPress=\{\(\)=>onSubmit\(filled.join\('・'\)\)\}/);
  assert.match(game,/<PreschoolSequenceFillPanel key=\{question.id\}/);
  assert.match(game,/onSubmit=\{value=>void submit\(value\)\}/);
  assert.match(game,/!pictureMatching && !sequenceFill && !bankQuestion\?\.preschoolTrace/);
  assert.match(game,/!inlineChoice && !sequenceFill\) \|\| round.feedback/);
});
