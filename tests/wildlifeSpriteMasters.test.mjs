import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HERO_PIXEL_SPRITES} from '../src/domain/heroPixelSprites.ts';
import {WILDLIFE_SPRITES} from '../src/domain/wildlifePixelSprites.ts';
import {ISLAND_ART_SETS} from '../src/domain/islandArtSets.ts';

test('eleven hand-pixelled masters use one 32px grid and are the map originals',()=>{
 assert.equal(Object.keys(HERO_PIXEL_SPRITES).length,11);
 for(const [id,rows] of Object.entries(HERO_PIXEL_SPRITES)){
  assert.equal(rows.length,32,id);
  assert.ok(rows.every(row=>row.length===32&&/^[.XBAFR]+$/.test(row)),id);
  assert.equal(WILDLIFE_SPRITES[id],rows,id);
  assert.ok([...ISLAND_ART_SETS.e2.large,...ISLAND_ART_SETS.e2.medium,...ISLAND_ART_SETS.e4.large].includes(id),id);
 }
 const review=readFileSync(new URL('../public/art-review/index.html',import.meta.url),'utf8');
 for(const id of Object.keys(HERO_PIXEL_SPRITES))assert.ok(review.includes(id));
 assert.equal((review.match(/<svg /g)||[]).length,44,'large, medium, small and silhouette for each hero');
 assert.ok(!/<script|https?:\/\/|localStorage|fetch\(/.test(review.replaceAll('http://www.w3.org/2000/svg','')),'review remains artwork only');
});
