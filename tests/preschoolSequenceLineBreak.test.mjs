import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const preschool=worldIslands.find(grade=>grade.id==='preschool');
const game=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('number-order tasks in every preschool stage display one missing square on its own line',()=>{
  const checkedStages=new Set();
  let checkedQuestions=0;
  for(const stage of preschool.stages){
    const bank=uiPreviewBank(stage);
    for(const question of bank){
      if(!question.question.includes('かくれた すうじは どれ？'))continue;
      checkedStages.add(stage.id);
      checkedQuestions++;
      const lines=question.question.split('\n');
      assert.equal(lines.length,2,question.id);
      assert.match(lines[0],/^((?:\d+|□)　){2}(?:\d+|□)$/u,question.id);
      assert.equal((lines[0].match(/□/g)??[]).length,1,question.id);
      assert.equal(lines[1],'かくれた すうじは どれ？');
      assert.equal((question.question.match(/□/g)??[]).length,1,question.id);
      const items=lines[0].split('　').map(item=>item==='□'?Number(question.answer):Number(item));
      assert.deepEqual(items,[items[0],items[0]+1,items[0]+2],
        'The answer must complete a true consecutive sequence: '+question.id);
      assert.equal(question.choices.filter(choice=>checkMathAnswer(question,choice)).length,1,question.id);
    }
  }
  assert.ok(checkedQuestions>=50,'expect all ordering stage banks');
  for(const number of [16,17,18,19,20]){
    assert.ok(checkedStages.has('preschool.n'+String(number).padStart(2,'0')));
  }
  for(const number of [3,4]){
    assert.ok(checkedStages.has('preschool.x'+String(number).padStart(2,'0')));
  }
});

test('preschool game lays out the number pattern and its instruction as two separate text rows',()=>{
  assert.match(game,/question.question.includes\('\\n'\)/);
  assert.match(game,/testID="preschool-sequence-two-line-question"/);
  assert.match(game,/question.question.split\('\\n'\).map/);
  assert.match(game,/styles.preschoolSequenceNumbers/);
  assert.match(game,/styles.preschoolSequenceInstruction/);
  assert.match(game,/styles.preschoolSequenceQuestion:\{alignItems:'flex-start'/);
});
