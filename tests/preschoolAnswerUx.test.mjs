import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const code=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8').replaceAll('\r\n','\n');

test('preschool counting numbers are large, accessible, and directly under the picture',()=>{
  const diagram=code.indexOf('<QuestionDiagram diagram={diagram} phase={round.hintLevel');
  const inline=code.indexOf('{countingGuide && !round.feedback && (\n                      <View style={styles.preschoolAnswerSection}>');
  const sidePanel=code.indexOf('{((!countingGuide && !numeralGuide && !inlineChoice) || round.feedback) && <View');
  assert.ok(diagram>0 && inline>diagram && sidePanel>inline,'place answer buttons under counting diagram, before side panel');
  assert.match(code,/testID=\{'preschool-answer-'\+option\}/u);
  assert.match(code,/accessibilityLabel=\{option\+'こ と こたえる'\}/u);
  assert.match(code,/preschoolNumberButton: \{[^\n]*minHeight:78/u);
  assert.match(code,/preschoolNumberText: \{[^\n]*fontSize:40/u);
  assert.match(code,/preschoolNumberRow: \{[^\n]*maxWidth:440/u);
});

test('preschool answer buttons grade their own value in one tap without stale state',()=>{
  assert.match(code,/onPress=\{\(\)=>void submit\(option\)\}/u);
  assert.match(code,/const submittedAnswer = selectedAnswer \?\? answer;/u);
  assert.match(code,/if \(selectedAnswer !== undefined\) setAnswer\(selectedAnswer\);/u);
  const submit=code.slice(code.indexOf('  async function submit('),code.indexOf('  function advance()'));
  assert.match(submit,/isValidMathAnswer\(question, submittedAnswer\)/u);
  assert.match(submit,/checkMathAnswer\(question,submittedAnswer\)/u);
  assert.match(submit,/requestLiveGrade\([^\n]*submittedAnswer\)/u);
  assert.match(submit,/question\.choices\?\.indexOf\(submittedAnswer\)/u);
  assert.match(submit,/round\.feedback \|\| submitting\.current \|\| saving/u);
});

test('choice answers use the shared inline buttons, while non-choice inputs retain manual submit',()=>{
  assert.match(code,/wide&&!countingGuide&&!numeralGuide&&question\.type!=='choice'&&styles\.workWide/u);
  assert.match(code,/!countingGuide && !numeralGuide && !bankQuestion\?\.preschoolTrace && question\.type!=='choice'/u);
  assert.match(code,/const inlineChoice=Boolean\(question\?\.type==='choice'/u);
  assert.match(code,/testID="kazu-inline-choice-panel"/u);
  assert.match(code,/question\.choices && question\.choices\.length>3 && styles\.inlineChoiceWrap/u);
  assert.match(code,/onPress=\{\(\)=>void submit\(\)\}/u);
  assert.match(code,/hints\.slice\(0,round\.hintLevel\)\.map/u);
  assert.match(code,/onPress=\{showHint\} style=\{styles\.preschoolHintButton\}/u);
});
