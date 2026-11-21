import type {MapPoint} from './worldMapLayout.ts';
import {preschoolMapExclusionZones,preschoolDecorationLayout,preschoolDecorationBounds,
  type DecorationRect} from './preschoolDecorLayout.ts';
import {ISLAND_ART_SETS,type GroundPattern} from './islandArtSets.ts';
import type {IslandSpriteId} from './islandPixelSprites.ts';
import type {StandardPixelIslandId} from './standardPixelIslandMap.ts';

export type PixelDecoration = {
  kind:IslandSpriteId;size:'large'|'medium'|'small';x:number;y:number;width:number;height:number;
};
export type GroundDecoration = {
  kind:GroundPattern;x:number;y:number;width:number;height:number;variant:number;
};
export type StoneWall = {x1:number;y1:number;x2:number;y2:number};
export type IslandScene = {
  decorations:PixelDecoration[];ground:GroundDecoration[];walls:StoneWall[];
};
export function boxesOverlap(a:DecorationRect,b:DecorationRect) {
  return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
}
export function sceneBounds(item:{x:number;y:number;width:number;height:number},padding=0):DecorationRect {
  return {left:item.x-padding,right:item.x+item.width+padding,
    top:item.y-padding,bottom:item.y+item.height+padding};
}
function randomFor(id:string,width:number) {
  let state=0x714fa6^Math.round(width*137);
  for(const letter of id)state=Math.imul(state^letter.charCodeAt(0),16777619);
  return ()=>{
    state=(state+0x6d2b79f5)|0;
    let value=Math.imul(state^(state>>>15),state|1);
    value^=value+Math.imul(value^(value>>>7),value|61);
    return ((value^(value>>>14))>>>0)/4294967296;
  };
}
function shuffled<T>(items:readonly T[],random:()=>number):T[] {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

/** Clip each axis-aligned wall against the exact UI exclusion rectangles.
 * Padding includes the full wall stroke so no stone extends under labels.
 */
function clipWall(wall:StoneWall,zones:readonly DecorationRect[]):StoneWall[] {
  const horizontal=wall.y1===wall.y2;
  let intervals=[[horizontal?wall.x1:wall.y1,horizontal?wall.x2:wall.y2]];
  for(const zone of zones) {
    const cross=horizontal?wall.y1:wall.x1;
    if(cross<(horizontal?zone.top:zone.left)-3||cross>(horizontal?zone.bottom:zone.right)+3)continue;
    const low=(horizontal?zone.left:zone.top)-3;
    const high=(horizontal?zone.right:zone.bottom)+3;
    intervals=intervals.flatMap(([start,end])=>{
      if(end<=low||start>=high)return [[start,end]];
      return [[start,Math.min(end,low)],[Math.max(start,high),end]].filter(([a,b])=>b-a>=5);
    });
  }
  return intervals.map(([start,end])=>horizontal
    ? {x1:start,y1:wall.y1,x2:end,y2:wall.y2}
    : {x1:wall.x1,y1:start,x2:wall.x2,y2:end});
}

/** A seeded depth-first maze with branching passages and true dead ends.
 * It is background scenery, never a replacement for the stage route.
 */
export function stoneMaze(width:number,height:number,zones:readonly DecorationRect[]):StoneWall[] {
  const random=randomFor('stone-maze',width);
  const cell=width<620?20:28;
  const columns=Math.floor((width-56)/cell);
  const rows=Math.floor((height-112)/cell);
  if(columns<2||rows<2)return [];
  const visited=new Set<number>([0]);
  const stack=[0];
  const open=new Set<string>();
  const edge=(a:number,b:number)=>Math.min(a,b)+':'+Math.max(a,b);
  while(stack.length) {
    const current=stack[stack.length-1],x=current%columns,y=Math.floor(current/columns);
    const choices=[x>0?current-1:-1,x<columns-1?current+1:-1,
      y>0?current-columns:-1,y<rows-1?current+columns:-1]
      .filter(next=>next>=0&&!visited.has(next));
    if(!choices.length){stack.pop();continue;}
    const next=choices[Math.floor(random()*choices.length)];
    open.add(edge(current,next));visited.add(next);stack.push(next);
  }
  const walls:StoneWall[]=[];
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++) {
    const index=y*columns+x,left=28+x*cell,top=88+y*cell;
    if(y===0||!open.has(edge(index,index-columns)))
      walls.push({x1:left,y1:top,x2:left+cell,y2:top});
    if(x===0||!open.has(edge(index,index-1)))
      walls.push({x1:left,y1:top,x2:left,y2:top+cell});
    if(x===columns-1)walls.push({x1:left+cell,y1:top,x2:left+cell,y2:top+cell});
    if(y===rows-1)walls.push({x1:left,y1:top+cell,x2:left+cell,y2:top+cell});
  }
  return walls.flatMap(wall=>clipWall(wall,zones));
}

export function islandScenery(id:StandardPixelIslandId,width:number,height:number,
    positions:readonly MapPoint[]):IslandScene {
  if(width<244||height<220||positions.length!==65)return {decorations:[],ground:[],walls:[]};
  const art=ISLAND_ART_SETS[id],random=randomFor(id,width);
  const compact=width<620;
  const zones=preschoolMapExclusionZones(width,positions);
  const legacy=id==='preschool'||id==='e1';
  const occupied=legacy?preschoolDecorationLayout(width,height,positions).map(preschoolDecorationBounds):[];
  const decorations:PixelDecoration[]=[];
  const ground:GroundDecoration[]=[];
  const inside=(box:DecorationRect)=>box.left>=26&&box.right<=width-26&&box.top>=88&&box.bottom<=height-24;
  const clear=(box:DecorationRect)=>inside(box)&&!zones.some(zone=>boxesOverlap(box,zone));
  function placeGround() {
  for(let i=0;i<(compact?55:140);i++) {
    const kind=art.ground[i%art.ground.length];
    if(kind==='stoneMaze')continue;
    for(let attempt=0;attempt<25;attempt++) {
      const dimension=Math.round((compact?27:38)*(1+random()*.7));
      const item:GroundDecoration={kind,x:Math.round(28+random()*(width-dimension-56)),
        y:Math.round(90+random()*(height-dimension-120)),
        width:dimension,height:dimension,variant:Math.floor(random()*4)};
      const box=sceneBounds(item,3);
      if(!clear(box)||occupied.some(old=>boxesOverlap(box,old)))continue;
      ground.push(item);occupied.push(box);break;
    }
  }
  }
  for(const size of ['large','medium','small'] as const) {
    if(size==='medium')placeGround();
    // Existing plush and toy heroes retain their detailed silhouettes.
    if(legacy&&size==='large')continue;
    const kinds=shuffled(art[size],random);
    const target=legacy?(size==='medium'?14:28):size==='large'?16:size==='medium'?56:100;
    for(let i=0;i<target;i++) {
      const kind=kinds[i%kinds.length];
      for(let attempt=0;attempt<100;attempt++) {
        const pixels=size==='large'?(compact?58:80):size==='medium'?(compact?36:48):(compact?20:25);
        const dimension=Math.round(pixels*(.88+random()*.22));
        const row=i%13;
        const y=positions[row*5].y+90+random()*130;
        const x=28+random()*(width-56-dimension);
        const item:PixelDecoration={kind,size,x:Math.round(x),y:Math.round(y),width:dimension,height:dimension};
        const box=sceneBounds(item,5);
        if(!clear(box)||occupied.some(old=>boxesOverlap(box,old)))continue;
        if(decorations.some(old=>old.kind===kind&&Math.hypot(old.x-item.x,old.y-item.y)<(compact?110:170)))continue;
        decorations.push(item);occupied.push(box);break;
      }
    }
  }
  return {decorations,ground,walls:id==='j1'?stoneMaze(width,height,[...zones,...decorations.map(item=>sceneBounds(item,4))]):[]};
}
