import { toPixels, type Point } from './ink.ts';
import type { DigitInk } from '../recognition/contracts.ts';
import { preschoolTraceInkQuality } from './preschoolTraceRecognition.ts';

/**
 * Simple handwritten numeral templates, shared by the faint visible guide
 * AND the trace validator. Positions are independent of pen/display width.
 * An outline is not accepted because it is "long enough": it must follow
 * the visible guide through most of its shape without covering the whole box.
 */
type Mark = readonly [number,number];
const templates:Record<string,readonly (readonly Mark[])[]>={
  '0': [[[50,11],[34,15],[23,28],[20,48],[24,68],[34,84],[50,90],[65,84],[76,67],[80,47],[75,27],[63,15],[50,11]]],
  '1': [[[31,27],[43,17],[51,13],[51,88]]],
  '2': [[[22,27],[28,17],[43,12],[61,15],[72,28],[70,40],[58,55],[41,70],[23,88],[76,88]]],
  '3': [[[25,20],[43,12],[61,15],[72,27],[66,39],[48,49],[68,56],[75,69],[67,82],[46,90],[25,82]]],
  '4': [[[64,12],[24,60],[77,60]],[[64,12],[64,89]]],
  '5': [[[75,14],[29,14],[26,48],[43,43],[62,47],[74,60],[73,76],[60,87],[41,89],[25,82]]],
  '6': [[[66,14],[49,26],[31,47],[26,68],[33,82],[48,90],[65,85],[75,69],[69,54],[53,47],[36,51],[26,68]]],
  '7': [[[22,15],[77,15],[62,37],[51,61],[43,89]]],
  '8': [[[50,11],[35,16],[29,27],[36,41],[63,57],[73,70],[67,82],[50,89],[33,82],[27,70],[37,57],[64,41],[71,28],[63,16],[50,11]]],
  '9': [[[71,45],[63,25],[49,13],[32,18],[25,34],[33,49],[49,53],[65,48],[71,36],[70,63],[57,81],[43,90]]],
};
export function preschoolDigitGuidePaths(digit:string,size:{width:number;height:number}):Point[][] {
  const template=templates[digit];
  if(!template||size.width<=0||size.height<=0)return [];
  const scale=Math.min(1.35,size.height/120,size.width/95);
  return template.map(stroke=>stroke.map(([x,y])=>({
    x:size.width/2+(x-50)*scale,
    y:size.height/2+(y-50)*scale,
  })));
}
function pointSegmentDistance(p:Point,a:Point,b:Point):number{
  const dx=b.x-a.x,dy=b.y-a.y;
  const denom=dx*dx+dy*dy;
  const t=denom?Math.min(1,Math.max(0,((p.x-a.x)*dx+(p.y-a.y)*dy)/denom)):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function pointPathDistance(p:Point,paths:readonly (readonly Point[])[]):number{
  let best=Infinity;
  for(const stroke of paths)for(let i=1;i<stroke.length;i++){
    best=Math.min(best,pointSegmentDistance(p,stroke[i-1],stroke[i]));
  }
  return best;
}
function pathLength(paths:readonly (readonly Point[])[]):number{
  let total=0;
  for(const stroke of paths)for(let i=1;i<stroke.length;i++)
    total+=Math.hypot(stroke[i].x-stroke[i-1].x,stroke[i].y-stroke[i-1].y);
  return total;
}
function samples(paths:readonly (readonly Point[])[],step=3):Point[]{
  const out:Point[]=[];
  for(const stroke of paths)for(let i=1;i<stroke.length;i++){
    const a=stroke[i-1],b=stroke[i];
    const count=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/step));
    for(let j=0;j<=count;j++){
      const t=j/count;
      out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    }
  }
  return out;
}
export type PreschoolGuideMatch = {
  matched:boolean;
  inkNear:number;
  guideCovered:number;
  lengthRatio:number;
};

/** Follow the displayed guide, with tolerance for thin, wobbly preschool ink.
 * Every guide stroke must be covered: e.g. a single diagonal cannot pass as 4.
 */
export function preschoolTraceGuideMatch(digit:string,ink:DigitInk):PreschoolGuideMatch{
  const failure={matched:false,inkNear:0,guideCovered:0,lengthRatio:0};
  if(preschoolTraceInkQuality(ink)!=='plausible')return failure;
  const guide=preschoolDigitGuidePaths(digit,ink.size);
  if(!guide.length)return failure;
  const drawn=ink.drawing.map(stroke=>stroke.map(point=>toPixels(point,ink.size)));
  const penPoints=samples(drawn),guidePoints=samples(guide);
  if(!penPoints.length||!guidePoints.length)return failure;
  const tolerance=Math.max(12,Math.min(19,ink.size.height*.098));
  const near=penPoints.filter(p=>pointPathDistance(p,guide)<=tolerance).length/penPoints.length;
  const covered=guidePoints.filter(p=>pointPathDistance(p,drawn)<=tolerance).length/guidePoints.length;
  const ratio=pathLength(drawn)/Math.max(1,pathLength(guide));
  const everyStroke=guide.every(stroke=>{
    const pts=samples([stroke]);
    return pts.length>0 &&
      pts.filter(p=>pointPathDistance(p,drawn)<=tolerance).length/pts.length>=.65;
  });
  // Several numerals share long sections. For example 2 and 7 share a
  // descending diagonal; the learner must match THIS guide better than any
  // OTHER numeral guide. Without this, drawing 2 could be accepted as 7.
  let closestOther=-Infinity;
  for(const other of Object.keys(templates)){
    if(other===digit)continue;
    const otherGuide=preschoolDigitGuidePaths(other,ink.size);
    const otherPoints=samples(otherGuide);
    const otherInkNear=penPoints.filter(p=>pointPathDistance(p,otherGuide)<=tolerance).length/penPoints.length;
    const otherCovered=otherPoints.filter(p=>pointPathDistance(p,drawn)<=tolerance).length/otherPoints.length;
    closestOther=Math.max(closestOther,(otherInkNear+otherCovered)/2);
  }
  const shapeDiscriminates=(near+covered)/2-closestOther>=.025;
  return {matched:near>=.76&&covered>=.78&&ratio>=.5&&ratio<=1.85&&everyStroke&&shapeDiscriminates,
    inkNear:near,guideCovered:covered,lengthRatio:ratio};
}
