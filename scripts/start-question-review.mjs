import { randomBytes } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { openQuestionReviewStore } from '../server/question-review-store.mjs';
import { openSupabasePool } from '../server/supabase-postgres.mjs';
import { createSupabaseQuestionReview } from '../server/supabase-question-review.mjs';
import { createSupabaseOwnerAuth } from '../server/supabase-owner-auth.mjs';
import { liveQuestionRepository,liveQuestionService } from '../server/live-question-service.mjs';
import { questionDeck, questionRound } from '../server/question-round-selection.mjs';
import { createQuestionReviewServer } from '../server/question-review-http.mjs';

const [directory, portArg = '8123', dataDirectory = '.expo/question-review-private'] = process.argv.slice(2);
const port = Number(portArg);
if (!directory || !Number.isSafeInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Usage: node scripts/start-question-review.mjs <dev-export-directory> [port] [data-directory]');
}
const root = await realpath(directory);
const data = resolve(dataDirectory);
const location = relative(root,data);
if (!location || (!(location==='..' || location.startsWith('..'+sep)) && !isAbsolute(location))) {
  throw new Error('Place the admin database and credentials outside the web export directory.');
}
await mkdir(data,{recursive:true,mode:0o700});
const keyForAuth=process.env.KAZU_QUESTION_AUTH_PUBLISHABLE_KEY;
const publicOrigin=process.env.KAZU_REVIEW_HTTPS_ORIGIN;
if (publicOrigin && !keyForAuth) throw new Error('HTTPS review requires Supabase Auth.');
const keyFile = resolve(data,'admin-key.txt');
if (!keyForAuth) try {
  await writeFile(keyFile,randomBytes(32).toString('hex')+'\n',{flag:'wx',mode:0o600});
} catch (problem) {
  if (problem.code !== 'EEXIST') throw problem;
}
const key = keyForAuth ? undefined : (await readFile(keyFile,'utf8')).trim();
const supabase=Boolean(process.env.KAZU_QUESTION_DB_HOST);
const pool=supabase ? openSupabasePool('svc_kazu_review') : undefined;
const store = pool ? createSupabaseQuestionReview(pool) : openQuestionReviewStore(resolve(data,'questions.sqlite'),new URL('../public/question-banks/',import.meta.url),
  new URL('../question-drafts/',import.meta.url));
const registered = await (pool ? store.stageTotals().then(stages=>stages.reduce((n,stage)=>n+stage.registered,0)) : store.importBanks());
if (keyForAuth && !pool) throw new Error('Supabase Auth requires a Supabase review store.');
const ownerAuth=keyForAuth ? createSupabaseOwnerAuth(keyForAuth,store.isAdministratorSession) : undefined;
const types = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.jpg':'image/jpeg',
};
const allowed = /^\/(?:_expo\/static\/|assets\/)/;
const server = createQuestionReviewServer({
  store,port,adminKey:key,ownerAuth,publicOrigin,allowedGameOrigin:process.env.KAZU_GAME_WEB_ORIGIN,
  game:pool ? liveQuestionService({...liveQuestionRepository(pool,{preview:!publicOrigin && !keyForAuth})}) : undefined,
  preview: pool && !publicOrigin && !keyForAuth ? {
    deck:stageId=>questionDeck(pool,stageId,{preview:true,premium:true}),
    round:(stageId,ids)=>questionRound(pool,stageId,ids,{preview:true,premium:true}),
  } : undefined,
  async assets(path,response) {
    const route = path === '/admin' || path === '/' || (pool && !keyForAuth && path==='/play-db') || (pool && !keyForAuth && path === '/game-preview') ? '/index.html' : decodeURIComponent(path);
    if (route !== '/index.html' && route !== '/version.json' && (!allowed.test(route) || !Object.hasOwn(types,extname(route)))) return false;
    try {
      const file = await realpath(resolve(root,'.'+route));
      const relativeFile = relative(root,file);
      if ((relativeFile==='..' || relativeFile.startsWith('..'+sep)) || isAbsolute(relativeFile)) return false;
      const body = await readFile(file);
      response.writeHead(200,{'Content-Type':types[extname(file)]}).end(body);
      return true;
    } catch { return false; }
  },
});
server.on('close',()=>pool ? void pool.end() : store.db.close());
server.listen(port,'127.0.0.1',()=> {
  console.log('Question review: http://127.0.0.1:'+port+'/admin');
  console.log(registered+' registered questions via '+(pool ? 'Supabase' : 'SQLite'));
  if (pool && !keyForAuth) console.log('Game preview: http://127.0.0.1:'+port+'/game-preview');
});
