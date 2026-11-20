import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {countingTokenArt} from '../src/domain/countingTokens.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';
import {displayedChoiceOptions} from '../src/domain/choicePresentation.ts';
import {preschoolSpatialChoiceEmoji} from '../src/domain/preschoolSpatialChoice.ts';

const preschool=worldIslands.find(island=>island.id==='preschool');

test('all toy-position answer choices show the exact toy emoji from their scene',()=>{
  assert.ok(preschool);
  let checked=0;
  const bank=[...preschool.stages.flatMap(stage=>uiPreviewBank(stage)),
    ...Array.from({length:10},(_,i)=>uiPreviewPreschoolCheckpoint(i+1)).flat()];
  for(const q of bank){
    if(q.diagram?.kind!=='countingBoard'||q.diagram.arrangement!=='position-row')continue;
    assert.equal(q.diagram.rows.length,1,q.id);
    const tokens=q.diagram.rows[0].tokens;
    assert.equal(tokens.length,3,q.id);
    assert.equal(q.choices.length,3,q.id);
    const allowedNames=tokens.map(t=>countingTokenArt[t][1]);
    assert.deepEqual(new Set(q.choices),new Set(allowedNames),q.id);
    for(const option of q.choices){
      const token=tokens.find(t=>countingTokenArt[t][1]===option);
      assert.ok(token,q.id+' '+option);
      assert.equal(preschoolSpatialChoiceEmoji(q.diagram,option),countingTokenArt[token][0],q.id);
    }
    assert.equal(q.choices.filter(option=>checkMathAnswer(q,option)).length,1,q.id);
    if(q.question.includes('いちばん'))assert.match(q.question,/どれ？/u,q.id);
    checked++;
  }
  assert.ok(checked>=40,'position exercises and checkpoints must be exercised');
});

test('numeric and meaning-based choices are not incorrectly mapped to toy pictures',()=>{
  assert.equal(preschoolSpatialChoiceEmoji(undefined,'ねこ'),undefined);
  assert.equal(preschoolSpatialChoiceEmoji({kind:'magnitudeCompare',metric:'length',first:2,second:4},'ねこ'),undefined);
  const stage49=preschool.stages.find(stage=>stage.id==='preschool.n49');
  assert.ok(stage49);
  for(const q of uiPreviewBank(stage49)){
    assert.equal(preschoolSpatialChoiceEmoji(q.diagram,q.answer),undefined,q.id);
    assert.deepEqual(displayedChoiceOptions(q.choices),['ひだり','みぎ'],q.id);
    assert.deepEqual(new Set(q.choices),new Set(['ひだり','みぎ']),q.id);
    assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
    assert.equal(Math.abs(q.diagram.rows[0].tokens.length-q.diagram.rows[1].tokens.length),1,q.id);
  }
});

test('picture answer buttons use large emoji and readable small kana, with immediate grading',()=>{
  const game=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');
  assert.match(game,/diagram.arrangement==='vertical-position' \|\| diagram.arrangement==='position-row'/u);
  assert.match(game,/\{spatialPictureChoices \? \(/u);
  assert.match(game,/\{preschoolSpatialChoiceEmoji\(diagram,option\)\}/u);
  assert.match(game,/<Text style=\{styles.verticalPictureChoiceName\}>\{option\}<\/Text>/u);
  assert.match(game,/verticalPictureChoiceEmoji:\{fontSize:54,lineHeight:70,textAlign:'center'\}/u);
  assert.match(game,/onPress=\{\(\)=>void submit\(option\)\}/u);
});
