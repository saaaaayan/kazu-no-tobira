import assert from 'node:assert/strict';
import test from 'node:test';
import { uiPreviewRound,uiPreviewSampleKind } from '../src/domain/uiPreviewRound.ts';

const preschool={id:'preschool.n01',gradeId:'preschool',family:'count',kind:'normal'};
const otherPreschool={...preschool,id:'preschool.n02'};
const addition={id:'e1.forest',gradeId:'e1',family:'addition',kind:'normal'};

test('the first preschool stage has ten distinct safe horizontal counting samples',()=>{
  assert.equal(uiPreviewSampleKind(preschool),'counting');
  const questions=uiPreviewRound(preschool);
  assert.equal(questions.length,10);
  const pairs=new Set();
  for(const q of questions){
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
    assert.equal(q.answer,String(row.tokens.length));
    assert.deepEqual(q.choices,['1','2','3']);
    assert.equal(q.hints.length,3);
    assert.ok(q.hints.every(hint=>hint.length>0 && !hint.includes(q.answer+' こ')));
    assert.ok(q.explanation.includes(q.answer+' こ'));
    assert.doesNotMatch(q.question,/[＋＋×÷=＝]/u);
    assert.doesNotMatch(q.prompt,/たしざん|ひきざん/u);
    pairs.add(row.tokens[0]+'-'+row.tokens.length);
  }
  assert.equal(pairs.size,10);
});

test('unsupported island stages do not silently use unrelated samples',()=>{
  assert.equal(uiPreviewSampleKind(otherPreschool),undefined);
  assert.deepEqual(uiPreviewRound(otherPreschool),[]);
  assert.equal(uiPreviewSampleKind({...preschool,kind:'extra'}),undefined);
  assert.deepEqual(uiPreviewRound({...preschool,kind:'extra'}),[]);
  assert.equal(uiPreviewSampleKind(addition),'addition');
  assert.equal(uiPreviewRound(addition).length,10);
});
