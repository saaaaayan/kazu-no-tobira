import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { countingTapNumber, countingTapNumberInRow, toggleCountingTap } from '../src/domain/countingTapOrder.ts';

test('counted picture badges follow the order tapped, not their positions',()=>{
  let ids=new Set();
  ids=toggleCountingTap(ids,'0:2');
  assert.equal(countingTapNumber(ids,'0:2'),1);
  ids=toggleCountingTap(ids,'0:0');
  assert.equal(countingTapNumber(ids,'0:2'),1);
  assert.equal(countingTapNumber(ids,'0:0'),2);
  ids=toggleCountingTap(ids,'0:1');
  assert.deepEqual([...ids],['0:2','0:0','0:1']);
  assert.deepEqual([...ids].map(id=>countingTapNumber(ids,id)),[1,2,3]);
  assert.equal(countingTapNumber(ids,'not-tapped'),undefined);
});

test('untapping and retapping a picture gives consecutive new numbers',()=>{
  let ids=new Set(['0:2','0:0','0:1']);
  ids=toggleCountingTap(ids,'0:0'); // Remove the second picture from counting.
  assert.deepEqual([...ids],['0:2','0:1']);
  assert.equal(countingTapNumber(ids,'0:1'),2);
  ids=toggleCountingTap(ids,'0:0'); // Tapped again, so this is third.
  assert.deepEqual([...ids],['0:2','0:1','0:0']);
  assert.equal(countingTapNumber(ids,'0:0'),3);
  ids=toggleCountingTap(ids,'0:2');
  ids=toggleCountingTap(ids,'0:1');
  ids=toggleCountingTap(ids,'0:0');
  assert.equal(ids.size,0);
  assert.equal(countingTapNumber(ids,'0:2'),undefined);
});

test('numerals are rendered on the picture, and the touch area remains borderless',()=>{
  const component=readFileSync(new URL('../src/components/QuestionSupport.tsx',import.meta.url),'utf8');
  assert.match(component,/const tapNumber = sideBySide \? countingTapNumberInRow\(selected,id\) : countingTapNumber\(selected,id\)/u);
  assert.match(component,/onPress=\{\(\) => toggle\(id\)\}/u);
  assert.match(component,/\{tapNumber!==undefined && <View pointerEvents="none"/u);
  assert.match(component,/>\{tapNumber\}<\/Text><\/View>/u);
  assert.match(component,/countingTileAppearance\(\)/u);
  assert.match(component,/position:'absolute',right:0,bottom:0/u);
  assert.match(component,/accessibilityLabel=\{lit \? shape\[1\]\+'、'\+tapNumber\+'ばんめ'/u);
  assert.doesNotMatch(component,/>✓<\/Text><\/View>/u);
});

test('left and right counting badges each start at one even when the child taps both sides alternately',()=>{
  let ids=new Set();
  const taps=['0:0','1:0','0:1','1:1','1:2','0:2','0:3','1:3','0:4','1:4','0:5'];
  for(const id of taps)ids=toggleCountingTap(ids,id);
  assert.deepEqual(Array.from({length:6},(_,i)=>countingTapNumberInRow(ids,'0:'+i)),[1,2,3,4,5,6]);
  assert.deepEqual(Array.from({length:5},(_,i)=>countingTapNumberInRow(ids,'1:'+i)),[1,2,3,4,5]);
  // The previous implementation erroneously displayed 6...10 on one side.
  assert.equal(countingTapNumber(ids,'0:5'),11);
  assert.equal(countingTapNumberInRow(ids,'1:4'),5);
  assert.equal(countingTapNumberInRow(ids,'0:8'),undefined);
});

test('untapping or recounting one group does not renumber the other group',()=>{
  let ids=new Set(['0:0','1:0','0:1','1:1','0:2','1:2']);
  ids=toggleCountingTap(ids,'0:1');
  assert.equal(countingTapNumberInRow(ids,'0:2'),2);
  assert.equal(countingTapNumberInRow(ids,'1:2'),3);
  ids=toggleCountingTap(ids,'0:1');
  assert.equal(countingTapNumberInRow(ids,'0:1'),3);
  assert.equal(countingTapNumberInRow(ids,'1:0'),1);
  ids=toggleCountingTap(ids,'1:1');
  assert.equal(countingTapNumberInRow(ids,'1:2'),2);
  assert.equal(countingTapNumberInRow(ids,'0:1'),3);
});
