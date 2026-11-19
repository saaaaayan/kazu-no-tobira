import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compactIslandStageMap,islandCheckpointLayout,islandStageLayout,PRESCHOOL_MAP_TITLE_INSET}
  from '../src/domain/worldMapLayout.ts';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {checkpointsFor} from '../src/domain/stageStructure.ts';
const code=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('every five-stage preschool group has a dedicated wide vertical clearing',()=>{
 const preschool=worldIslands.find(grade=>grade.id==='preschool');
 assert.equal(preschool.stages.length,65);
 for(const width of [290,340,390,480,619,620,850,1024]){
   const compact=compactIslandStageMap(width);
   const normal=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,false);
   const detailed=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
   const gap=compact?102:110;
   const rowHeight=compact?190:160;
   assert.equal(detailed.rowHeight,rowHeight);
   assert.equal(detailed.positions.length,65);
   assert.ok(detailed.height>normal.height+gap*11);
   for(let row=1;row<13;row++){
     const prev=detailed.positions[row*5-1];
     const next=detailed.positions[row*5];
     assert.equal(next.y-prev.y,
       rowHeight+gap+([10,12].includes(row)?compact?58:50:0),
       JSON.stringify({width,row,prev,next}));
     assert.equal(prev.x,next.x,'the route enters the next row on the same side');
   }
 }
});

test('the ten big checkpoint signs are visible and correctly centered in their own gaps',()=>{
 const preschool=worldIslands.find(grade=>grade.id==='preschool');
 const checks=checkpointsFor(preschool);
 assert.equal(checks.length,10);
 for(const width of [290,340,390,480,619,620,850,1024]){
   const compact=compactIslandStageMap(width);
   const layout=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
   const marker=Math.max(46,Math.min(57,Math.floor(width/5)-9));
   for(const checkpoint of checks){
     const prev=layout.positions[checkpoint.after.order];
     const next=layout.positions[checkpoint.after.order+1];
     const sign=islandCheckpointLayout(width,prev,marker,next,true);
     assert.equal(sign.compact,compact);
     assert.equal(sign.height,86);
     assert.ok(sign.width>=116,'clear large touch target');
     assert.ok(sign.left>=8 && sign.left+sign.width<=width-8,
       JSON.stringify({width,checkpoint:checkpoint.number,sign}));
     assert.equal(sign.top,Math.round((prev.y+next.y-sign.height)/2));
     const labelBottom=prev.y+marker/2+5+(compact?42:32);
     assert.ok(sign.top>=labelBottom+10,
       'sign must not overlap a three-line stage name: '+JSON.stringify({width,checkpoint:checkpoint.number,sign,labelBottom}));
     assert.ok(sign.top+sign.height<=next.y-marker/2-20,
       'sign must not overlap the next stage pin');
     const center=sign.left+sign.width/2;
     assert.ok(Math.abs(center-prev.x)<sign.width/2,
       'sign stays associated with the actual connecting path');
   }
 }
});

test('checkpoint signs show the review range and the ten actual numbered tests',()=>{
 const src=code('src/components/WorldScenes780.tsx');
 assert.match(src,/checkpointsFor\(grade\)\.map/);
 assert.match(src,/testID=\{'island-checkpoint-'\+checkpoint\.number\}/);
 assert.match(src,/grade.id==='preschool' && checkpoint.number<=10/);
 assert.match(src,/grade.id==='preschool' \? <>/);
 assert.match(src,/✓ かくにん/);
 assert.match(src,/テスト \{checkpoint\.number\}/);
 assert.match(src,/\{\(checkpoint\.number-1\)\*5\+1\}〜\{checkpoint\.number\*5\} の もんだい/);
 assert.match(src,/styles\.preschoolCheckpointTitle/);
 assert.match(src,/styles\.preschoolCheckpointRange/);
 assert.match(src,/onPress=\{\(\)=>onCheckpoint\(checkpoint\)\}/);
 assert.match(src,/borderWidth:grade.id==='preschool'\?3:1/);
 assert.match(src,/grade.id==='preschool'&&styles\.preschoolCheckpointSign/);
});

test('new pixel plush friends fill the checkpoint clearings without obscuring signs',()=>{
 const src=code('src/components/PreschoolPixelTerrain.tsx');
 assert.match(src,/Array\.from\(\{length:12\},\(_,gap\)=>\{/);
 assert.match(src,/const midY=\(positions\[row\*5-1\]\.y\+positions\[row\*5\]\.y\)\/2/);
 assert.match(src,/row%2===1/);
 assert.match(src,/x:\.23,offset:-18/);
 assert.match(src,/x:\.77,offset:18/);
 assert.match(src,/checkpoint-clearing-plush-/);
 assert.match(src,/ANIMALS\[\(row\*3\+slot\*5\)%ANIMALS\.length\]/);
 assert.match(src,/scale=\{scale\*spot\.size\}/);
 assert.match(src,/routeThrough\(paths\.normal\)/);
});
