import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { openQuestionReviewStore } from '../server/question-review-store.mjs';
import { createQuestionReviewServer } from '../server/question-review-http.mjs';

const bank = JSON.parse(await readFile(new URL('../public/question-banks/e1.n04.v1.json',import.meta.url),'utf8'));
const stage = bank.stageId;
const [first,second] = bank.questions;

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(),'kazu-review-'));

  const path = join(dir,'questions.sqlite');
  const file = join(dir,stage+'.v1.json');
  await writeFile(file,JSON.stringify({...bank,questions:[first,second]}));
  return { dir,path,file };
}
const items = (...questions) => questions.map(item => ({ id:item.id,version:item.version ?? 0 }));

test('管理者審査は競合を検出し、ボツ・改訂を反映して選出を停止する', async t => {
  const {dir,path,file} = await fixture(t);
  const store = openQuestionReviewStore(path,dir);
  try {
    assert.equal(store.importBanks(),2);
    assert.equal(store.stageTotals().length,1040);
    assert.equal(store.list(new URLSearchParams('stage_id='+stage)).total,2);
    assert.deepEqual(store.readyQuestions(stage),[]);
    assert.throws(() => store.review({items:items(first),status:'ready',note:''},'owner'),{status:409});
    store.review({items:items(first),status:'verified',note:'照合済み'},'owner');
    assert.throws(() => store.review({items:items(second,first),status:'needs_work',note:'同時更新'},'owner'),{status:409});
    assert.equal(store.detail(second.id).status,'unreviewed','一括処理の一部を保存しない');
    store.review({items:items(store.detail(first.id)),status:'ready',note:'公開審査済み'},'owner');
    assert.deepEqual(store.readyQuestions(stage).map(q => q.id),[first.id]);
    store.review({items:items(store.detail(first.id)),status:'rejected',reason:'わかりにくい',note:'条件を追記'},'owner');
    assert.deepEqual(store.readyQuestions(stage),[]);
    assert.equal(store.importBanks(),2);
    assert.equal(store.detail(first.id).status,'rejected');
    await writeFile(file,JSON.stringify({...bank,questions:[{...first,hint:first.hint+'。'},second]}));
    store.importBanks();
    assert.equal(store.detail(first.id).status,'unreviewed');
    assert.equal(store.detail(first.id).history[0].event,'revision');
    assert.equal(store.db.prepare('SELECT count(*) n FROM revisions').get().n,3);
  } finally { store.db.close(); }
  const reopened = openQuestionReviewStore(path,dir);
  try {
    assert.equal(reopened.detail(first.id).note,'条件を追記');
    assert.equal(reopened.detail(first.id).history[1].status,'rejected');
    assert.deepEqual(reopened.readyQuestions(stage),[]);
  } finally { reopened.db.close(); await rm(dir,{recursive:true,force:true}); }
});

test('未ログイン・別オリジンでは問題本文もエクスポートも受け取れない', async t => {
  const {dir,path} = await fixture(t);
  const store = openQuestionReviewStore(path,dir);
  store.importBanks();
  const key = 'a'.repeat(64);
  const server = createQuestionReviewServer({store,adminKey:key,test:true});
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(async () => {
    await new Promise((resolve,reject) => server.close(problem => problem ? reject(problem) : resolve()));
    store.db.close();
    await rm(dir,{recursive:true,force:true});
  });
  const origin = 'http://127.0.0.1:'+server.address().port;
  const get = (route,headers) => fetch(origin+'/review-api/'+route,{headers});
  const post = (route,body,headers) => fetch(origin+'/review-api/'+route,{
    method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),
  });
  const encodedId = encodeURIComponent(first.id);
  for (const path of ['questions','questions/'+encodedId,'export.csv','export.json','stages']) {
    const unauthed = await get(path);
    assert.equal(unauthed.status,401);
    assert.doesNotMatch(await unauthed.text(),/bank1/);
  }
  assert.equal((await post('login',{key},{origin:'http://example.test'})).status,403);
  assert.equal((await post('login',{key:'wrong'},{origin})).status,401);
  const login = await post('login',{key},{origin});
  assert.equal(login.status,200);
  const header = login.headers.get('set-cookie');
  assert.match(header,/HttpOnly; SameSite=Strict/);
  const cookie = header.split(';')[0];
  assert.equal((await get('questions/'+encodedId,{cookie})).status,200);
  assert.equal((await get('questions',{cookie,'sec-fetch-site':'cross-site'})).status,403);
  const selected = await get('questions?stage_id='+stage,{cookie});
  assert.equal((await selected.json()).total,2);
  const exportResult = await get('export.json',{cookie});
  assert.equal((await exportResult.json()).length,2);
  assert.match((await get('export.csv',{cookie})).headers.get('content-type'),/^text\/csv/);
  assert.equal((await post('reviews',{items:items(first),status:'needs_work',note:'見直し'},{origin,cookie})).status,200);
  assert.equal((await post('logout',{},{origin,cookie})).status,200);
  assert.equal((await get('questions',{cookie})).status,401);
});
