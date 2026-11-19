import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {approvedWorldMap,approvedWorldMapHotspots,approvedWorldMapDimensions,
  approvedWorldMapImageUrl} from '../src/domain/approvedWorldMap.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
test('the exact approved 16-island background is stored in the repo, with reproducible SHA-256',()=>{
  const image=read('public/'+approvedWorldMap.filename);
  assert.ok(image.byteLength>1_000_000&&image.byteLength<3_000_000);
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(createHash('sha256').update(image).digest('hex'),approvedWorldMap.sha256);
  assert.equal(approvedWorldMap.width,1452);
  assert.equal(approvedWorldMap.height,1083);
  assert.match(approvedWorldMapImageUrl,/^\/kazu-no-tobira\/world-map-approved\.png\?v=[a-f0-9]{8}$/);
});

test('every mapped illustration opens the correct user-confirmed island',()=>{
  assert.equal(worldIslands.length,16);
  assert.equal(approvedWorldMapHotspots.length,worldIslands.length);
  assert.deepEqual(worldIslands.map(g=>g.id),[
    'preschool','e1','e2','e3','e4','e5','e6','j1','j2','j3','h1','h2','h3','sage','champion','cosmos',
  ]);
  const positions=new Set();
  for(const [index,{x,y}] of approvedWorldMapHotspots.entries()){
    assert.ok(x>.10&&x<.85&&y>.15&&y<.85,index);
    assert.ok(x-.099>=0&&x+.099<=1);
    assert.ok(y-.094>=0&&y+.094<=1);
    assert.ok(!positions.has(x+':'+y),'duplicate hotspot for island '+index);
    positions.add(x+':'+y);
  }
  for(let row=0;row<4;row++){
    const points=approvedWorldMapHotspots.slice(row*4,row*4+4);
    for(let i=1;i<4;i++) assert.equal(Math.sign(points[i].x-points[i-1].x),row%2===0?1:-1);
    assert.ok(points.every(p=>p.y===points[0].y));
  }
});

test('mobile map can zoom/pan and keeps 16 accessible island hit targets with compass already in artwork',()=>{
  const mobile=approvedWorldMapDimensions(360,true);
  const fit=approvedWorldMapDimensions(360,false);
  const desktop=approvedWorldMapDimensions(1200,true);
  assert.equal(mobile.compact,true);
  assert.equal(desktop.compact,false);
  assert.equal(fit.imageWidth,360);
  assert.ok(mobile.imageWidth>=960&&mobile.imageHeight>fit.imageHeight);
  assert.equal(desktop.imageWidth,1200);
  const ui=read('src/components/WorldScenes780.tsx').toString();
  assert.match(ui,/source={{uri:approvedWorldMapImageUrl}}/);
  assert.match(ui,/approvedWorldMapHotspots\[index\]/);
  assert.match(ui,/testID={'approved-world-island-'\+grade\.id}/);
  assert.match(ui,/onPress=\{\(\)=>onGrade\(grade\)\}/);
  assert.doesNotMatch(ui,/MutedNorthCompass|styles\.northCompass/);
  assert.match(ui,/scrollEnabled=\{compact&&zoomed\}/);
  assert.match(ui,/地図全体を表示する/);
  assert.match(ui,/16島の一覧から選ぶ/);
});

test('release pipeline publishes and independently checks the actual map, not only the JS version',()=>{
  const exporter=read('scripts/export-ui-preview.mjs').toString();
  const verifier=read('scripts/verify-web-release.mjs').toString();
  assert.match(exporter,/copyFileSync\(mapSource,resolve\(target,'world-map-approved\.png'\)\)/);
  assert.match(exporter,/approvedWorldMapSha256:contentDigest\(mapBytes\)/);
  assert.match(verifier,/await get\(imageFile\)/);
  assert.match(verifier,/world-map-approved\\.avif/);
  assert.match(verifier,/world-map-approved\\.png/);
  const snapshot=read('scripts/snapshot-pages-prototype.mjs').toString();
  assert.match(snapshot,/approvedMap\.file/);
  assert.match(snapshot,/publishedBanks/);
  assert.match(verifier,/published 16-island world map differs/);
  assert.match(verifier,/game bundle does not use the approved world map/);
});
