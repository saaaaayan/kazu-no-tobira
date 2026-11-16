import { readFile,realpath,stat } from 'node:fs/promises';
import { isAbsolute,relative,resolve,sep } from 'node:path';
import { intakeDraftBank } from '../server/draft-intake.mjs';
import { openSupabasePool } from '../server/supabase-postgres.mjs';

const [filename,flag,...extra]=process.argv.slice(2);
if (!filename || extra.length || (flag && flag!=='--write')) {
  throw new Error('Usage: pnpm beta:intake question-drafts/<bank.json> [--write]');
}
const file=await realpath(filename);
const privateRoot=await realpath(resolve('question-drafts'));
const path=relative(privateRoot,file);
if (!path || path==='..' || path.startsWith('..'+sep) || isAbsolute(path) || !path.endsWith('.json')) {
  throw new Error('Use an ignored local question-drafts JSON file.');
}
const info=await stat(file);
if (!info.isFile() || info.size>2_000_000) throw new Error('Use a draft JSON file of at most 2 MB.');
let bank;
try { bank=JSON.parse(await readFile(file,'utf8')); }
catch { throw new Error('原稿をJSONとして読み込めません。'); }
const write=flag==='--write';
const pool=openSupabasePool(write?'svc_kazu_import':'svc_kazu_review');
try {
  const result=await intakeDraftBank(pool,bank,{write});
  console.log(JSON.stringify({mode:write?'registered':'read-only',...result},null,2));
} catch (error) {
  // PostgreSQL details may include the attempted row, including solutions.
  if (error.code && /^[A-Z0-9]{5}$/.test(error.code)) throw new Error('DB operation failed (SQLSTATE '+error.code+').');
  throw error;
} finally { await pool.end(); }
