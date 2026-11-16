import pg from 'pg';
import { readFileSync } from 'node:fs';

const project = 'jxitjcfgavemddlbygzx';

export function openSupabasePool(role, env=process.env) {
  if (!['svc_kazu_import','svc_kazu_review'].includes(role)) throw new Error('Unknown question database role.');
  const { KAZU_QUESTION_DB_HOST: host, KAZU_QUESTION_DB_PASSWORD_FILE: passwordFile, KAZU_QUESTION_DB_CA_FILE: caFile }=env;
  if (!/^(?:db\.jxitjcfgavemddlbygzx\.supabase\.co|aws-[01]-ap-northeast-1\.pooler\.supabase\.com)$/.test(host ?? '')) {
    throw new Error('Configure the dedicated Kazu Supabase database hostname.');
  }
  if (!passwordFile) throw new Error('Configure KAZU_QUESTION_DB_PASSWORD_FILE on the server.');
  if (!caFile) throw new Error('Configure KAZU_QUESTION_DB_CA_FILE with the Supabase dashboard CA.');
  const ca=readFileSync(caFile,'utf8');
  const password=readFileSync(passwordFile,'utf8').trim();
  if (!/^[0-9a-f]{64}$/i.test(password)) throw new Error('Invalid question database credential format.');
  const user=host.startsWith('db.') ? role : role+'.'+project;
  const pool=new pg.Pool({
    host,port:5432,user,password,database:'postgres',ssl:{ca,rejectUnauthorized:true},
    max:3,connectionTimeoutMillis:8000,idleTimeoutMillis:30000,statement_timeout:30000,
    application_name:'kazu-question-catalog',
  });
  pool.on('error', () => console.error('Inactive question database connection closed.'));
  return pool;
}
