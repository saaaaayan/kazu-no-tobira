import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('src/components/WorldScenes780.tsx');
const terrain=read('src/components/PreschoolPixelTerrain.tsx');

test('preschool title has two muted pixel paw stamps on the left and right',()=>{
  assert.match(ui,/function PreschoolPawStamp\(\{flipped=false,compact=false\}/);
  assert.match(ui,/testID=\{flipped\?'preschool-title-paw-right':'preschool-title-paw-left'\}/);
  assert.match(ui,/flipped\?'translate\(24 0\) scale\(-1 1\)'/);
  assert.match(ui,/const shade='#9b8b77'/);
  assert.match(ui,/accessible=\{false\}/);
  assert.match(ui,/<View style=\{styles\.preschoolMapTopNameWithPaws\}>\s*<PreschoolPawStamp compact=\{compactStageMap\}\/>\s*<Text style=\{\[styles\.preschoolMapTopName,compactStageMap&&styles\.preschoolMapTopNameCompact\]\}>ぬいぐるみの島<\/Text>\s*<PreschoolPawStamp flipped compact=\{compactStageMap\}\/>/);
  assert.match(ui,/preschoolMapTopTitleCompact:\{left:17,right:17\}/);
  assert.match(ui,/preschoolMapTopNameCompact:\{fontSize:17,lineHeight:21\}/);
  assert.match(ui,/preschoolMapTopNameWithPaws:\{flexDirection:'row',alignItems:'center'/);
  assert.doesNotMatch(ui,/🐾/,'paw stamps should be pixel-art, not emoji');
});

test('squirrel has a short curled side tail rather than tall rectangular chimney',()=>{
  const match=terrain.match(/\{animal==='squirrel'&&<G>([\s\S]*?)<\/G>\}/);
  assert.ok(match,'squirrel-specific vector art must exist');
  const squirrel=match[1];
  assert.match(squirrel,/<Path d="M-17 -23 L-14 -38 L-2 -23 Z"/);
  assert.match(squirrel,/<Path d="M2 -23 L14 -38 L17 -23 Z"/);
  assert.equal((squirrel.match(/<Path d="M(?:-17|2) -23/g)||[]).length,2,'two triangular ears');
  assert.match(squirrel,/<Path d="M14 12 V-5 H20 V-15/);
  assert.match(squirrel,/fill="#af825e"/);
  assert.doesNotMatch(squirrel,/x=\{23\} y=\{-33\}/);
});

test('owl has two tufts, and monkey/owl do not receive duplicate generic bear ears',()=>{
  assert.match(terrain,/const bearEars=\['bear','panda','lion','koala'\]\.includes\(animal\)/);
  const match=terrain.match(/\{animal==='owl'&&<G>([\s\S]*?)<\/G>\}/);
  assert.ok(match,'owl tufts must exist');
  assert.equal((match[1].match(/<Rect /g)||[]).length,2);
  assert.match(match[1],/x=\{-16\} y=\{-34\}/);
  assert.match(match[1],/x=\{7\} y=\{-34\}/);
  assert.match(terrain,/\{animal==='monkey'&&<G>/);
  assert.match(terrain,/\{animal==='mouse'&&<G>/);
  assert.match(terrain,/\{animal==='frog'&&<G>/);
});

test('pixel paws and fixed plush artwork do not alter map geometry or decoration collision rules',()=>{
  const planner=read('src/domain/preschoolDecorLayout.ts');
  assert.match(terrain,/preschoolDecorationLayout\(width,height,positions\)/);
  assert.match(planner,/preschoolMapExclusionZones/);
  assert.match(planner,/preschoolDecorationBounds/);
  assert.match(ui,/preschoolStageLabelLayout\(actual,position,marker\)/);
  assert.match(ui,/islandCheckpointLayout\(actual,end,marker,nextPoint,grade.id==='preschool'\)/);
});
