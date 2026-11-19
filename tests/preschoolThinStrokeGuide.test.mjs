import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { preschoolDigitGuidePaths, preschoolTraceGuideMatch } from '../src/domain/preschoolTraceGuide.ts';
import { preschoolTraceInkQuality } from '../src/domain/preschoolTraceRecognition.ts';

const sizes=[
  {width:1024,height:188},
  {width:280,height:188},
  {width:165,height:188},
];
function drawnFromGuide(digit,size,offset=0){
  const guide=preschoolDigitGuidePaths(digit,size);
  return {
    size,
    drawing:guide.map((path,i)=>path.map((p,j)=>({
      x:(p.x+offset+Math.sin(j*1.7+i)*2)/size.width,
      y:(p.y+Math.cos(j*.9+i)*1.5)/size.height,
    }))),
  };
}
function scribble(size) {
  const points=[];
  for(let row=0;row<13;row++){
    const y=.13+row*.058;
    if(row%2===0)points.push([.3,y],[.7,y]);
    else points.push([.7,y],[.3,y]);
  }
  return {size,drawing:[points.map(([x,y])=>({x,y}))]};
}
test('thin centreline writing on the guide passes at desktop, phone and narrow 10-cell widths',()=>{
  for(const size of sizes){
    for(const digit of '0123456789'){
      const ink=drawnFromGuide(digit,size,3);
      assert.equal(preschoolTraceInkQuality(ink),'plausible',digit+' '+size.width);
      const result=preschoolTraceGuideMatch(digit,ink);
      assert.equal(result.matched,true,JSON.stringify({digit,size,result}));
      assert.ok(result.inkNear>.76 && result.guideCovered>.78);
    }
  }
});
test('thin handwritten 1 with a small top hook is accepted even when ML confidence is low',()=>{
 const size={width:1024,height:188};
 const guide=preschoolDigitGuidePaths('1',size)[0];
 const offset=guide[0];
 // Resembles the uploaded screenshot: a short slanted entry stroke and a thin
 // long vertical downstroke, not a thick brush line or a filled-in surface.
 const ink={size,drawing:[[
   {x:(offset.x+4)/size.width,y:(offset.y+4)/size.height},
   {x:(guide[1].x+3)/size.width,y:(guide[1].y+3)/size.height},
   {x:(guide[2].x+2)/size.width,y:(guide[2].y+2)/size.height},
   {x:(guide[3].x+2)/size.width,y:(guide[3].y-5)/size.height},
 ]]};
 assert.equal(preschoolTraceInkQuality(ink),'plausible');
 assert.equal(preschoolTraceGuideMatch('1',ink).matched,true);
 assert.equal(preschoolTraceGuideMatch('2',ink).matched,false);
});
test('cannot get a correct grade by drawing a different digit or colouring in the cell',()=>{
 const size=sizes[0];
 const wrong=drawnFromGuide('2',size);
 assert.equal(preschoolTraceGuideMatch('1',wrong).matched,false);
 assert.equal(preschoolTraceGuideMatch('7',wrong).matched,false);
 for(const digit of '0123456789') {
   assert.equal(preschoolTraceGuideMatch(digit,scribble(size)).matched,false,digit);
 }
 const short={size,drawing:[[{x:.5,y:.3},{x:.5,y:.36}]]};
 assert.equal(preschoolTraceGuideMatch('1',short).matched,false);
});
test('every target digit rejects strokes that follow a different numeral guide',()=>{
 const size={width:1024,height:188};
 for(const written of '0123456789'){
   const ink=drawnFromGuide(written,size,0);
   for(const asked of '0123456789'){
     if(asked===written)continue;
     const result=preschoolTraceGuideMatch(asked,ink);
     assert.equal(result.matched,false,
       'wrote '+written+' but was asked for '+asked+'; '+JSON.stringify(result));
   }
 }
});

test('the visible guide and hit test share identical paths, and feedback is readable',()=>{
 const view=readFileSync(new URL('../src/components/PreschoolTracePad.tsx',import.meta.url),'utf8');
 assert.match(view,/preschoolDigitGuidePaths\(target,size\)\.map/);
 assert.match(view,/preschoolTraceGuideMatch\(target,\{drawing:next,size\}\)/);
 assert.match(view,/if\(guideMatch\.matched\)\{/);
 assert.match(view,/lastGuideMatch\.current=guideMatch/);
 assert.match(view,/guide\.inkNear>=\.55 && guide\.guideCovered>=\.56/);
 assert.match(view,/strokeWidth=\{3\.5\}/);
 assert.match(view,/status:\{color:'#f5f0db'/);
 assert.doesNotMatch(view,/guideText:/);
});
