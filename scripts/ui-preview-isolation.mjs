import { createHash } from 'node:crypto';
import { readdirSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const contentDigest=bytes=>createHash('sha256').update(bytes).digest('hex');

export function assertSampleBundle(bundle,version) {
  const bankIds=readdirSync('public/question-banks').filter(file=>file.endsWith('.json')).flatMap(file=>
    JSON.parse(readFileSync(resolve('public/question-banks',file),'utf8')).questions.map(question=>question.id));
  if (!bundle.includes(version) || !bundle.includes('kazu-sample-only-preview') ||
      bankIds.some(id=>bundle.includes('"'+id+'"')) ||
      /question-banks\/|question-drafts\/|\.supabase\.co|DB_PASSWORD_FILE/.test(bundle)) {
    throw new Error('The UI artifact did not satisfy the preview isolation checks.');
  }
}
