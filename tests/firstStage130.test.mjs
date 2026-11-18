import assert from 'node:assert/strict';
import test from 'node:test';
import { allWorldStages } from '../src/domain/worldCatalog.ts';
import { firstStageLessonBanks,uiPreviewRound,uiPreviewSampleKind } from '../src/domain/uiPreviewRound.ts';
import { checkMathAnswer,isValidMathAnswer } from '../src/domain/mathAnswer.ts';

const ids=['e2.n01','e3.n01','e4.n01','e5.n01','e6.n01','j1.n01','j2.n01','j3.n01',
  'h1.n01','h2.n01','h3.n01','champion.n01','cosmos.n01'];
const outcomes={
  'e2.n01':[400+20+6,300+70+5,Math.floor(682/10)%10,Math.floor(709/100),499+1,600-1,1000/100,900+80+4,Math.max(540,504),801+10],
  'e3.n01':[4000+500+70+8,6000+300+20+9,Math.floor(8291/1000),Math.floor(5037/100)%10,9999+1,7000-1,Math.floor(8420/100),Math.floor(3204/10)%10,Math.max(4506,4560),4990+100],
  'e4.n01':[7*10000+3*1000+2*100,Math.floor(480000/10000)%10,900000+60000+5000,10000*10000,Math.floor(12345678/1e6)%10,7e6/1e6,999999+1,32e6/1e4,Math.max(5070000,5700000),1e8-1e4],
  'e5.n01':[1.2*3,.4*5,2.5*4,.6*.3,3.6/3,4.8/.6,1.25*8,.75/.25,2.4*1.5,7.2/1.2],
  'e6.n01':['1/3','1/2','1/3','1/2','2/3','5/6','2','1/2','1/3','3/2'],
  'j1.n01':[-5+8,-3-6,(-4)*(-3),18/(-6),Math.abs(-11),Math.max(-2,-7),-4+7,(-2)**3,-5+(-7),-24/(-4)],
  'j2.n01':[3+2,3-1,5-2,3*(-5),-2*3,2+5-3,4*2-3*(-1),-2+5,6-1,2-5],
  'j3.n01':[3,4,Math.sqrt(9),6/2,15/5,Math.sqrt(12/3),12/2,Math.sqrt(25),-2*4,-2+3],
  'h1.n01':[2*(-3),-2*2*3,2+3,3*4,2**3-8,3*2,-1,4,2*3,2-(-2)],
  'h2.n01':[3*2,3*3**2,-1+2,6,-4,1,1,-(2**2),-2,3*2**2],
  'h3.n01':[2,'1/4',0,1/(1-.5),0,1,3,'1/e','1/2',1],
  'champion.n01':[2**10%7,3**4%5,17**2%6,8,2026%9,7**3%10,1001%11,5**7%8,5,16],
  'cosmos.n01':[new Set([1,2,3,3,4]).size,new Set([3,5]).size,new Set([1,4,9]).size,
    new Set([4,1,0,1,4]).size,new Set([1,0,1,0]).size,2**3,3*4,7+8-3,(2*2+1)**2,2*4+3],
};
test('13 additional islands each have exactly ten playable questions with complete pedagogy and no duplicate stems',()=>{
  assert.deepEqual(Object.keys(firstStageLessonBanks).sort(),[...ids].sort());
  let total=0;
  for (const id of ids){
    const stage=allWorldStages.find(s=>s.id===id);
    assert.ok(stage,'missing stage '+id);
    assert.equal(stage.kind,'normal');
    assert.equal(stage.order,0);
    assert.equal(uiPreviewSampleKind(stage),'island-first-stage');
    const questions=firstStageLessonBanks[id];
    assert.equal(questions.length,10,id);
    assert.deepEqual(uiPreviewRound(stage).map(q=>q.id),questions.map(q=>q.id));
    assert.equal(new Set(questions.map(q=>q.id)).size,10,id);
    assert.equal(new Set(questions.map(q=>q.question.normalize('NFKC').replace(/\s/g,''))).size,10,id);
    for(const [i,question] of questions.entries()){
      assert.ok(question.skillId.startsWith(stage.gradeId+'.'),question.id);
      assert.ok(question.question.length>=6,question.id);
      assert.ok(question.explanation.length>=13,question.id);
      assert.equal(question.hints.length,3,question.id);
      assert.ok(question.hints.every(h=>h.length>=10),question.id);
      assert.ok(question.steps?.length>=2,question.id);
      assert.equal(checkMathAnswer(question,question.answer),true,question.id);
      assert.equal(isValidMathAnswer(question,question.answer),true,question.id);
      const expected=outcomes[id][i];
      if(typeof expected==='number'){
        assert.ok(Math.abs(Number(question.answer)-expected)<1e-8,
          question.id+' expected '+expected+' got '+question.answer);
      }else assert.equal(question.answer,expected,question.id);
      if(question.type==='choice'){
        assert.equal(question.choices?.length,4,question.id);
        assert.equal(new Set(question.choices).size,4,question.id);
        assert.equal(question.choices.filter(value=>checkMathAnswer(question,value)).length,1,question.id);
      }else{
        assert.equal(checkMathAnswer(question,String(Number(question.answer)+1000)),false,question.id);
      }
    }
    assert.deepEqual(uiPreviewRound({...stage,kind:'extra'}),[],id+' should not enable premium');
    total+=questions.length;
  }
  assert.equal(total,130);
});

test('ten-question rollout remains scoped to 13 specific first stages and leaves all others gated',()=>{
  for(const id of ids){
    const stage=allWorldStages.find(s=>s.id===id);
    const later=allWorldStages.find(s=>s.id===id.replace('.n01','.n02'));
    assert.ok(stage&&later);
    assert.equal(uiPreviewRound(later).length,0,'do not mark unmade lessons ready: '+later.id);
  }
});
