import assert from 'node:assert/strict';
import test from 'node:test';
import {emptyProgress} from '../src/domain/progress.ts';
import {getWorldStage} from '../src/domain/worldProgress.ts';
import {freeAccess} from '../src/domain/accessPlan.ts';
import {diagnosisCandidates, practiceItems, savePracticeAnswer, skillEvidence} from '../src/domain/studyPractice.ts';

const premium = {plan:'premium', verifiedUntil:Infinity};
const stamp='2026-11-16T00:00:00.000Z';
const formulas={
  'e1.count': [/^(\d+)/, (a,b)=>b===undefined ? a+1 : a-b],
  'e1.addition': [/^(\d+)＋(\d+)/,(a,b)=>a+b],
  'e1.subtraction': [/^(\d+)−(\d+)/,(a,b)=>a-b],
  'e2.place': [/^(\d+)/,a=>Math.floor(a/10)%10],
  'j1.signed': [/^\(−(\d+)\)＋\((-?\d+)\)/,(a,b)=>b-a],
  'j2.expression': [/^(\d+)x([−＋])(\d+)x/,(a,operator,b)=>a+(operator==='−'?-b:b)],
  'h1.factor': [/^\(x＋(\d+)\)\(x([−＋])(\d+)\)/,(a,operator,b)=>a+(operator==='−'?-b:b)],
  'h2.calculus': [/f\(x\)＝(\d+)x\^(\d+).*f'\((\d+)\)/,(a,p,x)=>a*p*x**(p-1)],
};

test('練習問題の全候補を独立に採点し、同じ問題は繰り返さない', () => {
  for (const [skill,[pattern,solve]] of Object.entries(formulas)) for (const level of [1,2]) {
    const all = practiceItems(skill,level,0,[],1000);
    assert.ok(all.length>=5,skill);
    assert.equal(new Set(all.map(q=>q.prompt)).size,all.length);
    for (const q of all) {
      const args=q.prompt.match(pattern).slice(1).map(s=>Number.isNaN(Number(s))?s:Number(s));
      if (skill==='e1.count' && level===2) args.push(Number(q.prompt.match(/(\d+)つ/)[1]));
      assert.equal(solve(...args),q.answer,q.prompt);
      assert.equal(getWorldStage(q.stageId).gradeId,skill.split('.')[0]);
      assert.equal(getWorldStage(q.stageId).family,skill.split('.')[1]);
    }
    if (all.length>=10) {
      const history=all.slice(0,5).map(q=>({problemId:q.id}));
      assert.ok(practiceItems(skill,level,0,history).every(q=>!history.some(a=>a.problemId===q.id)),skill);
    }
  }
});

test('データ不足と弱点候補を分け、複数学年にまたがる前提技能を候補にする', () => {
  const item = practiceItems('j2.expression',1,1,[])[0];
  assert.equal(savePracticeAnswer(freeAccess,emptyProgress,item,0,stamp),emptyProgress);
  let state=emptyProgress;
  for(let i=0;i<4;i++) state=savePracticeAnswer(premium,state,item,item.answer+1,stamp);
  assert.equal(skillEvidence(state)[0].status,'insufficient');
  state=savePracticeAnswer(premium,state,item,item.answer+1,stamp);
  assert.equal(skillEvidence(state)[0].status,'needs-practice');
  assert.deepEqual(diagnosisCandidates(skillEvidence(state),item.skillId).map(x=>x.skillId),['j1.signed']);
  const record=practiceItems('j1.signed',1,1,[])[0];
  for(let i=0;i<5;i++) state=savePracticeAnswer(premium,state,record,record.answer,stamp);
  assert.deepEqual(diagnosisCandidates(skillEvidence(state),item.skillId),[]);
  assert.deepEqual(state.stages,{});
  assert.equal(state.attempts.length,10);
});
