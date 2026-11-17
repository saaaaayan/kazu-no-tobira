import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { once } from 'node:events';
import { isIP } from 'node:net';
import { createServer } from 'node:http';

const cookieName = 'kazu_question_admin';
const sessionLifetime = 60 * 60 * 1000;
const bodyLimit = 64 * 1024;
const hash = text => createHash('sha256').update(text).digest();
const error = (status,message) => Object.assign(new Error(message), { status });

async function readJson(request) {
  if (request.headers['content-type'] !== 'application/json') throw error(415,'JSON が必要です。');
  if (Number(request.headers['content-length']) > bodyLimit) throw error(413,'データが大きすぎます。');
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > bodyLimit) throw error(413,'データが大きすぎます。');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw error(400,'入力を確認してください。');
  }
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}

async function exportQuestions(response, store, params, format) {
  const headers = ['id','stage_id','island','unit','difficulty','format','stem','status','note','reason','payload'];
  response.setHeader('Content-Type',format==='csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8');
  response.setHeader('Content-Disposition','attachment; filename="kazu-question-review.'+format+'"');
  const write = async data => {
    if (!response.write(data)) await once(response,'drain',{ signal:AbortSignal.timeout(30000) });
  };
  let first = true;
  await write(format==='csv' ? '\uFEFF'+headers.join(',')+'\r\n' : '[');
  for await (const { payload, ...row } of store.exportRows(params)) {
    if (response.destroyed) return;
    if (format==='csv') await write([...headers.slice(0,-1).map(key => csvCell(row[key])),csvCell(payload)].join(',')+'\r\n');
    else await write((first ? '' : ',')+JSON.stringify({...row,question:JSON.parse(payload)}));
    first = false;
  }
  response.end(format==='json' ? ']\n' : '');
}

// The loopback instance is a private review environment. Production auth/entitlement is not inferred from this session.
export function createQuestionReviewServer({ store, port, adminKey, ownerAuth, assets, preview, game, publicOrigin, allowedGameOrigin, test = false }) {
  const secureOrigin = publicOrigin ? new URL(publicOrigin) : null;
  if (secureOrigin && (secureOrigin.protocol!=='https:' || secureOrigin.origin!==publicOrigin || !ownerAuth || preview)) {
    throw new Error('HTTPS review requires Supabase Auth and prohibits the preview API.');
  }
  if (allowedGameOrigin && (!secureOrigin || new URL(allowedGameOrigin).protocol!=='https:' || new URL(allowedGameOrigin).origin!==allowedGameOrigin)) {
    throw new Error('An external game origin requires HTTPS and an exact HTTPS origin.');
  }
  if (!ownerAuth && !/^[0-9a-f]{64}$/i.test(adminKey ?? '')) throw new Error('A random 256-bit admin key is required.');
  const secret = ownerAuth ? null : hash(adminKey);
  const sessions = new Map();
  const roundAttempts=new Map();
  const admin = { subject: 'owner', role: 'question_admin' };
  const name = secureOrigin ? '__Host-'+cookieName : cookieName;
  const cookie = (value,maxAge) => `${name}=${value}; Path=${secureOrigin?'/':'/review-api'}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureOrigin?'; Secure':''}`;
  let failed = 0;
  let lockUntil = 0;
  const server = createServer({ requestTimeout: 15000, headersTimeout: 10000 }, async (request,response) => {
    const host = secureOrigin?.host ?? '127.0.0.1:'+(test ? server.address().port : port);
    const origin = secureOrigin?.origin ?? 'http://'+host;
    response.setHeader('Cache-Control','private, no-store');
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('X-Frame-Options','DENY');
    response.setHeader('Referrer-Policy','no-referrer');
    const json = (status,data) => response.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}).end(JSON.stringify(data));
    try {
      if (request.headers.host !== host || (secureOrigin && request.headers['x-forwarded-proto']!=='https')) throw error(403,'無効なホストです。');
      const url = new URL(request.url,origin);
      const gamePath=game && ['/play-api/round','/play-api/answer','/play-api/hint'].includes(url.pathname);
      const externalGame=Boolean(gamePath && allowedGameOrigin && request.headers.origin===allowedGameOrigin);
      if (request.headers['sec-fetch-site']==='cross-site' && !externalGame) throw error(403,'同じサイトから開いてください。');
      if (externalGame) {
        response.setHeader('Access-Control-Allow-Origin',allowedGameOrigin);
        response.setHeader('Vary','Origin');
        if (request.method==='OPTIONS' && request.headers['access-control-request-method']==='POST') {
          return response.writeHead(204,{'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}).end();
        }
      }
      if (request.method === 'GET' && !url.pathname.startsWith('/review-api/') && assets) {
        if (await assets(url.pathname,response)) return;
      }
      if (request.method !== 'GET' && request.headers.origin !== origin && !externalGame) throw error(403,'送信元を確認できません。');
      const now = Date.now();
      for (const [token,session] of sessions) if (session.expires <= now) sessions.delete(token);
      const sessionToken = request.headers.cookie?.split(';').map(item=>item.trim())
        .find(item=>item.startsWith(name+'='))?.slice(name.length+1);
      const sessionId = sessionToken && hash(sessionToken).toString('hex');
      const session = sessions.get(sessionId);

      if (request.method === 'GET' && url.pathname === '/review-api/login-mode') {
        return json(200,{ mode:ownerAuth ? 'supabase' : 'local' });
      }
      if (gamePath && request.method==='POST') {
        const starting=url.pathname.endsWith('/round');
        if (starting) {
          const forwarded=request.headers['x-real-ip'];
          const client=secureOrigin && typeof forwarded==='string' && isIP(forwarded) ? forwarded : request.socket.remoteAddress;
          const now=Date.now();
          for (const [address,bucket] of roundAttempts) if (bucket.until<=now) roundAttempts.delete(address);
          const bucket=roundAttempts.get(client) ?? {count:0,until:now+60000};
          if (bucket.count>=12 || (!roundAttempts.has(client) && roundAttempts.size>=4096)) {
            throw error(429,'少し時間をおいてから、もう一度お試しください。');
          }
          bucket.count++;
          roundAttempts.set(client,bucket);
        }
        const input=await readJson(request);
        return json(200,starting ? await game.start(input,undefined) : url.pathname.endsWith('/hint')
          ? await game.hint(input,undefined) : await game.grade(input,undefined));
      }
      if (preview && request.method==='POST' && ['/game-preview/deck','/game-preview/round'].includes(url.pathname)) {
        const {stageId,ids}=await readJson(request);
        const result=url.pathname.endsWith('/deck') ? await preview.deck(stageId) : await preview.round(stageId,ids);
        return json(200,result);
      }
      if (request.method === 'POST' && url.pathname === '/review-api/login') {
        if (now < lockUntil) throw error(429,'時間をおいて再試行してください。');
        const payload = await readJson(request);
        const { key } = payload;
        const identity = ownerAuth ? await ownerAuth.login(payload)
          : typeof key==='string' && key.length<=128 && timingSafeEqual(secret,hash(key)) ? admin : null;
        if (!identity) {
          failed++;
          if (failed >= 5) {
            lockUntil = Date.now() + 60_000;
            failed = 0;
          }
          throw error(401,'管理者のログイン情報を確認してください。');
        }
        failed = 0;
        if (sessionId) sessions.delete(sessionId);
        if (sessions.size >= 20) sessions.delete(sessions.keys().next().value);
        const token = randomBytes(32).toString('hex');
        const expires=Math.min(now+sessionLifetime,identity.expires ?? Infinity);
        sessions.set(hash(token).toString('hex'),{...identity,expires});
        response.setHeader('Set-Cookie',cookie(token,Math.max(0,Math.floor((expires-now)/1000))));
        return json(200,{ role:identity.role });
      }

      if (request.method === 'POST' && url.pathname === '/review-api/logout') {
        sessions.delete(sessionId);
        response.setHeader('Set-Cookie',cookie('',0));
        if (ownerAuth && session) {
          try { await ownerAuth.logout(session); }
          catch { return json(503,{error:'この画面からログアウトしました。認証サービスのセッション終了を確認できませんでした。'}); }
        }
        return json(200,{ signedOut:true });
      }
      if (session?.role !== 'question_admin' || (ownerAuth && !await ownerAuth.validate(session))) {
        if (sessionId) sessions.delete(sessionId);
        response.setHeader('Set-Cookie',cookie('',0));
        throw error(401,'管理者ログインが必要です。');
      }
      if (request.method === 'GET' && url.pathname === '/review-api/session') return json(200,{ role:session.role });
      if (request.method === 'GET' && url.pathname === '/review-api/questions') return json(200,await store.list(url.searchParams));
      if (request.method === 'GET' && url.pathname === '/review-api/stages') return json(200,await store.stageTotals());
      if (request.method === 'GET' && url.pathname.startsWith('/review-api/questions/')) {
        const id = decodeURIComponent(url.pathname.slice('/review-api/questions/'.length));
        const revision = url.searchParams.get('revision');
        const value = await (revision ? store.historicalRevision(id,revision) : store.detail(id));
        if (!value) throw error(404,'問題が見つかりません。');
        return json(200,value);
      }
      if (request.method === 'POST' && url.pathname === '/review-api/reviews') {
        return json(200,await store.review(await readJson(request),session.subject));
      }
      if (request.method === 'POST' && url.pathname === '/review-api/revisions' && store.editQuestion) {
        return json(200,await store.editQuestion(await readJson(request),session.subject));
      }
      if (request.method === 'GET' && ['/review-api/export.csv','/review-api/export.json'].includes(url.pathname)) {
        await exportQuestions(response,store,url.searchParams,url.pathname.split('.').at(-1));
        return;
      }
      throw error(404,'ページが見つかりません。');
    } catch (problem) {
      if (response.destroyed || response.headersSent) { response.destroy(); return; }
      if (!problem.status) console.error('Question review request failed:',problem.code ?? problem.name);
      json(problem.status ?? 500,{error: problem.status ? problem.message : '審査サーバーの処理に失敗しました。'});
    }
  });
  return server;
}
