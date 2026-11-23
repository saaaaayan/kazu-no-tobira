import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {approvedWorldMap,approvedWorldMapHotspots,approvedWorldMapAreaNames,
  approvedWorldMapDimensions,approvedWorldMapImageUrl} from '../src/domain/approvedWorldMap.ts';

import {richWorldMap,richWorldMapHotspots,richWorldMapButtonWidths,
  richWorldMapButtonHeight,richWorldMapImageUrl} from '../src/domain/richWorldMap.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
test('2026-11-23 user-selected color map is restored byte-for-byte',()=>{
  const bytes=read('public/'+richWorldMap.filename);
  assert.equal(bytes.length,3_555_946);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),1448);
  assert.equal(bytes.readUInt32BE(20),1086);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),richWorldMap.sha256);
  assert.equal(richWorldMap.sha256,'7f2573fe2850e626012d6d36c65d665e1e9a820d9f8ed2762663418abdfe564c');
  assert.match(richWorldMapImageUrl,/^\\/kazu-no-tobira\\/world-map-rich-20261123[.]png\\?v=[a-f0-9]{8}$/);
  assert.equal(richWorldMapHotspots.length,16);
  assert.equal(richWorldMapButtonWidths.length,16);
  for(let i=0;i<16;i++){
    const p=richWorldMapHotspots[i],w=richWorldMapButtonWidths[i],h=richWorldMapButtonHeight;
    assert.ok(p.x-w/2>=0 && p.x+w/2<=1 && p.y-h/2>=0 && p.y+h/2<=1);
    for(let j=0;j<i;j++){
      const q=richWorldMapHotspots[j];
      assert.ok(Math.abs(p.x-q.x)>=(w+richWorldMapButtonWidths[j])/2 ||
        Math.abs(p.y-q.y)>=h, 'new image has overlapping buttons '+(j+1)+' and '+(i+1));
    }
  }
});
test('original 2026-11-22 approved treasure map is reproduced with exact image bytes',()=>{
  const image=read('public/'+approvedWorldMap.filename);
  assert.equal(image.byteLength,7_804_072);
  assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(createHash('sha256').update(image).digest('hex'),approvedWorldMap.sha256);
  assert.equal(approvedWorldMap.sha256,'5e91554bc4de79192d5a1b04994149e866c7c8e1b0f17963dc21f9cc88cddc2c');
  assert.equal(image.readUInt32BE(16),2048);
  assert.equal(image.readUInt32BE(20),1522);
  assert.equal(approvedWorldMap.width,2048);
  assert.equal(approvedWorldMap.height,1522);
  assert.match(approvedWorldMapImageUrl,/^\/kazu-no-tobira\/world-map-approved-20261122\.png\?v=[a-f0-9]{8}$/);
  const script=read('scripts/materialize-approved-world-map.mjs').toString();
  assert.match(script,/createHash/);
  assert.match(script,/World-map image bytes differ from the approved original/);
});

test('every newly placed region is uniquely clickable with nonoverlapping precise hotspots',()=>{
  assert.equal(worldIslands.length,16);
  assert.equal(approvedWorldMapHotspots.length,16);
  assert.equal(approvedWorldMapAreaNames.length,16);
  assert.deepEqual(worldIslands.map(g=>g.id),[
    'preschool','e1','e2','e3','e4','e5','e6','j1','j2','j3','h1','h2','h3','sage','champion','cosmos',
  ]);
  assert.deepEqual([approvedWorldMapAreaNames[0],approvedWorldMapAreaNames[7],
    approvedWorldMapAreaNames[14],approvedWorldMapAreaNames[15]],
    ['ぬいぐるみの町','地底の迷宮','天空の王国','銀河の果て']);
  for(const [index,p] of approvedWorldMapHotspots.entries()){
    assert.ok(p.x>.08&&p.x<.93&&p.y>.18&&p.y<.9,index);
    assert.ok(p.x-.08>=0&&p.x+.08<=1);
    assert.ok(p.y-.045>=0&&p.y+.045<=1);
    for(let j=0;j<index;j++){
      const other=approvedWorldMapHotspots[j];
      assert.ok(Math.abs(other.x-p.x)>=.16||Math.abs(other.y-p.y)>=.09,
        'overlapping clickable region: '+(j+1)+' and '+(index+1));
    }
  }
  // The fantasy atlas is intentionally irregular, not the former 4×4 grid.
  assert.ok(approvedWorldMapHotspots[3].x<approvedWorldMapHotspots[2].x);
  assert.ok(approvedWorldMapHotspots[9].y<approvedWorldMapHotspots[8].y);
  assert.ok(approvedWorldMapHotspots[15].x<approvedWorldMapHotspots[14].x);
});

test('mobile zoom still keeps all sixteen regions accessible in an exact image-ratio map',()=>{
  const mobile=approvedWorldMapDimensions(360,true);
  const fit=approvedWorldMapDimensions(360,false);
  const desktop=approvedWorldMapDimensions(1200,true);
  assert.equal(mobile.compact,true);
  assert.equal(desktop.compact,false);
  assert.equal(fit.imageWidth,360);
  assert.ok(mobile.imageWidth>=960&&mobile.imageHeight>fit.imageHeight);
  assert.equal(desktop.imageWidth,1200);
  assert.equal(mobile.imageHeight,Math.round(mobile.imageWidth*1522/2048));
  const ui=read('src/components/WorldScenes780.tsx').toString();
  assert.match(ui,/source={{uri:richWorldMapImageUrl}}/);
  // The image carries its own sixteen labels: do not draw another set on top.
  assert.doesNotMatch(ui,/<WorldAreaPixelButton/);
  assert.match(ui,/const spot=richWorldMapHotspots\[index\]/);
  assert.match(ui,/const plaqueWidth=richWorldMapButtonWidths\[index\]/);
  assert.match(ui,/const plaqueHeight=richWorldMapButtonHeight/);
  assert.match(ui,/imageHeight=Math[.]round\(imageWidth\*richWorldMap[.]height\/richWorldMap[.]width\)/);
  assert.match(ui,/testID={'approved-world-island-'\+grade[.]id}/);
  assert.match(ui,/onPress=\{\(\)=>onGrade\(grade\)\}/);
  assert.match(ui,/width:imageWidth\*plaqueWidth/);
  assert.match(ui,/height:imageHeight\*plaqueHeight/);
  assert.match(ui,/const atlasBleedWidth=viewportWidth>=700/);
  assert.match(ui,/width:atlasBleedWidth,alignSelf:'center'/);
  assert.doesNotMatch(ui,/resizeMode="cover"/);
  assert.match(ui,/scrollEnabled=\{compact&&zoomed\}/);
  assert.match(ui,/地図全体を表示する/);
  assert.match(ui,/16エリアの一覧から選ぶ/);
});

test('release pipeline publishes and checks the exact original 2026-11-22 map',()=>{
  const exporter=read('scripts/export-ui-preview.mjs').toString();
  const verifier=read('scripts/verify-web-release.mjs').toString();
  assert.match(exporter,/copyFileSync\(mapSource,resolve\(target,'world-map-approved-20261122\.png'\)\)/);
  assert.match(exporter,/approvedWorldMapSha256:contentDigest\(richMapBytes\)/);
  assert.match(exporter,/copyFileSync\(richMapSource,resolve\(target,'world-map-rich-20261123[.]png'\)\)/);
  assert.match(verifier,/world-map-rich-20261123[.]png/);
  assert.match(verifier,/await get\(imageFile\)/);
  assert.match(verifier,/world-map-approved-20261122[.]png/);
  assert.match(verifier,/world-map-approved[.]png/);
  const snapshot=read('scripts/snapshot-pages-prototype.mjs').toString();
  assert.match(snapshot,/approvedMap\.file/);
  assert.match(verifier,/published 16-island world map differs/);
  assert.match(verifier,/game bundle does not use the approved world map/);
});
