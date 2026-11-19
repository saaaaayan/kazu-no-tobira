import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank} from '../src/domain/uiPreviewRound.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';

const world=worldIslands.find(island=>island.id==='preschool');
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Stage 29 makes children apply both color and shape, without showing the solution in its stem',()=>{
 const bank=uiPreviewBank(world.stages[28]);
 assert.equal(bank.length,10);
 const positions=new Set();
 const seen=new Set();
 const iconInfo={
   '🔴':{color:'あか',shape:'まる'},
   '🔵':{color:'あお',shape:'まる'},
   '🔺':{color:'あか',shape:'さんかく'},
   '🔼':{color:'あお',shape:'さんかく'},
   '🟥':{color:'あか',shape:'しかく'},
   '🟦':{color:'あお',shape:'しかく'},
 };
 for(const q of bank){
   assert.deepEqual(q.preschoolTwoRules && Object.keys(q.preschoolTwoRules).sort(),['color','shape'],q.id);
   assert.equal(q.question,'2つの おやくそくに あうのは どれ？',q.id);
   assert.ok(!q.question.includes(q.answer),q.id);
   assert.equal(q.choices.length,3,q.id);
   assert.equal(new Set(q.choices).size,3,q.id);
   const rules=q.preschoolTwoRules;
   const candidates=q.choices.map(icon=>iconInfo[icon]);
   assert.ok(candidates.every(Boolean),q.id);
   assert.equal(candidates.filter(x=>x.color===rules.color&&x.shape===rules.shape).length,1,q.id);
   assert.equal(candidates.filter(x=>x.color===rules.color&&x.shape!==rules.shape).length,1,q.id);
   assert.equal(candidates.filter(x=>x.color!==rules.color&&x.shape===rules.shape).length,1,q.id);
   assert.deepEqual(iconInfo[q.answer],rules,q.id);
   assert.equal(q.choices.filter(choice=>checkMathAnswer(q,choice)).length,1,q.id);
   assert.ok(q.hints.length===3&&q.hints.every(h=>h.length>6),q.id);
   assert.ok(q.explanation.includes(rules.color)&&q.explanation.includes(rules.shape),q.id);
   positions.add(q.choices.indexOf(q.answer));
   seen.add(rules.color+rules.shape);
 }
 assert.ok(positions.size>=3,'answers should not be always in the same place');
 assert.ok(seen.size>=6,'practice six different color-and-shape combinations');
});

test('Stage 29 displays two separate, readable rules and reads them aloud',()=>{
 const game=read('src/FullAdventure.tsx');
 assert.match(game,/testID="preschool-two-rule-conditions"/);
 assert.match(game,/① いろは/);
 assert.match(game,/② かたちは/);
 assert.match(game,/styles\.preschoolRulesPanel/);
 assert.match(game,/preschoolRuleText:\{color:'#293757'/);
 assert.match(game,/\? \['いろは '\+bankQuestion\.preschoolTwoRules\.color/);
 assert.match(game,/かたちは '\+bankQuestion\.preschoolTwoRules\.shape/);
 assert.match(game,/styles\.preschoolSequenceQuestion/);
});
