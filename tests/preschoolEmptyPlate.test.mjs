import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const island=worldIslands.find(x=>x.id==='preschool');

test('stage 09 visibly contrasts empty, one-object and two-object plates',()=>{
 const questions=uiPreviewBank(island.stages[8]);
 assert.equal(questions.length,10);
 const plates=questions.filter(q=>q.diagram?.kind==='plateCount');
 assert.equal(plates.length,6);
 assert.deepEqual(plates.map(q=>q.diagram.count),[0,1,2,1,2,0]);
 assert.deepEqual(plates.map(q=>q.answer),['0','1','2','1','2','0']);
 for(const q of plates){
   assert.equal(q.answer,String(q.diagram.count),q.id);
   assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
   assert.ok(q.question.includes('おさら')||q.prompt.includes('おさら'),q.id);
   assert.ok(q.explanation.includes(q.diagram.count+'こ'),q.id);
   assert.ok(q.hints.every(h=>h.length>=9),q.id);
   assert.ok(['apple','bear','rabbit','flower'].includes(q.diagram.token),q.id);
 }
 // The user should need to look at the picture; zero cannot be the only correct choice.
 assert.ok(questions.some(q=>q.answer==='1'));
 assert.ok(questions.some(q=>q.answer==='2'));
 const mixed=uiPreviewPreschoolCheckpoint(2,()=>0.34);
 assert.equal(mixed.length,10);
});

test('the empty token is never just a circle glyph or a tap target',()=>{
 const glyph=read('src/domain/countingTokens.ts');
 const picture=read('src/components/QuestionSupport.tsx');
 assert.doesNotMatch(glyph,/empty:\s*\['◯'/);
 assert.match(glyph,/empty: \['🍽️','なにも のっていない おさら'\]/);
 assert.match(picture,/if\(token==='empty'\)return <View key=\{id\}/);
 assert.match(picture,/testID="counting-empty-plate"/);
 assert.match(picture,/styles\.emptyPlateOuter/);
 assert.match(picture,/styles\.emptyPlateInner/);
 assert.match(picture,/なにも のっていない おさら/);
 assert.match(picture,/emptyPlateOuter:\{width:158,height:95/);
 assert.match(picture,/emptyPlateCaption:\{fontSize:17/);
 assert.match(picture,/return interactive \? <Pressable/);
});

test('plate graphics include identical plate outlines and countable objects for 0, 1, and 2',()=>{
 const picture=read('src/components/QuestionSupport.tsx');
 const types=read('src/domain/questionBank.ts');
 assert.match(types,/kind: 'plateCount'; token: CountingToken; count: 0 \| 1 \| 2/);
 assert.match(picture,/if \(diagram.kind === 'plateCount'\) \{/);
 assert.match(picture,/testID="preschool-plate-count-scene"/);
 assert.match(picture,/styles\.plateCountOuter/);
 assert.match(picture,/styles\.plateCountInner/);
 assert.match(picture,/Array\.from\(\{length:diagram.count\}/);
 assert.match(picture,/styles\.plateCountToy/);
 assert.doesNotMatch(picture,/0こ\s*<Text/);
});
