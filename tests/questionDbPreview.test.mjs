import assert from 'node:assert/strict';
import test from 'node:test';
import { previewApiOrigin, fetchPreviewRound, previewDeckChanged } from '../src/domain/questionDbPreview.ts';

test('Supabase game preview stays on the local development origin', () => {
  const preview=new URL('http://127.0.0.1:8125/game-preview');
  assert.equal(previewApiOrigin(preview,true),preview.origin);
  assert.equal(previewApiOrigin(preview,false),undefined);
  assert.equal(previewApiOrigin(new URL('https://example.test/game-preview'),true),undefined);
  assert.equal(previewApiOrigin(new URL('http://127.0.0.1:8125/'),true),undefined);
  assert.equal(previewApiOrigin(undefined,true,'8125'),preview.origin);
  assert.equal(previewApiOrigin(undefined,false,'8125'),undefined);
  assert.equal(previewApiOrigin(undefined,true,'99999'),undefined);
});

test('server errors may retry, but moderation conflicts invalidate the current deck', async t => {
  const origin='http://127.0.0.1:8125';
  let calls=0;
  const fetch=t.mock.method(globalThis,'fetch',async () => {
    calls++;
    if (calls===1) return new Response(JSON.stringify({error:'retry'}),{status:503});
    return new Response(JSON.stringify({error:'deck changed'}),{status:409});
  });
  const ids=['e1.forest:bank1:example'];
  await assert.rejects(fetchPreviewRound(origin,'e1.forest',ids),previewDeckChanged);
  assert.equal(fetch.mock.callCount(),2);
  assert.equal(fetch.mock.calls[0].arguments[1].cache,'no-store');
});
