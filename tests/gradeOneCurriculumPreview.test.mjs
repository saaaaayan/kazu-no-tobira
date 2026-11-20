import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands,allWorldStages} from '../src/domain/worldCatalog.ts';
import {gradeOnePreviewStageInfo,gradeOnePreviewUnits} from '../src/domain/gradeOnePreviewCurriculum.ts';
import {uiPreviewBank,uiPreviewRound,uiPreviewGradeOneCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const grade=worldIslands.find(g=>g.id==='e1');
const stages=grade.stages.filter(stage=>stage.kind==='normal');
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('grade one covers all official four mathematics domains in a 50-stage ordered curriculum',()=>{
  assert.equal(stages.length,50);
  assert.equal(gradeOnePreviewUnits.length,10);
  const required=['数と計算','図形','測定・データ'];
  const domains=new Set(gradeOnePreviewUnits.map(unit=>unit.domain));
  for(const name of required)assert.ok(domains.has(name),name);
  const goals=stages.map(s=>gradeOnePreviewStageInfo(s));
  assert.ok(goals.every(Boolean));
  assert.ok(goals.every(item=>item.title&&item.goal&&item.unit&&item.domain));
  assert.equal(new Set(goals.map(g=>g.title)).size,50,'every map pin has a distinct learning goal');
  assert.deepEqual(stages.slice(40,50).map(s=>gradeOnePreviewStageInfo(s).title),[
    'まるい かたち','さんかく・しかく','かたちを くみあわせる',
    'かたちの ならび','かたちあそび まとめ',
    'ながさを くらべよう','かさを くらべよう','とけいを よもう',
    'えグラフを よもう','1ねんせいの まとめ']);
});

test('all 50 stages have ten independently gradable lessons with multi-step hints',()=>{
  assert.equal(stages.length,50);
  const ids=new Set();
  for(const [stageIndex,stage] of stages.entries()){
    const bank=uiPreviewBank(stage);
    assert.equal(bank.length,10,stage.id);
    assert.deepEqual(uiPreviewRound(stage).map(x=>x.id),bank.map(x=>x.id));
    assert.ok(bank.every(q=>q.stageId===stage.id),stage.id);
    for(const q of bank){
      assert.ok(!ids.has(q.id),q.id);
      ids.add(q.id);
      assert.equal(q.type,'choice',q.id);
      assert.equal(q.choices.length,3,q.id);
      assert.equal(new Set(q.choices).size,3,q.id);
      assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
      assert.equal(q.hints.length,3,q.id);
      assert.ok(q.hints.every(h=>h.trim().length>=8),q.id);
      assert.ok(q.explanation.length>=8,q.id);
      assert.ok(q.steps.length>=2,q.id);
      assert.ok(!/小数|分数|×|÷|面積|円周率/u.test(q.question),q.id);
      assert.equal(q.difficulty,bank.indexOf(q)<3?1:bank.indexOf(q)<8?2:3,q.id);
    }
    if(stageIndex>=40&&stageIndex<50)assert.ok(bank.every(q=>q.diagram||q.clock),stage.id);
    const unit=Math.floor(stageIndex/5),part=stageIndex%5;
    // Arithmetic units use equations; concrete 10-bond introductions,
    // counting/place-value activities and drawings are intentionally visual.
    if([1,2,5,6].includes(unit)||(unit===3&&[1,2,3].includes(part))){
      assert.ok(bank.filter(q=>q.question.includes('＝')).length>=4,
        'calculation unit should primarily use numeric expressions: '+stage.id+' '+bank.map(q=>q.question).join(' | '));
    }
  }
  assert.equal(ids.size,500);
});

test('the first-grade drawing of every number line hides exactly its correct missing number',()=>{
  let found=0;
  for(const stage of stages){
    for(const q of uiPreviewBank(stage)){
      if(q.diagram?.kind!=='gradeOneNumberLine')continue;
      const {start,end,hidden,step}=q.diagram;
      assert.ok(hidden>start&&hidden<end,q.id);
      assert.equal((hidden-start)%step,0,q.id);
      assert.equal(q.answer,String(hidden),q.id);
      assert.equal((end-start)/step,5,q.id);
      found++;
    }
  }
  assert.ok(found>=20);
});

test('length, capacity and picture graphs have math-correct answers grounded in the visible picture',()=>{
  const size=stage=>uiPreviewBank(stages[stage-1]);
  const measures=[...size(46),...size(47)];
  for(const q of measures){
    const diagram=q.diagram;
    assert.ok(['magnitudeCompare','gradeOneCapacity'].includes(diagram?.kind),q.id);
    const {first,second}=diagram;
    const askMore=/ながい|おおい/u.test(q.question);
    const expected=first===second?'おなじ':(askMore?first>second:first<second)?'あか':'あお';
    assert.equal(q.answer,expected,q.id);
  }
  for(const q of size(49)){
    assert.equal(q.diagram?.kind,'gradeOnePictureGraph',q.id);
    assert.equal(q.diagram.rows.length,3);
    const rows=q.diagram.rows;
    const counts=rows.map(r=>r.count);
    assert.equal(new Set(counts).size,3,q.id);
    const askMore=q.question.includes('おおい');
    const expected=rows[counts.indexOf(askMore?Math.max(...counts):Math.min(...counts))].label;
    assert.equal(q.answer,expected,q.id);
  }
  for(const q of size(48)){
    assert.ok(q.clock?.read,q.id);
    assert.ok([0,30].includes(q.clock.start%60),q.id);
    const half=q.clock.start%60===30;
    assert.equal(q.answer,Math.floor(q.clock.start/60)+(half?'じはん':'じ'),q.id);
    assert.ok(q.choices.every(value=>value.endsWith(half?'じはん':'じ')),q.id);
  }
});

test('every five-stage unit has a ten-question checkpoint with no unsupported stage',()=>{
  for(let checkpoint=1;checkpoint<=10;checkpoint++){
    const batch=uiPreviewGradeOneCheckpoint(checkpoint,()=>.4);
    assert.equal(batch.length,10,'checkpoint '+checkpoint);
    assert.equal(new Set(batch.map(q=>q.id)).size,10);
    const permitted=new Set(stages.slice((checkpoint-1)*5,checkpoint*5).map(x=>x.id));
    for(const q of batch){
      assert.ok(permitted.has(q.stageId),q.id+' stageId='+q.stageId+' permitted='+[...permitted].join(','));
      assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
    }
    for(const id of permitted)assert.equal(batch.filter(q=>q.stageId===id).length,2,id);
  }
});

test('the trial does not overwrite archived hundred-question banks or approve an unreviewed card',()=>{
  const player=read('src/FullAdventure.tsx');
  const catalog=read('src/domain/uiPreviewRound.ts');
  const map=read('src/components/WorldScenes780.tsx');
  assert.match(player,/if \(stage.gradeId==='e1' && stage.kind==='normal'\)/u);
  assert.match(player,/uiPreviewGradeOneCheckpoint\(item.number\)/u);
  assert.match(player,/以前の100問バンクは別途保管/u);
  assert.match(catalog,/kind==='grade-one-curriculum'/u);
  assert.match(map,/gradeOnePreviewStageInfo\(stage\)\?\.title/u);
  assert.match(map,/grade.id==='preschool'\|\|grade.id==='e1'/u);
  const bank=JSON.parse(read('public/question-banks/e1.n31.v1.json'));
  assert.equal(bank.version,1);
  assert.equal(bank.questions.length,100);
  assert.ok(bank.questions.every(q=>q.id.startsWith('e1.n31:bank1:')));
});
