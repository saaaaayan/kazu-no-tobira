import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const ui=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');

test('preschool island map appears before curriculum, start shortcut, legend and study material',()=>{
  const render=ui.slice(ui.indexOf('  const supplementalPanels=('),ui.indexOf('\nconst styles=StyleSheet.create('));
  const panelsStart=render.indexOf('  const supplementalPanels=(');
  const panelsEnd=render.indexOf('  return (',panelsStart);
  const panels=render.slice(panelsStart,panelsEnd);
  assert.match(panels,/<IslandCurriculumPanel grade=\{grade\}/);
  assert.match(panels,/testID="kazu-preview-first-stage"/);
  assert.match(panels,/styles\.legend/);
  assert.match(panels,/styles\.studyCard/);
  assert.match(panels,/styles\.nextButton/);

  const actualRender=render.slice(panelsEnd);
  const topSupplement=actualRender.indexOf("{!standardPixelMap && supplementalPanels}");
  const mapHeading=actualRender.indexOf('<View style={styles.mapHeading}>');
  const mapTerrain=actualRender.indexOf('<View style={[styles.ocean');
  const bottomSupplement=actualRender.indexOf("{standardPixelMap && supplementalPanels}");
  const footer=actualRender.indexOf('styles.footer');
  assert.ok(topSupplement>0&&topSupplement<mapHeading,'other islands keep their prior top panels');
  assert.ok(topSupplement<mapTerrain&&mapTerrain<bottomSupplement,
    'preschool island must show the navigable map before supporting cards');
  assert.ok(bottomSupplement<footer,'reference material is still available below map');
  assert.equal((actualRender.match(/<IslandCurriculumPanel/g)||[]).length,0,
    'all curriculum instances should be rendered from the grade-conditional panel');
});

test('preschool map navigation stays playable without scrolling through curriculum first',()=>{
  assert.match(ui,/styles\.stagePin,standardPixelMap&&styles\.pixelStagePin/);
  assert.match(ui,/onPress=\{\(\)=>onStart\(stage\)\}/);
  assert.match(ui,/testID=\{'island-checkpoint-'\+checkpoint\.number\}/);
  assert.match(ui,/testID="preschool-map-top-title"/);
  assert.match(ui,/styles\.islandBanner/);
});
