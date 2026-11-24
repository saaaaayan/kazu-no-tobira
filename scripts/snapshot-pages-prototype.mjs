import { appendFileSync,mkdirSync,writeFileSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { releaseClient } from './verify-web-release.mjs';
import { assertSampleBundle } from './ui-preview-isolation.mjs';

const [address,directory]=process.argv.slice(2);
const client=releaseClient(address);
const manifest=await client.manifest();
if (!/^[a-f0-9]{40}$/.test(manifest.version) ||
    ![undefined,'production','ui-preview'].includes(manifest.profile)) throw new Error('Invalid current Pages version manifest.');
if (manifest.profile==='production') throw new Error('Select production explicitly to operate on a production deployment.');
if (manifest.profile!=='ui-preview') {
  console.log('Initial prototype release. The legacy site is retained until the new artifact is verified and deployed.');
} else {
  const {version,index,entryPath,bundle,admin,approvedMap,responsiveMaps,publishedBanks,approvedTitleMusic}=await client.verify(manifest.version,'ui-preview');
  assertSampleBundle(bundle.toString('utf8'),version.version,Boolean(admin));
  mkdirSync(directory);
  const asset=resolve(directory,entryPath);
  mkdirSync(dirname(asset),{recursive:true});
  writeFileSync(asset,bundle);
  writeFileSync(resolve(directory,'index.html'),index);
  if(approvedMap)writeFileSync(resolve(directory,approvedMap.file),approvedMap.data);
  for(const {file,data} of responsiveMaps)writeFileSync(resolve(directory,file),data);
  if(approvedTitleMusic)writeFileSync(resolve(directory,approvedTitleMusic.file),approvedTitleMusic.data);
  if(publishedBanks.length){
    mkdirSync(resolve(directory,'question-banks'),{recursive:true});
    for(const {file,data} of publishedBanks)
      writeFileSync(resolve(directory,'question-banks',file),data);
  }
  if (admin) {
    mkdirSync(resolve(directory,'admin'));
    writeFileSync(resolve(directory,'admin/index.html'),admin);
  }
  writeFileSync(resolve(directory,'version.json'),JSON.stringify(version)+'\n');
  writeFileSync(resolve(directory,'.nojekyll'),'');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,'version='+version.version+'\n');
  console.log('Prepared the last healthy sample-only site for recovery.');
}
