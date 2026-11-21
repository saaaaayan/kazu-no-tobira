import assert from 'node:assert/strict';
import test from 'node:test';
import {ISLAND_ART_SETS} from '../src/domain/islandArtSets.ts';
import {ISLAND_SPRITES} from '../src/domain/islandPixelSprites.ts';
import {islandScenery,sceneBounds,boxesOverlap,stoneMaze} from '../src/domain/islandScenery.ts';
import {preschoolMapExclusionZones,preschoolDecorationLayout,preschoolDecorationBounds} from '../src/domain/preschoolDecorLayout.ts';
import {islandStageLayout,PRESCHOOL_MAP_TITLE_INSET} from '../src/domain/worldMapLayout.ts';

test('all sixteen art libraries have recognizable pixel silhouettes in three sizes and four ground patterns',()=>{
  assert.equal(Object.keys(ISLAND_ART_SETS).length,16);
  for(const [id,art] of Object.entries(ISLAND_ART_SETS)){
    assert.ok(art.large.length>=3,id);
    assert.ok(art.medium.length>=6,id);
    assert.ok(art.small.length>=8,id);
    assert.ok(new Set([...art.large,...art.medium,...art.small]).size>=18,id);
    assert.equal(new Set(art.ground).size,4,id);
    const silhouettes = new Set();
    for(const kind of [...art.large,...art.medium,...art.small]){
      const rows=ISLAND_SPRITES[kind];
      assert.ok(rows,kind);
      assert.ok(!silhouettes.has(rows.join('')),id+' duplicate silhouette '+kind);
      silhouettes.add(rows.join(''));
      assert.ok(rows.length>=6,kind);
      assert.ok(rows.join('').replaceAll('.','').length>=8,kind);
      assert.match(rows.join(''),/^[.XBAFR]+$/,kind);
    }
  }
});

test('responsive scenery never covers pins, learning labels, signs or the unchanged single route',()=>{
  for(const width of [244,288,320,343,375,398,430,620,1040,1220]){
    const geometry=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
    const before=structuredClone(geometry);
    const exclusions=preschoolMapExclusionZones(width,geometry.positions);
    for(const id of Object.keys(ISLAND_ART_SETS)){
      const scene=islandScenery(id,width,geometry.height,geometry.positions);
      assert.deepEqual(geometry,before);
      const boxes=[];
      for(const item of [...scene.decorations,...scene.ground]){
        const box=sceneBounds(item);
        assert.ok(box.left>=26&&box.right<=width-26&&box.top>=88&&box.bottom<=geometry.height-24,id+' bounds');
        assert.ok(exclusions.every(zone=>!boxesOverlap(box,zone)),id+' obscures navigation at '+width);
        assert.ok(boxes.every(old=>!boxesOverlap(box,old)),id+' overlapping decorations at '+width);
        boxes.push(box);
      }
      if(id==='preschool'||id==='e1'){
        const legacy=preschoolDecorationLayout(width,geometry.height,geometry.positions);
        for(const item of [...scene.decorations,...scene.ground]){
          assert.ok(legacy.every(old=>!boxesOverlap(sceneBounds(item),preschoolDecorationBounds(old))),id+' covers established art');
        }
      } else {
        assert.ok(scene.decorations.filter(item=>item.size==='large').length>=3,id+' missing landmarks '+width);
        assert.ok(new Set(scene.decorations.map(item=>item.kind)).size>=15,id+' insufficient variety '+width);
        assert.equal(new Set(scene.ground.map(item=>item.kind)).size,id==='j1'?3:4,id+' ground variety '+width);
      }
      for(let i=0;i<scene.decorations.length;i++){
        const item=scene.decorations[i];
        assert.ok(scene.decorations.slice(i+1).every(other=>other.kind!==item.kind||
          Math.hypot(other.x-item.x,other.y-item.y)>=(width<620?110:170)),id+' repeated neighboring icons');
      }
      for(const wall of scene.walls){
        assert.ok(wall.x1===wall.x2||wall.y1===wall.y2,'maze walls stay orthogonal');
        const box={left:wall.x1-2.5,right:wall.x2+2.5,top:wall.y1-2.5,bottom:wall.y2+2.5};
        assert.ok(exclusions.every(zone=>!boxesOverlap(box,zone)),'wall below navigation '+width);
      }
    }
  }
});

test('fixed scenes are repeatable and the labyrinth covers every map section with branching stone walls',()=>{
  const geometry=islandStageLayout(375,65,PRESCHOOL_MAP_TITLE_INSET,true);
  const a=islandScenery('j1',375,geometry.height,geometry.positions);
  assert.deepEqual(a,islandScenery('j1',375,geometry.height,geometry.positions));
  const walls=stoneMaze(375,geometry.height,[]);
  assert.ok(walls.length>1000);
  assert.ok(walls.some(w=>w.x1!==w.x2)&&walls.some(w=>w.y1!==w.y2));
  for(let row=0;row<13;row++){
    const y=geometry.positions[row*5].y;
    assert.ok(a.walls.some(w=>w.y1>=y+85&&w.y1<=y+245),'missing maze section '+row);
  }
  assert.equal(islandScenery('e2',375,geometry.height,geometry.positions).walls.length,0);
  assert.deepEqual(islandScenery('j1',0,0,[]),{decorations:[],ground:[],walls:[]});
});
