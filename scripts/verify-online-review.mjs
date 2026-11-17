import assert from 'node:assert/strict';

const api = 'https://jxitjcfgavemddlbygzx.supabase.co/functions/v1/question-admin/';
const pagesOrigin = 'https://saaaaayan.github.io';

function check(path, { method = 'GET', origin = pagesOrigin } = {}) {
  return fetch(api + path, {
    method, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000),
    headers: { Origin: origin, ...(method === 'OPTIONS' ? {
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization, apikey',
    } : {}) },
  });
}

const [anonymous, preflight, otherOrigin] = await Promise.all([
  check('questions'), check('session', { method: 'OPTIONS' }),
  check('session', { method: 'OPTIONS', origin: 'https://example.com' }),
]);
assert.equal(anonymous.status, 401, 'The private question API must reject unauthenticated requests.');
assert.equal(preflight.status, 204, 'The Pages frontend must be able to contact the private API.');
assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), pagesOrigin);
assert.equal(otherOrigin.status, 403, 'The private API must reject other browser origins.');
console.log('Verified online review authorization boundary and allowed Pages origin.');
