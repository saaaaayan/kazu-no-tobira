import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands,allWorldStages} from '../src/domain/worldCatalog.ts';
import {worldMapLayout} from '../src/domain/worldMapLayout.ts';
import {atlasIslandSymbols} from '../src/domain/worldAtlasSymbols.ts';

const confirmedNames=[
  'ぬいぐるみの島','おもちゃの島','どうぶつの島','おかしの島',
  '恐竜の島','機械の島','古代の島','迷宮の島',
  '鏡の島','光と影の島','星座の島','大自然の島',
  'アカデミーの島','魔法使いの島','王国','宇宙の島',
];

test('all 16 island names reflect the previously confirmed themes without altering stage IDs',()=>{
  assert.deepEqual(worldIslands.map(grade=>grade.island),confirmedNames);
  assert.deepEqual(atlasIslandSymbols.map(art=>art.name),confirmedNames);
  assert.equal(worldIslands.length,16);
  assert.equal(allWorldStages.length,1040);
  assert.equal(new Set(allWorldStages.map(stage=>stage.id)).size,1040);
  assert.ok(worldIslands.every(grade=>grade.stages.length===65));
});

test('all 16 theme icons are unique, single-color, restrained SVG symbols',()=>{
  const art=readFileSync(new URL('../src/components/WorldAtlasArt.tsx',import.meta.url),'utf8');
  const map=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');
  assert.equal(atlasIslandSymbols.length,16);
  assert.equal(new Set(atlasIslandSymbols.map(item=>item.icon)).size,16);
  for(const [index,symbol] of atlasIslandSymbols.entries()){
    assert.ok(symbol.coast.startsWith('M'),index+' missing shape');
    assert.ok(symbol.icon.startsWith('M') && symbol.icon.length>=30,index+' missing pictogram');
    assert.equal(symbol.ink,'#f0e4c9');
    assert.match(symbol.land,/^#[\da-f]{6}$/);
    const colors=[symbol.land,symbol.rock];
    for(const color of colors){
      const values=[1,3,5].map(pos=>parseInt(color.slice(pos,pos+2),16));
      assert.ok(Math.max(...values)-Math.min(...values)<90,
        'avoid an overly bright saturated island '+index+' '+color);
    }
  }
  assert.match(art,/d={art\.icon} fill="none" stroke={art\.ink}/);
  assert.doesNotMatch(art,/art\.feature|art\.light|Sparkle|glitter/i);
  assert.match(map,/String\(index\+1\)\.padStart\(2,'0'\)/);
  assert.match(map,/道にそって進もう/);
});

test('stage progression uses a readable non-crossing serpentine order on phones and desktops',()=>{
  for(const width of [288,360,699,700,850,1000]){
    const {positions,targetWidth,height}=worldMapLayout(width);
    const compact=width<700;
    const columns=compact?2:4;
    const rows=16/columns;
    for(let row=0;row<rows;row++){
      const points=positions.slice(row*columns,(row+1)*columns);
      for(let k=1;k<points.length;k++)
        assert.equal(Math.sign(points[k].x-points[k-1].x),row%2===0?1:-1,
          'route must alternate direction each row '+width+' row '+row);
      const minY=Math.min(...points.map(p=>p.y));
      const maxY=Math.max(...points.map(p=>p.y));
      assert.ok(maxY-minY<60,'same row should remain horizontally legible');
      assert.ok(points.every(p=>p.x-targetWidth/2>0&&p.x+targetWidth/2<width&&p.y+85<height));
      if(row>0)assert.ok(minY>Math.max(...positions.slice((row-1)*columns,row*columns).map(p=>p.y))+60);
    }
    assert.equal(new Set(positions.map(p=>p.x)).size,16);
    assert.equal(new Set(positions.map(p=>p.y)).size,16);
  }
});
