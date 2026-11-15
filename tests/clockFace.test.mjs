import assert from 'node:assert/strict';
import test from 'node:test';
import { clockAngles, clockLabel } from '../src/domain/clockFace.ts';
import { worldStages } from '../src/domain/worldCatalog.ts';
import { generateWorldQuestions } from '../src/domain/worldQuestions.ts';

test('analog hands move through the hour and across noon', () => {
  assert.deepEqual(clockAngles(620), { minute:120, hour:310 });
  assert.deepEqual(clockAngles(730), { minute:60, hour:5 });
  assert.equal(clockLabel(710+20), '12時10分');
  assert.equal(clockLabel(15-20), '11時55分');
});

test('every clock stage generates annotated clocks and matching unique answers', () => {
  const stages = worldStages.filter(stage => stage.family === 'time');
  let checked = 0;
  let backwards = 0;
  assert.equal(stages.length, 12);
  for (const stage of stages) for (const seed of [0,1,2,3,4,5,6,7,8,9]) {
    for (const q of generateWorldQuestions(stage,seed)) {
      assert.ok(q.clock,q.id);
      const {start,end,read} = q.clock;
      if (read) assert.equal(end,start);
      else {
        const [,h,m,offset,direction] = q.question.match(/(\d+)時(\d+)分の (\d+)分(あと|まえ)/);
        assert.equal(+h*60 + +m,start);
        assert.equal(end,start+(direction==='まえ' ? -1 : 1)*Number(offset));
        if(direction==='まえ') backwards++;
      }
      assert.equal(q.answer, clockLabel(end));
      assert.equal(q.choices.filter(choice=>choice===q.answer).length,1);
      assert.match(q.hint,/長い はり/);
      assert.ok(q.explanation.includes(q.answer));
      checked++;
    }
  }
  assert.equal(checked,1200);
  assert.ok(backwards>0);
});
