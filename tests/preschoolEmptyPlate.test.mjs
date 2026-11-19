import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const island=worldIslands.find(x=>x.id==='preschool');

test('zero means no apples: every empty-plate question has answer zero and zero countable objects',()=>{
 const questions=uiPreviewBank(island.stages[8]); // n09, zero
 assert.equal(questions.length,10);
 const plates=questions.filter(q=>q.diagram?.kind==='countingBoard' &&
    q.diagram.rows.some(row=>row.tokens.includes('empty')));
 assert.ok(plates.length>=4);
 for(const q of plates){
   assert.deepEqual(q.diagram.rows.flatMap(row=>row.tokens),['empty']);
   assert.equal(q.answer,'0',q.id);
   assert.equal(q.choices.filter(c=>checkMathAnswer(q,c)).length,1,q.id);
   assert.match(q.question,/おさらに/);
   assert.match(q.prompt,/おさらの なかを みて/);
   assert.match(q.explanation,/0こ/);
   assert.ok(q.hints.every(h=>h.length>=9));
 }
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
