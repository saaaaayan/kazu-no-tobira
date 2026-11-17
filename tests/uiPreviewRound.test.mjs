import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMathAnswer } from '../src/domain/mathAnswer.ts';
import { uiPreviewBank, uiPreviewRound } from '../src/domain/uiPreviewRound.ts';
import { allWorldStages } from '../src/domain/worldCatalog.ts';

const expected = ['e1.forest','e1.n06','preschool.n01','preschool.n02','preschool.n03','preschool.n04','preschool.n05'];
test('public prototype exposes exactly preschool 01–05 and the original elementary demos',()=>{
  const playable=allWorldStages.map(stage=>[stage,uiPreviewRound(stage)]).filter(([,round])=>round.length);
  assert.deepEqual(playable.map(([stage])=>stage.id).sort(),expected);
  for (const [stage,round] of playable) {
    assert.equal(round.length,10);
    assert.equal(new Set(round.map(q=>q.id)).size,10);
    assert.ok(round.every(question=>question.id.startsWith('ui-preview-'+stage.id+'-')));
    assert.ok(round.every(question=>checkMathAnswer(question,question.answer)));
    assert.deepEqual(uiPreviewRound({...stage,kind:'extra'}),[]);
    assert.deepEqual(uiPreviewRound({...stage,family:'unknown'}),[]);
    if (stage.gradeId==='preschool') {
      assert.ok(round.every(q=>q.diagram.kind==='countingBoard'));
      assert.ok(round.every(q=>!/[＋+＝=]/.test(q.question)));
    } else assert.ok(round.every(q=>Number(q.answer)<=9));
  }
});

test('preschool 02–05 share the correct count with diagram and targeted token',()=>{
  for(let index=2;index<=5;index++){
    const id='preschool.n0'+index;
    const stage=allWorldStages.find(item=>item.id===id);
    const questions=uiPreviewBank(stage);
    assert.equal(questions.length,10);
    assert.equal(new Set(questions.map(q=>q.question)).size,10,'ten distinct questions per stage');
    for (const q of questions) {
      const diagram=q.diagram;
      const tokens=diagram.rows.flatMap(row=>row.tokens);
      const matches=tokens.filter(token=>!diagram.targetToken || token===diagram.targetToken);
      assert.equal(Number(q.answer),matches.length,q.id);
      assert.equal(q.choices.filter(value=>checkMathAnswer(q,value)).length,1,q.id);
      assert.equal(q.hints.length,3,q.id);
      assert.ok(q.explanation.length>5);
      assert.ok(q.steps.some(step=>step.title==='くわしく しる'));
      if(index===3) assert.deepEqual(diagram.rows.map(row=>row.tokens.length),[5,Number(q.answer)-5]);
      if(index===4){
        assert.ok(diagram.targetToken);
        assert.ok(tokens.some(token=>token!==diagram.targetToken));
      }
      if(index===5){
        const before=diagram.layoutComparison?.beforeRows;
        const after=diagram.rows.map(row=>row.tokens.length);
        assert.ok(before,'stage 05 must visibly rearrange the same items');
        assert.equal(before.reduce((sum,n)=>sum+n,0),Number(q.answer),q.id);
        assert.equal(after.reduce((sum,n)=>sum+n,0),Number(q.answer),q.id);
        assert.notDeepEqual(before,after,'before and after must have different rows');
        assert.match(q.question,/ばしょを かえた あとの/u);
        assert.match(q.prompt,/したの えに/u);
        assert.notEqual(diagram.layoutComparison.before,diagram.layoutComparison.after);
      }
    }
  }
});
