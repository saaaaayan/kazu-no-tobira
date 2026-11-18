import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {assertSampleBundle} from '../scripts/ui-preview-isolation.mjs';

const script = `
  const config=require('./metro.config.cjs');
  const context={resolveRequest:(_context,name)=>name};
  const resolved=config.resolver.resolveRequest(context,'../stageBankLoader','web');
  process.stdout.write(resolved);
`;
function resolvedLoader(env) {
  return execFileSync(process.execPath,['-e',script],{
    encoding:'utf8',
    env:{...process.env,KAZU_DB_ONLY_PREVIEW:'1',EXPO_PUBLIC_KAZU_UI_PREVIEW:'1',
      EXPO_PUBLIC_KAZU_ONLINE_REVIEW:'1',...env},
  }).trim();
}

test('GitHub Pages export resolves REAL HTTP stage loader, not DB-preview exception',()=>{
  assert.match(resolvedLoader({KAZU_PUBLIC_BANK_FILES:'1'}),/stageBankLoader\.web\.ts$/);
  assert.match(resolvedLoader({KAZU_PUBLIC_BANK_FILES:'0'}),/stageBankLoader\.db-preview\.ts$/);
  const exportScript=readFileSync(new URL('../scripts/export-ui-preview.mjs',import.meta.url),'utf8');
  assert.match(exportScript,/KAZU_DB_ONLY_PREVIEW:'1',KAZU_PUBLIC_BANK_FILES:'1'/);
  assert.match(exportScript,/assertSampleBundle\(bundle\.toString\('utf8'\),version,pages,true\)/);
});

test('public build fails instead of deploying the known nonfunctional error loader',()=>{
  const sha='a'.repeat(40);
  const marker='kazu-sample-only-preview '+sha+' /kazu-no-tobira/admin ';
  assert.throws(
    ()=>assertSampleBundle(marker+'Open the DB-backed game preview on the project preview server.',sha,false,true),
    /preview isolation checks/
  );
  assert.throws(()=>assertSampleBundle(marker,sha,false,true),/preview isolation checks/);
  assert.doesNotThrow(
    ()=>assertSampleBundle(marker+'Stage bank is unavailable: ',sha,false,true)
  );
});
