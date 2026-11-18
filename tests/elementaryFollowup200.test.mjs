import assert from 'node:assert/strict';
import test from 'node:test';
import {elementaryFollowupBanks} from '../src/domain/elementaryFollowupBanks.ts';
import {allWorldStages} from '../src/domain/worldCatalog.ts';
import {uiPreviewRound,uiPreviewSampleKind} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

function reduce(n,d) {
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const g=gcd(n,d);
  return d/g===1?String(n/g):n/g+'/'+(d/g);
}
function recompute(q,g) {
  const text=q.question;
  if(g==='e5') {
    const m=text.match(/^(\d+\.\d+) ([×÷]) ([\d.]+) は？$/);
    assert.ok(m,q.id+' '+text);
    return Number((m[2]==='×'?Number(m[1])*Number(m[3]):Number(m[1])/Number(m[3])).toFixed(4));
  }
  if(g==='e6') {
    const m=text.match(/^(\d+)\/(\d+) ([×÷]) (\d+)\/(\d+) を約分すると？$/);
    assert.ok(m,q.id+' '+text);
    const a=Number(m[1]),b=Number(m[2]),c=Number(m[4]),d=Number(m[5]);
    return m[3]==='×'?reduce(a*c,b*d):reduce(a*d,b*c);
  }
  const match=text.match(/^(\d+)/);
  assert.ok(match,q.id+' '+text);
  const n=Number(match[1]);
  const place=g==='e2'?100:g==='e3'?1000:1000000;
  const digitPlace=g==='e2'?10:g==='e3'?100:10000;
  const digitPrompt=text.match(/の (百|千|百万|十|万)の位の数字は？$/);
  if(digitPrompt) return Math.floor(n/(digitPrompt[1]===({'e2':'百','e3':'千','e4':'百万'}[g])?place:digitPlace))%10;
  let m=text.match(/に (\d+) を足すと？/);
  if(m) return n+Number(m[1]);
  m=text.match(/から (\d+) を引くと？/);
  if(m) return n-Number(m[1]);
  m=text.match(/より (\d+) 大きい数は？/);
  if(m) return n+Number(m[1]);
  if(text.includes('の10大きい'))return n+10;
  if(text.includes('の10小さい'))return n-10;
  if(text.includes('の次の整数'))return n+1;
  if(text.includes('のひとつ前の整数'))return n-1;
  m=text.match(/を (\d+) で割った商は？/);
  if(m)return Math.floor(n/Number(m[1]));
  assert.fail('unrecognized stem '+text);
}
test('200 elementary second-to-fifth stage problems are unique, graded, correct and unit aligned',()=>{
  assert.equal(Object.keys(elementaryFollowupBanks).length,20);
  let count=0;
  for(const g of ['e2','e3','e4','e5','e6']) {
    const fullStems=new Set();
    for(let n=2;n<=5;n++){
      const id=g+'.n0'+n,stage=allWorldStages.find(x=>x.id===id);
      assert.ok(stage);
      assert.equal(stage.unitIndex,0,id+' unit');
      assert.equal(stage.kind,'normal');
      assert.equal(uiPreviewSampleKind(stage),'foundation-stage');
      const bank=elementaryFollowupBanks[id];
      assert.equal(bank.length,10,id);
      assert.equal(new Set(bank.map(x=>x.id)).size,10);
      assert.deepEqual(uiPreviewRound(stage).map(q=>q.id),bank.map(q=>q.id));
      for(const q of bank){
        assert.ok(q.id.startsWith('ui-preview-'+id+'-lesson-'));
        assert.equal(q.stageId,id);
        assert.equal(q.hints.length,3);
        assert.ok(q.hints.every(x=>x.length>=9),q.id);
        assert.ok(q.explanation.length>=10,q.id);
        assert.ok(q.detailedExplanation?.length>q.explanation.length,q.id);
        assert.equal(q.steps.length,2,q.id);
        assert.equal(q.reviewStatus,'draft');
        assert.equal(q.pedagogicalApproval,false);
        assert.equal(checkMathAnswer(q,q.answer),true,q.id);
        assert.equal(checkMathAnswer(q,String(Number(q.answer)+10000)),false,q.id);
        assert.equal(String(recompute(q,g)),q.answer,q.id);
        if(q.type==='choice'){
          assert.equal(q.choices.length,4,q.id);
          assert.equal(q.choices.filter(x=>checkMathAnswer(q,x)).length,1,q.id);
        }
        const key=q.question.normalize('NFKC').replace(/\s+/g,'');
        assert.ok(!fullStems.has(key),q.id+' repeated across unit stages');
        fullStems.add(key);count++;
      }
      assert.deepEqual(uiPreviewRound({...stage,kind:'secret'}),[]);
    }
    assert.equal(fullStems.size,40,g);
  }
  assert.equal(count,200);
});
