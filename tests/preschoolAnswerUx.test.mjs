import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const code=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('preschool counting numbers are large, accessible, and directly under the picture',()=>{
  const diagram=code.indexOf('<QuestionDiagram diagram={diagram} phase={round.hintLevel');
  const inline=code.indexOf('{countingGuide && !round.feedback && (\n                      <View style={styles.preschoolAnswerSection}>');
  const sidePanel=code.indexOf('{((!countingGuide && !numeralGuide) || round.feedback) && <View');
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

test('other grades still have ordinary two-step answering, and preschool hints are visible',()=>{
  assert.match(code,/wide&&!countingGuide&&!numeralGuide&&styles\.workWide/u);
  assert.match(code,/!countingGuide && !numeralGuide && <CalculationMemo/u);
  assert.match(code,/onPress=\{\(\)=>void submit\(\)\}/u);
  assert.match(code,/hints\.slice\(0,round\.hintLevel\)\.map/u);
  assert.match(code,/onPress=\{showHint\} style=\{styles\.preschoolHintButton\}/u);
});
