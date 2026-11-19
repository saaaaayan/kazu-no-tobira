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
