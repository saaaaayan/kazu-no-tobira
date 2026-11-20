import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';
import {preschoolStageMapInfo} from '../src/domain/preschoolStageMapInfo.ts';

const island=worldIslands.find(g=>g.id==='preschool');
const find=n=>island?.stages.find(s=>s.id==='preschool.n'+String(n).padStart(2,'0'));
const bank=n=>{const stage=find(n);assert.ok(stage,'stage '+n);return uiPreviewBank(stage);};
const values=['あか','あお','おなじ'];

test('stages 34 and 35 compare length and size by visible dimensions without rotating shapes',()=>{
  for(const [num,metric] of [[34,'length'],[35,'size']]){
    const problems=bank(num);
    assert.equal(problems.length,10);
    const distinct=new Set();
    let equal=0,unequal=0;
    for(const q of problems){
      assert.equal(q.diagram?.kind,'magnitudeCompare',q.id);
      assert.equal(q.diagram.metric,metric,q.id);
      const {first,second}=q.diagram;
      assert.ok(first>=1&&first<=4&&second>=1&&second<=4,q.id);
      distinct.add(first+','+second);
      const lookingForMore=metric==='length'?q.question.includes('ながい'):q.question.includes('おおきい');
      const winner=first===second?'おなじ':
        lookingForMore?(first>second?'あか':'あお'):(first<second?'あか':'あお');
      assert.equal(q.answer,winner,q.id);
      if(first===second)equal++;else unequal++;
      assert.deepEqual(new Set(q.choices),new Set(values),q.id);
      assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
      assert.equal(q.hints.length,3,q.id);
      assert.ok(q.hints.every(h=>h.length>=5),q.id);
      assert.ok(!/まわす|かいてん|くるっと/u.test(q.question),q.id);
    }
    assert.equal(distinct.size,10);
    assert.ok(equal>=1&&unequal>=1);
  }
  const view=readFileSync(new URL('../src/components/QuestionSupport.tsx',import.meta.url),'utf8');
  assert.match(view,/testID="preschool-magnitude-compare"/u);
  assert.match(view,/const extent=length\?42\+item.amount\*38:24\+item.amount\*22/u);
  assert.match(view,/testID=\{'preschool-magnitude-'\+item.label\}/u);
  assert.match(view,/magnitudeRow:\{flexDirection:'row',alignItems:'center'/u);
});

test('stage 46 combines two visible groups to find a total within ten',()=>{
  for(const q of bank(46)){
    assert.equal(q.diagram?.kind,'countingBoard',q.id);
    assert.equal(q.diagram.arrangement,'side-by-side',q.id);
    assert.deepEqual(q.diagram.rows.map(row=>row.label),['はじめ','あとから'],q.id);
    const a=q.diagram.rows[0].tokens.length,b=q.diagram.rows[1].tokens.length;
    assert.ok(a>=1&&b>=1&&a+b<=10,q.id);
    assert.equal(q.answer,String(a+b),q.id);
    assert.match(q.explanation,/あわせて/u,q.id);
  }
});

test('stage 47 splits an illustrated whole into two named boxes',()=>{
  for(const q of bank(47)){
    assert.equal(q.diagram?.kind,'countingBoard',q.id);
    assert.equal(q.diagram.arrangement,'side-by-side',q.id);
    assert.deepEqual(q.diagram.rows.map(row=>row.label),['ひだりの はこ','みぎの はこ'],q.id);
    const a=q.diagram.rows[0].tokens.length,b=q.diagram.rows[1].tokens.length;
    assert.ok(a>0&&b>0&&a+b<=10,q.id);
    assert.equal(q.answer,String(b),q.id);
    assert.match(q.explanation,/ぜんぶで/u,q.id);
  }
});

test('stage 49 equalizes two groups with one additional object, keeping both-side counts independent',()=>{
  for(const q of bank(49)){
    assert.equal(q.diagram?.kind,'countingBoard',q.id);
    assert.equal(q.diagram.arrangement,'side-by-side',q.id);
    const a=q.diagram.rows[0].tokens.length,b=q.diagram.rows[1].tokens.length;
    assert.equal(Math.abs(a-b),1,q.id);
    assert.equal(q.answer,a<b?'ひだり':'みぎ',q.id);
    assert.deepEqual(new Set(q.choices),new Set(['ひだり','みぎ']),q.id);
    assert.equal(q.choices.length,2,q.id);
    assert.match(q.question,/どっちに 1こ おくと おなじ かずに なる/u);
    assert.match(q.explanation,/おなじ/u);
  }
});

test('renamed learning targets match the playable banks and reach review checkpoints',()=>{
  for(const [n,word] of [[34,'ながい'],[35,'おおきさ'],[46,'あわせ'],[47,'わけ'],[49,'おなじ']]){
    const stage=find(n);assert.ok(stage);
    assert.ok(preschoolStageMapInfo(stage).goal.includes(word),n);
    assert.equal(bank(n).length,10);
  }
  const c7=uiPreviewPreschoolCheckpoint(7,()=>.4);
  assert.equal(c7.filter(q=>q.id.includes('preschool.n34')).length,2);
  assert.equal(c7.filter(q=>q.id.includes('preschool.n35')).length,2);
  const c10=uiPreviewPreschoolCheckpoint(10,()=>.4);
  for(const n of [46,47,49])assert.equal(c10.filter(q=>q.id.includes('preschool.n'+n)).length,2);
  const s50=bank(50);
  assert.ok(s50.some(q=>q.diagram?.kind==='magnitudeCompare'));
  assert.ok(s50.some(q=>q.explanation.includes('あわせて')));
  assert.ok(s50.some(q=>q.explanation.includes('ぜんぶで')));
});
