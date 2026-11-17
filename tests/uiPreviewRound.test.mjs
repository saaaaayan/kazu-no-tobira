import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMathAnswer } from '../src/domain/mathAnswer.ts';
import { uiPreviewRound } from '../src/domain/uiPreviewRound.ts';
import { allWorldStages } from '../src/domain/worldCatalog.ts';

test('only stages with a matching sample open a preview round',()=>{
  const playable=allWorldStages.map(stage=>[stage,uiPreviewRound(stage)]).filter(([,round])=>round.length);
  assert.deepEqual(playable.map(([stage])=>stage.id).sort(),['e1.forest','e1.n06','preschool.n01']);
  for (const [stage,round] of playable) {
    assert.ok(round.every(question=>question.id.startsWith('ui-preview-'+stage.id+'-')));
    assert.ok(round.every(question=>checkMathAnswer(question,question.answer)));
    assert.deepEqual(uiPreviewRound({...stage,kind:'extra'}),[]);
    assert.deepEqual(uiPreviewRound({...stage,family:'unknown'}),[]);
    if (stage.gradeId==='preschool') {
      assert.equal(round.length,10);
      assert.ok(round.every(question=>question.diagram.rows.length===1));
      assert.deepEqual([...new Set(round.map(question=>question.diagram.rows[0].tokens.length))].sort(),[1,2,3]);
      assert.ok(round.every(question=>!/[＋+＝=]/.test(question.question)));
    } else {
      assert.ok(round.every(question=>Number(question.answer)<=9));
    }
  }
});
