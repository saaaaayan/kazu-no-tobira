import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {ISLAND_ART_SETS} from '../src/domain/islandArtSets.ts';
import {ISLAND_SPRITES} from '../src/domain/islandPixelSprites.ts';
import {WILDLIFE_COLORS,WILDLIFE_SPRITES} from '../src/domain/wildlifePixelSprites.ts';
import {islandScenery} from '../src/domain/islandScenery.ts';
import {islandStageLayout,PRESCHOOL_MAP_TITLE_INSET} from '../src/domain/worldMapLayout.ts';

test('forest heroes are four different whole-body animals, with wildlife and nature in every size',()=>{
  const art=ISLAND_ART_SETS.e2;
  assert.deepEqual(art.large,['forestBear','forestRabbit','forestFox','forestDeer']);
  assert.equal(art.medium.filter(kind=>['forestSquirrel','forestOwl','forestRaccoon','forestBird'].includes(kind)).length,4);
  assert.ok([...art.large,...art.medium,...art.small].every(kind=>kind.startsWith('forest')));
  for(const kind of art.large)assert.ok(WILDLIFE_COLORS[kind]);
  assert.equal(new Set(art.large.map(kind=>WILDLIFE_SPRITES[kind].join(''))).size,4);
  assert.equal(art.medium.length,15);
  assert.equal(art.small.length,8);
});

test('prehistoric heroes include eight recognizable dinosaur silhouettes plus a volcano',()=>{
  const art=ISLAND_ART_SETS.e4;
  assert.deepEqual(art.large,['prehistoricRex','prehistoricTriceratops','prehistoricPterosaur','prehistoricLongneck','prehistoricStegosaurus','prehistoricAnkylosaurus','prehistoricParasaurolophus','prehistoricRaptor','prehistoricVolcano']);
  const wing=WILDLIFE_SPRITES.prehistoricPterosaur;
  const neck=WILDLIFE_SPRITES.prehistoricLongneck;
  assert.equal(wing[0].length,32);
  assert.equal(wing.length,32);
  assert.ok(neck.length>25,'longneck has a tall silhouette');
  assert.ok([...art.large,...art.medium,...art.small].every(kind=>kind.startsWith('prehistoric')));
  assert.equal(new Set(art.large.map(kind=>WILDLIFE_SPRITES[kind].join(''))).size,9);
  assert.equal(art.medium.length,8);
  assert.equal(art.small.length,8);
});

test('wildlife receives priority at the start and across the island without moving any stage',()=>{
  for(const width of [244,281,288,320,336,375,391,430,620,1022,1220]){
    const layout=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
    const saved=structuredClone(layout);
    for(const id of ['e2','e4']){
      const scene=islandScenery(id,width,layout.height,layout.positions);
      const large=scene.decorations.filter(item=>item.size==='large');
      assert.ok(large.length>=10,id+' insufficient principal characters '+width);
      assert.ok(large.every(item=>item.width>(width<280?50:60)));
      const first=large.filter(item=>item.y<layout.positions[5].y);
      assert.ok(first.length>=1,id+' needs a hero before the second stage row '+width);
      const animals=large.filter(item=>item.kind!=='prehistoricVolcano');
      assert.ok(animals.length/large.length>=.7,id+' animal heroes must dominate');
      const kinds=new Set(animals.map(item=>item.kind));
      assert.equal(kinds.size,id==='e2'?4:8,id+' show every principal species across the island');
      if(id==='e2'){
        const allKinds=new Set(scene.decorations.map(item=>item.kind));
        for(const species of [...ISLAND_ART_SETS.e2.large,...ISLAND_ART_SETS.e2.medium.filter(kind=>!['forestTree','forestStump','forestMushroom','forestGrass','forestPine','forestFallenLog','forestBerryBush'].includes(kind))])
          assert.ok(allKinds.has(species),'missing '+species+' at '+width);
      }
      assert.equal(new Set(scene.ground.map(item=>item.kind)).size,4);
    }
    assert.deepEqual(layout,saved);
  }
});

test('the other fourteen islands keep their exact sprite libraries and seeded scenery',()=>{
  const baseline=JSON.parse(readFileSync(new URL('./fixtures/other-island-art-baseline.json',import.meta.url),'utf8'));
  for(const width of [288,1040]){
    const layout=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
    for(const [id,art] of Object.entries(ISLAND_ART_SETS)){
      if(['e2','e4'].includes(id))continue;
      const payload={art,sprites:[...art.large,...art.medium,...art.small].map(kind=>ISLAND_SPRITES[kind]),
        scene:islandScenery(id,width,layout.height,layout.positions)};
      const hash=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      assert.equal(hash,baseline[id+'-'+width],id+' changed beyond the two-island scope');
    }
  }
});


test('all twenty living species have unique silhouettes and recur without adjacent copies',()=>{
  const forest=[...ISLAND_ART_SETS.e2.large,...ISLAND_ART_SETS.e2.medium.slice(0,8)];
  const dinosaurs=ISLAND_ART_SETS.e4.large.filter(kind=>kind!=='prehistoricVolcano');
  assert.equal(forest.length,12);
  assert.equal(dinosaurs.length,8);
  const silhouettes=[...forest,...dinosaurs].map(kind=>WILDLIFE_SPRITES[kind].map(row=>row.replace(/[BAFR]/g,'X')).join(''));
  assert.equal(new Set(silhouettes).size,20,'ears, tails, beaks, plates, crests and armor differ');
  for(const width of [244,281,288,320,336,375,391,430,620,1022,1220]){
    const layout=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET,true);
    for(const [id,kinds] of [['e2',forest],['e4',dinosaurs]]){
      const scene=islandScenery(id,width,layout.height,layout.positions);
      for(const kind of kinds)assert.ok(scene.decorations.some(item=>item.kind===kind),kind+' absent at '+width);
      for(let row=0;row<13;row++){
        const inGap=scene.decorations.filter(item=>item.y>=layout.positions[row*5].y
          &&item.y<(layout.positions[(row+1)*5]?.y??layout.height));
        assert.equal(new Set(inGap.map(item=>item.kind)).size,inGap.length,id+' repeats in gap '+row+' at '+width);
      }
      for(const [index,item] of scene.decorations.entries())for(const other of scene.decorations.slice(index+1)){
        if(item.kind!==other.kind)continue;
        assert.ok(Math.hypot(item.x-other.x,item.y-other.y)>=(width<620?110:170),item.kind+' repeated too close');
      }
    }
    const rex=islandScenery('e4',width,layout.height,layout.positions).decorations.find(item=>item.kind==='prehistoricRex');
    assert.ok(rex&&rex.y<layout.positions[5].y,'T. rex introduces the dinosaur island '+width);
  }
});
