import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {shouldAutoGradePreschoolChoice} from '../src/domain/preschoolAnswerFlow.ts';

const preschool=worldIslands.find(g=>g.id==='preschool');
const source=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('every choice question from preschool stage 16 through 65 is graded on the tapped choice',()=>{
  assert.ok(preschool);
  assert.equal(preschool.stages.length,65);
  let checked=0;
  for(const stage of preschool.stages.slice(15)){
    assert.ok(stage.order>=15,stage.id);
    const bank=uiPreviewBank(stage);
    assert.equal(bank.length,10,stage.id);
    for(const q of bank){
      assert.equal(q.type,'choice',q.id);
      assert.equal(shouldAutoGradePreschoolChoice(stage,q.type,false,
        Boolean(q.preschoolTrace||q.preschoolNumberMatch)),true,q.id);
      checked++;
    }
  }
  assert.equal(checked,500);
});

test('stages 1–15, handwriting, interactive matching and admin review are not switched to one-tap choice mode',()=>{
  assert.ok(preschool);
  for(const stage of preschool.stages.slice(0,15)){
    assert.equal(shouldAutoGradePreschoolChoice(stage,'choice',false,false),false,stage.id);
  }
  const stage16=preschool.stages[15];
  assert.equal(shouldAutoGradePreschoolChoice(stage16,'number',false,false),false);
  assert.equal(shouldAutoGradePreschoolChoice(stage16,'choice',true,false),false);
  assert.equal(shouldAutoGradePreschoolChoice(stage16,'choice',false,true),false);
  assert.equal(shouldAutoGradePreschoolChoice(undefined,'choice',false,false),false);
  const other=worldIslands.find(g=>g.id==='e1').stages[15];
  assert.equal(shouldAutoGradePreschoolChoice(other,'choice',false,false),false);
});

test('preschool checkpoint reviews from stages 16–20 onward also use one-tap choices, but earlier checks keep their behavior',()=>{
  assert.ok(preschool);
  for(let checkpoint=1;checkpoint<=10;checkpoint++){
    const after=preschool.stages[checkpoint*5-1];
    const round=uiPreviewPreschoolCheckpoint(checkpoint,()=>.4);
    assert.equal(round.length,10);
    for(const question of round){
      const auto=shouldAutoGradePreschoolChoice(after,question.type,false,
        Boolean(question.preschoolTrace||question.preschoolNumberMatch));
      if(checkpoint>=4)assert.equal(auto,true,question.id);
      else assert.equal(auto,false,question.id);
    }
  }
});

test('tap submits the clicked option directly and opens feedback without a second answer-check tap',()=>{
  assert.match(source,/shouldAutoGradePreschoolChoice\(\s*round\?\.stage,question\?\.type,Boolean\(review\)/);
  assert.match(source,/if\(autoGradePreschoolChoice\)\{\s*\/\/ Read the tapped option/);
  assert.match(source,/void submit\(option\);/);
  assert.match(source,/const submittedAnswer = selectedAnswer \?\? answer;/);
  assert.match(source,/if \(selectedAnswer !== undefined\) setAnswer\(selectedAnswer\);/);
  assert.match(source,/!autoTraceEnabled && !autoGradePreschoolChoice && <GameButton/);
  assert.match(source,/setRound\(\{ \.\.\.round, problems, correct: newCorrect, results: \[\.\.\.round\.results, result\], feedback: result \}\)/);
});

test('after feedback, next-question and final-result navigation remain manual',()=>{
  assert.match(source,/<GameButton gold label=\{round\.index\+1===round\.problems\.length\?'けっかを みる':'つぎの もんだいへ'\} onPress=\{advance\}\/>/);
  assert.match(source,/function advance\(\) \{\s*if \(!round \|\| !round\.feedback\) return;/);
  assert.doesNotMatch(source,/setTimeout\(\(\)=>advance\(\)/);
});
