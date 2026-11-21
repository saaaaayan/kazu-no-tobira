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
  assert.equal(art.medium.length,8);
  assert.equal(art.small.length,8);
});

test('prehistoric heroes include five recognizable dinosaur silhouettes plus a volcano',()=>{
  const art=ISLAND_ART_SETS.e4;
  assert.deepEqual(art.large,['prehistoricRex','prehistoricTriceratops','prehistoricPterosaur','prehistoricLongneck','prehistoricStegosaurus','prehistoricVolcano']);
  const wing=WILDLIFE_SPRITES.prehistoricPterosaur;
  const neck=WILDLIFE_SPRITES.prehistoricLongneck;
  assert.equal(wing[0].length,32);
  assert.equal(wing.length,32);
  assert.ok(neck.length>25,'longneck has a tall silhouette');
  assert.ok([...art.large,...art.medium,...art.small].every(kind=>kind.startsWith('prehistoric')));
  assert.equal(new Set(art.large.map(kind=>WILDLIFE_SPRITES[kind].join(''))).size,6);
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
      assert.equal(kinds.size,id==='e2'?4:5,id+' show every principal species across the island');
      if(id==='e2'){
        const allKinds=new Set(scene.decorations.map(item=>item.kind));
        for(const species of [...ISLAND_ART_SETS.e2.large,'forestSquirrel','forestOwl','forestRaccoon','forestBird'])
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
