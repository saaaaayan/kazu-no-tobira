import assert from 'node:assert/strict';
import test from 'node:test';
import { countingBoardSizes, fitCountingBoardSizes, countingTileAppearance } from '../src/domain/countingBoardSizes.ts';

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

test('three counting dots and their labels fit in the actual explanation card',()=>{
  // 大きなデスクトップ画面でも、結果カード自体は細くなり得る。
  for(const width of [190,220,240,260,280,300,340,380,450,600,900]) {
    for(const guided of [true,false]){
      const { tile, symbol, gap }=fitCountingBoardSizes(width,guided,3);
      assert.ok(tile>0);
      assert.ok(symbol>0 && symbol<tile);
      assert.ok(3*tile+2*gap+20<=width,
        `3 items must fit in ${width}px result card, guided=${guided}`);
    }
  }
  // 従来: viewport1440pxの112pxタイルを幅300pxの解説欄にも使い、左右が欠けた。
  const narrow=fitCountingBoardSizes(300,true,3);
  assert.ok(narrow.tile<112);
  assert.ok(narrow.symbol<82);
  assert.deepEqual(fitCountingBoardSizes(1440,true,3),{tile:112,symbol:81,gap:16});
});

test('longer rows shrink to their actual available width without cutting off elements',()=>{
  for(const columns of [1,2,3,4,5,10]){
    for(const width of [180,260,320,480]){
      const { tile, gap }=fitCountingBoardSizes(width,true,columns);
      assert.ok(columns*tile+(columns-1)*gap+20<=width);
    }
  }
});
