import assert from 'node:assert/strict';
import test from 'node:test';
import {createSupabaseOwnerAuth} from '../server/supabase-owner-auth.mjs';

test('verified Supabase user must be allowed during sign-in and on later requests',async t=>{
  let active=false;
  let identity='owner-id';
  const response=(request)=>{
    if (request.includes('/token?')) return {access_token:'test-token', user:{id:identity},expires_at:Math.floor(Date.now()/1000)+600};
    return {id:identity};
  };
  const fetch=t.mock.method(globalThis,'fetch',async request=>Response.json(response(request)));
  const auth=createSupabaseOwnerAuth('sb_publishable_test',id=>id==='owner-id' && active);
  const input={email:'owner@example.test',password:'test'};
  assert.equal(await auth.login(input),null);
  active=true;
  const session=await auth.login(input);
  assert.equal(session.subject,'owner-id');
  assert.equal(await auth.validate(session),true);
  assert.equal(fetch.mock.calls.at(-1).arguments[1].headers.Authorization,'Bearer test-token');
  identity='someone-else';
  assert.equal(await auth.validate(session),false);
  identity='owner-id';
  active=false;
  assert.equal(await auth.validate(session),false);
});
