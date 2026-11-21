import { execFileSync } from 'node:child_process';
import { readdirSync,readFileSync,writeFileSync,mkdirSync,copyFileSync } from 'node:fs';
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
    env:{...env,EXPO_NO_DOTENV:'1',KAZU_DB_ONLY_PREVIEW:'1',KAZU_PUBLIC_BANK_FILES:'1',
      EXPO_PUBLIC_FOLDER:'.expo/ui-preview-empty-public',
      EXPO_PUBLIC_KAZU_UI_PREVIEW:'1',EXPO_PUBLIC_KAZU_UI_PREVIEW_SHA:version,
      EXPO_PUBLIC_KAZU_ONLINE_REVIEW:pages?'1':'0'},
  });
} finally {
  if (originalConfig) writeFileSync('app.json',originalConfig);
}

// The owner authorized public play of the existing 43×100 problem banks.
// Publish them as separate data files, NOT as embedded JavaScript or private admin data.
const idMatch=readFileSync('src/domain/bankStageIds.ts','utf8').match(/export const bankStageIds = (\[[^\n]+\]) as const;/);
if(!idMatch)throw new Error('Unable to verify public bank ID manifest.');
const publicBankIds=JSON.parse(idMatch[1]);
if(!Array.isArray(publicBankIds)||publicBankIds.length!==43||
   new Set(publicBankIds).size!==43)throw new Error('Unexpected public bank manifest.');
const bankFiles={};
mkdirSync(resolve(target,'question-banks'),{recursive:true});
for(const id of publicBankIds){
  if(typeof id!=='string'||!/^(?:e1|sage)\.[a-z0-9]+$/.test(id))throw new Error('Invalid public bank ID.');
  const file=id+'.v1.json';
  const source=resolve('public/question-banks',file);
  const parsed=JSON.parse(readFileSync(source,'utf8'));
  if(parsed.stageId!==id||!Array.isArray(parsed.questions)||parsed.questions.length!==100||
     new Set(parsed.questions.map(q=>q.id)).size!==100)throw new Error('Invalid public bank '+id);
  copyFileSync(source,resolve(target,'question-banks',file));
  bankFiles[file]=contentDigest(readFileSync(source));
}

// Keep the exact user-approved world image as a separate, cacheable public asset.
const mapSource=resolve('public/world-map-approved.png');
const mapBytes=readFileSync(mapSource);
if(mapBytes.length<1_000_000||mapBytes.length>3_000_000||
   !mapBytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))
  throw new Error('The approved 16-island map is not a valid PNG asset.');
copyFileSync(mapSource,resolve(target,'world-map-approved.png'));

const allowed=new Set(['index.html','metadata.json','world-map-approved.png']);
const files=readdirSync(target,{recursive:true,withFileTypes:true}).filter(entry=>!entry.isDirectory())
  .map(entry=>relative(target,resolve(entry.parentPath,entry.name)).replaceAll('\\','/'));
if (files.some(file=>!allowed.has(file) && !/^_expo\/static\/js\/web\/[A-Za-z0-9._-]+\.js$/.test(file) &&
    !/^question-banks\/(?:e1|sage)\.[a-z0-9]+\.v1\.json$/.test(file))) {
  throw new Error('Unexpected file in the sample-only preview artifact.');
}
const entries=files.filter(file=>file.endsWith('.js'));
if (entries.length!==1) throw new Error('The sample-only preview must have one entry bundle.');
const [entry]=entries;
const bundle=readFileSync(resolve(target,entry));
assertSampleBundle(bundle.toString('utf8'),version,pages,true);
if(!bundle.toString('utf8').includes('preschool-plush-pixel-v2'))
  throw new Error('The compiled preview does not contain the preschool plush map view.');
if(!bundle.toString('utf8').includes('toy-island-pixel-v1'))
  throw new Error('The compiled preview does not contain the grade-one toy map.');
if(!bundle.toString('utf8').includes('all-16-island-pixel-themes-v1'))
  throw new Error('The compiled preview does not contain the sixteen thematic map renderer.');
const index=resolve(target,'index.html');
if (pages) writePagesAdminEntry(target);
else writeFileSync(index,readFileSync(index,'utf8').replace('<head>',
  `<head><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">`));
writeFileSync(resolve(target,'version.json'),JSON.stringify({
  version,profile:'ui-preview',indexSha256:contentDigest(readFileSync(index)),entrySha256:contentDigest(bundle),
  publishedBankQuestions:publicBankIds.length*100,bankSha256:bankFiles,
  approvedWorldMapSha256:contentDigest(mapBytes),
  pixelSceneryV2:true,
  preschoolPlushPixelV2:true,toyIslandPixelV1:true,allIslandPixelThemesV1:true,
  ...(pages ? {adminSha256:contentDigest(readFileSync(resolve(target,'admin/index.html')))} : {}),
})+'\n');
console.log('Verified public prototype with '+(publicBankIds.length*100)+' bank questions at '+version);
