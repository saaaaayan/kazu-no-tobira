import assert from 'node:assert/strict';
import { openSupabasePool } from '../server/supabase-postgres.mjs';
import { createSupabaseQuestionReview } from '../server/supabase-question-review.mjs';
import { questionDeck, questionRound } from '../server/question-round-selection.mjs';

const pool=openSupabasePool('svc_kazu_review');
const connection=await pool.connect();
const isolated={
  query:(...args)=>connection.query(...args),
  async connect() {
    return {
      async query(sql,values) {
        if (['begin','commit','rollback'].includes(sql)) return;
        return connection.query(sql,values);
      },
      release() {},
    };
  },
};
const store=createSupabaseQuestionReview(isolated);
try {
  // QA changes use the database's real checks and policies but stay inside this rollback-only transaction.
  await connection.query('begin isolation level repeatable read');
  const all=await store.list(new URLSearchParams());
  const stage='e1.n06';
  const {rows,total}=await store.list(new URLSearchParams('stage_id='+stage+'&has_figure=1'));
  assert.ok(total>0 && rows.every(row=>row.stage_id===stage && row.has_figure));
  assert.equal((await store.list(new URLSearchParams('page=1'))).rows.length,20);
  assert.equal((await store.stageTotals()).length,1040);
  const detail=await store.detail(rows[0].id);
  assert.ok(detail.question.hints.length===3 && detail.question.diagram);
  for await (const row of store.exportRows(new URLSearchParams('stage_id='+stage))) {
    assert.ok(row.payload.includes(row.id));
    break;
  }
  const preview={preview:true,premium:false};
  const deck=await questionDeck(isolated,stage,preview);
  assert.equal(deck.cards.length,100);
  const ids=deck.cards.slice(0,10).map(row=>row.id);
  assert.equal((await questionRound(isolated,stage,ids,preview)).length,10);
  await assert.rejects(questionDeck(isolated,stage),{status:404});
  const selected=[];
  for (const id of ids) selected.push(await store.detail(id));
  const reviewItems=selected.map(item=>({id:item.id,version:item.version}));
  assert.equal((await store.review({items:reviewItems,status:'verified',note:'Rollback-only QA'},'qa')).updated,10);
  assert.equal((await store.review({items:reviewItems.map(item=>({...item,version:item.version+1})),status:'ready',note:'Rollback-only QA'},'qa')).updated,10);
  assert.equal((await questionRound(isolated,stage,ids)).length,10);
  await assert.rejects(store.review({items:reviewItems,status:'needs_work',note:'Conflict check'},'qa'),{status:409});
  assert.equal((await store.review({items:[{...reviewItems[0],version:reviewItems[0].version+2}],
    status:'rejected',reason:'重複',note:'Rollback-only QA'},'qa')).updated,1);
  assert.equal((await store.detail(ids[0])).history[0].status,'rejected');
  assert.equal((await store.detail(ids[0])).reason,'重複');
  await assert.rejects(questionRound(isolated,stage,ids,preview),{status:409});
  await assert.rejects(questionRound(isolated,stage,ids),{status:409});
  await assert.rejects(questionDeck(isolated,'sage.n01',preview),{status:404});
  assert.equal((await questionDeck(isolated,'sage.n01',{preview:true,premium:true})).cards.length,100);
  assert.equal((await store.list(new URLSearchParams('stage_id=preschool.n01'))).total,10);
  await assert.rejects(questionDeck(isolated,'preschool.n01',{preview:true,premium:true}),{status:404});
  console.log(JSON.stringify({total:all.total,statuses:all.counts,liveReviewTransaction:'passed-and-rolled-back'}));
} finally {
  await connection.query('rollback');
  connection.release();
  await pool.end();
}
