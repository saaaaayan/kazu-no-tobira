import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('fitted portrait map never creates a nested horizontal ScrollView that blocks vertical swiping',()=>{
  const ui=read('src/components/WorldScenes780.tsx');
  const native=read('src/components/WorldMapViewport.tsx');
  const web=read('src/components/WorldMapViewport.web.tsx');
  assert.match(ui,/<WorldMapViewport zoomed=\{compact&&zoomed\}/);
  assert.doesNotMatch(ui,/<ScrollView horizontal scrollEnabled=\{compact&&zoomed\}/);
  assert.match(native,/if\(!zoomed\)return <View/);
  assert.match(web,/if\(!zoomed\)return <div/);
  assert.match(web,/touchAction:'pan-y pinch-zoom'/);
  assert.match(web,/touchAction:'pan-x pan-y pinch-zoom'/);
  assert.match(web,/overflowX:'auto'/);
  assert.doesNotMatch(web,/onTouchMove|preventDefault|touchAction:'none'/);
  assert.match(ui,/onPress=\{\(\)=>onGrade\(grade\)\}/);
  assert.match(read('src/FullAdventure.tsx'),/scrollEnabled=\{!round\|\|!drawing\}/);
});
