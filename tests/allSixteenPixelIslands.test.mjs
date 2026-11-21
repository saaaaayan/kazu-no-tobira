import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ISLAND_SPRITES} from '../src/domain/islandPixelSprites.ts';
import {ISLAND_ART_SETS} from '../src/domain/islandArtSets.ts';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {
  isStandardPixelIsland,standardPixelIslandConfig,ISLAND_PIXEL_PALETTES,islandPixelPalette
} from '../src/domain/standardPixelIslandMap.ts';
import {
  PRESCHOOL_MAP_TITLE_INSET,islandStageLayout,islandCheckpointLayout,
  preschoolStageLabelLayout
} from '../src/domain/worldMapLayout.ts';
import {preschoolDecorationLayout,preschoolDecorationBounds,
  preschoolMapExclusionZones} from '../src/domain/preschoolDecorLayout.ts';
import {checkpointsFor} from '../src/domain/stageStructure.ts';
import {sharedIslandStageMapInfo} from '../src/domain/sharedIslandStageMapInfo.ts';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('every island is registered and shares the identical 65-node preschool map geometry',()=>{
  assert.equal(worldIslands.length,16);
  assert.equal(Object.keys(ISLAND_PIXEL_PALETTES).length,16);
  const ids=new Set();
  for(const island of worldIslands){
    assert.ok(isStandardPixelIsland(island.id),island.id);
    assert.ok(standardPixelIslandConfig(island.id),island.id);
    assert.equal(island.stages.length,65,island.id);
    assert.equal(island.stages.filter(s=>s.kind==='normal').length,50,island.id);
    assert.equal(island.stages.filter(s=>s.kind==='extra').length,10,island.id);
    assert.equal(island.stages.filter(s=>s.kind==='secret').length,5,island.id);
    assert.equal(checkpointsFor(island).length,10,island.id);
    assert.ok(!ids.has(island.id));ids.add(island.id);
    assert.equal(standardPixelIslandConfig(island.id).title,island.island);
  }
  const approved=worldIslands[0];
  for(const width of [244,320,375,430,610,620,920,1220]){
    const baseline=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
    for(const island of worldIslands){
      const layout=islandStageLayout(width,island.stages.length,PRESCHOOL_MAP_TITLE_INSET,true);
      assert.deepEqual(layout,baseline,island.id+' width '+width);
      for(let i=0;i<65;i++)
        assert.deepEqual(preschoolStageLabelLayout(width,layout.positions[i],52),
          preschoolStageLabelLayout(width,baseline.positions[i],52));
      for(let n=1;n<=10;n++){
        const end=n*5-1,next=end+1;
        assert.deepEqual(
          islandCheckpointLayout(width,layout.positions[end],52,layout.positions[next],true),
          islandCheckpointLayout(width,baseline.positions[end],52,baseline.positions[next],true),
          island.id+' checkpoint '+n+' width '+width
        );
      }
      assert.equal(layout.positions[49].order,49);
      assert.equal(layout.positions[50].order,50);
      assert.equal(layout.positions[60].order,60);
    }
  }
  assert.equal(approved.id,'preschool');
});

test('land palettes are not duplicates, and toy coral differs strongly from preschool grass',()=>{
  const landColors=new Set(),waterColors=new Set(),pairs=new Set();
  for(const island of worldIslands){
    const p=islandPixelPalette(island.id);
    assert.ok(p,island.id);
    for(const key of ['water','land','bandA','bandB','stripe','ink','shore','path',
      'pathBorder','accent','paper','trialBand','legendBand']){
      assert.match(p[key],/^#[a-f0-9]{6}$/i,island.id+':'+key);
    }
    assert.ok(p.motifs.length>=1,island.id);
    landColors.add(p.land.toLowerCase());
    waterColors.add(p.water.toLowerCase());
    const pair=p.water.toLowerCase()+'/'+p.land.toLowerCase();
    assert.ok(!pairs.has(pair),'duplicate island palette '+island.id);
    pairs.add(pair);
  }
  assert.equal(pairs.size,16);
  assert.equal(landColors.size,16);
  assert.equal(waterColors.size,16);
  const grass=islandPixelPalette('preschool'),toys=islandPixelPalette('e1');
  assert.notEqual(grass.land,toys.land);
  const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  const a=rgb(grass.land),b=rgb(toys.land);
  const delta=Math.hypot(...a.map((v,i)=>v-b[i]));
  assert.ok(delta>=45,'toy land must be visibly distinguishable from preschool green, distance '+delta);
  assert.notEqual(grass.water,toys.water);
  assert.notEqual(grass.bandA,toys.bandA);
  const toyArt=read('src/components/PreschoolPixelTerrain.tsx');
  assert.match(toyArt,/theme==='toys'\?'#d9ae99':'#a9cb83'/u);
  assert.match(toyArt,/theme==='toys'\?'#688dad':'#80adc4'/u);
  assert.match(toyArt,/theme==='toys'\?'#835a57':'#506d5e'/u);
  assert.match(toyArt,/ISLAND_ART_SETS.e1.small/u);
});

test('all fourteen additional islands use their own pixel emblems with the shared collision mask',()=>{
  const art=read('src/components/SharedThemedPixelTerrain.tsx');
  assert.match(art,/islandScenery\(id,width,height,positions\)/u);
  assert.match(art,/ISLAND_PIXEL_PALETTES\[grade.id as StandardPixelIslandId\]/u);
  assert.match(art,/all-16-island-pixel-themes-v1/u);
  assert.match(art,/function IslandThemeStamp|export function IslandThemeStamp/u);
  for(const island of worldIslands.filter(x=>!['preschool','e1'].includes(x.id))){
    const set=ISLAND_ART_SETS[island.id];
    assert.ok(set.large.length>=3);
    assert.ok(set.medium.length>=6);
    assert.ok(set.small.length>=8);
    assert.ok(set.ground.length>=3);
    for(const kind of [...set.large,...set.medium,...set.small])
      assert.ok(ISLAND_SPRITES[kind],island.id+' missing themed icon '+kind);
  }
  for(const width of [320,375,620,940]){
    const layout=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
    const spots=preschoolDecorationLayout(width,layout.height,layout.positions);
    const exclusions=preschoolMapExclusionZones(width,layout.positions);
    assert.ok(spots.length>=20,width+' insufficient scattered decoration');
    for(const d of spots){
      const box=preschoolDecorationBounds(d);
      assert.ok(exclusions.every(r=>box.right<=r.left||r.right<=box.left||
        box.bottom<=r.top||r.bottom<=box.top),'landmark obscures map at '+width);
    }
  }
});

test('all sixteen islands show the child-first map and preserve tap navigation and status',()=>{
  const map=read('src/components/WorldScenes780.tsx');
  const app=read('src/FullAdventure.tsx');
  assert.match(app,/const standardIslandMapFirst = !round && screen === 'island' && isStandardPixelIsland\(grade.id\)/u);
  assert.match(app,/!standardIslandMapFirst && <VersionNotice\/>/u);
  assert.match(map,/const standardPixelMap=isStandardPixelIsland\(grade.id\)/u);
  assert.match(map,/standardPixelMap\?PRESCHOOL_MAP_TITLE_INSET:0,standardPixelMap/u);
  assert.match(map,/islandCheckpointLayout\(actual,end,marker,nextPoint,standardPixelMap\)/u);
  assert.match(map,/<SharedThemedPixelTerrain width=\{width\} height=\{height\}/u);
  assert.match(map,/testID=\{'themed-map-top-title-'\+grade.id\}/u);
  assert.match(map,/<IslandThemeStamp id=\{grade.id\} compact=\{compactStageMap\}\/>/u);
  assert.match(map,/standardPixelMap && grade.stages.map/u);
  assert.match(map,/sharedIslandStageMapInfo\(grade,stage\)/u);
  assert.match(map,/onPress=\{\(\)=>onStart\(stage\)\}/u);
  assert.match(map,/onPress=\{\(\)=>setDetailStageId\(stage.id\)\}/u);
  assert.match(map,/testID=\{'island-checkpoint-'\+checkpoint.number\}/u);
  assert.match(map,/standardPixelMap && supplementalPanels/u);
  assert.match(map,/disabled=\{!selectable\}/u);
  assert.match(map,/label:ready\?'▶ あそぶ':'準備中'/u);
});

test('every island preserves 65 stage learning descriptions without writing unreviewed problems',()=>{
  for(const island of worldIslands){
    const items=island.stages.map(stage=>sharedIslandStageMapInfo(island,stage));
    assert.equal(items.length,65);
    assert.ok(items.every(item=>item.title.trim().length>0&&item.goal.trim().length>0));
    if(island.id!=='preschool')
      assert.ok(items.slice(50).every(item=>item.provisional),
        'premium drafts are provisional '+island.id);
    assert.ok(items.every((item,i)=>
      item.title.length<=48),island.id+' stage title should remain short');
    const ordered=island.stages.map(x=>x.order);
    assert.deepEqual(ordered,Array.from({length:65},(_,i)=>i),'no stage IDs or order changed '+island.id);
  }
});

test('release system enforces the new all-island renderer in the deployed bundle',()=>{
  const exporter=read('scripts/export-ui-preview.mjs');
  const verify=read('scripts/verify-web-release.mjs');
  const spec=read('docs/ISLAND_MAP_STANDARD.md');
  assert.match(exporter,/allIslandPixelThemesV1:true/u);
  assert.match(exporter,/includes\('all-16-island-pixel-themes-v1'\)/u);
  assert.match(verify,/version.allIslandPixelThemesV1 === true/u);
  assert.match(verify,/js.includes\('all-16-island-pixel-themes-v1'\)/u);
  assert.match(spec,/全16島を共通化済/u);
  assert.match(spec,/コーラル/u);
});
