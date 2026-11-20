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
      assert.ok(['choice','number'].includes(q.type),q.id);
      if(q.type==='choice'){
        assert.equal(q.choices.length,3,q.id);
        assert.equal(new Set(q.choices).size,3,q.id);
        assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
      }else{
        assert.ok(/^\d+$/u.test(q.answer),q.id);
        assert.equal(q.choices,undefined,q.id);
      }
      assert.ok(checkMathAnswer(q,q.answer),q.id);
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
    const isCount=q.question.includes('いくつ');
    const askMore=q.question.includes('おおい');
    const expected=isCount?String(rows.find(r=>q.question.startsWith(r.label))?.count):
      rows[counts.indexOf(askMore?Math.max(...counts):Math.min(...counts))].label;
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
      if(q.type==='choice')assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
      else assert.ok(checkMathAnswer(q,q.answer),q.id);
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

test('no first-grade round repeats the same illustrated task within one stage',()=>{
  let keypadExercises=0;
  for(const stage of stages){
    const items=uiPreviewBank(stage);
    const signatures=items.map(q=>JSON.stringify({
      text:q.question,diagram:q.diagram,clock:q.clock,answer:q.answer
    }));
    assert.equal(new Set(signatures).size,10,'duplicate learning task in '+stage.id);
    keypadExercises+=items.filter(q=>q.type==='number').length;
  }
  assert.ok(keypadExercises>=30,'short equations must include typed number entry');
});

test('the 10-number lessons never ask children about numbers above ten',()=>{
  const numberOrder=uiPreviewBank(stages[3]);
  assert.equal(numberOrder.length,10);
  for(const q of numberOrder){
    assert.equal(q.diagram?.kind,'gradeOneNumberLine',q.id);
    assert.ok(q.diagram.start>=0&&q.diagram.end<=10,q.id);
    assert.ok(Number(q.answer)<=10,q.id);
  }
  const hundredLine=uiPreviewBank(stages[37]);
  for(const q of hundredLine){
    assert.equal(q.diagram?.kind,'gradeOneNumberLine',q.id);
    assert.ok(q.diagram.end<=100&&q.diagram.hidden<=100,q.id);
  }
  const hundred=uiPreviewBank(stages[35]);
  assert.ok(hundred.some(q=>q.answer==='100'),'10 tens must reach 100');
});

test('11–15 and 16–18 borrowing topics stay in range and really require borrowing',()=>{
  for(const [index,min,max] of [[32,11,15],[33,16,18]]){
    const stage=stages[index];
    for(const q of uiPreviewBank(stage)){
      assert.equal(q.diagram?.kind,'borrowTen',q.id);
      const {total,used}=q.diagram;
      assert.ok(total>=min&&total<=max,q.id);
      assert.ok(used>total%10&&used<=9,q.id+' must borrow ones from ten');
      assert.ok(checkMathAnswer(q,q.answer),q.id);
      assert.ok(q.explanation.includes(String(total-used)),q.id);
    }
  }
});

test('each carry-addition stage has different exercises and teaches the ten bridge',()=>{
  const signatures=new Set();
  for(const stage of stages.slice(25,30)){
    const cards=uiPreviewBank(stage);
    assert.equal(cards.length,10,stage.id);
    for(const q of cards){
      assert.ok(q.diagram?.kind==='tenFrame',q.id);
      assert.ok(q.diagram.first+q.diagram.second>10,q.id);
      assert.ok(q.diagram.first+q.diagram.second<=20,q.id);
      assert.ok(q.hints.some(h=>h.includes('10')),q.id);
      const signature=JSON.stringify([q.question,q.answer]);
      assert.ok(!signatures.has(signature),q.id+' repeats an earlier carry calculation');
      signatures.add(signature);
    }
  }
});

test('every geometry and picture-graph exercise is grounded in its visible shapes and counts',()=>{
  for(let stageNo=41;stageNo<=45;stageNo++){
    for(const q of uiPreviewBank(stages[stageNo-1])){
      assert.equal(q.diagram?.kind,'gradeOneShapes',q.id);
      const symbols=q.diagram.symbols;
      assert.ok(symbols.length>=3&&symbols.length<=4,q.id);
      if(q.question.includes('いくつ')){
        const target=q.question.includes('●')?'●':q.question.includes('▲')?'▲':'■';
        assert.equal(q.answer,String(symbols.filter(symbol=>symbol===target).length),q.id);
      }
    }
  }
  const graphs=uiPreviewBank(stages[48]);
  assert.equal(new Set(graphs.map(q=>JSON.stringify(q.diagram))).size,10);
  assert.ok(graphs.some(q=>/いくつ/.test(q.question)),'a data chart also needs counting');
  assert.ok(graphs.some(q=>/おおい/.test(q.question)));
  assert.ok(graphs.some(q=>/すくない/.test(q.question)));
});

test('the final grade-one review mixes counting, calculations, shapes, time and measurement',()=>{
  const cards=uiPreviewBank(stages[49]);
  const kinds=new Set(cards.map(q=>q.diagram?.kind??(q.clock?'clock':null)));
  for(const kind of ['magnitudeCompare','gradeOneCapacity','gradeOneShapes','gradeOnePictureGraph','tenFrame','takeAway','clock']){
    assert.ok(kinds.has(kind),'review missing: '+kind);
  }
});
