import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewRound,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';

const game=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('ordinary button-answer problems place large horizontal choices directly under the question',()=>{
  assert.match(game,/const inlineChoice=Boolean\(question\?\.type==='choice' && !countingGuide && !numeralGuide &&/u);
  assert.match(game,/!pictureMatching && !bankQuestion\?\.preschoolTrace && !review\)/u);
  assert.match(game,/testID="kazu-inline-choice-panel"/u);
  assert.match(game,/style=\{\[styles.preschoolNumberRow,styles.inlineChoiceRow\]\}/u);
  assert.match(game,/inlineChoiceRow:\{maxWidth:560,flexWrap:'wrap'\}/u);
  assert.match(game,/preschoolNumberRow: \{ flexDirection:'row'/u);
  assert.match(game,/preschoolNumberButton: \{ flex:1, minWidth:0, minHeight:78/u);
  assert.match(game,/option.length>5&&styles.inlineChoiceLong/u);
  assert.match(game,/option.length>9&&styles.inlineChoiceVeryLong/u);
  const inline=game.slice(game.indexOf('{inlineChoice && !round.feedback'),game.indexOf('{((!countingGuide'));
  assert.match(inline,/onPress=\{\(\)=>void submit\(option\)\}/u);
  assert.match(inline,/onPress=\{showHint\}/u);
  assert.match(inline,/hints.slice\(0,round.hintLevel\)/u);
  assert.doesNotMatch(inline,/setAnswer\(option\)/u);
});

test('choice submission goes immediately to feedback, has no memo, and next question remains a manual tap',()=>{
  assert.match(game,/const submittedAnswer = selectedAnswer \?\? answer;/u);
  assert.match(game,/if \(selectedAnswer !== undefined\) setAnswer\(selectedAnswer\);/u);
  assert.match(game,/setRound\(\{ \.\.\.round, problems, correct: newCorrect, results: \[\.\.\.round.results, result\], feedback: result \}\)/u);
  assert.match(game,/\{\(\(!countingGuide && !numeralGuide && !inlineChoice\) \|\| round.feedback\) && <View/u);
  assert.match(game,/!bankQuestion\?\.preschoolTrace && question.type!=='choice' &&\s*<CalculationMemo/u);
  assert.match(game,/<GameButton gold label=\{round.index\+1===round.problems.length\?'けっかを みる':'つぎの もんだいへ'\} onPress=\{advance\}\/>/u);
  assert.doesNotMatch(game,/setTimeout\(\(\)=>advance\(\)/u);
});

test('all preschool counting and numeral choices have the same side-by-side tappable layout; matching and tracing stay distinct',()=>{
  assert.match(game,/\{countingGuide && !round.feedback && \(/u);
  assert.match(game,/testID=\{'preschool-answer-'\+option\}/u);
  assert.match(game,/preschoolNumeralChoices:\{width:'100%',maxWidth:520,gap:9,flexDirection:'row'\}/u);
  assert.match(game,/preschoolNumeralOption:\{minHeight:78,flex:1,minWidth:0/u);
  assert.match(game,/testID="preschool-connect-picture-number-panel"/u);
  assert.match(game,/<PreschoolTracePad key=\{question.id\}/u);
  const island=worldIslands.find(g=>g.id==='preschool');
  assert.equal(island.stages.length,65);
  for(const stage of island.stages){
    const round=uiPreviewRound(stage);
    assert.equal(round.length,10,stage.id);
    for(const question of round){
      assert.equal(question.type,'choice',question.id);
      assert.ok(question.choices?.length>=2,question.id);
    }
  }
  for(let number=1;number<=10;number++)assert.equal(uiPreviewPreschoolCheckpoint(number).length,10);
});
