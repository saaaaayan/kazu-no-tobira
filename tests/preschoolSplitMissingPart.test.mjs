import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const island=worldIslands.find(x=>x.id==='preschool');
const getStage=n=>island?.stages.find(x=>x.id==='preschool.n'+String(n).padStart(2,'0'));
const getBank=n=>{const stage=getStage(n);assert.ok(stage);return uiPreviewBank(stage);};

test('the second box in stage 47 is unknown; counting it directly is impossible',()=>{
  const bank=getBank(47);
  assert.equal(bank.length,10);
  for(const question of bank){
    assert.equal(question.diagram?.kind,'preschoolSplit',question.id);
    const {total,placedLeft}=question.diagram;
    assert.equal(question.answer,String(total-placedLeft),question.id);
    assert.ok(total>placedLeft&&total<=10,question.id);
    assert.ok(question.choices?.includes(question.answer),question.id);
    assert.equal(question.choices.filter(c=>checkMathAnswer(question,c)).length,1,question.id);
    assert.ok(question.question.includes('ぜんぶで '+total+'こ'),question.id);
    assert.ok(question.question.includes('ひだりの はこに '+placedLeft+'こ'),question.id);
    assert.ok(question.question.includes('みぎには いくつ はいる？'),question.id);
    assert.ok(!question.question.includes('みぎの はこに '+(total-placedLeft)+'こ'),question.id);
    assert.ok(question.hints?.length===3,question.id);
    assert.match(question.hints[2],/まだ はこに はいって いない ぶん/u,question.id);
  }
});

test('stage 50 and checkpoint 10 reuse the corrected partition task',()=>{
  const final=getBank(50);
  const partitions=final.filter(q=>q.diagram?.kind==='preschoolSplit');
  assert.equal(partitions.length,2);
  for(const q of partitions)assert.equal(q.answer,String(q.diagram.total-q.diagram.placedLeft),q.id);
  const checkpoint=uiPreviewPreschoolCheckpoint(10,()=>0.42);
  assert.equal(checkpoint.length,10);
  const stage47=checkpoint.filter(q=>q.id.includes('preschool.n47'));
  assert.equal(stage47.length,2);
  for(const q of stage47){
    assert.equal(q.diagram?.kind,'preschoolSplit',q.id);
    assert.equal(q.answer,String(q.diagram.total-q.diagram.placedLeft),q.id);
  }
});

test('right box is a question mark until grading; feedback reveals exactly the missing toys',()=>{
  const view=readFileSync(new URL('../src/components/QuestionSupport.tsx',import.meta.url),'utf8');
  const game=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');
  assert.match(view,/if \(diagram.kind === 'preschoolSplit'\) \{/u);
  assert.match(view,/const remaining=diagram.total-diagram.placedLeft/u);
  assert.match(view,/const solved=phase==='solution'/u);
  assert.match(view,/testID="preschool-split-whole"/u);
  assert.match(view,/testID="preschool-split-left-box"/u);
  assert.match(view,/testID="preschool-split-hidden-right-box"/u);
  assert.match(view,/solved\s*\? <View style=\{styles.splitTokens\}>\{toys\(remaining\)\}<\/View>\s*: <Text style=\{styles.splitUnknown\}>？<\/Text>/u);
  assert.match(view,/はこに わける/u);
  assert.match(game,/diagram && !round.feedback && \(/u);
  assert.match(game,/\(countingGuide \|\| diagram\?\.kind==='preschoolSplit'\) && diagram &&/u);
  assert.match(game,/<QuestionDiagram diagram=\{diagram\} phase="solution"\/>/u);
});
