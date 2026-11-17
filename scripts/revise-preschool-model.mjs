import { readFile,realpath,stat } from 'node:fs/promises';
import { isAbsolute,relative,resolve,sep } from 'node:path';
import { openSupabasePool } from '../server/supabase-postgres.mjs';
import { createSupabaseQuestionReview } from '../server/supabase-question-review.mjs';

const [filename,flag,...extra]=process.argv.slice(2);
if (!filename || extra.length || (flag && flag!=='--apply')) {
  throw new Error('Usage: node scripts/revise-preschool-model.mjs question-drafts/<file.json> [--apply]');
}
const path=await realpath(filename);
const source=relative(await realpath(resolve('question-drafts')),path);
if (!source || source==='..' || source.startsWith('..'+sep) || isAbsolute(source) || !source.endsWith('.json')) {
  throw new Error('Use a private JSON file inside question-drafts.');
}
const info=await stat(path);
if (!info.isFile() || info.size>150000) throw new Error('Invalid draft size.');
const draft=JSON.parse(await readFile(path,'utf8'));
const pool=openSupabasePool('svc_kazu_review');
try {
  const store=createSupabaseQuestionReview(pool);
  const rollbackOnly=flag!=='--apply';
  const result=await store.revisePreschoolModel(draft,'model-draft-operator',{rollbackOnly});
  console.log(JSON.stringify({mode:rollbackOnly?'rolled-back':'saved-as-unreviewed',...result}));
} catch (error) {
  if (error.code && /^[A-Z0-9]{5}$/.test(error.code)) throw new Error('Database rejected the revision (SQLSTATE '+error.code+').');
  throw error;
} finally { await pool.end(); }
