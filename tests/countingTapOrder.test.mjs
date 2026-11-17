import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { countingTapNumber, toggleCountingTap } from '../src/domain/countingTapOrder.ts';

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
  assert.match(component,/const tapNumber = countingTapNumber\(selected,id\)/u);
  assert.match(component,/onPress=\{\(\) => toggle\(id\)\}/u);
  assert.match(component,/\{tapNumber!==undefined && <View pointerEvents="none"/u);
  assert.match(component,/>\{tapNumber\}<\/Text><\/View>/u);
  assert.match(component,/countingTileAppearance\(\)/u);
  assert.match(component,/position:'absolute',right:0,bottom:0/u);
  assert.match(component,/accessibilityLabel=\{lit \? shape\[1\]\+'、'\+tapNumber\+'ばんめ'/u);
  assert.doesNotMatch(component,/>✓<\/Text><\/View>/u);
});
