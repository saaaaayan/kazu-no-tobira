import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writePagesAdminEntry} from '../scripts/pages-admin-entry.mjs';

test('hosted admin HTML unlocks mobile touch scrolling without altering the game',()=>{
  const dir=mkdtempSync(join(tmpdir(),'kazu-admin-scroll-'));
  try{
    writeFileSync(join(dir,'index.html'),
      '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>');
    writePagesAdminEntry(dir,undefined);
    const admin=readFileSync(join(dir,'admin/index.html'),'utf8');
    const game=readFileSync(join(dir,'index.html'),'utf8');
    assert.match(admin,/<style id="kazu-admin-scroll">/);
    assert.match(admin,/overflow-y: auto !important/);
    assert.match(admin,/touch-action: pan-y !important/);
    assert.match(admin,/#root \{/);
    assert.match(admin,/min-height: 100dvh !important/);
    assert.match(admin,/\.kazu-admin-stage-table/);
    assert.ok(admin.indexOf('<style id="kazu-admin-scroll">')<admin.indexOf('</head>'));
    assert.doesNotMatch(game,/kazu-admin-scroll|touch-action: pan-y|kazu-admin-stage-table/);
    assert.match(admin,/connect-src 'self' https:\/\/jxitjcfgavemddlbygzx.supabase.co/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('admin content is independently scrollable even if RN global app root locks scrolling',()=>{
  const source=readFileSync(new URL('../src/components/ServerQuestionReview.web.tsx',import.meta.url),'utf8');
  const listing=readFileSync(new URL('../src/components/StageProductionDashboard.web.tsx',import.meta.url),'utf8');
  assert.match(source,/height:'100dvh'/);
  assert.match(source,/overflowY:'auto' as const/);
  assert.match(source,/touchAction:'pan-y' as const/);
  assert.match(source,/WebkitOverflowScrolling:'touch' as const/);
  assert.match(listing,/className="kazu-admin-stage-table"/);
  assert.doesNotMatch(source,/overflowY:'hidden'/);
});
