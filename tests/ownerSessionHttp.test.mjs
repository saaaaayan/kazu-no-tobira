import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { request } from 'node:http';
import { createQuestionReviewServer } from '../server/question-review-http.mjs';

test('HTTPS admin mode rejects preview, rejects regular users and expires cookies',async t=>{
  const publicOrigin='https://admin.example.test';
  let active=true,revoked=false;
  const ownerAuth={
    async login({email}) { return email==='owner@example.test' ? {subject:'owner',role:'question_admin',expires:Date.now()+60000} : null; },
    async validate() { return active; },
    async logout() { revoked=true; },
  };
  assert.throws(()=>createQuestionReviewServer({publicOrigin,ownerAuth,preview:{}}));
  assert.throws(()=>createQuestionReviewServer({publicOrigin,adminKey:'a'.repeat(64)}));
  let edited=0;
  const server=createQuestionReviewServer({publicOrigin,ownerAuth,store:{
    async editQuestion(payload,actor) {
      assert.equal(payload.id,'fixture');
      assert.equal(actor,'owner');
      edited++;
      return {changed:true};
    },
  }});
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port+'/review-api/';
  const headers={host:'admin.example.test','x-forwarded-proto':'https',origin:publicOrigin,'content-type':'application/json'};
  function call(path,options) {
    return new Promise((resolve,reject)=>{
      const sent=request(base+path,options,res=>{
        res.resume();
        res.on('end',()=>resolve({status:res.statusCode,headers:{
          get:name=>res.headers[name]?.[0],
        }}));
      });
      sent.on('error',reject);
      sent.end(options.body);
    });
  }
  const post=(path,body,extra)=>call(path,{method:'POST',body:JSON.stringify(body),headers:{...headers,...extra}});
  assert.equal((await post('revisions',{id:'fixture'})).status,401);
  assert.equal((await post('login',{email:'regular@example.test'})).status,401);
  assert.equal((await post('login',{email:'owner@example.test'},{origin:'https://other.example.test'})).status,403);
  assert.equal((await post('login',{email:'owner@example.test'},{'x-forwarded-proto':'http'})).status,403);
  const login=await post('login',{email:'owner@example.test'});
  const cookie=login.headers.get('set-cookie');
  assert.match(cookie,/^__Host-kazu_question_admin=.*; Path=\/; HttpOnly; SameSite=Strict; Max-Age=\d+; Secure$/);
  const session={...headers,cookie:cookie.split(';')[0]};
  assert.equal((await call('session',{headers:session})).status,200);
  assert.equal((await post('revisions',{id:'fixture'},{cookie:session.cookie,origin:'https://other.example.test'})).status,403);
  assert.equal((await post('revisions',{id:'fixture'},{cookie:session.cookie})).status,200);
  active=false;
  assert.equal((await post('revisions',{id:'fixture'},{cookie:session.cookie})).status,401);
  assert.equal(edited,1);
  assert.equal((await call('session',{headers:session})).status,401);
  active=true;
  assert.equal((await call('session',{headers:session})).status,401);
  const second=await post('login',{email:'owner@example.test'});
  const secondCookie=second.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('logout',{},{cookie:secondCookie})).status,200);
  assert.equal(revoked,true);
  assert.equal((await call('session',{headers:{...headers,cookie:secondCookie}})).status,401);
});
