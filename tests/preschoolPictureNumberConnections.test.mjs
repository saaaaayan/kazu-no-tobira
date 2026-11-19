import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';
import {pictureNumberConnectedAnswer,pictureNumberMatchAnswer} from '../src/domain/preschoolNumberConnections.ts';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const stage=worldIslands.find(g=>g.id==='preschool').stages[9];

test('stage10 tasks have three unique countable picture groups and three real numeral destinations',()=>{
 const questions=uiPreviewBank(stage);
 assert.equal(questions.length,10);
 const scenarios=new Set();
 for(const q of questions){
   assert.equal(q.format,'numeral',q.id);
   assert.equal(q.preschoolNumberActivity,true,q.id);
   assert.ok(q.preschoolNumberMatch,q.id);
   const match=q.preschoolNumberMatch;
   assert.equal(match.pictures.length,3,q.id);
   assert.equal(match.numbers.length,3,q.id);
   assert.ok(match.pictures.every(p=>Number.isInteger(p.count)&&p.count>=1&&p.count<=5),q.id);
   assert.equal(new Set(match.pictures.map(p=>p.count)).size,3,q.id);
   assert.equal(new Set(match.numbers).size,3,q.id);
   assert.deepEqual([...match.numbers].sort((a,b)=>a-b),
     match.pictures.map(p=>p.count).sort((a,b)=>a-b),q.id);
   assert.equal(q.answer,pictureNumberMatchAnswer(match),q.id);
   assert.ok(q.choices.includes(q.answer),q.id);
   assert.equal(q.choices.filter(a=>checkMathAnswer(q,a)).length,1,q.id);
   assert.equal(q.hints.length,3,q.id);
   assert.ok(q.hints.every(h=>h.length>=10),q.id);
   assert.ok(q.explanation.length>=15,q.id);
   scenarios.add(JSON.stringify(match));
 }
 assert.equal(scenarios.size,10,'all ten problems must differ');
});

test('connecting left pictures to matching right digits yields the one correct answer',()=>{
 for(const question of uiPreviewBank(stage)){
   const match=question.preschoolNumberMatch;
   const good={};
   for(let i=0;i<3;i++)good[i]=match.numbers.indexOf(match.pictures[i].count);
   assert.equal(pictureNumberConnectedAnswer(match,good),question.answer,question.id);
   assert.equal(pictureNumberConnectedAnswer(match,{0:good[0]}),'',question.id);
   assert.equal(pictureNumberConnectedAnswer(match,{0:0,1:0,2:2}),'',
     'one digit cannot be reused by two picture groups');
   const wrong={0:good[1],1:good[0],2:good[2]};
   const typed=pictureNumberConnectedAnswer(match,wrong);
   assert.ok(typed,question.id);
   assert.equal(checkMathAnswer(question,typed),false,question.id);
 }
});

test('stage10 UI draws actual lines between pictures and digits, both touchable',()=>{
 const game=source('src/FullAdventure.tsx');
 const ui=source('src/components/PreschoolPictureNumberMatch.tsx');
 assert.match(game,/const pictureMatching=Boolean\(preschoolStage && bankQuestion\?\.preschoolNumberMatch\)/);
 assert.match(game,/testID="preschool-connect-picture-number-panel"/);
 assert.match(game,/<PreschoolPictureNumberMatch key=\{question.id\}/);
 assert.match(game,/onSubmit=\{value=>void submit\(value\)\}/);
 assert.match(game,/\{numeralGuide && !pictureMatching && !round.feedback/);
 assert.match(ui,/testID="preschool-picture-number-board"/);
 assert.match(ui,/testID=\{'preschool-picture-'\+i\}/);
 assert.match(ui,/testID=\{'preschool-number-'\+n\}/);
 assert.match(ui,/onPress=\{\(\)=>selectPicture\(i\)\}/);
 assert.match(ui,/onPress=\{\(\)=>selectNumber\(i\)\}/);
 assert.match(ui,/<Line key=\{'match-'\+from\}/);
 assert.match(ui,/stroke="#486a92" strokeWidth=\{5\}/);
 assert.match(ui,/if\(active===null\)/);
 assert.match(ui,/if\(next\[Number\(key\)\]===index\)delete next\[Number\(key\)\]/);
 assert.match(ui,/disabled=\{disabled\|\|!done\}/);
 assert.match(ui,/onPress=\{\(\)=>\{if\(done&&!disabled\)onSubmit\(answer\);\}\}/);
 assert.match(ui,/えを さわって、すうじを さわろう/);
});

test('checkpoint 2 draws stage10 matching rather than reverting to a multiple-choice shortcut',()=>{
 const round=uiPreviewPreschoolCheckpoint(2,()=>.5);
 const cards=round.filter(q=>q.id.startsWith('ui-preview-preschool.n10-'));
 assert.equal(cards.length,2);
 assert.ok(cards.every(q=>q.preschoolNumberMatch));
});
