import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {plushTownScenery} from '../src/domain/plushTownScenery.ts';
import {islandStageLayout,islandRouteByKind} from '../src/domain/worldMapLayout.ts';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {checkpointsFor} from '../src/domain/stageStructure.ts';

test('plush town uses separate artwork and preserves every interactive learning point',()=>{
 const grade=worldIslands.find(g=>g.id==='preschool');
 assert.equal(grade.stages.length,65);
 assert.equal(checkpointsFor(grade).length,10);
 for(const w of [244,360,390,620,1000]){
   const layout=islandStageLayout(w,65,86,true);
   const groups=islandRouteByKind(grade.stages,layout.positions);
   assert.deepEqual([groups.normal.length,groups.extra.length,groups.secret.length],[50,10,5]);
 }
 assert.equal(Object.keys(plushTownScenery).length,8);
 for(const uri of Object.values(plushTownScenery)){
   assert.match(uri,/^data:image\/jpeg;base64,/);
   assert.equal(Buffer.from(uri.split(',')[1],'base64').subarray(0,2).toString('hex'),'ffd8');
 }
 const terrain=readFileSync(new URL('../src/components/PreschoolFantasyTerrain.tsx',import.meta.url),'utf8');
 assert.match(terrain,/pointerEvents="none"/);
 assert.match(terrain,/routeThrough\(groups\[kind\]\)/);
 const ui=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');
 assert.match(ui,/ぬいぐるみの町<\/Text>/);
 assert.match(ui,/onPress=\{\(\)=>onStart\(stage\)\}/);
 assert.match(ui,/onPress=\{\(\)=>onCheckpoint\(checkpoint\)\}/);
});
