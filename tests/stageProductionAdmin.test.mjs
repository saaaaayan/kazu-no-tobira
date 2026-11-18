import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createStageProductionService} from '../server/stage-production-service.mjs';
import {onlineQuestionReview} from '../server/online-question-review.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('stage admin offers individual, in-order, and randomized game previews',()=>{
  const source=read('src/components/StageProductionDashboard.web.tsx');
  const review=read('src/components/ServerQuestionReview.web.tsx');
  assert.match(source,/この1問をゲーム画面で解く/);
  assert.match(source,/ステージの問題を順番に解く/);
  assert.match(source,/ランダム出題で解く/);
  assert.match(source,/onPreview\(selected\.id,questions,'sequential'\)/);
  assert.match(source,/onPreview\(selected\.id,shuffle\(questions\)\.slice\(0,randomCount\),'random'\)/);
  assert.match(source,/onPreview\(selected\.id,\[question\],'single'\)/);
  assert.match(review,/stageGame\?\.questions \?\? previewQuestions/);
  assert.match(source,/制作状況ダッシュボード/);
  assert.match(source,/statusFilter/);
  assert.match(source,/registered_count/);
  assert.match(review,/制作状況・ステージ管理/);
  assert.match(review,/全問題の検索・審査/);
  assert.match(review,/StageProductionDashboard api=\{api\}/);
});

test('stage listing includes all stages and separate production vs DB totals',async()=>{
  const seen=[];
  const store=createStageProductionService({
    async query(sql,args){seen.push({sql,args});return {rows:[{id:'e1.n01',island_id:'e1',registered_count:100}]};}
  });
  assert.equal((await store.stageProduction())[0].id,'e1.n01');
  assert.match(seen[0].sql,/from question_catalog\.stage_production p/);
  assert.match(seen[0].sql,/registered_count/);
  assert.match(seen[0].sql,/order by p\.island_id,p\.id/);
});

test('stage question endpoint delivers registered questions in ID order, no client filter can inject SQL',async()=>{
  const calls=[];
  const store=createStageProductionService({
    async query(sql,args){
      calls.push({sql,args});
      if(sql.startsWith('select id from'))return {rows:[{id:args[0]}]};
      return {rows:[{question:{id:'one',question:'1+1=?'}},{question:{id:'two',question:'2+2=?'}}]};
    },
  });
  const r=await store.stageQuestions('e1.n06');
  assert.deepEqual(r.questions.map(q=>q.id),['one','two']);
  assert.match(calls[1].sql,/order by q\.id limit 101/);
  assert.deepEqual(calls[1].args,['e1.n06']);
  await assert.rejects(store.stageQuestions("e1.n06' OR true --"),/ステージID/);
});

test('stage status saving demands accurate counts and writes a history row with the server actor',async()=>{
  const events=[];
  const before={id:'e1.n06',version:2,is_checkpoint:false,status:'hundred_created',authored_count:100,
    reviewed_count:0,child_test_count:0,note:''};
  const fake={async connect(){return {
    async query(sql,args){
      events.push({sql,args});
      if(sql.startsWith('select * from question_catalog.stage_production'))return {rows:[before]};
      if(sql.startsWith('update question_catalog.stage_production'))return {rows:[{...before,status:args[1],version:3}]};
      return {rows:[]};
    },
    release(){events.push({sql:'released'});},
  };}};
  const store=createStageProductionService(fake);
  const saved=await store.updateStageProduction({id:'e1.n06',status:'final_creator_reviewed',version:2,
    authored_count:100,reviewed_count:100,child_test_count:0,note:'制作者の最終確認を完了'},'verified-admin-subject');
  assert.equal(saved.changed,true);
  assert.equal(events[0].sql,'begin');
  const history=events.find(e=>e.sql.startsWith('insert into question_catalog.stage_production_history'));
  assert.equal(history.args[1],'verified-admin-subject');
  assert.equal(history.args[3],'final_creator_reviewed');
  assert.ok(events.some(e=>e.sql==='commit'));
  await assert.rejects(store.updateStageProduction({id:'e1.n06',status:'child_tested',version:2,
    authored_count:100,reviewed_count:100,child_test_count:0,note:''},'admin'),/制作件数/);
  await assert.rejects(store.updateStageProduction({id:'e1.n06',status:'final_creator_reviewed',version:2,
    authored_count:100,reviewed_count:10,child_test_count:0,note:''},'admin'),/最終確認/);
});

test('new stage endpoints are protected by existing admin authentication',async()=>{
  let calls=0;
  const handler=onlineQuestionReview({
    store:{async stageProduction(){calls++;return[];},async stageQuestions(){calls++;return{questions:[]};},
      async updateStageProduction(payload,actor){calls++;assert.equal(actor,'real-owner');return {changed:true};}},
    auth:{async authenticate(t){return t==='owner'?{subject:'real-owner',isAdministrator:true}:
      t==='user'?{subject:'ordinary',isAdministrator:false}:null;}}
  });
  const req=(path,token,body)=>new Request('https://example.com/question-admin/'+path,{
    method:body?'POST':'GET',
    headers:{Origin:'https://saaaaayan.github.io',...(token?{Authorization:'Bearer '+token}:{}),
      ...(body?{'Content-Type':'application/json'}:{})},
    body:body?JSON.stringify(body):undefined,
  });
  assert.equal((await handler(req('stage-production',undefined))).status,401);
  assert.equal((await handler(req('stage-production','user'))).status,403);
  assert.equal((await handler(req('stage-questions?id=e1.n01','user'))).status,403);
  assert.equal(calls,0);
  assert.equal((await handler(req('stage-production','owner'))).status,200);
  assert.equal((await handler(req('stage-questions?id=e1.n01','owner'))).status,200);
  assert.equal((await handler(req('stage-production','owner',{id:'e1.n01'}))).status,200);
  assert.equal(calls,3);
});
