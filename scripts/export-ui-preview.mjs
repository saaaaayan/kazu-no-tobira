import { execFileSync } from 'node:child_process';
import { readdirSync,readFileSync,writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { isAbsolute,relative,resolve,sep } from 'node:path';

const target=resolve(process.argv[2] ?? '.expo/ui-preview-web');
const inside=relative(resolve('.expo'),target);
if (!inside || isAbsolute(inside) || inside==='..' || inside.startsWith('..'+sep) || existsSync(target)) {
  throw new Error('Choose a new output directory inside .expo.');
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const version=git('rev-parse','HEAD');
if (git('status','--porcelain') || !/^[a-f0-9]{40}$/.test(version)) {
  throw new Error('Build a clean commit so the preview version identifies its source.');
}
const cli=createRequire(import.meta.url).resolve('expo/bin/cli');
const env=Object.fromEntries(Object.entries(process.env).filter(([name])=>!/^(?:EXPO_|KAZU_|SUPABASE_|DATABASE_URL$)/i.test(name)));
execFileSync(process.execPath,[cli,'export','--platform','web','--output-dir',target],{
  stdio:'inherit',
  env:{...env,EXPO_NO_DOTENV:'1',KAZU_DB_ONLY_PREVIEW:'1',EXPO_PUBLIC_FOLDER:'.expo/ui-preview-empty-public',
    EXPO_PUBLIC_KAZU_UI_PREVIEW:'1',EXPO_PUBLIC_KAZU_UI_PREVIEW_SHA:version},
});

const allowed=new Set(['index.html','metadata.json']);
const files=readdirSync(target,{recursive:true,withFileTypes:true}).filter(entry=>!entry.isDirectory())
  .map(entry=>relative(target,resolve(entry.parentPath,entry.name)).replaceAll('\\','/'));
if (files.some(file=>!allowed.has(file) && !/^_expo\/static\/js\/web\/[A-Za-z0-9._-]+\.js$/.test(file))) {
  throw new Error('Unexpected file in the sample-only preview artifact.');
}
const bundles=files.filter(file=>file.endsWith('.js')).map(file=>readFileSync(resolve(target,file),'utf8'));
const bankIds=readdirSync('public/question-banks').filter(file=>file.endsWith('.json')).flatMap(file=>
  JSON.parse(readFileSync(resolve('public/question-banks',file),'utf8')).questions.map(question=>question.id));
if (!bundles.some(bundle=>bundle.includes(version) && bundle.includes('kazu-sample-only-preview')) ||
    bundles.some(bundle=>bankIds.some(id=>bundle.includes('"' + id + '"')) ||
      /question-banks\/|question-drafts\/|\.supabase\.co|DB_PASSWORD_FILE/.test(bundle))) {
  throw new Error('The UI artifact did not satisfy the preview isolation checks.');
}
const index=resolve(target,'index.html');
writeFileSync(index,readFileSync(index,'utf8').replace('<head>',
  `<head><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">`));
writeFileSync(resolve(target,'version.json'),JSON.stringify({version,profile:'ui-preview'})+'\n');
console.log('Verified sample-only preview artifact at '+version);
