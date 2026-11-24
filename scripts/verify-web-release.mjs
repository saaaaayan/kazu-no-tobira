import { responsiveWorldMapAssets,verifyResponsiveWorldMap } from './responsive-world-map-assets.mjs';
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
    if (version.preschoolPlushPixelV2 === true &&
        !js.includes('preschool-plush-pixel-v2')) {
      throw new Error('The public bundle is missing the preschool pixel map view.');
    }
    if(version.preschoolFantasyTownV1===true&&!js.includes('preschool-fantasy-town-v1'))throw new Error('Missing published fantasy plush town map');
    if (version.toyIslandPixelV1 === true &&
        !js.includes('toy-island-pixel-v1')) {
      throw new Error('The public bundle is missing the grade-one toy pixel map.');
    }
    if (version.allIslandPixelThemesV1 === true &&
        !js.includes('all-16-island-pixel-themes-v1')) {
      throw new Error('The public bundle is missing the shared all-island pixel renderer.');
    }
    if (profile && (version.indexSha256!==digest(index) || version.entrySha256!==digest(bundle))) {
      throw new Error('The sample HTML or JavaScript differs from the verified build.');
    }
    if(version.wildlifeReviewSha256!==undefined){
      const review=Buffer.from(await (await get('art-review/index.html')).arrayBuffer());
      if(digest(review)!==version.wildlifeReviewSha256)throw new Error('The wildlife review differs from the verified artwork.');
    }
    // Validate the original AVIF on previous releases, and the new exact PNG
    // on updated releases. This also allows recovery snapshots during migration.
    let approvedMap;
    if(version.approvedWorldMapSha256!==undefined){
      if(!/^[a-f0-9]{64}$/.test(version.approvedWorldMapSha256))
        throw new Error('The approved world map digest is invalid.');
      const imageFile=js.includes('world-map-rich-20261123.png')?'world-map-rich-20261123.png':
        js.includes('world-map-approved-20261122.png')?'world-map-approved-20261122.png':
        js.includes('world-map-approved.png')?'world-map-approved.png':
        js.includes('world-map-approved.avif')?'world-map-approved.avif':null;
      if(!imageFile)throw new Error('The game bundle does not use the approved world map.');
      const art=Buffer.from(await (await get(imageFile)).arrayBuffer());
      const valid=imageFile.endsWith('.png')
        ?art.subarray(0,8).toString('hex')==='89504e470d0a1a0a'
        :art.subarray(4,12).toString('ascii')==='ftypavif';
      if(!valid||digest(art)!==version.approvedWorldMapSha256)
        throw new Error('The published 16-island world map differs from the approved asset.');
      approvedMap={file:imageFile,data:art};
    }
    const responsiveMaps=[];
    if(version.responsiveWorldMapSha256!==undefined){
      const hashes=version.responsiveWorldMapSha256;
      if(Object.keys(hashes).length!==responsiveWorldMapAssets.length)throw new Error('Incomplete responsive map manifest.');
      for(const spec of responsiveWorldMapAssets){
        if(hashes[spec.filename]!==spec.sha256 || !js.includes(spec.filename))throw new Error('Invalid responsive map manifest or bundle: '+spec.filename);
        const data=verifyResponsiveWorldMap(Buffer.from(await (await get(spec.filename)).arrayBuffer()),spec);
        responsiveMaps.push({file:spec.filename,data});
      }
    }
    // For the 4,300-question public trial, verify that each of the 43 data
    // files is actually accessible at the hosted site, not merely in GitHub.
    if (version.pixelSceneryV2 === true &&
        (!js.includes('island-scenery-') || !js.includes('labyrinth-stone-walls'))) {
      throw new Error('The public bundle is missing the new themed scenery.');
    }
    let approvedTitleMusic;
    if(version.approvedTitleMusicSha256!==undefined){
      const file='title-infinity-v3.flac';
      if(version.approvedTitleMusicSha256!=='1a7afff5e8836510a138ae611308a481aef5543b4b25643b22b80d572b65a1aa' || !js.includes(file))
        throw new Error('Approved title BGM manifest or game bundle is invalid.');
      const data=Buffer.from(await (await get(file)).arrayBuffer());
      if(data.length!==6633014 || data.subarray(0,4).toString('ascii')!=='fLaC' || digest(data)!==version.approvedTitleMusicSha256)
        throw new Error('Published title BGM differs from approved asset.');
      approvedTitleMusic={file,data};
    }
    const publishedBanks=[];
    if (version.bankSha256 !== undefined) {
      const entries=Object.entries(version.bankSha256);
      if (entries.length!==43 || version.publishedBankQuestions!==4300) {
        throw new Error('The hosted public bank manifest is incomplete.');
      }
      for (let offset=0;offset<entries.length;offset+=8) {
        await Promise.all(entries.slice(offset,offset+8).map(async([file,hash])=>{
          if(!/^(?:e1|sage)\.[a-z0-9]+\.v1\.json$/.test(file) ||
             !/^[a-f0-9]{64}$/.test(hash)) {
            throw new Error('Unexpected public bank file or digest.');
          }
          const data=Buffer.from(await (await get('question-banks/'+file)).arrayBuffer());
          if (digest(data)!==hash)throw new Error('The published question bank differs: '+file);
          publishedBanks.push({file,data});
          const bank=JSON.parse(data.toString('utf8'));
          if(bank.stageId!==file.slice(0,-'.v1.json'.length)||
             !Array.isArray(bank.questions)||bank.questions.length!==100||
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
    return {version,index,entryPath,bundle,admin,approvedMap,responsiveMaps,publishedBanks,approvedTitleMusic};
  }};
}

if (import.meta.main) {
  const [address,sha,profile]=process.argv.slice(2);
  await releaseClient(address).verify(sha,profile);
  console.log('Verified Web manifest and app bundle at '+sha);
}
