import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands,allWorldStages,hasGeneratedWorldQuestions} from '../src/domain/worldCatalog.ts';
import {bankStageIds,hasStageBank} from '../src/domain/questionBank.ts';
import {generateWorldQuestions,checkMathAnswer} from '../src/domain/worldQuestions.ts';
import {generateAdditionalIslandQuestions} from '../src/domain/additionalIslandQuestions.ts';
// Public-stage routing is validated from its source because native Metro resolves its loader.
import {uiPreviewRound,uiPreviewSampleKind} from '../src/domain/uiPreviewRound.ts';

test('all sixteen islands and 1,040 stages are classified in real academic categories',()=>{
  assert.equal(worldIslands.length,16);
  assert.equal(allWorldStages.length,1040);
  assert.equal(new Set(allWorldStages.map(s=>s.id)).size,1040);
  for(const island of worldIslands) {
    assert.equal(island.units.length,10,island.id);
    assert.equal(new Set(island.units.map(u=>u.code)).size,10,island.id);
    assert.equal(new Set(island.units.map(u=>u.title)).size,10,island.id+' duplicate unit titles');
    assert.equal(island.stages.length,65,island.id);
    assert.equal(island.stages.filter(s=>s.kind==='normal').length,50);
    assert.equal(island.stages.filter(s=>s.kind==='extra').length,10);
    assert.equal(island.stages.filter(s=>s.kind==='secret').length,5);
    for(const stage of island.stages) {
      assert.equal(stage.gradeId,island.id);
      assert.equal(stage.questions,10);
      assert.ok(stage.title.trim(),stage.id);
      if(stage.kind==='normal' && !['e1.forest','e1.bridge','e1.tower'].includes(stage.id))
        assert.equal(stage.subtitle,island.units[stage.unitIndex].title,stage.id+' category misalignment');
      if(stage.id==='e1.bridge')assert.match(stage.subtitle,/10を つくる/);
      if(stage.id==='e1.tower')assert.match(stage.subtitle,/10を こえる/);
      assert.ok(hasStageBank(stage.id)||Boolean(uiPreviewSampleKind(stage))||hasGeneratedWorldQuestions(stage.gradeId)||['preschool','sage','champion','cosmos'].includes(stage.gradeId),'still locked '+stage.id);
    }
  }
  assert.equal(bankStageIds.length,43);
});

test('every existing 100-question bank survives, every other stage has 10 distinct solvable first drafts',async()=>{
  let original=0,other=0,authored=0;
  const rows=[];
  for(const stage of allWorldStages) {
    if(hasStageBank(stage.id)){
      const bank=JSON.parse(readFileSync(new URL('../public/question-banks/'+stage.id+'.v1.json',import.meta.url),'utf8'));
      assert.equal(bank.stageId,stage.id);
      assert.equal(bank.questions.length,100);
      original+=bank.questions.length;
      authored+=100;
      continue;
    }
    const questions=uiPreviewSampleKind(stage)?uiPreviewRound(stage):
      hasGeneratedWorldQuestions(stage.gradeId)?generateWorldQuestions(stage,0):
        generateAdditionalIslandQuestions(stage);
    assert.equal(questions.length,10,stage.id);
    assert.equal(new Set(questions.map(q=>q.id)).size,10,stage.id);
    assert.equal(new Set(questions.map(q=>(q.clock?.read?q.question+q.clock.start:q.question).normalize('NFKC'))).size,10,
      stage.id+' duplicate visible question');
    for(const q of questions){
      assert.ok(q.question.trim(),stage.id);
      assert.ok(q.hint.trim(),stage.id);
      assert.ok(q.explanation.trim(),stage.id);
      assert.equal(checkMathAnswer(q,q.answer),true,stage.id+': '+q.question+' / '+q.answer);
      if(!hasGeneratedWorldQuestions(stage.gradeId)) {
        assert.equal(('hints' in q?q.hints:q.guidedHints)?.length,3,stage.id);
        assert.ok(q.steps?.length>=2,stage.id);
      }
      if(q.type==='choice') {
        assert.equal(new Set(q.choices).size,q.choices.length,stage.id);
        assert.ok(q.choices.includes(q.answer),stage.id);
        assert.equal(q.choices.filter(v=>checkMathAnswer(q,v)).length,1,stage.id);
      }
      if(q.clock)assert.ok(q.clock.start>=0);
    }
    other++;
    authored+=questions.length;
    rows.push([stage.id,stage.subtitle,questions.length]);
  }
  assert.equal(original,4300);
  assert.equal(other,997);
  assert.equal(authored,14270);
  const source=readFileSync(new URL('../src/domain/everyIslandStageRound.ts',import.meta.url),'utf8');
  assert.match(source,/guidedHints:question.guidedHints\?\?\[question.hint,second,third\]/);
  assert.match(source,/if\(hasStageBank\(stage.id\)\)return publicBankStageRound\(stage\)/);
});

test('preschool remains child-friendly with big one-tap answers, voice and tracing surface',()=>{
  const app=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');
  const map=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');
  assert.match(app,/const preschoolStage=Boolean\(round\?\.stage\.gradeId==='preschool'\)/);
  assert.match(app,/const countingGuide=Boolean\(preschoolStage && question\?\.type==='choice'\)/);
  assert.match(app,/round\.stage\.family==='tracing'/);
  assert.match(app,/ゆびで すうじを なぞろう/);
  assert.match(map,/const unlocked=preview \? hasPrototypeStageQuestions\(stage\)/);
  assert.match(map,/全65ステージで 10問ずつ/);
  assert.doesNotMatch(map,/管理者テスト・ログインが必要/);
});

test('each extra/secret stage has its own ten-question unit rather than a placeholder',()=>{
  for(const island of worldIslands){
    for(const stage of island.stages.filter(s=>s.kind!=='normal')){
      if(hasStageBank(stage.id))continue;
      const questions=stage.gradeId==='preschool'||['sage','champion','cosmos'].includes(stage.gradeId)
        ? generateAdditionalIslandQuestions(stage) : generateWorldQuestions(stage,0);
      assert.equal(questions.length,10,stage.id);
      assert.ok(new Set(questions.map(q=>q.question)).size>=9,stage.id);
    }
  }
});
