import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';
import {countingTokenArt} from '../src/domain/countingTokens.ts';
import {preschoolSpatialChoiceEmoji,preschoolVerticalChoiceEmoji} from '../src/domain/preschoolSpatialChoice.ts';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const island=worldIslands.find(g=>g.id==='preschool');

test('stage 41 always shows one pictured toy above another and offers only those two pictured choices',()=>{
  assert.ok(island);
  const stage=island.stages.find(s=>s.id==='preschool.n41');
  assert.ok(stage);
  const questions=uiPreviewBank(stage);
  assert.equal(questions.length,10);
  let topCount=0,bottomCount=0;
  for(let i=0;i<questions.length;i++){
    const q=questions[i];
    assert.equal(q.diagram?.kind,'countingBoard',q.id);
    assert.equal(q.diagram?.arrangement,'vertical-position',q.id);
    assert.deepEqual(q.diagram.rows.map(row=>row.label),['うえ','した'],q.id);
    assert.deepEqual(q.diagram.rows.map(row=>row.tokens.length),[1,1],q.id);
    const [top,bottom]=q.diagram.rows.map(row=>row.tokens[0]);
    assert.notEqual(top,bottom,q.id);
    const askingTop=q.question.includes('うえ');
    assert.ok(askingTop||q.question.includes('した'),q.id);
    if(askingTop)topCount++;else bottomCount++;
    assert.equal(q.answer,countingTokenArt[askingTop?top:bottom][1],q.id);
    assert.deepEqual(new Set(q.choices),
      new Set([countingTokenArt[top][1],countingTokenArt[bottom][1]]),q.id);
    assert.equal(q.choices.length,2,q.id);
    assert.equal(q.choices.filter(x=>checkMathAnswer(q,x)).length,1,q.id);
    assert.equal(q.hints.length,3,q.id);
    assert.ok(q.hints.every(h=>h.length>=5),q.id);
    for(const choice of q.choices){
      const emoji=preschoolVerticalChoiceEmoji(q.diagram,choice);
      assert.ok(emoji,'every answer has a matching picture: '+q.id+' '+choice);
      assert.equal(emoji,countingTokenArt[choice===countingTokenArt[top][1]?top:bottom][0],q.id);
    }
  }
  assert.equal(topCount,5);
  assert.equal(bottomCount,5);
});

test('checkpoint containing stage 41 preserves its correct vertical picture metadata',()=>{
  const checkpoint=uiPreviewPreschoolCheckpoint(9,()=>0.45);
  assert.equal(checkpoint.length,10);
  const upDown=checkpoint.filter(q=>q.id.includes('preschool.n41'));
  assert.equal(upDown.length,2);
  assert.ok(upDown.every(q=>q.diagram?.kind==='countingBoard' &&
    q.diagram?.arrangement==='vertical-position' && q.choices?.length===2));
});

test('vertical position scenes stay above and below, and do not apply counting taps',()=>{
  const components=src('src/components/QuestionSupport.tsx');
  const bank=src('src/domain/questionBank.ts');
  assert.match(bank,/arrangement\?: 'side-by-side' \| 'position-row' \| 'vertical-position'/);
  assert.match(components,/const verticalPosition=diagram.arrangement==='vertical-position' && diagram.rows.length===2/);
  assert.match(components,/testID=\{sideBySide\?'counting-left-right-layout':verticalPosition\?'counting-up-down-layout':undefined\}/);
  assert.match(components,/row===0\?'counting-up-scene':'counting-down-scene'/);
  assert.match(components,/verticalPositionCountingGroups:\{gap:12,alignItems:'center',paddingVertical:5\}/);
  assert.match(components,/verticalPositionCountingGroup:\{width:'100%',maxWidth:340/);
  assert.match(components,/const interactive=!positionRow && !verticalPosition/);
  assert.match(components,/justifyContent:verticalPosition\?'center'/);
});

test('answer buttons display large matching emojis with kana labels without changing grading',()=>{
  const game=src('src/FullAdventure.tsx');
  assert.match(game,/import \{ preschoolSpatialChoiceEmoji \} from '\.\/domain\/preschoolSpatialChoice';/);
  assert.match(game,/const spatialPictureChoices=Boolean\(diagram\?\.kind==='countingBoard' &&/);
  assert.match(game,/\{spatialPictureChoices \? \(/);
  assert.match(game,/\{preschoolSpatialChoiceEmoji\(diagram,option\)\}/);
  assert.match(game,/<Text style=\{styles.verticalPictureChoiceName\}>\{option\}<\/Text>/);
  assert.match(game,/verticalPictureChoiceEmoji:\{fontSize:54,lineHeight:70,textAlign:'center'\}/);
  assert.match(game,/onPress=\{\(\)=>void submit\(option\)\}/);
  assert.equal(preschoolVerticalChoiceEmoji(undefined,'くま'),undefined);
});
