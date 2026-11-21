import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {isStandardPixelIsland,standardPixelIslandConfig} from '../src/domain/standardPixelIslandMap.ts';
import {PRESCHOOL_MAP_TITLE_INSET,islandStageLayout,
  islandCheckpointLayout,preschoolStageLabelLayout} from '../src/domain/worldMapLayout.ts';
import {preschoolDecorationLayout,preschoolMapExclusionZones,
  preschoolDecorationBounds} from '../src/domain/preschoolDecorLayout.ts';
import {gradeOnePreviewStageInfo} from '../src/domain/gradeOnePreviewCurriculum.ts';
import {gradeOneStageMapInfo} from '../src/domain/gradeOneStageMapInfo.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('preschool and grade-one island share identical geometries at phone and desktop widths',()=>{
  const preschool=worldIslands.find(island=>island.id==='preschool');
  const gradeOne=worldIslands.find(island=>island.id==='e1');
  assert.ok(preschool&&gradeOne);
  assert.equal(preschool.stages.length,65);
  assert.equal(gradeOne.stages.length,65);
  assert.ok(isStandardPixelIsland('preschool'));
  assert.ok(isStandardPixelIsland('e1'));
  assert.equal(worldIslands.filter(island=>isStandardPixelIsland(island.id)).length,16,
    'the preschool map standard must be active for all sixteen islands');
  for(const width of [244,320,375,430,610,620,920,1220]){
    const preschoolMap=islandStageLayout(width,preschool.stages.length,PRESCHOOL_MAP_TITLE_INSET,true);
    const gradeOneMap=islandStageLayout(width,gradeOne.stages.length,PRESCHOOL_MAP_TITLE_INSET,true);
    assert.deepEqual(gradeOneMap,preschoolMap,'geometry mismatch at '+width);
    for(const index of [0,4,5,24,49,50,59,60,64])
      assert.deepEqual(preschoolStageLabelLayout(width,gradeOneMap.positions[index],52),
        preschoolStageLabelLayout(width,preschoolMap.positions[index],52));
    for(let checkpoint=1;checkpoint<=10;checkpoint++){
      const index=checkpoint*5-1,next=index+1;
      const a=islandCheckpointLayout(width,preschoolMap.positions[index],52,
        preschoolMap.positions[next],true);
      const b=islandCheckpointLayout(width,gradeOneMap.positions[index],52,
        gradeOneMap.positions[next],true);
      assert.deepEqual(b,a,'checkpoint '+checkpoint+' / '+width);
    }
  }
});

test('toy and plush themes use the same calm artwork and collision-safe scattering engine',()=>{
  const art=read('src/components/PreschoolPixelTerrain.tsx');
  const config=read('src/domain/standardPixelIslandMap.ts');
  assert.deepEqual(standardPixelIslandConfig('e1'),{
    title:'おもちゃの島',grade:'小学1年生',symbol:'blocks',art:'toys'
  });
  assert.match(art,/export function ToyPixelTerrain\(props:/u);
  assert.match(art,/<PreschoolPixelTerrain \{\.\.\.props\} theme="toys"\/>/u);
  assert.match(art,/theme==='toys'\?'toy-island-pixel-v1':'preschool-plush-pixel-v2'/u);
  assert.match(art,/preschoolDecorationLayout\(width,height,positions\)/u);
  assert.match(art,/TOY_SYMBOLS=\['robot','car','train','ball','blocks','top','rocket','kite','house','puzzle','drum','boat'\]/u);
  for(const kind of ['robot','car','train','ball','blocks','top','rocket','kite','house','puzzle','drum','boat'])
    assert.ok(art.includes("kind==='"+kind+"'"),kind);
  assert.match(config,/ISLAND_PIXEL_PALETTES/u);
});

test('toy ornaments never cover routes, stage pins, title labels, or checkpoint signs',()=>{
  for(const width of [320,375,610,940]){
    const layout=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
    const decorators=preschoolDecorationLayout(width,layout.height,layout.positions);
    const forbidden=preschoolMapExclusionZones(width,layout.positions);
    assert.ok(decorators.length>=20,width+' should include many scattered toy icons');
    for(const d of decorators){
      const box=preschoolDecorationBounds(d);
      assert.ok(forbidden.every(r=>box.right<=r.left||r.right<=box.left||
        box.bottom<=r.top||r.bottom<=box.top),'decoration overlaps exclusion at '+width);
    }
  }
});

test('the grade-one map has the same child-first structure, all ten signs and 65 interactive stage labels',()=>{
  const map=read('src/components/WorldScenes780.tsx');
  const app=read('src/FullAdventure.tsx');
  assert.match(map,/const standardPixelMap=isStandardPixelIsland\(grade.id\)/u);
  assert.match(map,/standardPixelMap\?PRESCHOOL_MAP_TITLE_INSET:0,standardPixelMap/u);
  assert.match(map,/islandCheckpointLayout\(actual,end,marker,nextPoint,standardPixelMap\)/u);
  assert.match(map,/<ToyPixelTerrain width=\{width\} height=\{height\}/u);
  assert.match(map,/testID="toy-map-top-title"/u);
  assert.ok(map.includes('<ToyBlockStamp compact={compactStageMap}/>'));
  assert.ok(map.includes('<ToyBlockStamp flipped compact={compactStageMap}/>'));
  assert.match(map,/\{standardPixelMap && grade.stages.map\(\(stage,index\)=>\{/u);
  assert.match(map,/grade.id==='e1'\?'toy-stage-topic-':'island-stage-topic-'/u);
  assert.match(map,/onPress=\{\(\)=>setDetailStageId\(stage.id\)\}/u);
  assert.match(map,/onPress=\{\(\)=>onStart\(stage\)\}/u);
  assert.match(map,/standardPixelMap && supplementalPanels/u);
  assert.match(app,/const standardIslandMapFirst = !round && screen === 'island' && isStandardPixelIsland\(grade.id\)/u);
  assert.match(app,/styles.scroll,standardIslandMapFirst&&styles.preschoolScroll/u);
  assert.match(app,/!standardIslandMapFirst && <VersionNotice\/>/u);
  assert.match(map,/\{standardPixelMap \? <>/u);
});

test('all grade-one stage topic labels preserve curricular specificity',()=>{
  const gradeOne=worldIslands.find(grade=>grade.id==='e1');
  const titles=gradeOne.stages.slice(0,50).map(stage=>gradeOnePreviewStageInfo(stage)?.title);
  assert.equal(titles.length,50);
  assert.equal(new Set(titles).size,50);
  assert.ok(titles.every(Boolean));
  assert.ok(titles.some(title=>title.includes('とけい')));
  assert.ok(titles.some(title=>title.includes('かたち')));
  assert.ok(titles.some(title=>title.includes('たしざん')));
  assert.ok(titles.some(title=>title.includes('ひきざん')));
});

test('the permanent all-island design decision is stored in the project',()=>{
  const document=read('docs/ISLAND_MAP_STANDARD.md');
  assert.match(document,/今後の全16島/u);
  assert.match(document,/共通テンプレート/u);
  assert.match(document,/おもちゃの島/u);
  assert.match(document,/確認テスト/u);
});

test('every toy-island stage has a distinct title, and premium-only stages remain proposals',()=>{
  const gradeOne=worldIslands.find(grade=>grade.id==='e1');
  assert.ok(gradeOne);
  const items=gradeOne.stages.map(gradeOneStageMapInfo);
  assert.equal(items.length,65);
  assert.ok(items.every(info=>Boolean(info?.title)&&Boolean(info?.goal)));
  assert.equal(new Set(items.map(info=>info.title)).size,65);
  assert.ok(items.slice(0,50).every(info=>!info.provisional));
  assert.ok(items.slice(50).every(info=>info.provisional));
  const source=read('src/components/WorldScenes780.tsx');
  assert.match(source,/sharedIslandStageMapInfo\(grade,stage\)/u);
});

test('release manifests and public URL verifier require the live toy map bundle',()=>{
  const exporter=read('scripts/export-ui-preview.mjs');
  const verifier=read('scripts/verify-web-release.mjs');
  assert.match(exporter,/toyIslandPixelV1:true/u);
  assert.match(exporter,/includes\('toy-island-pixel-v1'\)/u);
  assert.match(verifier,/version.toyIslandPixelV1 === true/u);
  assert.match(verifier,/js.includes\('toy-island-pixel-v1'\)/u);
});
