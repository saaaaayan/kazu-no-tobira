import { createHash } from 'node:crypto';

const fullSha=/^[a-f0-9]{40}$/;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export function releaseClient(address) {
  const base=new URL(address);
  if ((base.protocol!=='https:' && !(base.protocol==='http:' && base.hostname==='127.0.0.1')) ||
      base.username || base.password || base.search || base.hash || !base.pathname.endsWith('/')) {
    throw new Error('Use an HTTPS or loopback site base URL ending in /.');
  }
  const cacheBust=crypto.randomUUID();
  async function get(path) {
    const url=new URL(path,base);
    if (url.origin!==base.origin || !url.pathname.startsWith(base.pathname)) throw new Error('Entry escaped the site base.');
    url.searchParams.set('release',cacheBust);
    const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(7000)});
    if (!response.ok) throw new Error('HTTP '+response.status+' for '+url.pathname);
    return response;
  }
  const manifest=async()=>(await get('version.json')).json();
  return {manifest,async verify(sha,profile) {
    if (!fullSha.test(sha) || (profile && profile!=='ui-preview')) throw new Error('Invalid expected release.');
    const version=await manifest();
    if (version.version!==sha || (profile && version.profile!==profile)) throw new Error('Version manifest differs from the requested release.');
    const index=Buffer.from(await (await get('')).arrayBuffer());
    const html=index.toString('utf8');
    if (!html.includes('<title>数のトビラ</title>')) throw new Error('The site entry has the wrong title.');
    const script=html.match(/<script\b[^>]*\bsrc="([^"]*\/_expo\/static\/js\/web\/[^"]+\.js)"/)?.[1];
    const entry=script && new URL(script,base);
    if (!entry || entry.origin!==base.origin || !entry.pathname.startsWith(base.pathname)) throw new Error('The Expo entry script was not found.');
    const entryPath=entry.pathname.slice(base.pathname.length);
    if (!/^_expo\/static\/js\/web\/[A-Za-z0-9._-]+\.js$/.test(entryPath)) throw new Error('Unexpected path for the Expo entry.');
    const bundle=Buffer.from(await (await get(script)).arrayBuffer());
    const js=bundle.toString('utf8');
    if (!js.includes(sha) || (profile && !js.includes('kazu-sample-only-preview'))) throw new Error('The served app bundle differs from the requested release.');
    if (profile && (version.indexSha256!==digest(index) || version.entrySha256!==digest(bundle))) {
      throw new Error('The sample HTML or JavaScript differs from the verified build.');
    }
    // For the 4,300-question public trial, verify that each of the 43 data
    // files is actually accessible at the hosted site, not merely in GitHub.
    if (version.bankSha256 !== undefined) {
      const entries=Object.entries(version.bankSha256);
      if (entries.length!==54 || version.publishedBankQuestions!==4410) {
        throw new Error('The hosted public bank manifest is incomplete.');
      }
      for (let offset=0;offset<entries.length;offset+=8) {
        await Promise.all(entries.slice(offset,offset+8).map(async([file,hash])=>{
          if(!/^(?:e1|sage|e[2-6]|j[1-3]|h[1-3])\.[a-z0-9]+\.v1\.json$/.test(file) ||
             !/^[a-f0-9]{64}$/.test(hash)) {
            throw new Error('Unexpected public bank file or digest.');
          }
          const data=Buffer.from(await (await get('question-banks/'+file)).arrayBuffer());
          if (digest(data)!==hash)throw new Error('The published question bank differs: '+file);
          const bank=JSON.parse(data.toString('utf8'));
          if(bank.stageId!==file.slice(0,-'.v1.json'.length)||
             !Array.isArray(bank.questions)||bank.questions.length!==(file.startsWith('e1.')||file.startsWith('sage.')?100:10)||
             new Set(bank.questions.map(q=>q.id)).size!==100) {
            throw new Error('The published bank has invalid questions: '+file);
          }
        }));
      }
    }
    let admin;
    if (version.adminSha256 !== undefined) {
      admin = Buffer.from(await (await get('admin/')).arrayBuffer());
      if (digest(admin) !== version.adminSha256 ||
          !admin.toString('utf8').includes('src="' + script + '"') ||
          !js.includes('/kazu-no-tobira/admin')) throw new Error('The admin route differs from the verified build.');
    }
    return {version,index,entryPath,bundle,admin};
  }};
}

if (import.meta.main) {
  const [address,sha,profile]=process.argv.slice(2);
  await releaseClient(address).verify(sha,profile);
  console.log('Verified Web manifest and app bundle at '+sha);
}
