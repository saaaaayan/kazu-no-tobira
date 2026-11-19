import test from 'node:test';
import assert from 'node:assert/strict';
import {
  preschoolDecorationLayout,preschoolDecorationBounds,preschoolMapExclusionZones,
  PRESCHOOL_PLUSH_ANIMALS,
} from '../src/domain/preschoolDecorLayout.ts';
import { islandStageLayout,PRESCHOOL_MAP_TITLE_INSET } from '../src/domain/worldMapLayout.ts';

const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const expanded=(a,p)=>({left:a.left-p,right:a.right+p,top:a.top-p,bottom:a.bottom+p});

for(const width of [290,360,390,619,620,820,1100,1440]){
 test('preschool decorative scattering clears UI and has organic variety at width '+width,()=>{
   const geometry=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
   const decorations=preschoolDecorationLayout(width,geometry.height,geometry.positions);
   const zones=preschoolMapExclusionZones(width,geometry.positions);
   assert.deepEqual(decorations,preschoolDecorationLayout(width,geometry.height,geometry.positions),
     'Map decorations must never reshuffle after a re-render');
   const animals=decorations.filter(d=>d.kind==='plush');
   const blocks=decorations.filter(d=>d.kind==='blocks');
   const flowers=decorations.filter(d=>d.kind==='flower');
   assert.ok(animals.length>=(width<620?33:85),
     'too few plushes: '+JSON.stringify({width,plush:animals.length,blocks:blocks.length,flowers:flowers.length}));
   assert.ok(flowers.length>=(width<620?20:70),'there should be many more flowers');
   assert.ok(blocks.length>=(width<620?8:21),'there should be many more toy-block stacks');
   const variety=new Set(animals.map(d=>d.animal));
   assert.ok(variety.size>=(width<620?15:21),'animal variety is too limited');
   const sizes=animals.map(d=>d.scale);
   assert.ok(Math.max(...sizes)/Math.min(...sizes)>1.55,
     'plush sizes must vary clearly');
   for(let i=0;i<decorations.length;i++){
     const item=decorations[i];
     const box=preschoolDecorationBounds(item);
     assert.ok(box.left>=26&&box.right<=width-26&&box.top>=88&&box.bottom<=geometry.height-24,
       'decoration must remain inside playable map '+JSON.stringify({width,item}));
     for(const zone of zones)assert.ok(!overlap(expanded(box,7),zone),
       'decoration obscures checkpoint, heading, stage, label or road: '+JSON.stringify({width,item,box,zone}));
     for(let j=0;j<i;j++){
       const other=decorations[j];
       assert.ok(!overlap(expanded(box,item.kind==='flower'?2:6),preschoolDecorationBounds(other)),
         'decorations overlap '+JSON.stringify({width,item,other}));
       if(item.kind==='plush'&&other.kind==='plush'&&item.animal===other.animal){
         const distance=Math.hypot(item.x-other.x,item.y-other.y);
         assert.ok(distance>=(width<620?115:175),
           'identical plushes are clustered '+JSON.stringify({width,item,other,distance}));
       }
     }
   }
   // Scatter isn't 3 or 4 repeated x coordinates, nor is size repeated by row.
   assert.ok(new Set(animals.map(d=>Math.round(d.x))).size>=Math.min(28,animals.length));
   assert.ok(new Set(animals.map(d=>Math.round(d.y))).size>=Math.min(30,animals.length));
 });
}

test('all 23 plush types are defined and no repeated species are adjacent in the palette',()=>{
 assert.ok(PRESCHOOL_PLUSH_ANIMALS.length>=23);
 assert.equal(new Set(PRESCHOOL_PLUSH_ANIMALS).size,PRESCHOOL_PLUSH_ANIMALS.length);
 for(const type of ['monkey','frog','mouse','duck','raccoon','squirrel','hedgehog','pig','turtle','owl']){
   assert.ok(PRESCHOOL_PLUSH_ANIMALS.includes(type),'new plush kind '+type);
 }
});
