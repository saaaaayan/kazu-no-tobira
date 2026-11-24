import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const music=readFileSync(new URL('../src/domain/gameMusic.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('entering a music scene attempts autoplay when enabled and audible',()=>{
  assert.match(music,/setMusicScene\(scene: MusicScene\|undefined\)\{\s*desired=scene;[\s\S]*?if\(scene&&enabled&&volume>0\)unlockMusic\(\)/);
});
test('approved title starts preloading even if browser audio is suspended',()=>{
  const unlock=music.slice(music.indexOf('export function unlockMusic()'));
  assert.ok(unlock.indexOf('prepareTitle(context)')>=0);
  assert.ok(unlock.indexOf('prepareTitle(context)')<unlock.indexOf('context.resume()'));
  assert.match(music,/function prepareTitle\(ctx: AudioContext\)\{\s*if\(desired==='title'&&!cache.has\('title'\)&&!titleRequest\)/);
  assert.match(music,/context.addEventListener\('statechange',sync\)/);
  assert.match(music,/next.loopStart=titleLoopStart/);
  assert.match(music,/next.loopEnd=Math.min\(titleLoopEnd,next.buffer.duration\)/);
});
test('trusted touch, click and keyboard activation remain available, with cleanup',()=>{
  for(const event of ['pointerup','touchend','click','keydown']){
    assert.ok(app.includes("document.addEventListener('"+event+"', unlock, true)"));
    assert.ok(app.includes("document.removeEventListener('"+event+"', unlock, true)"));
  }
});
