import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');
const map=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');

test('preschool island and questions hide trial/version/navigation chrome, while the world still discloses preview mode',()=>{
  assert.match(app,/const preschoolMapFirst = !round && screen === 'island' && grade.id === 'preschool'/);
  assert.match(app,/const preschoolChildView = preschoolMapFirst \|\| Boolean\(!review && round\?\.stage\.gradeId === 'preschool'\)/);
  assert.match(app,/!standardIslandMapFirst && <VersionNotice\/>/);
  assert.match(app,/uiPreview && !standardIslandChildView && <View style=\{styles.playPanel\} testID="kazu-sample-only-preview"/);
  assert.match(app,/__DEV__ && !review && !standardIslandChildView && <View style=\{styles.navigation\}/);
  assert.match(app,/\) : !standardIslandChildView \? \(\s*<View style=\{styles.navigation\}>/);
  assert.match(app,/contentContainerStyle=\{\[styles.scroll,standardIslandMapFirst&&styles.preschoolScroll,screen==='world' && !round && styles.worldMapScroll\]\}/);
  assert.match(app,/worldMapScroll: \{ paddingTop: 0, paddingHorizontal: 0 \}/);
  assert.match(app,/worldMapShell: \{ maxWidth: '100%', alignSelf: 'flex-start' \}/);
  assert.match(app,/style=\{\[styles.shell,standardIslandMapFirst&&styles.preschoolShell/);
  assert.match(app,/試作版の回答記録は保存されません/);
  assert.match(app,/screen === 'world' &&\s*<WorldMap780/);
  assert.match(app,/screen === 'island' &&\s*<IslandStageMap/);
});

test('preschool island displays its back link, one short hint, and the stage map without redundant title cards',()=>{
  assert.match(map,/style=\{\[styles.screen,standardPixelMap&&styles.preschoolScreen\]\}/);
  assert.match(map,/standardPixelMap\?'‹ せかいちずへ':'‹ 世界地図に もどる'/);
  assert.match(map,/\{!standardPixelMap && <View style=\{styles.islandBanner\}>/);
  assert.match(map,/\{!standardPixelMap && <View style=\{styles.mapHeading\}>/);
  assert.match(map,/testID=\{grade.id==='preschool'\?'preschool-map-quick-hint':'toy-map-quick-hint'\}/);
  assert.match(map,/すうじを さわってね/);
  const island=map.slice(map.indexOf('export function IslandStageMap('));
  assert.ok(island.indexOf('preschool-map-quick-hint') < island.indexOf('<View style={[styles.ocean,'));
  assert.match(map,/testID="preschool-map-top-title"/);
  assert.match(map,/onPress=\{\(\)=>onStart\(stage\)\}/);
  assert.match(map,/\{standardPixelMap && supplementalPanels\}/);
});
