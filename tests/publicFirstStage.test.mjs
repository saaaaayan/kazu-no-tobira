import assert from 'node:assert/strict';
import test from 'node:test';
import { uiPreviewBank, uiPreviewRound, uiPreviewSampleKind } from '../src/domain/uiPreviewRound.ts';
import { countingTokenArt, preschoolCountingTokens } from '../src/domain/countingTokens.ts';
import { checkMathAnswer } from '../src/domain/mathAnswer.ts';

const preschool={id:'preschool.n01',gradeId:'preschool',family:'count',kind:'normal'};
const otherPreschool={...preschool,id:'preschool.n02'};
const addition={id:'e1.forest',gradeId:'e1',family:'addition',kind:'normal'};

function seededRandom(seed){
  let state=seed>>>0;
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/0x100000000;
  };
}

test('the public preschool preview bank contains 100 distinct illustrated counting questions',()=>{
  assert.equal(uiPreviewSampleKind(preschool),'counting');
  const bank=uiPreviewBank(preschool);
  assert.equal(bank.length,100);
  assert.equal(new Set(bank.map(q=>q.id)).size,100);
  assert.equal(preschoolCountingTokens.length,34);
  assert.equal(new Set(preschoolCountingTokens).size,34);
  const pictures=new Set();
  const visualQuestions=new Set();
  const answerCounts={'1':0,'2':0,'3':0};
  for(const q of bank){
    assert.equal(q.skillId,'preschool.objects');
    assert.equal(q.format,'counting');
    assert.equal(q.type,'choice');
    assert.equal(q.diagram?.kind,'countingBoard');
    assert.equal(q.diagram?.guide,true);
    assert.equal(q.diagram.rows.length,1);
    const row=q.diagram.rows[0];
    assert.equal(row.label,undefined);
    assert.ok(row.tokens.length>=1 && row.tokens.length<=3);
    assert.ok(row.tokens.every(token=>token===row.tokens[0]));
    const token=row.tokens[0];
    assert.ok(preschoolCountingTokens.includes(token));
    assert.equal(q.answer,String(row.tokens.length));
    assert.ok(checkMathAnswer(q,q.answer));
    for(const answer of q.choices){
      assert.equal(checkMathAnswer(q,answer),answer===q.answer);
    }
    assert.deepEqual(q.choices,['1','2','3']);
    assert.equal(q.hints.length,3);
    assert.ok(q.hints.every(hint=>hint.length>0 && !hint.includes(q.answer+' こ')));
    assert.ok(q.explanation.includes(q.answer+' こ'));
    assert.ok(q.question.startsWith(countingTokenArt[token][1]));
    assert.doesNotMatch(q.question,/[＋+×÷=＝]/u);
    assert.doesNotMatch(q.prompt,/たしざん|ひきざん/u);
    assert.ok(!q.question.match(/[一-龥]/u),'preschool prompt should be hiragana');
    pictures.add(token);
    const signature=token+'-'+row.tokens.length;
    assert.ok(!visualQuestions.has(signature),'duplicate visual counting task: '+signature);
    visualQuestions.add(signature);
    answerCounts[q.answer]++;
  }
  assert.equal(pictures.size,34);
  assert.deepEqual(answerCounts,{'1':34,'2':33,'3':33});
});

test('every play samples ten different pictures in randomized order with balanced answers',()=>{
  const bank=uiPreviewBank(preschool);
  const validIds=new Set(bank.map(q=>q.id));
  const sequences=new Set();
  const selections=new Set();
  for(let seed=1;seed<=80;seed++){
    const questions=uiPreviewRound(preschool,seededRandom(seed));
    assert.equal(questions.length,10);
    assert.equal(new Set(questions.map(q=>q.id)).size,10);
    assert.ok(questions.every(q=>validIds.has(q.id)));
    const pictures=questions.map(q=>q.diagram.rows[0].tokens[0]);
    assert.equal(new Set(pictures).size,10,'no repeated picture in one 10-question round');
    const answerCounts=[1,2,3].map(n=>questions.filter(q=>q.answer===String(n)).length).sort();
    assert.deepEqual(answerCounts,[3,3,4]);
    sequences.add(questions.map(q=>q.id).join('|'));
    selections.add(questions.map(q=>q.id).sort().join('|'));
  }
  assert.ok(sequences.size>50,'many playthroughs must have different orders');
  assert.ok(selections.size>50,'many playthroughs must draw different questions');
});

test('unsupported stages remain unavailable and elementary sample remains separate',()=>{
  assert.equal(uiPreviewSampleKind(otherPreschool),'preschool-sample');
  assert.equal(uiPreviewBank(otherPreschool).length,10);
  assert.equal(uiPreviewRound(otherPreschool).length,10);
  assert.deepEqual(uiPreviewRound({...otherPreschool,id:'preschool.n06'}),[]);
  assert.equal(uiPreviewSampleKind({...preschool,kind:'extra'}),undefined);
  assert.deepEqual(uiPreviewBank({...preschool,kind:'extra'}),[]);
  assert.deepEqual(uiPreviewRound({...preschool,kind:'extra'}),[]);
  assert.equal(uiPreviewSampleKind(addition),'addition');
  assert.equal(uiPreviewBank(addition).length,10);
  assert.equal(uiPreviewRound(addition).length,10);
});
