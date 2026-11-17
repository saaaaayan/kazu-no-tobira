import assert from 'node:assert/strict';
import test from 'node:test';
import { onlineQuestionReview } from '../server/online-question-review.mjs';
import { restrictedReviewPool } from '../server/restricted-review-pool.mjs';

const origin = 'https://saaaaayan.github.io';

test('Online review protects private reads and writes and uses the server identity for history', async () => {
  let calls = 0;
  let revoked = false;
  const handler = onlineQuestionReview({
    auth: {
      async authenticate(token) {
        if (token === 'ordinary') return { subject: 'reader', isAdministrator: false };
        if (token === 'owner') return { subject: 'confirmed-owner', isAdministrator: !revoked };
        return null;
      },
      async logout() { revoked = true; },
    },
    store: {
      async list() { calls++; return { rows: ['private question'] }; },
      async editQuestion(body, actor) {
        calls++;
        assert.equal(actor, 'confirmed-owner');
        assert.equal(body.id, 'preschool.n01:example');
        return { changed: true };
      },
    },
  });
  function request(path, token, { from = origin, method = 'GET', body } = {}) {
    const headers = { Origin: from };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body) headers['Content-Type'] = 'application/json';
    return handler(new Request('https://api.example/functions/v1/question-admin/' + path, {
      headers, method, body: body && JSON.stringify(body),
    }));
  }
  const preflight = await request('session', undefined, { method: 'OPTIONS' });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal((await request('questions', undefined)).status, 401);
  assert.equal((await request('questions', 'invalid')).status, 401);
  assert.equal((await request('questions', 'ordinary')).status, 403);
  assert.equal((await request('export.json', 'ordinary')).status, 403);
  assert.equal((await request('questions', 'owner', { from: 'https://example.com' })).status, 403);
  assert.equal((await request('revisions', 'ordinary', { method: 'POST', body: {} })).status, 403);
  assert.equal(calls, 0);
  const list = await request('questions', 'owner');
  assert.equal(list.status, 200);
  assert.equal(list.headers.get('Cache-Control'), 'private, no-store');
  const edit = await request('revisions', 'owner', {
    method: 'POST', body: { id: 'preschool.n01:example', actor: 'forged-client-actor' },
  });
  assert.equal(edit.status, 200);
  assert.equal(calls, 2);
  assert.equal((await request('logout', 'owner', { method: 'POST', body: {} })).status, 200);
  assert.equal((await request('questions', 'owner')).status, 403);
  assert.equal(calls, 2);
});

test('Hosted review runs reads under the explicit review role and discards failed transactions', async () => {
  const queries = [];
  let discarded = false;
  const pool = restrictedReviewPool({
    async connect() {
      return {
        async query(sql) {
          queries.push(sql);
          if (sql === 'failed query') throw new Error('database failure');
          return { rows: [] };
        },
        release(destroy) { discarded = destroy; },
      };
    },
  });
  await pool.query('select');
  assert.deepEqual(queries, ['begin', 'set local role kazu_catalog_review', "set local statement_timeout = '12s'", 'select', 'commit']);
  assert.equal(discarded, false);
  await assert.rejects(pool.query('failed query'), /database failure/);
  assert.equal(discarded, true);
});
