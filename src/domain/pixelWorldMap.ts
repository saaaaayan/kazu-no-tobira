import {approvedWorldMapHotspots} from './approvedWorldMap.ts';
import type {IslandSpriteId} from './islandPixelSprites.ts';

/** World overview only: three readable stamps per island. Shared stage artwork,
 * geometry, curriculum and entitlement rules are never changed by this atlas. */
export const PIXEL_WORLD_MOTIFS = {
  preschool:['forestBear','forestRabbit','cushion'],
  e1:['blocks','robot','train'],
  e2:['forestSquirrel','forestDeer','forestBird'],
  e3:['candy','cake','donut'],
  e4:['prehistoricRex','prehistoricTriceratops','prehistoricVolcano'],
  e5:['gear','arm','meter'],
  e6:['temple','column','obelisk'],
  j1:['maze','gate','key'],
  j2:['mirror','crystal','gem'],
  j3:['sun','lightTower','moon'],
  h1:['observatory','telescope','constellation'],
  h2:['mountain','waterfall','forestDeer'],
  h3:['school','book','column'],
  sage:['hat','crystal','spellbook'],
  champion:['castle','tower','flag'],
  cosmos:['planet','rocket','satellite'],
} as const satisfies Record<string,readonly IslandSpriteId[]>;

// Same 16 anchors and serpentine connections as the existing clickable map.
export const PIXEL_WORLD_CENTERS = approvedWorldMapHotspots.map(({x,y})=>({
  x:Math.round((x*1452+12)/4)*4,y:Math.round(y*1083/4)*4,
}));
export const PIXEL_WORLD_CONNECTIONS = PIXEL_WORLD_CENTERS.slice(1).map((end,index)=>{
  const start=PIXEL_WORLD_CENTERS[index];
  if(index%4!==3)return {from:index,to:index+1,points:[{x:start.x,y:start.y+12},{x:end.x,y:end.y+12}]};
  const outside=index===7?24:1420;
  return {from:index,to:index+1,points:[{x:start.x,y:start.y+12},
    {x:outside,y:start.y+12},{x:outside,y:end.y+12},{x:end.x,y:end.y+12}]};
});
/** Simplified overview-only stamps. Individual island artwork is untouched. */
function overviewStamp(draw:(box:(x:number,y:number,w:number,h:number,c?:string)=>void)=>void) {
  const grid=Array.from({length:24},()=>Array<string>(24).fill('.'));
  draw((x,y,w,h,c='X')=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(grid[yy]?.[xx]!==undefined)grid[yy][xx]=c;});
  return grid.map(row=>row.join(''));
}
export const PIXEL_WORLD_STAMPS={
  cushion:overviewStamp(b=>{b(4,5,16,14);b(2,7,20,10);b(5,6,14,12,'F');b(3,8,18,8,'F');b(7,9,10,6,'B');}),
  planet:overviewStamp(b=>{b(9,4,7,2);b(6,6,13,3);b(4,9,16,7);b(7,16,11,3);b(10,19,6,1);b(9,7,7,9,'B');b(6,10,3,4,'F');
    b(1,14,5,3);b(0,16,3,2);b(3,17,5,2);b(7,15,5,2,'F');b(12,12,5,2,'F');b(17,9,5,2);b(20,6,3,4);}),
  telescope:overviewStamp(b=>{b(3,5,12,6);b(14,3,5,10);b(19,4,2,8,'F');b(4,6,10,3,'B');b(11,11,3,3);b(10,14,3,8);
    b(7,16,3,3);b(4,19,3,3);b(14,16,3,3);b(17,19,3,3);}),
  constellation:overviewStamp(b=>{b(5,6,10,1);b(14,7,1,7);b(9,14,6,1);b(8,14,1,6);b(5,6,1,6);b(5,11,5,1);
    for(const [x,y] of [[4,5],[13,5],[13,13],[7,18],[4,10]]){b(x,y,3,3,'F');b(x+1,y+1,1,1);}}),
  waterfall:overviewStamp(b=>{b(3,3,18,3);b(5,6,14,14,'B');b(6,6,2,13,'F');b(11,6,2,13,'F');b(16,6,2,13,'F');b(3,19,18,2);b(1,21,22,2,'F');}),
  castle:overviewStamp(b=>{for(const x of [2,16]){b(x,5,6,16);b(x-1,3,2,5);b(x+2,3,2,5);b(x+5,3,2,5);b(x+2,8,2,3,'F');}
    b(8,10,8,11);b(7,8,3,4);b(11,8,3,4);b(15,8,2,4);b(10,15,4,6,'F');b(11,14,2,1,'F');}),
  flag:overviewStamp(b=>{b(5,2,2,20);b(7,3,12,8,'F');b(17,9,4,2,'F');b(2,21,9,2);}),
};
