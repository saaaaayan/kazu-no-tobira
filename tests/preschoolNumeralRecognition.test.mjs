import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewRound,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const island=worldIslands.find(x=>x.id==='preschool');
const stage=n=>island.stages[n-1];
const screen=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('stage 06–08 teach numerals, not another round of only counting toys',()=>{
 for(const [n,digits] of [[6,['1','2','3']],[7,['4','5']],[8,['6','7','8','9','10']]]){
  const qs=uiPreviewBank(stage(n));
  assert.equal(qs.length,10);
  assert.ok(qs.every(q=>q.preschoolNumberActivity&&q.format==='numeral'));
  assert.ok(qs.every(q=>!/(?:が|は) いくつ(?: ある)?[？?]/.test(q.question)));
  assert.ok(qs.some(q=>q.preschoolNumeral!==undefined),'large numeral visual must appear');
  assert.ok(qs.some(q=>q.answer.match(/^[0-9]+$/)),'select written digits');
  assert.ok(qs.some(q=>/[ぁ-ん]/.test(q.answer)),'read spoken numeral names');
  assert.ok(qs.some(q=>/🐻|🐰|🐱|🐶|🐤|🌸|🍎|🚗|🐟|🐢/.test(q.answer)),
   'match digits to picture quantities');
  assert.ok(qs.filter(q=>q.preschoolNumeral).every(q=>digits.includes(q.preschoolNumeral)));
  assert.equal(new Set(qs.map(q=>JSON.stringify([q.question,q.preschoolNumeral,q.diagram]))).size,10,
    'do not repeat identical exercises');
 }
});

test('stage 09 teaches zero through contrast with one and two, not ten answers of 0',()=>{
 const qs=uiPreviewBank(stage(9));
 assert.equal(qs.length,10);
 assert.ok(qs.every(q=>q.preschoolNumberActivity));
 assert.ok(qs.some(q=>q.preschoolNumeral==='0'));
 assert.ok(qs.some(q=>q.answer==='ぜろ'));
 assert.ok(qs.some(q=>q.answer==='からっぽ'));
 assert.ok(qs.some(q=>q.answer==='なにも ない'));
 const counts={0:0,1:0,2:0};
 for(const q of qs)if(q.answer in counts)counts[q.answer]++;
 assert.deepEqual(counts,{'0':3,'1':2,'2':2});
 const plates=qs.filter(q=>q.diagram?.kind==='plateCount');
 assert.equal(plates.length,6);
 assert.deepEqual(plates.map(q=>q.diagram.count),[0,1,2,1,2,0]);
 assert.ok(plates.every(q=>q.answer===String(q.diagram.count)));
 assert.ok(plates.every(q=>q.explanation.includes(q.diagram.count+'こ')));
});

test('stage 10 is a real three-pair matching exercise in all ten tasks',()=>{
 const qs=uiPreviewBank(stage(10));
 assert.equal(qs.length,10);
 assert.ok(qs.every(q=>q.preschoolNumberMatch),'the actual line-connecting activity must be present');
 assert.ok(qs.every(q=>q.preschoolNumeral===undefined&&!q.diagram),
   'no old single-number multiple choice UI');
 assert.ok(qs.every(q=>/せんで むすぼう/.test(q.question)));
 assert.ok(qs.every(q=>q.preschoolNumberMatch.pictures.length===3
   &&q.preschoolNumberMatch.numbers.length===3));
 assert.equal(new Set(qs.map(q=>JSON.stringify(q.preschoolNumberMatch))).size,10,
   'the ten sets of matching cards should differ');
});

test('all fifty numeral tasks have one valid answer, targeted hints and unbiased answer positions',()=>{
 for(let n=6;n<=10;n++){
  const questions=uiPreviewRound(stage(n));
  assert.equal(questions.length,10);
  assert.equal(new Set(questions.map(q=>q.id)).size,10);
  const correctPositions=new Set();
  for(const q of questions){
   assert.equal(q.choices.length,3,q.id);
   assert.equal(new Set(q.choices).size,3,q.id);
   assert.ok(q.choices.includes(q.answer),q.id);
   assert.equal(q.choices.filter(a=>checkMathAnswer(q,a)).length,1,q.id);
   assert.equal(q.hints.length,3,q.id);
   assert.ok(q.hints.every(h=>h.length>10),q.id);
   assert.ok(q.explanation.length>=10,q.id);
   assert.equal(q.format,'numeral');
   correctPositions.add(q.choices.indexOf(q.answer));
  }
  assert.ok(correctPositions.size>=3,'vary correct choice position in '+n);
 }
});

test('the number-recognition UI shows a large digit and directly tappable choices',()=>{
 assert.match(screen,/const numeralGuide=Boolean\(preschoolStage && bankQuestion\?\.preschoolNumberActivity\)/);
 assert.match(screen,/testID="preschool-numeral-target"/);
 assert.match(screen,/\{bankQuestion\.preschoolNumeral\}/);
 assert.match(screen,/testID="preschool-numeral-choice-panel"/);
 assert.match(screen,/testID=\{'preschool-numeral-choice-'\+option\}/);
 assert.match(screen,/onPress=\{\(\)=>void submit\(option\)\}/);
 assert.match(screen,/\{\(\(!countingGuide && !numeralGuide && !inlineChoice\) \|\| round\.feedback\) && <View/);
 assert.match(screen,/!countingGuide && !numeralGuide && !bankQuestion\?\.preschoolTrace && question\.type!=='choice'/);
 assert.match(screen,/preschoolNumeralTargetText:\{fontSize:100/);
 assert.match(screen,/preschoolNumeralChoices:\{width:'100%',maxWidth:520,gap:9,flexDirection:'row'/);
 assert.match(screen,/preschoolNumeralOption:\{minHeight:78,flex:1,minWidth:0/);
});

test('checkpoint 2 draws the corrected 06–10 numeral activities',()=>{
 const questions=uiPreviewPreschoolCheckpoint(2,()=>0.51);
 assert.equal(questions.length,10);
 assert.ok(questions.every(q=>q.preschoolNumberActivity===true));
 for(let i=0;i<5;i++){
  const id='preschool.n'+String(i+6).padStart(2,'0');
  assert.ok(questions.slice(i*2,i*2+2).every(q=>q.id.startsWith('ui-preview-'+id+'-')));
 }
});
