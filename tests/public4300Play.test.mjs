import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {bankStageIds} from '../src/domain/bankStageIds.ts';
import {allWorldStages} from '../src/domain/worldCatalog.ts';
import {checkMathAnswer} from '../src/domain/mathAnswer.ts';
import {drawStageRound} from '../src/domain/stageDeck.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('all 43 public stage banks contain 4,300 distinct, gradable real questions',()=>{
  assert.equal(bankStageIds.length,43);
  assert.equal(bankStageIds.filter(id=>id.startsWith('e1.')).length,40);
  assert.equal(bankStageIds.filter(id=>id.startsWith('sage.')).length,3);
  let count=0;
  for(const id of bankStageIds){
    const bank=JSON.parse(read('public/question-banks/'+id+'.v1.json'));
    const stage=allWorldStages.find(stage=>stage.id===id);
    assert.ok(stage,'bank points to an actual route stage '+id);
    assert.equal(stage.questions,10);
    assert.equal(bank.stageId,id);
    assert.equal(bank.gradeId,stage.gradeId);
    assert.equal(bank.islandId,stage.gradeId);
    assert.equal(bank.questions.length,100,id);
    assert.equal(new Set(bank.questions.map(q=>q.id)).size,100,id);
    for(const question of bank.questions){
      assert.ok(question.id&&question.question&&question.answer);
      assert.equal(question.hints?.length,3,question.id);
      assert.ok(question.explanation?.length>0,question.id);
      assert.ok(checkMathAnswer(question,question.answer),question.id);
    }
    count+=bank.questions.length;
  }
  assert.equal(count,4300);
});

test('each 100-question stage can be played in ten unique 10-question rounds',()=>{
  for(const id of bankStageIds){
    const bank=JSON.parse(read('public/question-banks/'+id+'.v1.json'));
    const ids=bank.questions.map(question=>question.id);
    let previous;
    const observed=new Set();
    for(let i=0;i<10;i++){
      const deck=drawStageRound(ids,10,bank.version,previous);
      assert.equal(deck.lastRound.length,10);
      assert.equal(new Set(deck.lastRound).size,10);
      for(const questionId of deck.lastRound){
        assert.ok(!observed.has(questionId),'a question repeated early in '+id);
        observed.add(questionId);
      }
      previous=deck;
    }
    assert.equal(observed.size,100,id);
  }
});

test('normal map stages fetch public banks and start the same answer/feedback game',()=>{
  const app=read('src/FullAdventure.tsx');
  const map=read('src/components/WorldScenes780.tsx');
  const bank=read('src/domain/publicBankStageRound.ts');
  const loader=read('src/stageBankLoader.web.ts');
  const exporter=read('scripts/export-ui-preview.mjs');
  const verify=read('scripts/verify-web-release.mjs');
  assert.match(app,/await everyIslandStageRound\(stage\)/);
  assert.match(read('src/domain/everyIslandStageRound.ts'),/if\(hasStageBank\(stage\.id\)\)return publicBankStageRound\(stage\)/);
  assert.match(app,/setRound\(\{stage,problems,index:0,correct:0/);
  assert.match(map,/const unlocked=preview \? hasPrototypeStageQuestions\(stage\)/);
  assert.doesNotMatch(map,/管理者テスト・ログインが必要/);
  assert.match(bank,/const decks=new Map<string,StageDeck>\(\)/);
  assert.match(bank,/drawStageRound\(\[\.\.\.byId\.keys\(\)\],stage\.questions,bank\.version,previous\)/);
  assert.match(loader,/fetch\(new URL\('question-banks\/' \+ stageId \+ '\.v1\.json', base\)/);
  assert.match(exporter,/copyFileSync\(source,resolve\(target,'question-banks',file\)\)/);
  assert.match(verify,/The published question bank differs/);
  assert.match(verify,/The hosted public bank manifest is incomplete/);
});
