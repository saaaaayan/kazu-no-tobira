import assert from 'node:assert/strict';
import test from 'node:test';
import { worldStageById } from '../src/domain/worldCatalog.ts';
import { generateWorldQuestions } from '../src/domain/worldQuestions.ts';
import { inspectQuestion, normalizeQuestion, optionKey, questionKeys } from '../scripts/question-audit-rules.mjs';

test('表記揺れ、交換法則、構造類似を区別する',()=>{
  const stem=question=>questionKeys({question});
  assert.equal(stem('２　＋ ３ ＝ ？').exact,stem('2+3=?').exact);
  assert.notEqual(stem('2+3=?').exact,stem('3+2=?').exact);
  assert.equal(stem('2+3=?').equivalent,stem('3+2=?').equivalent);
  assert.notEqual(stem('2-3=?').equivalent,stem('3-2=?').equivalent);
  assert.equal(stem('2+3=?').shape,stem('7+8=?').shape);
  assert.notEqual(stem('2+3=?').equivalent,stem('7+8=?').equivalent);
  assert.equal(normalizeQuestion('ｘ²'),normalizeQuestion('x^2'));
  assert.notEqual(normalizeQuestion('2²'),normalizeQuestion('22'));
  assert.equal(stem('(x＋3)(x＋5) を展開すると？').equivalent,stem('(x+5)(x+3)を展開すると？').equivalent);
});

test('同値選択肢、誤った演算、図の参照欠落を検出する',()=>{
  const base={id:'audit.fixture',explanation:'検査用の説明',answer:'0.5'};
  assert.equal(optionKey('0.50'),optionKey('２／４'));
  const choice={...base,type:'choice',question:'該当する数は？',choices:['1/2','2/4','1','0']};
  assert.deepEqual(inspectQuestion(choice).issues,['choice-answer-count','equivalent-choices']);
  assert.deepEqual(inspectQuestion({...base,type:'number',question:'1.25×2＝？'}).issues,['arithmetic-answer']);
  assert.equal(inspectQuestion({...base,type:'number',question:'1.25×2＝？',answer:'2.5'}).independent,true);
  const analog={...base,type:'choice',question:'この とけいは なんじ？',choices:['0.5','1','2','3']};
  assert.deepEqual(inspectQuestion(analog).issues,['figure-referenced-but-missing']);
  const at=start=>questionKeys({...analog,clock:{read:true,start,end:start}});
  assert.notEqual(at(60).exact,at(90).exact);
  assert.equal(at(60).exact,at(780).exact);
  assert.equal(at(60).shape,at(90).shape);
});

test('現行の小5・小6の隠しステージに再登場する固定問題を監査で再現する',()=>{
  const auditGrade=grade=>new Set(Array.from({length:5},(_,i)=>worldStageById.get(grade+'.s0'+(i+1)))
    .flatMap(stage=>[0,1,2].flatMap(seed=>generateWorldQuestions(stage,seed)))
    .map(question=>questionKeys(question).exact));
  const fifth=auditGrade('e5'), sixth=auditGrade('e6');
  const recurring=[...fifth].filter(key=>sixth.has(key));
  assert.equal(recurring.length,24,'既知の不具合を修正するときは重複ゼロの回帰テストに置き換える');
  assert.ok(recurring.includes(questionKeys({question:'1＋3＋5＋7＋9＝？'}).exact));
});
