import { randomBytes } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { openQuestionReviewStore } from '../server/question-review-store.mjs';
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
const keyFile = resolve(data,'admin-key.txt');
try {
  await writeFile(keyFile,randomBytes(32).toString('hex')+'\n',{flag:'wx',mode:0o600});
} catch (problem) {
  if (problem.code !== 'EEXIST') throw problem;
}
const key = (await readFile(keyFile,'utf8')).trim();
const store = openQuestionReviewStore(resolve(data,'questions.sqlite'),new URL('../public/question-banks/',import.meta.url),
  new URL('../question-drafts/',import.meta.url));
const registered = store.importBanks();
const types = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.jpg':'image/jpeg',
};
const allowed = /^\/(?:_expo\/static\/|assets\/)/;
const server = createQuestionReviewServer({
  store,port,adminKey:key,
  async assets(path,response) {
    const route = path === '/admin' || path === '/' ? '/index.html' : decodeURIComponent(path);
    if (route !== '/index.html' && (!allowed.test(route) || !Object.hasOwn(types,extname(route)))) return false;
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
server.on('close',()=>store.db.close());
server.listen(port,'127.0.0.1',()=> {
  console.log('Question review: http://127.0.0.1:'+port+'/admin');
  console.log(registered+' registered questions');
});
