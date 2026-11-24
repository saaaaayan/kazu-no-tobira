import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {approvedWorldMap,approvedWorldMapHotspots,approvedWorldMapAreaNames,
  approvedWorldMapDimensions,approvedWorldMapImageUrl} from '../src/domain/approvedWorldMap.ts';

import {responsiveWorldMaps,responsiveWorldMapForWidth,responsiveWorldMapImageUrl,responsiveWorldMapGradeLabels} from '../src/domain/responsiveWorldMap.ts';
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
  assert.equal(richWorldMapImageUrl,'/kazu-no-tobira/world-map-rich-20261123.png?v=7f2573fe');
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
  assert.match(ui,/source={{uri:responsiveWorldMapImageUrl\(map\)}}/);
  // The image carries its own sixteen labels: do not draw another set on top.
  assert.doesNotMatch(ui,/<WorldAreaPixelButton/);
  assert.match(ui,/const spot=map.hotspots\[index\]/);
  assert.match(ui,/const plaqueWidth=spot.width/);
  assert.match(ui,/const plaqueHeight=spot.height/);
  assert.match(ui,/imageHeight=Math[.]round\(imageWidth\*map[.]height\/map[.]width\)/);
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
  assert.match(exporter,/responsiveWorldMapSha256,approvedEulerHeroSha256/);
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


test('both approved 2026-11-24 maps are exact PNGs and have sixteen distinct in-bounds hit targets',()=>{
  assert.equal(responsiveWorldMapForWidth(390),responsiveWorldMaps.mobile);
  assert.equal(responsiveWorldMapForWidth(699),responsiveWorldMaps.mobile);
  assert.equal(responsiveWorldMapForWidth(700),responsiveWorldMaps.pc);
  assert.equal(responsiveWorldMapForWidth(1200),responsiveWorldMaps.pc);
  for(const map of Object.values(responsiveWorldMaps)){
    const bytes=read('public/'+map.filename);
    assert.equal(bytes.length,map.bytes);
    assert.equal(bytes.readUInt32BE(16),map.width);
    assert.equal(bytes.readUInt32BE(20),map.height);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),map.sha256);
    assert.ok(responsiveWorldMapImageUrl(map).includes(map.filename));
    assert.equal(map.hotspots.length,16);
    for(const [i,p] of map.hotspots.entries()){
      assert.ok(p.x-p.width/2>=0&&p.x+p.width/2<=1&&p.y-p.height/2>=0&&p.y+p.height/2<=1);
      for(let j=0;j<i;j++){
        const q=map.hotspots[j];
        assert.ok(Math.abs(p.x-q.x)>=(p.width+q.width)/2||Math.abs(p.y-q.y)>=(p.height+q.height)/2,'overlap '+map.key+' '+(j+1)+' '+(i+1));
      }
    }
  }
  assert.match(read('src/components/WorldScenes780.tsx').toString(),/useState\(false\)/);
  assert.match(read('scripts/verify-web-release.mjs').toString(),/verifyResponsiveWorldMap/);
  assert.match(read('scripts/snapshot-pages-prototype.mjs').toString(),/of responsiveMaps/);
});


test('all sixteen destinations visibly identify their learning grade or course',()=>{
  assert.deepEqual(responsiveWorldMapGradeLabels,['幼児','小1','小2','小3','小4','小5','小6','中1','中2','中3','高1','高2','高3','理系大学入試','最難関・数学競技','大学数学・探究']);
  assert.equal(responsiveWorldMapGradeLabels.length,worldIslands.length);
  const ui=read('src/components/WorldScenes780.tsx').toString();
  assert.ok(ui.includes("testID={'world-map-grade-'+grade.id}"));
  assert.ok(ui.includes('{responsiveWorldMapGradeLabels[index]}'));
  assert.ok(ui.includes('top:imageHeight*plaqueHeight+1'));
  for(const width of [244,320,360,390,600,700,900,1200]){
    const compact=width<700,map=responsiveWorldMapForWidth(width);
    const height=Math.round(width*map.height/map.width);
    const font=compact?Math.max(10,Math.min(14,Math.round(width/32))):Math.max(10,Math.min(15,Math.round(width/80)));
    const boxes=map.hotspots.map(p=>({x:width*(p.x-p.width/2),y:height*(p.y-p.height/2),w:Math.max(35,width*p.width),h:Math.max(39,height*p.height+font+7)}));
    for(const [i,p] of boxes.entries()){
      assert.ok(p.y+p.h<=height);
      for(let j=0;j<i;j++){const q=boxes[j];assert.ok(p.x+p.w<=q.x||q.x+q.w<=p.x||p.y+p.h<=q.y||q.y+q.h<=p.y,'overlap at '+width+': '+(i+1)+' / '+(j+1));}
    }
  }
});
