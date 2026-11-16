import assert from 'node:assert/strict';
import test from 'node:test';
import { intakeDraftBank,validateDraftBank } from '../server/draft-intake.mjs';

const question={id:'e1.n06:intake-test',skillId:'e1.counting',difficulty:1,type:'number',prompt:'答えを入力',
  question:'1+2=?',answer:'3',explanation:'全部で3。',hint:'1から数える。',
  hints:['1から数える。','2つ増やす。','2の次は3。'],steps:[{title:'数える',body:'1からあと2つ数える。'}]};
const bank={stageId:'e1.n06',gradeId:'e1',islandId:'e1',version:1,questions:[question]};

function poolWith(existing=[],failure=false) {
  const queries=[];
  return {queries,async connect(){
    return {async query(sql,params){
      queries.push({sql,params});
      if (sql.includes('from question_catalog.stages')) return {rowCount:1,rows:[{kind:'normal',island_id:'e1'}]};
      if (sql.includes('where id=any')) return {rowCount:existing.length,rows:existing};
      if (failure && sql.includes('insert into question_catalog.history')) throw new Error('simulated DB error');
      return {rowCount:0,rows:[]};
    },release(){}};
  }};
}

test('intake validates correctness and figure compatibility before touching the database',()=>{
  assert.equal(validateDraftBank(bank).rows[0].independent,true);
  const validate=question=>validateDraftBank({...bank,questions:[question]});
  assert.throws(()=>validate({...question,answer:'4'}),/arithmetic-answer/);
  assert.throws(()=>validate({...question,answer:'３'}),/採点形式/);
  assert.throws(()=>validate({...question,question:'この図のたまは何個？'}),/figure-referenced-but-missing/);
  assert.throws(()=>validate({...question,diagram:{kind:'tenFrame',first:12,second:10}}),/図の構造/);
  assert.throws(()=>validate({...question,steps:[{title:'数える',body:'本文',equations:'3'}]}),/解説/);
  assert.throws(()=>validateDraftBank({...bank,questions:[question,question]}),/ID/);
});

test('intake dry run writes nothing and preserves same-version registrations',async()=>{
  const pool=poolWith();
  assert.equal((await intakeDraftBank(pool,bank)).newCandidates,1);
  assert.ok(pool.queries.every(({sql})=>!sql.startsWith('insert')));
  const previous={id:question.id,fingerprint:validateDraftBank(bank).rows[0].fingerprint,active:true,stage_id:bank.stageId};
  const repeat=poolWith([previous]);
  assert.equal((await intakeDraftBank(repeat,bank,{write:true})).unchanged,1);
  assert.ok(repeat.queries.every(({sql})=>!sql.startsWith('insert')));
  await assert.rejects(intakeDraftBank(poolWith([{...previous,fingerprint:'older'}]),bank,{write:true}),/既存ID/);
});

test('registration only creates unreviewed records and rolls back if history fails',async()=>{
  const pool=poolWith();
  const result=await intakeDraftBank(pool,{...bank,questions:[{...question,status:'ready'}]},{write:true});
  assert.equal(result.inserted,1);
  const writes=pool.queries.filter(({sql})=>sql.startsWith('insert'));
  assert.equal(writes.length,4);
  assert.ok(writes[2].sql.includes("'unreviewed'") && writes[3].sql.includes("'unreviewed'"));
  assert.equal(pool.queries.at(-1).sql,'commit');
  const failing=poolWith([],true);
  await assert.rejects(intakeDraftBank(failing,bank,{write:true}),/simulated DB error/);
  assert.equal(failing.queries.at(-1).sql,'rollback');
});
