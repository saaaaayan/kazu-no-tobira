import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displayedChoiceOptions} from '../src/domain/choicePresentation.ts';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank,uiPreviewPreschoolCheckpoint} from '../src/domain/uiPreviewRound.ts';

const app=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');
const ordered=['ひだり','おなじ','みぎ'];

test('all six permutations of positional choices display left, same, right without mutating the original array',()=>{
  const all=[
    ['みぎ','ひだり','おなじ'],['みぎ','おなじ','ひだり'],
    ['ひだり','みぎ','おなじ'],['ひだり','おなじ','みぎ'],
    ['おなじ','ひだり','みぎ'],['おなじ','みぎ','ひだり'],
  ];
  for(const options of all){
    const before=options.slice();
    assert.deepEqual(displayedChoiceOptions(options),ordered);
    assert.deepEqual(options,before);
  }
});

test('unrelated or partial selections keep their source ordering',()=>{
  const examples=[['1','3','2'],['おなじ','ちがう','みぎ'],['ひだり','みぎ'],['さんかく','しかく','まる']];
  for(const value of examples)assert.strictEqual(displayedChoiceOptions(value),value);
  assert.equal(displayedChoiceOptions(undefined),undefined);
});

test('all preschool compare-stage and checkpoint options have consistent presentation',()=>{
  const island=worldIslands.find(g=>g.id==='preschool');
  assert.ok(island);
  let checked=0;
  for(const stage of island.stages){
    for(const problem of uiPreviewBank(stage)){
      if(problem.type!=='choice'||problem.choices?.length!==3||!ordered.every(v=>problem.choices.includes(v)))continue;
      assert.deepEqual(displayedChoiceOptions(problem.choices),ordered,problem.id);
      checked++;
    }
  }
  for(let i=1;i<=10;i++){
    for(const question of uiPreviewPreschoolCheckpoint(i)){
      if(question.type==='choice'&&question.choices?.length===3&&ordered.every(v=>question.choices.includes(v))){
        assert.deepEqual(displayedChoiceOptions(question.choices),ordered,question.id);
        checked++;
      }
    }
  }
  assert.ok(checked>=50);
});

test('the three spatial buttons use the same font size, with a uniform narrow-phone fallback',()=>{
  assert.match(app,/import \{ displayedChoiceOptions \} from '\.\/domain\/choicePresentation';/);
  assert.match(app,/const displayedChoices=displayedChoiceOptions\(question\?\.choices\)/);
  assert.match(app,/const directionalChoices=Boolean\(displayedChoices && displayedChoices!==question\?\.choices\)/);
  assert.match(app,/\{displayedChoices\?\.map\(option=>\(/);
  assert.match(app,/directionalChoices&&styles.inlineDirectionalChoiceText,/);
  assert.match(app,/directionalChoices&&viewport<400&&styles.inlineDirectionalChoiceTextNarrow/);
  assert.match(app,/inlineDirectionalChoiceText:\{fontSize:30\}/);
  assert.match(app,/inlineDirectionalChoiceTextNarrow:\{fontSize:22\}/);
  assert.match(app,/onPress=\{\(\)=>void submit\(option\)\}/);
});
