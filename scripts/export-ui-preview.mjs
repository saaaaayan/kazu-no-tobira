import { execFileSync } from 'node:child_process';
import { readdirSync,readFileSync,writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { isAbsolute,relative,resolve,sep } from 'node:path';
import { writePagesAdminEntry } from './pages-admin-entry.mjs';
import { assertSampleBundle,contentDigest } from './ui-preview-isolation.mjs';

const target=resolve(process.argv[2] ?? '.expo/ui-preview-web');
const [profile,...extra]=process.argv.slice(3);
if (extra.length || (profile && profile!=='--pages')) throw new Error('Unknown UI preview export profile.');
const pages=profile==='--pages';
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
const originalConfig=pages ? readFileSync('app.json') : undefined;
try {
  if (originalConfig) {
    const config=JSON.parse(originalConfig.toString('utf8'));
    config.expo.experiments={...config.expo.experiments,baseUrl:'/kazu-no-tobira'};
    writeFileSync('app.json',JSON.stringify(config));
  }
  execFileSync(process.execPath,[cli,'export','--platform','web','--output-dir',target],{
    stdio:'inherit',
    env:{...env,EXPO_NO_DOTENV:'1',KAZU_DB_ONLY_PREVIEW:'1',EXPO_PUBLIC_FOLDER:'.expo/ui-preview-empty-public',
      EXPO_PUBLIC_KAZU_UI_PREVIEW:'1',EXPO_PUBLIC_KAZU_UI_PREVIEW_SHA:version,
      EXPO_PUBLIC_KAZU_ONLINE_REVIEW:pages?'1':'0'},
  });
} finally {
  if (originalConfig) writeFileSync('app.json',originalConfig);
}

const allowed=new Set(['index.html','metadata.json']);
const files=readdirSync(target,{recursive:true,withFileTypes:true}).filter(entry=>!entry.isDirectory())
  .map(entry=>relative(target,resolve(entry.parentPath,entry.name)).replaceAll('\\','/'));
if (files.some(file=>!allowed.has(file) && !/^_expo\/static\/js\/web\/[A-Za-z0-9._-]+\.js$/.test(file))) {
  throw new Error('Unexpected file in the sample-only preview artifact.');
}
const entries=files.filter(file=>file.endsWith('.js'));
if (entries.length!==1) throw new Error('The sample-only preview must have one entry bundle.');
const [entry]=entries;
const bundle=readFileSync(resolve(target,entry));
assertSampleBundle(bundle.toString('utf8'),version,pages);
const index=resolve(target,'index.html');
if (pages) writePagesAdminEntry(target);
else writeFileSync(index,readFileSync(index,'utf8').replace('<head>',
  `<head><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">`));
writeFileSync(resolve(target,'version.json'),JSON.stringify({
  version,profile:'ui-preview',indexSha256:contentDigest(readFileSync(index)),entrySha256:contentDigest(bundle),
  ...(pages ? {adminSha256:contentDigest(readFileSync(resolve(target,'admin/index.html')))} : {}),
})+'\n');
console.log('Verified sample-only preview artifact at '+version);
