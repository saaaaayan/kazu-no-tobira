import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('choice feedback fills the width of the question panel without a blank memo column',()=>{
  assert.match(app,/const choiceFeedback=Boolean\(round\?\.feedback && question\?\.type==='choice'\)/u);
  assert.match(app,/testID=\{choiceFeedback\?'choice-feedback-centered':undefined\}/u);
  assert.match(app,/choiceFeedback&&styles.choiceFeedbackWork/u);
  assert.match(app,/choiceFeedback&&styles.choiceFeedbackArea/u);
  assert.match(app,/choiceFeedbackWork: \{ alignItems: 'center' \}/u);
  assert.match(app,/choiceFeedbackArea: \{ width: '100%', alignSelf: 'stretch', padding: 0, backgroundColor: 'transparent' \}/u);
  assert.match(app,/choiceFeedbackBox: \{ borderRadius: 19, padding: 18 \}/u);
  assert.match(app,/choiceFeedback&&styles.choiceFeedbackBox/u);
  assert.match(app,/wide&&!countingGuide&&!numeralGuide&&question.type!=='choice'&&styles.workWide/u);
  assert.match(app,/wide&&!countingGuide&&!numeralGuide&&question.type!=='choice'&&styles.answerWide/u);
  assert.match(app,/!bankQuestion\?\.preschoolTrace && question.type!=='choice' &&\s*<CalculationMemo/u);
});

test('correctness and lesson content stay visible and the next question requires a tap',()=>{
  assert.match(app,/round.feedback==='incorrect' && \(pictureMatching \?/u);
  assert.match(app,/きみの こたえ：/u);
  assert.match(app,/正しい|ただしい こたえ：/u);
  assert.match(app,/question.explanation/u);
  assert.match(app,/showWorkedSolution && canReadWorkedSolution/u);
  assert.match(app,/round.feedback==='correct'&&<ComboBadge results=\{round.results\}\/>/u);
  assert.match(app,/<GameButton gold label=\{round.index\+1===round.problems.length\?'けっかを みる':'つぎの もんだいへ'\} onPress=\{advance\}\/>/u);
});
