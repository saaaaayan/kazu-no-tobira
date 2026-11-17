import assert from 'node:assert/strict';
import test from 'node:test';
import { countingBoardSizes, countingTileAppearance } from '../src/domain/countingBoardSizes.ts';

test('preschool counting objects are large and do not overflow narrow phones',()=>{
  const sampleWidths=[320,360,375,390,430,480,600,768,1440];
  for(const width of sampleWidths) {
    const { tile, symbol, gap } = countingBoardSizes(width,true);
    assert.ok(tile>=62,'touch targets should be at least 62px');
    assert.ok(symbol>=43,'circle should be visibly larger than the old 30px glyph');
    assert.ok(symbol>=tile*0.65,'object should fill most of its tap target');
    assert.ok(3*tile+2*gap+20<=width-48,'three items must fit in one line on small phones');
  }
  assert.deepEqual(countingBoardSizes(320,true),{tile:62,symbol:43,gap:8});
  assert.deepEqual(countingBoardSizes(1440,true),{tile:112,symbol:82,gap:16});
});

test('legacy counting boards without child guidance keep their original sizing',()=>{
  assert.deepEqual(countingBoardSizes(320,false),{tile:48,symbol:30,gap:8});
  assert.deepEqual(countingBoardSizes(1440,false),{tile:48,symbol:30,gap:8});
});

test('counting objects never show individual boxes, including bears in legacy diagrams',()=>{
  for(const width of [320,375,480,768,1440]) {
    const guided=countingBoardSizes(width,true);
    const regular=countingBoardSizes(width,false);
    assert.ok(guided.tile>=62);
    assert.ok(guided.symbol<guided.tile);
    assert.ok(regular.tile>=48);
    const style=countingTileAppearance();
    assert.deepEqual(style,{
      borderWidth:0, borderColor:'transparent', borderRadius:0, backgroundColor:'transparent',
    });
  }
});
