import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessFeature, canAccessStage, freeAccess } from '../src/domain/accessPlan.ts';
import { readServerEntitlement } from '../src/domain/serverEntitlement.ts';
import { worldStageAction } from '../src/domain/playMode.ts';
import { emptyProgress } from '../src/domain/progress.ts';
import { worldIslands, worldGrades } from '../src/domain/worldCatalog.ts';

const premium = { plan: 'premium', verifiedUntil: Infinity };

test('通常の600地点は全学年でEXを攻略せずに進める', () => {
  const progress = { ...emptyProgress, stages:{}, lessons:{ 'e1.number-order':{ completedAt:'2026-11-16', page:10, checks:{} } } };
  let count = 0;
  for (const island of worldGrades) {
    for (const stage of island.stages.filter(stage => stage.kind === 'normal')) {
      assert.equal(worldStageAction('normal', progress, stage, freeAccess), 'play', stage.id);
      progress.stages[stage.id] = { clearedAt: '2026-11-16' };
      count++;
    }
  }
  assert.equal(count, 600);
});

test('有料地点と機能をテストモードや旧クリアで解放できない', () => {
  const all = worldIslands.flatMap(island => island.stages);
  assert.equal(all.filter(stage => canAccessStage(freeAccess, stage)).length, 600);
  assert.equal(all.filter(stage => canAccessStage(premium, stage)).length, 845);
  for (const stage of all.filter(stage => !canAccessStage(freeAccess, stage))) {
    const progress = { ...emptyProgress, stages:{ [stage.id]:{ clearedAt:'2026-11-16' } } };
    for (const mode of ['normal','test']) assert.equal(worldStageAction(mode,progress,stage,freeAccess),'premium',stage.id);
  }
  assert.equal(canAccessFeature(freeAccess,'unitLessons'),true);
  assert.equal(canAccessFeature(freeAccess,'workedSolutions'),false);
  assert.equal(canAccessFeature(premium,'workedSolutions'),true);
  assert.equal(canAccessFeature({plan:'premium',verifiedUntil:0},'workedSolutions'),false);
});

test('本番の権限はHTTPSのサーバー応答と有効期限に従う', async t => {
  const future = new Date(Date.now()+60_000).toISOString();
  let response = new Response(JSON.stringify({ premium:true, expiresAt:future }));
  const fetch = t.mock.method(globalThis,'fetch',async () => response);
  const signal = new AbortController().signal;
  assert.deepEqual(await readServerEntitlement(undefined,signal),freeAccess);
  assert.deepEqual(await readServerEntitlement('http://example.test',signal),freeAccess);
  assert.equal(fetch.mock.callCount(),0);
  assert.deepEqual(await readServerEntitlement('https://example.test/entitlement',signal),{plan:'premium',verifiedUntil:Date.parse(future)});
  assert.equal(fetch.mock.calls[0].arguments[1].credentials,'include');
  response = new Response(JSON.stringify({premium:true,expiresAt:'2000-01-01T00:00:00Z'}));
  assert.deepEqual(await readServerEntitlement('https://example.test/entitlement',signal),freeAccess);
  response = new Response('Unauthorized',{status:401});
  assert.deepEqual(await readServerEntitlement('https://example.test/entitlement',signal),freeAccess);
});
