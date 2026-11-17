import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { contentDigest } from '../scripts/ui-preview-isolation.mjs';
import { releaseClient } from '../scripts/verify-web-release.mjs';

test('Pages version check rejects mixed, stale and out-of-base assets',async()=>{
  const sha='a'.repeat(40);
  const parts='/kazu-no-tobira/';
  const entry=parts+'_expo/static/js/web/index-sample.js';
  const bundle='kazu-sample-only-preview /kazu-no-tobira/admin '+sha;
  const htmlFor=path=>'<title>数のトビラ</title><script src="'+path+'"></script>';
  const version={version:sha,profile:'ui-preview',indexSha256:contentDigest(htmlFor(entry)),entrySha256:contentDigest(bundle)};
  let html=htmlFor(entry);
  let admin=htmlFor(entry);
  let served=bundle;
  const server=createServer((request,response)=>{
    const path=new URL(request.url,'http://127.0.0.1').pathname;
    if (path===parts+'version.json') return response.end(JSON.stringify(version));
    if (path===parts) return response.end(html);
    if (path===parts+'admin/') return response.end(admin);
    if (path===entry) return response.end(served);
    response.writeHead(404).end();
  });
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  try {
    const site=releaseClient('http://127.0.0.1:'+server.address().port+parts);
    assert.equal((await site.verify(sha,'ui-preview')).version.version,sha);
    await assert.rejects(site.verify('b'.repeat(40),'ui-preview'),/Version manifest/);
    version.adminSha256=contentDigest(admin);
    assert.equal((await site.verify(sha,'ui-preview')).admin.toString(),admin);
    admin+='changed';
    await assert.rejects(site.verify(sha,'ui-preview'),/admin route differs/);
    admin=htmlFor(entry);
    served=bundle+'changed';
    await assert.rejects(site.verify(sha,'ui-preview'),/differs from the verified build/);
    html=htmlFor('/_expo/static/js/web/outside.js');
    await assert.rejects(site.verify(sha,'ui-preview'),/entry script was not found/);
  } finally {
    server.close();
  }
});
