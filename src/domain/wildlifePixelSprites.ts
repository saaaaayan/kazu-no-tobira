type PixelPainter = {
  box:(x:number,y:number,width:number,height:number,color?:string)=>void;
  polygon:(points:readonly (readonly [number,number])[],color?:string)=>void;
  line:(x:number,y:number,endX:number,endY:number,color?:string)=>void;
};

/** Hand-authored whole-body silhouettes, drawn on an integer pixel canvas.
 * Only these two islands use this atlas. Existing shared animal/toy art stays
 * available under its original identifiers.
 */
function wildlifeSprite(paint:(p:PixelPainter)=>void):readonly string[] {
  const canvas=Array.from({length:36},()=>Array<string>(48).fill('.'));
  function box(x:number,y:number,width:number,height:number,color='B') {
    for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)
      if(xx>=1&&xx<47&&yy>=1&&yy<35)canvas[yy][xx]=color;
  }
  function line(x:number,y:number,endX:number,endY:number,color='X') {
    const steps=Math.max(Math.abs(endX-x),Math.abs(endY-y));
    for(let n=0;n<=steps;n++)box(Math.round(x+(endX-x)*n/(steps||1)),
      Math.round(y+(endY-y)*n/(steps||1)),1,1,color);
  }
  function polygon(points:readonly (readonly [number,number])[],color='B') {
    for(let y=1;y<35;y++)for(let x=1;x<47;x++){
      let inside=false;
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const [xi,yi]=points[i],[xj,yj]=points[j];
        if((yi>y+.5)!==(yj>y+.5)&&x+.5<(xj-xi)*(y+.5-yi)/(yj-yi)+xi)inside=!inside;
      }
      if(inside)canvas[y][x]=color;
    }
    points.forEach(([x,y],i)=>{
      const next=points[(i+1)%points.length];
      line(x,y,next[0],next[1],color);
    });
  }
  paint({box,polygon,line});
  const outlined=canvas.map(row=>[...row]);
  for(let y=1;y<35;y++)for(let x=1;x<47;x++){
    if(canvas[y][x]!=='.')continue;
    if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([xx,yy])=>canvas[yy]?.[xx]!=='.'))
      outlined[y][x]='X';
  }
  const points=outlined.flatMap((row,y)=>row.flatMap((value,x)=>value==='.'?[]:[{x,y}]));
  const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x));
  const top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
  return outlined.slice(top,bottom+1).map(row=>row.slice(left,right+1).join(''));
}

export const WILDLIFE_SPRITES = {
  forestBear:wildlifeSprite(({polygon,box})=>{
    polygon([[5,13],[8,9],[22,9],[27,13],[26,22],[8,22],[4,18]]);
    polygon([[22,8],[25,5],[32,5],[35,10],[34,17],[29,20],[24,17]]);
    box(24,3,4,4);box(31,3,4,4);box(27,5,2,2,'A');
    box(32,12,6,4,'F');box(37,12,2,2,'X');box(31,9,2,2,'X');
    box(7,20,5,7);box(21,20,5,7);box(10,19,4,5,'A');box(25,19,3,6,'A');
    box(6,26,7,2,'X');box(20,26,7,2,'X');box(4,12,3,3,'A');
    polygon([[10,18],[23,18],[22,21],[10,21]],'A');
  }),
  forestRabbit:wildlifeSprite(({polygon,box,line})=>{
    polygon([[6,20],[7,14],[12,10],[21,11],[26,17],[24,25],[9,25]]);
    polygon([[21,12],[23,8],[30,8],[33,13],[32,19],[26,21],[22,18]],'F');
    polygon([[23,9],[22,2],[25,1],[27,9]],'F');
    polygon([[28,9],[29,1],[32,2],[31,10]],'F');
    line(24,3,25,8,'A');line(30,3,30,8,'A');
    box(29,12,2,2,'X');box(32,15,2,1,'A');
    box(4,19,4,4,'F');box(10,23,9,3,'A');box(23,23,10,3,'F');
    line(27,17,29,18,'A');
  }),
  forestFox:wildlifeSprite(({polygon,box,line})=>{
    polygon([[5,20],[2,14],[3,10],[8,12],[13,20],[12,25],[6,24]],'A');
    polygon([[2,12],[3,10],[7,12],[5,16]],'F');
    polygon([[10,16],[16,12],[27,13],[30,20],[24,24],[12,23]]);
    polygon([[25,13],[25,5],[29,9],[33,4],[34,12],[39,15],[32,20],[27,19]]);
    polygon([[28,14],[36,14],[32,18]],'F');box(38,15,2,1,'X');box(32,11,2,2,'X');
    line(26,7,27,11,'A');line(33,6,33,10,'A');
    box(13,23,3,6,'X');box(25,22,3,7,'X');box(17,22,2,5,'A');
  }),
  forestDeer:wildlifeSprite(({polygon,box,line})=>{
    polygon([[6,14],[11,11],[26,13],[28,20],[23,23],[8,21]]);
    polygon([[23,14],[27,7],[31,5],[34,7],[34,11],[29,16],[27,21]]);
    box(31,7,6,3);box(35,8,2,1,'X');box(31,6,1,1,'X');
    line(28,6,26,1,'A');line(27,3,23,2,'A');line(29,5,32,1,'A');line(31,3,35,2,'A');
    polygon([[27,8],[23,6],[25,10]],'A');box(5,14,3,4,'F');
    for(const x of [9,14,23,27]){box(x,21,2,10);box(x,30,3,2,'X');}
    for(const x of [11,16,20])box(x,15+(x%2),2,2,'F');
  }),
  forestSquirrel:wildlifeSprite(({polygon,box,line})=>{
    polygon([[12,23],[5,22],[3,17],[4,9],[8,5],[13,6],[16,12],[14,17],[10,17],[9,13]],'A');
    polygon([[13,16],[18,13],[25,16],[27,24],[23,29],[15,28]]);
    polygon([[20,14],[20,7],[23,4],[26,7],[28,10],[27,16],[23,19]]);
    box(21,3,2,4);box(25,3,2,4);box(25,9,1,2,'X');box(27,12,2,1,'X');
    polygon([[18,20],[22,19],[24,26],[19,27]],'F');
    box(16,28,11,2,'A');line(22,19,28,21,'B');box(28,20,3,3,'A');
  }),
  forestOwl:wildlifeSprite(({polygon,box,line})=>{
    polygon([[13,9],[11,3],[18,7],[24,7],[31,3],[29,10],[31,16],[29,25],[24,29],[16,29],[11,25],[10,16]]);
    polygon([[14,12],[18,9],[21,13],[24,9],[28,12],[27,19],[23,22],[17,22],[13,18]],'F');
    box(16,13,3,4,'X');box(24,13,3,4,'X');box(16,13,1,1,'F');box(24,13,1,1,'F');
    polygon([[20,18],[23,18],[21,21]],'A');
    line(12,19,15,25,'A');line(29,19,26,25,'A');
    for(const x of [17,23]){box(x,28,2,3,'A');box(x-1,30,4,1,'X');}
    box(8,31,26,2,'A');
  }),
  forestRaccoon:wildlifeSprite(({polygon,box,line})=>{
    polygon([[4,14],[7,11],[12,13],[15,22],[12,27],[7,26],[4,21]],'A');
    line(5,16,11,15,'X');line(7,21,13,20,'X');line(9,26,13,24,'X');
    polygon([[12,17],[17,13],[28,14],[31,22],[27,27],[15,26]]);
    polygon([[25,15],[25,8],[28,5],[33,6],[36,11],[35,18],[30,21],[26,19]],'F');
    box(26,5,3,4,'X');box(33,5,3,4,'X');box(26,12,9,3,'X');
    box(28,12,1,1,'F');box(33,12,1,1,'F');box(30,17,3,2,'X');
    box(15,25,4,5,'X');box(27,25,4,5,'X');
  }),
  forestBird:wildlifeSprite(({polygon,box,line})=>{
    polygon([[13,16],[16,10],[23,9],[28,13],[27,20],[22,24],[16,22]]);
    polygon([[16,17],[7,14],[12,21],[18,21]],'A');
    polygon([[26,13],[32,15],[27,17]],'A');
    box(24,12,2,2,'X');line(18,23,18,28,'A');line(23,23,24,28,'A');
    box(15,28,5,1,'X');box(23,28,5,1,'X');line(17,16,23,19,'F');
  }),
  forestTree:wildlifeSprite(({polygon,box,line})=>{
    box(20,16,5,16,'A');line(22,25,16,20,'X');line(22,22,29,16,'X');
    polygon([[8,10],[12,6],[16,6],[18,2],[27,2],[30,6],[35,7],[38,13],[35,19],[29,22],[15,21],[9,17]]);
    polygon([[12,10],[17,6],[23,5],[24,10],[18,13]],'A');
    line(25,17,30,14,'F');
  }),
  forestStump:wildlifeSprite(({polygon,box,line})=>{
    polygon([[10,14],[15,10],[30,10],[35,14],[33,28],[27,30],[15,30],[10,27]],'A');
    polygon([[10,14],[15,10],[30,10],[35,14],[29,18],[15,18]],'F');
    line(17,13,27,13,'A');line(16,15,29,15,'A');
    line(17,20,16,27,'X');line(29,20,29,27,'X');
    box(7,28,9,3,'A');box(31,26,6,4,'A');
  }),
  forestMushroom:wildlifeSprite(({polygon,box})=>{
    box(20,16,5,14,'F');polygon([[10,17],[11,11],[16,6],[28,6],[34,12],[35,17]],'R');
    box(15,10,4,3,'F');box(26,12,4,3,'F');box(20,7,3,2,'F');
  }),
  forestGrass:wildlifeSprite(({polygon})=>{
    polygon([[7,25],[6,15],[12,20],[15,11],[19,22],[24,13],[26,23],[33,16],[32,27]],'B');
  }),
  forestTracks:wildlifeSprite(({box,polygon})=>{
    for(const [x,y] of [[10,10],[25,21]]){
      polygon([[x,y+4],[x+4,y+3],[x+7,y+6],[x+6,y+10],[x,y+10]],'A');
      for(const [dx,dy] of [[-2,0],[2,-2],[6,0]])box(x+dx,y+dy,3,3,'A');
    }
  }),
  forestAcorn:wildlifeSprite(({polygon,box})=>{
    polygon([[15,15],[28,15],[27,25],[23,29],[19,28],[15,23]],'A');
    polygon([[13,15],[16,10],[26,10],[30,15],[29,18],[14,18]],'B');box(20,6,3,5,'A');
    box(18,19,2,5,'F');
  }),
  forestLeaves:wildlifeSprite(({polygon,line})=>{
    polygon([[8,12],[19,10],[18,18],[11,21]],'B');line(9,20,18,12,'A');
    polygon([[24,19],[34,14],[35,24],[28,28]],'A');line(27,27,33,17,'B');
  }),
  forestFlowers:wildlifeSprite(({box,line})=>{
    for(const [x,y] of [[11,12],[24,19],[33,9]]){
      line(x+1,y+3,x+1,y+10,'B');box(x-2,y,7,3,'F');box(x,y-2,3,7,'F');box(x,y,3,3,'A');
    }
  }),
  forestTwigs:wildlifeSprite(({line})=>{
    line(8,27,33,12,'A');line(19,21,18,14,'A');line(25,17,32,20,'A');line(10,29,35,14,'A');
  }),
  forestBerries:wildlifeSprite(({box,line})=>{
    line(13,16,24,8,'B');line(24,8,32,17,'B');
    for(const [x,y] of [[10,18],[17,15],[28,18]]){box(x,y,5,5,'R');box(x+1,y+1,1,1,'F');}
  }),
  forestFeather:wildlifeSprite(({polygon,line})=>{
    polygon([[12,27],[13,15],[19,7],[28,5],[29,12],[22,22]],'F');
    line(10,30,27,8,'A');line(17,23,15,16,'A');line(21,18,26,17,'A');
  }),
  forestTinyMushrooms:wildlifeSprite(({polygon,box})=>{
    for(const [x,y] of [[9,16],[25,21]]){
      box(x+4,y+3,3,7,'F');polygon([[x,y+3],[x+2,y-2],[x+8,y-2],[x+11,y+3]],'A');
      box(x+4,y,2,2,'F');
    }
  }),
  prehistoricRex:wildlifeSprite(({polygon,box,line})=>{
    polygon([[4,19],[11,19],[18,14],[24,13],[28,18],[28,25],[20,28],[14,25],[9,24]]);
    polygon([[23,16],[24,8],[28,4],[39,4],[42,7],[42,13],[32,15],[29,23]]);
    box(37,6,2,2,'X');box(32,11,11,2,'X');
    for(const x of [33,36,39])box(x,11,1,2,'F');
    polygon([[24,18],[27,17],[28,23],[24,25]],'F');
    polygon([[16,24],[21,24],[20,31],[14,31]],'A');box(13,31,8,2,'X');
    polygon([[25,24],[29,24],[31,30],[34,30],[34,32],[27,32]],'B');
    line(28,18,33,20,'A');line(33,20,34,18,'A');
    box(4,18,3,1,'A');
  }),
  prehistoricTriceratops:wildlifeSprite(({polygon,box,line})=>{
    polygon([[3,17],[10,14],[25,13],[31,17],[31,25],[23,28],[11,27],[7,23]]);
    polygon([[26,12],[28,7],[33,6],[38,10],[39,17],[36,23],[30,24],[27,19]],'A');
    polygon([[32,15],[39,14],[43,18],[43,22],[35,24]],'B');
    polygon([[34,14],[35,7],[37,15]],'F');polygon([[39,16],[42,10],[42,18]],'F');
    polygon([[41,18],[46,17],[43,21]],'F');box(37,17,2,2,'X');
    for(const x of [10,16,28,33]){box(x,25,4,7,'B');box(x,31,5,2,'X');}
    line(29,11,29,19,'F');line(31,10,31,21,'F');
  }),
  prehistoricPterosaur:wildlifeSprite(({polygon,box,line})=>{
    polygon([[21,18],[16,12],[5,5],[7,15],[14,16],[18,23]],'A');
    polygon([[25,18],[31,11],[43,5],[40,16],[33,16],[28,23]],'A');
    polygon([[20,15],[22,9],[26,8],[29,11],[27,15],[27,24],[23,27],[20,22]],'B');
    polygon([[26,10],[36,13],[27,14]],'F');polygon([[22,9],[17,4],[25,8]],'B');
    box(25,10,1,1,'X');line(23,25,20,29,'X');line(25,25,28,29,'X');
    line(8,10,18,17,'F');line(39,10,29,17,'F');
  }),
  prehistoricLongneck:wildlifeSprite(({polygon,box,line})=>{
    polygon([[4,24],[12,24],[17,20],[29,19],[33,22],[33,27],[27,29],[16,28],[11,27]],'B');
    polygon([[28,24],[28,11],[30,5],[32,3],[37,3],[39,6],[38,9],[34,9],[33,24]],'B');
    box(37,5,1,1,'X');box(34,9,2,14,'F');
    for(const x of [17,22,28,32]){box(x,27,3,6,'B');box(x,32,4,1,'X');}
    line(14,24,26,23,'A');
  }),
  prehistoricVolcano:wildlifeSprite(({polygon,box,line})=>{
    polygon([[3,30],[9,23],[15,12],[19,10],[28,10],[33,16],[37,25],[44,30]],'B');
    polygon([[17,11],[20,9],[28,9],[30,12],[26,15],[20,14]],'X');
    polygon([[21,12],[25,12],[25,17],[29,20],[29,24],[34,30],[29,30],[25,24],[25,21],[21,18]],'R');
    polygon([[15,18],[11,27],[7,29],[18,29]],'A');
    box(20,5,3,3,'A');box(26,3,3,3,'A');line(21,3,18,1,'R');line(28,2,30,1,'R');
  }),
  prehistoricEggs:wildlifeSprite(({polygon,box})=>{
    for(const [x,y] of [[7,20],[19,16],[30,21]]){
      polygon([[x,y],[x+1,y-6],[x+4,y-9],[x+7,y-7],[x+9,y],[x+8,y+5],[x+2,y+5]],'F');
      box(x+3,y-3,2,3,'A');box(x+5,y+2,2,2,'B');
    }
  }),
  prehistoricBone:wildlifeSprite(({polygon,box})=>{
    polygon([[8,13],[11,13],[14,18],[31,18],[34,13],[38,13],[39,16],[36,20],[39,24],[37,27],[33,26],[30,22],[15,22],[11,26],[7,26],[6,23],[10,20],[6,17]],'F');
    box(16,19,14,1,'A');
  }),
  prehistoricSkeleton:wildlifeSprite(({polygon,line,box})=>{
    polygon([[28,10],[35,9],[40,12],[40,17],[32,18],[28,15]],'F');box(34,12,3,3,'X');
    line(7,22,29,15,'F');line(7,23,29,16,'F');
    for(let x=12;x<28;x+=4){line(x,21,x+1,25,'F');line(x+1,25,x+4,25,'F');}
    line(17,24,15,30,'F');line(26,21,29,29,'F');line(7,22,3,24,'F');
  }),
  prehistoricAmmonite:wildlifeSprite(({polygon,line})=>{
    polygon([[11,10],[27,8],[34,14],[33,25],[25,30],[13,28],[7,21]],'F');
    line(13,14,26,12,'A');line(26,12,29,18,'A');line(29,18,26,25,'A');
    line(26,25,16,25,'A');line(16,25,12,20,'A');line(12,20,17,16,'A');
    line(17,16,23,17,'A');line(23,17,23,21,'A');line(23,21,18,21,'A');
  }),
  prehistoricRockRidge:wildlifeSprite(({polygon,line})=>{
    polygon([[4,29],[6,18],[11,16],[13,7],[20,5],[25,11],[30,10],[35,18],[40,20],[43,29]],'B');
    polygon([[13,9],[20,7],[23,12],[15,14]],'F');line(25,13,26,26,'A');line(10,20,12,28,'A');
  }),
  prehistoricFern:wildlifeSprite(({line})=>{
    line(23,31,23,8,'B');
    for(let y=11;y<28;y+=4){line(23,y,10,y-5,'B');line(23,y,36,y-5,'B');line(23,y+1,12,y-3,'A');line(23,y+1,34,y-3,'A');}
    line(23,10,20,4,'B');
  }),
  prehistoricPalm:wildlifeSprite(({polygon,line})=>{
    polygon([[21,31],[22,14],[25,14],[25,31]],'A');
    polygon([[23,12],[14,5],[5,7],[14,9],[20,15]],'B');
    polygon([[23,12],[32,5],[42,8],[32,9],[26,15]],'B');
    polygon([[23,12],[17,11],[9,20],[16,17],[22,14]],'B');
    polygon([[25,12],[33,12],[40,20],[32,17],[25,15]],'B');
    line(22,7,24,13,'B');line(22,20,25,20,'X');line(22,25,25,25,'X');
  }),
  prehistoricLavaCrack:wildlifeSprite(({polygon})=>{
    polygon([[8,8],[20,12],[18,19],[31,22],[38,29],[28,26],[15,22],[16,15]],'X');
    polygon([[9,9],[19,13],[17,19],[30,23],[34,27],[29,25],[16,21],[17,14]],'R');
  }),
  prehistoricTracks:wildlifeSprite(({polygon})=>{
    for(const [x,y] of [[8,8],[26,18]]){
      polygon([[x+3,y+8],[x,y+2],[x+3,y+4],[x+5,y],[x+7,y+4],[x+11,y+2],[x+9,y+8],[x+7,y+11]],'A');
    }
  }),
  prehistoricPebbles:wildlifeSprite(({polygon})=>{
    polygon([[7,22],[8,17],[15,16],[19,22]],'A');
    polygon([[23,26],[25,20],[32,21],[35,27]],'B');
    polygon([[30,12],[32,9],[36,10],[38,14]],'F');
  }),
  prehistoricFossilShard:wildlifeSprite(({polygon,line})=>{
    polygon([[10,8],[24,11],[34,25],[19,29],[7,22]],'A');
    line(13,13,27,22,'F');line(18,16,16,22,'F');line(23,19,21,25,'F');
  }),
  prehistoricBoneChips:wildlifeSprite(({box,line})=>{
    line(10,11,19,19,'F');line(11,11,20,19,'F');box(8,9,4,4,'F');box(18,18,4,4,'F');
    line(29,22,35,17,'F');box(27,22,4,4,'F');box(34,15,4,4,'F');
  }),
  prehistoricAsh:wildlifeSprite(({box,line})=>{
    for(const [x,y] of [[7,12],[15,23],[24,15],[33,26],[37,9]]){box(x,y,2,2,'A');line(x+1,y+3,x+4,y+3,'B');}
  }),
  prehistoricGroundCrack:wildlifeSprite(({line})=>{
    line(8,8,16,14,'A');line(16,14,13,22,'A');line(13,22,23,29,'A');
    line(15,18,28,17,'A');line(28,17,36,23,'A');line(28,17,32,9,'A');
  }),
  prehistoricLeaves:wildlifeSprite(({polygon,line})=>{
    polygon([[7,21],[11,11],[23,7],[20,17],[12,25]],'B');line(8,25,21,10,'A');
    polygon([[25,22],[29,14],[39,13],[36,22],[29,28]],'A');line(27,27,37,16,'B');
  }),
  prehistoricSprout:wildlifeSprite(({polygon,line})=>{
    line(23,31,23,16,'B');
    polygon([[22,22],[12,19],[9,11],[18,15]],'B');
    polygon([[24,17],[29,9],[37,7],[34,16]],'B');
    line(15,16,22,22,'A');line(26,15,33,11,'A');
  }),
} as const;

export const WILDLIFE_COLORS:Record<string,Partial<Record<string,string>>> = {
  forestBear:{B:'#a17c57',A:'#816747',F:'#e0c9a0'},
  forestRabbit:{B:'#d0cdb5',A:'#aa9388',F:'#eee8d2'},
  forestFox:{B:'#b58455',A:'#956d47',F:'#eee1c2'},
  forestDeer:{B:'#b09a70',A:'#846c4b',F:'#e7d8b7'},
  forestSquirrel:{B:'#ad8459',A:'#8f704d',F:'#e6d4ac'},
  forestOwl:{B:'#8d8167',A:'#ad9870',F:'#e6ddbe'},
  forestRaccoon:{B:'#999b8c',A:'#7e8272',F:'#dfdfc8'},
  forestBird:{B:'#83958b',A:'#ac966b',F:'#ddd9bc'},
  forestTree:{B:'#64805d',A:'#859869',F:'#a3b584'},
  forestStump:{B:'#8d7457',A:'#9c825f',F:'#d4bc8c'},
  forestMushroom:{B:'#809164',A:'#a28b66',F:'#e3d6b6',R:'#a97c69'},
  prehistoricRex:{B:'#7d9169',A:'#5e7658',F:'#d6d0a4'},
  prehistoricTriceratops:{B:'#a4a17b',A:'#80855f',F:'#e4d8b7'},
  prehistoricPterosaur:{B:'#a28b70',A:'#b8a184',F:'#dcc9a2'},
  prehistoricLongneck:{B:'#839c8b',A:'#5d7d70',F:'#d7d9b7'},
  prehistoricVolcano:{B:'#89745c',A:'#ab9471',F:'#d8b67f',R:'#b87355'},
  prehistoricEggs:{B:'#9b9470',A:'#b39d78',F:'#e3dbbd'},
  prehistoricFern:{B:'#637d56',A:'#90a16c'},
  prehistoricPalm:{B:'#6e885e',A:'#a68c64'},
  prehistoricSprout:{B:'#718b5e',A:'#a2ad77'},
  prehistoricLeaves:{B:'#6f855b',A:'#a5a16b'},
  prehistoricTracks:{A:'#776b50'},
};
