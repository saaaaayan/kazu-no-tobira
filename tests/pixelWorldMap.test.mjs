import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {PIXEL_WORLD_MOTIFS,PIXEL_WORLD_STAMPS,PIXEL_WORLD_CENTERS,PIXEL_WORLD_CONNECTIONS} from '../src/domain/pixelWorldMap.ts';
import {approvedWorldMapHotspots,approvedWorldMap} from '../src/domain/approvedWorldMap.ts';
import {ISLAND_SPRITES} from '../src/domain/islandPixelSprites.ts';
import {worldIslands} from '../src/domain/worldCatalog.ts';

test('pixel overview keeps every existing hit target and the original sixteen-island order',()=>{
 assert.deepEqual(approvedWorldMapHotspots,[
  {x:.118,y:.180},{x:.349,y:.180},{x:.578,y:.180},{x:.830,y:.180},
  {x:.830,y:.398},{x:.578,y:.398},{x:.349,y:.398},{x:.118,y:.398},
  {x:.118,y:.610},{x:.349,y:.610},{x:.578,y:.610},{x:.830,y:.610},
  {x:.830,y:.824},{x:.578,y:.824},{x:.349,y:.824},{x:.118,y:.824},
 ]);
 assert.deepEqual(Object.keys(PIXEL_WORLD_MOTIFS),worldIslands.map(g=>g.id));
 assert.equal(PIXEL_WORLD_CENTERS.length,16);
 for(const [i,p] of PIXEL_WORLD_CENTERS.entries()){
  const original=approvedWorldMapHotspots[i];
  assert.ok(Math.abs(p.x/1452-original.x)<.012);
  assert.ok(Math.abs(p.y/1083-original.y)<.003);
  assert.equal(p.x%4,0);assert.equal(p.y%4,0);
 }
});

test('each island has exactly three distinct recognizable stamps without changing stage art',()=>{
 for(const [id,motifs] of Object.entries(PIXEL_WORLD_MOTIFS)){
  assert.equal(motifs.length,3,id);assert.equal(new Set(motifs).size,3,id);
  for(const kind of motifs){
   const rows=PIXEL_WORLD_STAMPS[kind]??ISLAND_SPRITES[kind];
   assert.ok(rows?.length>=6,kind);
   assert.ok(rows.every(row=>/^[.XBAFR]+$/.test(row)),kind);
  }
 }
 assert.ok(PIXEL_WORLD_MOTIFS.e4.includes('prehistoricRex'));
 assert.ok(PIXEL_WORLD_MOTIFS.j1.includes('maze'));
 for(const [id,rows] of Object.entries(PIXEL_WORLD_STAMPS)){
  assert.equal(rows.length,24,id);assert.ok(rows.every(row=>row.length===24),id);
  assert.notDeepEqual(rows,ISLAND_SPRITES[id],id+' has an overview-only simplified master');
 }
});

test('fifteen square-dash routes preserve connections and follow axis-aligned segments',()=>{
 assert.equal(PIXEL_WORLD_CONNECTIONS.length,15);
 for(const [i,route] of PIXEL_WORLD_CONNECTIONS.entries()){
  assert.equal(route.from,i);assert.equal(route.to,i+1);
  assert.deepEqual(route.points[0],{x:PIXEL_WORLD_CENTERS[i].x,y:PIXEL_WORLD_CENTERS[i].y+12});
  assert.deepEqual(route.points.at(-1),{x:PIXEL_WORLD_CENTERS[i+1].x,y:PIXEL_WORLD_CENTERS[i+1].y+12});
  for(const [j,p] of route.points.entries()){
   assert.ok(p.x>=16&&p.x<=1436&&p.y>110&&p.y<1020);
   if(j)assert.ok(p.x===route.points[j-1].x||p.y===route.points[j-1].y);
  }
 }
});

test('pixel artwork retains exact image geometry and both titles, with compact public asset',()=>{
 const image=readFileSync(new URL('../public/'+approvedWorldMap.filename,import.meta.url));
 assert.equal(image.readUInt32BE(16),1452);assert.equal(image.readUInt32BE(20),1083);
 assert.ok(image.byteLength<300_000,'flat-color map stays small');
 const renderer=readFileSync(new URL('../scripts/build-pixel-world-map.ps1',import.meta.url),'utf8');
 assert.ok(renderer.includes('数のトビラ 世界地図'));assert.ok(renderer.includes('world map'));
 assert.ok(renderer.includes("Text 'N' 80"),'north marker remains upper-left');
 assert.doesNotMatch(renderer,/LinearGradient|HatchBrush|DrawEllipse/);
});
