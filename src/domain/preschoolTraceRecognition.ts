import { toPixels, type Point } from './ink.ts';
import type { DigitInk, RecognitionResult } from '../recognition/contracts.ts';

/** An independent safety gate for digit recognition. Neither time spent
 * drawing nor line thickness constitutes evidence that a digit was written.
 * A large filled-in surface should never be accepted merely because the
 * classifier happens to return the target character.
 */
export type TraceInkQuality = 'empty' | 'too-small' | 'scribble' | 'plausible';

export function preschoolTraceInkQuality({drawing,size}:DigitInk):TraceInkQuality {
  if (!drawing.some(stroke=>stroke.length>0)) return 'empty';
  if (!Number.isFinite(size.width)||!Number.isFinite(size.height)||size.width<=0||size.height<=0)
    return 'too-small';
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  let travelled=0;
  let strokes=0;
  const points:Point[][]=[];
  for(const stroke of drawing){
    if(!stroke.length)continue;
    strokes++;
    const path:Point[]=[];
    for(const p of stroke){
      const point=toPixels(p,size);
      if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return 'scribble';
      left=Math.min(left,point.x);right=Math.max(right,point.x);
      top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);
      if(path.length){
        const prev=path[path.length-1];
        const step=Math.hypot(point.x-prev.x,point.y-prev.y);
        // Ignore subpixel jitter. A slow, thin stroke is just as valid as a
        // faster stroke of the same outline.
        if(step<0.75)continue;
        travelled+=step;
      }
      path.push(point);
    }
    if(path.length)points.push(path);
  }
  const width=right-left,height=bottom-top;
  const extent=Math.max(width,height);
  if(extent<17||travelled<14)return 'too-small';
  if(strokes>6)return 'scribble';
  const diagonal=Math.max(1,Math.hypot(width,height));
  if(travelled/diagonal>7.8)return 'scribble';

  // Count how many regions the traced centreline traverses, independent of
  // drawing/pen thickness. Filled surfaces cross most of this 9 x 9 grid.
  const occupied=new Set<number>();
  for(const path of points){
    for(let j=0;j<path.length;j++){
      const a=path[j],b=path[Math.min(j+1,path.length-1)];
      const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/Math.max(2,extent/18)));
      for(let k=0;k<=steps;k++){
        const x=a.x+(b.x-a.x)*k/steps,y=a.y+(b.y-a.y)*k/steps;
        const col=Math.max(0,Math.min(8,Math.floor((x-left)/Math.max(width,1)*9)));
        const row=Math.max(0,Math.min(8,Math.floor((y-top)/Math.max(height,1)*9)));
        occupied.add(row*9+col);
      }
    }
  }
  if(occupied.size>=54)return 'scribble';
  return 'plausible';
}

export function preschoolTraceMatches(expected:string, result:RecognitionResult, quality:TraceInkQuality):boolean {
  return quality==='plausible' && result.status==='recognized' && result.value===expected;
}
