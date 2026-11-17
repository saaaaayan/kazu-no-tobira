import assert from 'node:assert/strict';
import { openSupabasePool } from '../server/supabase-postgres.mjs';
import { createSupabaseQuestionReview } from '../server/supabase-question-review.mjs';
import { liveQuestionRepository,liveQuestionService } from '../server/live-question-service.mjs';
import { questionDeck, questionRound } from '../server/question-round-selection.mjs';
import { betaReadiness } from '../server/beta-readiness.mjs';

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
  const protectedGame=liveQuestionService(liveQuestionRepository(isolated));
  await assert.rejects(protectedGame.start({mode:'checkpoint',stageId:'e1.checkpoint1'}),{status:404});
  const sources=['e1.n04','e1.n05','e1.forest','e1.n07'];
  const extras=[];
  for (const source of sources) {
    const deck=await questionDeck(isolated,source,preview);
    for (const card of deck.cards.slice(0,10)) extras.push(await store.detail(card.id));
  }
  const additional=extras.map(item=>({id:item.id,version:item.version}));
  assert.equal((await store.review({items:additional,status:'verified',note:'Rollback-only QA'},'qa')).updated,40);
  assert.equal((await store.review({items:additional.map(item=>({...item,version:item.version+1})),status:'ready',note:'Rollback-only QA'},'qa')).updated,40);
  const readiness=await betaReadiness(isolated);
  assert.equal(readiness.target,10400);
  assert.equal(readiness.ready,50);
  assert.equal(readiness.playable,50);
  assert.equal(readiness.complete,5);
  assert.equal(readiness.inventoryReady,false);
  const challenge=await protectedGame.start({mode:'checkpoint',stageId:'e1.checkpoint1'});
  assert.equal(challenge.questions.length,10);
  assert.equal(new Set(challenge.questions.map(question=>question.id)).size,10);
  assert.ok(challenge.questions.every(question=>[stage,...sources].includes(question.stageId) && !('answer' in question) && !('steps' in question)));
  const first=challenge.questions[0];
  const correct=[...selected,...extras].find(item=>item.id===first.id).question.answer;
  const hint=await protectedGame.hint({token:challenge.token,id:first.id,level:0});
  assert.ok(hint.hint);
  const result=await protectedGame.grade({token:challenge.token,id:first.id,answer:correct});
  assert.equal(result.correct,true);
  assert.equal('steps' in result,false);
  await assert.rejects(protectedGame.start({mode:'daily',skills:['e1.addition'],premium:true}),{status:403});
  await assert.rejects(store.review({items:reviewItems,status:'needs_work',note:'Conflict check'},'qa'),{status:409});
  assert.equal((await store.review({items:[{...reviewItems[0],version:reviewItems[0].version+2}],
    status:'rejected',reason:'重複',note:'Rollback-only QA'},'qa')).updated,1);
  assert.equal((await store.detail(ids[0])).history[0].status,'rejected');
  assert.equal((await store.detail(ids[0])).reason,'重複');
  await assert.rejects(questionRound(isolated,stage,ids,preview),{status:409});
  await assert.rejects(questionRound(isolated,stage,ids),{status:409});
  await assert.rejects(protectedGame.start({mode:'checkpoint',stageId:'e1.checkpoint1'}),{status:404});
  await assert.rejects(questionDeck(isolated,'sage.n01',preview),{status:404});
  assert.equal((await questionDeck(isolated,'sage.n01',{preview:true,premium:true})).cards.length,100);
  assert.equal((await store.list(new URLSearchParams('stage_id=preschool.n01'))).total,10);
  await assert.rejects(questionDeck(isolated,'preschool.n01',{preview:true,premium:true}),{status:404});
  const before=await store.detail(ids[1]);
  const {question,prompt,answer,hints,explanation,steps}=before.question;
  const edit={id:before.id,version:before.version,note:'Rollback-only edit QA',
    content:{question,prompt,answer,hints,explanation:explanation+'\nテスト中の修正です。',
      steps:steps.map(step=>({...step,equations:step.equations??[]}))}};
  assert.equal(before.status,'ready');
  const visible=liveQuestionRepository(isolated);
  const lookup={id:before.id,fingerprint:before.history[0].fingerprint,premium:false,readyOnly:true};
  assert.ok(await visible.findCurrent(lookup));
  assert.equal((await store.editQuestion(edit,'qa')).changed,true);
  const revised=await store.detail(before.id);
  assert.equal(revised.status,'unreviewed');
  assert.equal(revised.version,before.version+1);
  assert.equal(revised.history[0].event,'revision');
  assert.equal((await store.historicalRevision(before.id,before.history[0].fingerprint)).explanation,explanation);
  assert.equal(await visible.findCurrent(lookup),undefined);
  assert.equal(await visible.findCurrent({...lookup,fingerprint:revised.history[0].fingerprint}),undefined);
  await assert.rejects(store.editQuestion(edit,'qa'),{status:409});
  await assert.rejects(store.review({items:[{id:before.id,version:revised.version}],status:'ready',note:''},'qa'),{status:409});
  console.log(JSON.stringify({total:all.total,statuses:all.counts,liveReviewTransaction:'passed-and-rolled-back'}));
} finally {
  await connection.query('rollback');
  connection.release();
  await pool.end();
}
