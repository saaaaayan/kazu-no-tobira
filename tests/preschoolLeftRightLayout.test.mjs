import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank} from '../src/domain/uiPreviewRound.ts';
import {countingTokenArt} from '../src/domain/countingTokens.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const preschool=worldIslands.find(g=>g.id==='preschool');

test('all left-versus-right comparison pictures use two actual horizontal columns',()=>{
  assert.ok(preschool);
  let comparisons=0;
  for(const stage of preschool.stages){
    for(const q of uiPreviewBank(stage)){
      if(!q.question.includes('どちらの') || !['ひだり','みぎ','おなじ'].includes(q.answer))continue;
      assert.equal(q.diagram?.kind,'countingBoard',q.id);
      assert.equal(q.diagram.arrangement,'side-by-side',q.id);
      assert.equal(q.diagram.rows.length,2,q.id);
      assert.deepEqual(q.diagram.rows.map(row=>row.label),['ひだり','みぎ'],q.id);
      const left=q.diagram.rows[0].tokens.length;
      const right=q.diagram.rows[1].tokens.length;
      assert.equal(q.answer,left===right?'おなじ':left>right?'ひだり':'みぎ',q.id);
      comparisons++;
    }
  }
  assert.ok(comparisons>=50,'the standard comparison stages are exercised');
});

test('all preschool position questions show exactly three left-to-right pictures in one nonwrapping diagram',()=>{
  assert.ok(preschool);
  let positions=0;
  for(const stage of preschool.stages){
    for(const q of uiPreviewBank(stage)){
      if(!/まんなかは だれ|いちばん ひだりは だれ|いちばん みぎは だれ|の ひだりは|の みぎは/u.test(q.question))continue;
      assert.equal(q.diagram?.kind,'countingBoard',q.id);
      assert.equal(q.diagram.rows.length,1,q.id);
      assert.equal(q.diagram.rows[0].tokens.length,3,q.id);
      assert.equal(q.diagram.arrangement,'position-row',q.id);
      assert.doesNotMatch(q.question,/🐻|🐰|🐱|🐶|🐤|🌸|🍎|🚗|🐟|🐢/u,q.id);
      const names=q.diagram.rows[0].tokens.map(token=>countingTokenArt[token][1]);
      const expected=q.question.includes('まんなかは だれ')?names[1]
        :q.question.includes('いちばん ひだり')||q.question.includes('の ひだりは')?names[0]:names[2];
      assert.equal(q.answer,expected,q.id);
      positions++;
    }
  }
  assert.ok(positions>=40,'the position stages are exercised');
});

test('counting diagram rendering preserves left-right order and never stacks compared groups',()=>{
  const support=read('src/components/QuestionSupport.tsx');
  const bank=read('src/domain/questionBank.ts');
  assert.match(bank,/arrangement\?: 'side-by-side' \| 'position-row'/u);
  assert.match(support,/const sideBySide=diagram.arrangement==='side-by-side' && diagram.rows.length===2/u);
  assert.match(support,/testID=\{sideBySide\?'counting-left-right-layout':undefined\}/u);
  assert.match(support,/style=\{sideBySide \? styles.sideBySideCountingGroups : styles.stackedCountingGroups\}/u);
  assert.match(support,/sideBySideCountingGroups:\{flexDirection:'row',alignItems:'stretch',gap:8\}/u);
  assert.match(support,/sideBySideCountingGroup:\{flex:1,minWidth:0/g);
  assert.match(support,/sideBySide\?2:maxColumns/u);
  assert.match(support,/const interactive=!positionRow/u);
  assert.match(support,/flexWrap:\(diagram.guide\|\|positionRow\)\?'nowrap':'wrap'/u);
});
