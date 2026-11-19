import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { preschoolTraceInkQuality, preschoolTraceMatches } from '../src/domain/preschoolTraceRecognition.ts';
import { recognizeDigits } from '../src/recognition/recognizeDigits.ts';
import { worldIslands } from '../src/domain/worldCatalog.ts';
import { uiPreviewBank } from '../src/domain/uiPreviewRound.ts';

const size={width:280,height:188};
const line=(pts)=>pts.map(([x,y])=>({x,y}));
const ink=(...lines)=>({size,drawing:lines.map(line)});
const thinOne=ink([[.50,.16],[.49,.30],[.50,.48],[.50,.64],[.51,.86]]);
const thinTwo=ink([[.22,.35],[.30,.22],[.49,.15],[.68,.22],[.72,.36],
 [.59,.50],[.42,.64],[.25,.80],[.50,.81],[.77,.81]]);
const empty=ink();
const tiny=ink([[.4,.4],[.401,.402],[.402,.405]]);
const lineWidthIsIrrelevant=()=>{
  // A drawing has only centreline points. UI paint strokeWidth is intentionally
  // not used by this validator or by the ML rasterizer.
  const first=preschoolTraceInkQuality(thinOne);
  const repeated=preschoolTraceInkQuality({drawing:thinOne.drawing.map(stroke=>stroke.map(p=>({...p}))),size});
  return [first,repeated];
};
const serpentine=[];
for(let row=0;row<12;row++){
  const y=.13+row*.064;
  if(row%2===0)serpentine.push([.1,y],[.9,y]);
  else serpentine.push([.9,y],[.1,y]);
}
const fill=ink(serpentine);
const scribble=ink(Array.from({length:101},(_,i)=>[
  .5+.35*Math.sin(i*.7),.5+.35*Math.cos(i*.73)
]));

test('thin but full-size numerals pass pre-recognition quality check',()=>{
 assert.deepEqual(lineWidthIsIrrelevant(),['plausible','plausible']);
 assert.equal(preschoolTraceInkQuality(thinTwo),'plausible');
 assert.equal(preschoolTraceInkQuality(empty),'empty');
 assert.equal(preschoolTraceInkQuality(tiny),'too-small');
});

test('zigzag filling, repeated loops, and many lines are not accepted as digits',()=>{
 assert.equal(preschoolTraceInkQuality(fill),'scribble');
 assert.equal(preschoolTraceInkQuality(scribble),'scribble');
 assert.equal(preschoolTraceInkQuality(ink(...Array.from({length:8},()=>[[.3,.1],[.7,.9]]))),'scribble');
 assert.equal(preschoolTraceMatches('1',{status:'recognized',value:'1'},'scribble'),false);
});

test('a completed attempt requires an independent model to read EXACTLY the target digit',()=>{
 const single={
   size:{width:90,height:90},
   drawing:[line([[.49,.20],[.49,.50],[.51,.80]])],
 };
 const result=recognizeDigits([single]);
 assert.deepEqual(result,{status:'recognized',value:'1'});
 assert.equal(preschoolTraceMatches('1',result,'plausible'),true);
 assert.equal(preschoolTraceMatches('2',result,'plausible'),false);
 assert.equal(preschoolTraceMatches('1',{status:'ambiguous',candidates:['1','7']},'plausible'),false);
 assert.equal(preschoolTraceMatches('1',{status:'uncertain'},'plausible'),false);
 assert.equal(preschoolTraceMatches('1',{status:'recognized',value:'1'},'too-small'),false);
});

test('tracing UI collects proper normalized strokes and checks digit recognition—not pen distance',()=>{
 const component=readFileSync(new URL('../src/components/PreschoolTracePad.tsx',import.meta.url),'utf8');
 assert.match(component,/import digitRecognizer from '\.\.\/recognition\/digitRecognizer'/);
 assert.match(component,/createRecognitionQueue\(digitRecognizer.recognize/);
 assert.match(component,/preschoolTraceInkQuality\(\{drawing:next,size\}\)/);
 assert.match(component,/preschoolTraceMatches\(cb.current.target,result,'plausible'\)/);
 assert.match(component,/queue.schedule\(\{drawing:next,size\}\)/);
 assert.match(component,/normalizePoint\(p,size\)/);
 assert.match(component,/strokeWidth=\{3\.5\}/);
 assert.match(component,/digit==='10'\?\['1','0'\]:\[digit\]/);
 assert.match(component,/matches.every\(Boolean\)\?'できた':'+'/);
 assert.match(component,/ぬりつぶさず、すうじの せんを かいてね/);
 assert.doesNotMatch(component,/total>size.width\*\.4/);
 assert.doesNotMatch(component,/current.length>=7/);
 assert.doesNotMatch(component,/setCompleted\(true\)/);
});

test('all 50 stage 11-15 activities remain trace questions but no longer award simple stroke completion',()=>{
 const preschool=worldIslands.find(g=>g.id==='preschool');
 let count=0;
 for(let n=11;n<=15;n++){
   const bank=uiPreviewBank(preschool.stages[n-1]);
   assert.equal(bank.length,10);
   for(const q of bank){
     assert.equal(q.format,'tracing');
     assert.equal(q.type,'choice');
     assert.ok(q.preschoolTrace?.length);
     assert.equal(q.answer,'できた');
     count++;
   }
 }
 assert.equal(count,50);
});
