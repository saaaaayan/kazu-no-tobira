import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('The preschool island uses live pixel plush SVG behind all interactive stage targets',()=>{
  const source=read('src/components/WorldScenes780.tsx');
  const art=read('src/components/PreschoolPixelTerrain.tsx');
  const catalog=read('src/domain/worldCatalog.ts');
  const app=read('src/FullAdventure.tsx');
  assert.match(catalog,/id: 'preschool', title: '就学前'/);
  assert.match(source,/import \{ PreschoolPixelTerrain \}/);
  assert.match(source,/testID=\{grade\.id==='preschool'\?'preschool-plush-pixel-v2':undefined\}/);
  assert.match(source,/grade\.id === 'preschool'/);
  assert.match(source,/<PreschoolPixelTerrain width=\{width\} height=\{height\}/);
  assert.match(art,/preschool-plush-pixel-v2/);
  for (const species of ['bear','bunny','panda','elephant','dog','cat','lion','penguin','lamb','fox','koala','chick','giraffe']) {
    assert.match(art,new RegExp('\\b'+species+'\\b'));
  }
  assert.match(source,/checkpointsFor\(grade\)\.map/);
  assert.match(source,/onPress=\{\(\)=>onStart\(stage\)\}/);
  assert.match(app,/import VersionNotice from '\.\/components\/VersionNotice'/);
  assert.match(app,/!round && screen !== 'lesson'.*<VersionNotice\/>/);
});

test('The public sample release manifest and verifier enforce the themed map',()=>{
  const manifest=read('scripts/export-ui-preview.mjs');
  const verifier=read('scripts/verify-web-release.mjs');
  const notice=read('src/components/VersionNotice.web.tsx');
  assert.match(manifest,/preschoolPlushPixelV2:true/);
  assert.match(verifier,/version\.preschoolPlushPixelV2 === true/);
  assert.match(verifier,/preschool-plush-pixel-v2/);
  assert.match(notice,/EXPO_PUBLIC_KAZU_UI_PREVIEW_SHA \|\| BUILD_VERSION/);
  assert.match(notice,/sessionStorage/);
  assert.match(notice,/location\.replace/);
});

test('Each island map has exactly three section banners, one per 50/10/5 stage area',()=>{
  const ui=read('src/components/WorldScenes780.tsx');
  const art=read('src/components/PreschoolPixelTerrain.tsx');
  assert.match(ui,/\{row:0,title:stageLabels\.normal,count:50,kind:'normal'\}/);
  assert.match(ui,/\{row:10,title:stageLabels\.extra,count:10,kind:'extra'\}/);
  assert.match(ui,/\{row:12,title:stageLabels\.secret,count:5,kind:'secret'\}/);
  assert.match(ui,/testID=\{'island-area-'\+area\.kind\}/);
  assert.doesNotMatch(ui,/Array\.from\(\{length:13\},\(_,row\)=>\{\s*const y=geometry\.positions/);
  assert.match(art,/row<10\s*\? \(row%2===0/);
  assert.match(art,/row<12\s*\? \(row%2===0/);
  assert.match(art,/\[50,60\]\.map/);
  assert.match(ui,/checkpointsFor\(grade\)\.map/);
});

test('Phone maps condense five stage labels to a single row title without hiding stage controls',()=>{
  const ui=read('src/components/WorldScenes780.tsx');
  const domain=read('src/domain/islandCurriculumView.ts');
  assert.match(ui,/compactStageMap && Array.from\(\{length:Math.ceil\(grade.stages.length\/5\)\}/);
  assert.match(ui,/!compactStageMap && grade.stages.map/);
  assert.match(ui,/stageRowCategoryName\(grade,row\)/);
  assert.match(domain,/export function stageRowCategoryName/);
  assert.match(ui,/testID=\{'island-row-topic-'\+row\}/);
  assert.match(ui,/numberOfLines=\{2\} style=\{styles.compactRowTopicText\}/);
  assert.match(ui,/islandCheckpointLayout\(actual,end,marker,nextPoint\)/);
  assert.match(ui,/checkpointLayout.compact\?'テスト':'確認テスト'/);
  assert.match(ui,/onPress=\{\(\)=>onCheckpoint\(checkpoint\)\}/);
  assert.match(ui,/onPress=\{\(\)=>onStart\(stage\)\}/);
  assert.match(ui,/testID=\{'island-area-'\+area.kind\}/);
});

test('Mobile preschool plush toys are visibly enlarged and avoid the three area banners',()=>{
  const art=read('src/components/PreschoolPixelTerrain.tsx');
  const ui=read('src/components/WorldScenes780.tsx');
  assert.match(art,/const compact=width<620/);
  assert.match(art,/Math\.max\(\.72,Math\.min\(\.94,width\/410\)\)/);
  assert.match(art,/row===0\?56\+PRESCHOOL_MAP_TITLE_INSET:compact&&\(row===10\|\|row===12\)\?y-105/);
  assert.match(art,/x=\{width\*\(compact\?\.28:\.2\)\}/);
  assert.match(art,/x=\{width\*\(compact\?\.72:\.8\)\}/);
  assert.match(ui,/left:Math\.max\(68,Math\.ceil\(actual\*\.16\)\)/);
  assert.match(ui,/const nextPoint=geometry\.positions\[checkpoint\.after\.order\+1\]/);
});

test('The in-map preschool title is visible above plush mascots and the first area',()=>{
  const ui=read('src/components/WorldScenes780.tsx');
  const terrain=read('src/components/PreschoolPixelTerrain.tsx');
  assert.match(ui,/grade\.id==='preschool'\?PRESCHOOL_MAP_TITLE_INSET:0/);
  assert.match(ui,/testID="preschool-map-top-title"/);
  assert.match(ui,/<Text style=\{styles\.preschoolMapTopGrade\}>就学前<\/Text>/);
  assert.match(ui,/<Text style=\{styles\.preschoolMapTopName\}>ぬいぐるみの島<\/Text>/);
  assert.match(ui,/preschoolMapTopTitle:\{position:'absolute',top:18,left:40,right:40,height:58/);
  assert.match(terrain,/row===0\?56\+PRESCHOOL_MAP_TITLE_INSET/);
});
