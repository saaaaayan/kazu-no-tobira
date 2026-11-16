const [address,sha,profile]=process.argv.slice(2);
const base=new URL(address);
if ((!['https:'].includes(base.protocol) && !(base.protocol==='http:' && base.hostname==='127.0.0.1')) ||
    base.username || base.password || base.search || base.hash || !base.pathname.endsWith('/') ||
    !/^[a-f0-9]{40}$/.test(sha) || (profile && profile!=='ui-preview')) {
  throw new Error('Usage: node scripts/verify-web-release.mjs <site-base-url/> <commit-sha> [ui-preview]');
}
const cacheBust=String(Date.now());
async function get(path) {
  const url=new URL(path,base);
  if (url.origin!==base.origin || !url.pathname.startsWith(base.pathname)) throw new Error('Entry escaped the site base.');
  url.searchParams.set('release',sha+'-'+cacheBust);
  const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(5000)});
  if (!response.ok) throw new Error('HTTP '+response.status+' for '+url.pathname);
  return response;
}
const manifest=await (await get('version.json')).json();
if (manifest.version!==sha || (profile && manifest.profile!==profile)) throw new Error('Version manifest differs from the requested release.');
const html=await (await get('')).text();
if (!html.includes('<title>数のトビラ</title>')) throw new Error('The site entry has the wrong title.');
const entry=html.match(/<script\b[^>]*\bsrc="([^"]*\/_expo\/static\/js\/web\/[^"]+\.js)"/)?.[1];
if (!entry) throw new Error('The Expo entry script was not found.');
const js=await (await get(entry)).text();
if (!js.includes(sha) || (profile && !js.includes('kazu-sample-only-preview'))) throw new Error('The served app bundle differs from the requested release.');
console.log('Verified Web manifest and app bundle at '+sha);
