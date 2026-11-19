import {
  PRESCHOOL_MAP_TITLE_INSET, islandCheckpointLayout,
  preschoolStageLabelLayout, type MapPoint,
} from './worldMapLayout.ts';

/** Types of hand-drawn, subdued pixel plushes present on the preschool island. */
export const PRESCHOOL_PLUSH_ANIMALS=[
  'bear','bunny','panda','elephant','dog','cat','penguin','lion',
  'lamb','fox','koala','chick','giraffe','monkey','frog','mouse',
  'duck','raccoon','squirrel','hedgehog','pig','turtle','owl',
] as const;
export type PreschoolPlushAnimal=typeof PRESCHOOL_PLUSH_ANIMALS[number];
export type PreschoolDecoration=
  | {kind:'plush'; animal:PreschoolPlushAnimal; x:number;y:number;scale:number}
  | {kind:'flower'|'blocks'; x:number;y:number;scale:number};
export type DecorationRect={left:number;right:number;top:number;bottom:number};

const expand=(r:DecorationRect,pad:number):DecorationRect=>({
  left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad,
});
const overlaps=(a:DecorationRect,b:DecorationRect)=>
  a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const rect=(x:number,y:number,halfWidth:number,above:number,below:number):DecorationRect=>({
  left:x-halfWidth,right:x+halfWidth,top:y-above,bottom:y+below,
});

/** Bounds include tails, tall ears and the entire pixel-art outline. */
export function preschoolDecorationBounds(d:PreschoolDecoration):DecorationRect{
  if(d.kind==='plush')return rect(d.x,d.y,35*d.scale,51*d.scale,29*d.scale);
  if(d.kind==='blocks')return rect(d.x,d.y,21*d.scale,35*d.scale,9*d.scale);
  return rect(d.x,d.y,10*d.scale,20*d.scale,4*d.scale);
}

/** Exclusion rectangles describe ALL elements which must remain unobscured.
 * These are calculated using the SAME placement functions as the live UI.
 * Masks include the sign's small right-hand support and drawing outlines. */
export function preschoolMapExclusionZones(width:number,
    positions:readonly MapPoint[]):DecorationRect[]{
  const compact=width<620;
  const marker=Math.max(46,Math.min(57,Math.floor(width/5)-9));
  const zones:DecorationRect[]=[];
  for(let i=0;i<positions.length;i++){
    const point=positions[i];
    zones.push(rect(point.x,point.y,marker/2+5,marker/2+5,marker/2+5));
    const label=preschoolStageLabelLayout(width,point,marker);
    zones.push(expand({left:label.left,top:label.top,
      right:label.left+label.width,bottom:label.top+label.height},3));
  }
  for(let n=1;n<=10;n++){
    const end=positions[n*5-1],next=positions[n*5];
    if(!end||!next)continue;
    const sign=islandCheckpointLayout(width,end,marker,next,true);
    zones.push(expand({left:sign.left,top:sign.top,
      right:sign.left+sign.width+13,bottom:sign.top+sign.height+10},13));
  }
  // The island header and all three small, centrally positioned area titles.
  zones.push({left:32,right:width-32,top:14,bottom:82});
  for(const row of [0,10,12]){
    const point=positions[row*5];
    if(!point)continue;
    const headingHalf=Math.min(width/2-8,compact?125:152);
    zones.push({left:width/2-headingHalf,right:width/2+headingHalf,
      top:point.y-72,bottom:point.y-34});
  }
  // Keep the horizontal and turning portions of each connecting route clear.
  for(let row=0;row<Math.ceil(positions.length/5);row++){
    const first=positions[row*5];
    if(!first)continue;
    zones.push({left:22,right:width-22,top:first.y-13,bottom:first.y+13});
    if(row+1<Math.ceil(positions.length/5)){
      const end=positions[row*5+4],next=positions[(row+1)*5];
      if(!end||!next)continue;
      const edgeX=(end.x+next.x)/2;
      zones.push({left:edgeX-12,right:edgeX+12,
        top:Math.min(end.y,next.y),bottom:Math.max(end.y,next.y)});
    }
  }
  return zones;
}
function rngFrom(seed:number){
  let value=seed>>>0;
  return ()=>{
    value=(value+0x6D2B79F5)>>>0;
    let t=Math.imul(value^(value>>>15),value|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function shuffled<T>(items:readonly T[],random:()=>number):T[]{
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

/** Stable seeded scatter, without visible repeated row templates.
 * Samples the FULL continuous map instead of using 3/4 preset x positions
 * in each row. Object-level collision checks prevent plushes, toy blocks,
 * and flowers from covering tests, labels, stage pins or each other.
 */
export function preschoolDecorationLayout(width:number,height:number,
    positions:readonly MapPoint[]):PreschoolDecoration[]{
  if(width<244||height<220||positions.length<5)return [];
  const compact=width<620;
  const rand=rngFrom(0x4a9d21^Math.round(width*71)^Math.round(height*13));
  const forbidden=preschoolMapExclusionZones(width,positions);
  const placed:PreschoolDecoration[]=[];
  const plush:Extract<PreschoolDecoration,{kind:'plush'}>[]=[];
  const base=compact
    ? Math.max(.72,Math.min(.94,width/410))
    : Math.max(.49,Math.min(1.16,width/920));
  const targetPlush=compact?83:Math.min(165,Math.round(95+width*.051));
  const targetBlocks=compact?24:40;
  const targetFlowers=compact?115:210;
  // Permute all species each cycle to avoid runs of the same one.
  let batch=shuffled(PRESCHOOL_PLUSH_ANIMALS,rand);
  function canPlace(d:PreschoolDecoration):boolean{
    const box=preschoolDecorationBounds(d);
    if(box.left<26||box.right>width-26||box.top<88||box.bottom>height-24)return false;
    if(forbidden.some(zone=>overlaps(expand(box,7),zone)))return false;
    if(placed.some(old=>overlaps(expand(box,d.kind==='flower'?2:6),
      preschoolDecorationBounds(old))))return false;
    if(d.kind==='plush'&&plush.some(other=>other.animal===d.animal&&
      Math.hypot(other.x-d.x,other.y-d.y)<(compact?115:175)))return false;
    return true;
  }
  function attempt(kind:'plush'|'flower'|'blocks',animal?:PreschoolPlushAnimal){
    const factor=kind==='plush'?.55+rand()*.95:kind==='blocks'?.75+rand()*.7:.72+rand()*.62;
    // Drawing sizes are independent of pen width and unlike earlier repeated
    // row templates, both axes and all scales vary continuously.
    const item:PreschoolDecoration=kind==='plush'
      ? {kind,animal:animal!,x:26+rand()*(width-52),y:95+rand()*(height-137),scale:base*factor}
      : {kind,x:26+rand()*(width-52),y:95+rand()*(height-137),scale:base*factor};
    if(!canPlace(item))return false;
    placed.push(item);
    if(item.kind==='plush')plush.push(item);
    return true;
  }
  // Reserve several independent toy-block spots BEFORE the plushes fill the
  // map. Otherwise narrow screens can end up with almost no building blocks.
  const initialBlocks=Math.ceil(targetBlocks*.65);
  for(let n=0;n<initialBlocks;n++)
    for(let tries=0;tries<180;tries++)if(attempt('blocks'))break;
  for(let n=0;n<targetPlush;n++){
    if(n>0&&n%PRESCHOOL_PLUSH_ANIMALS.length===0)
      batch=shuffled(PRESCHOOL_PLUSH_ANIMALS,rand);
    const animal=batch[n%PRESCHOOL_PLUSH_ANIMALS.length];
    // Each animal gets multiple attempts before continuing: diversity never
    // gives way to placing the same type next to itself.
    for(let tries=0;tries<250;tries++)if(attempt('plush',animal))break;
  }
  for(let n=initialBlocks;n<targetBlocks;n++)
    for(let tries=0;tries<130;tries++)if(attempt('blocks'))break;
  for(let n=0;n<targetFlowers;n++)
    for(let tries=0;tries<90;tries++)if(attempt('flower'))break;
  return placed;
}

// Keep an explicit public constant to connect the terrain title and stage
// layout; this also avoids magic "top of island" pixel offsets.
export const PRESCHOOL_DECOR_TOP_INSET=PRESCHOOL_MAP_TITLE_INSET;
