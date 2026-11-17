import { createHash } from 'node:crypto';
import { readdirSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const contentDigest=bytes=>createHash('sha256').update(bytes).digest('hex');

export function assertSampleBundle(bundle,version,adminEnabled=false) {
  const isolatedBundle = adminEnabled ? bundle.replaceAll('https://jxitjcfgavemddlbygzx.supabase.co','') : bundle;
  const bankIds=readdirSync('public/question-banks').filter(file=>file.endsWith('.json')).flatMap(file=>
    JSON.parse(readFileSync(resolve('public/question-banks',file),'utf8')).questions.map(question=>question.id));
  if (!bundle.includes(version) || !bundle.includes('kazu-sample-only-preview') ||
      bankIds.some(id=>bundle.includes('"'+id+'"')) ||
      /question-banks\/|question-drafts\/|\.supabase\.co|DB_PASSWORD_FILE|sb_secret_|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(isolatedBundle) ||
      (adminEnabled && (!bundle.includes('/functions/v1/question-admin/') || !bundle.includes('/kazu-no-tobira/admin')))) {
    throw new Error('The UI artifact did not satisfy the preview isolation checks.');
  }
}
