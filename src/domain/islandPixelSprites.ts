const legacySprites={
  tree:["....XX....","...XFFX...","..XFBBFX..",".XFBBBBFX.","XFBBBBBBFX","..XFBBFX..","...XFFX...","....XX....","....XX....","...XBBX..."],
  rabbit:["..XX..XX..","..XFX.XFX.","..XFX.XFX.","...XFFFXX.","..XFFFFFX.","..XAXFFAX.","..XFFFFFX.","...XXXXX..","...XFFFXX.","..XFFFFFX."],
  mushroom:["...XXXX...","..XAAAAX..",".XAAAAAAX.","XAAAAAAAAX","XXXXXXXXXX",".XFFFFFFX.","..XFXFFFX.","..XFFFFFFX.","..XXXXXXXX"],
  cupcake:["..XAAAAAX.","..AAAAAAA.","..XFFFFFX.","...XFFFX..",".XXXXXXXX.",".XBBBBBBX.",".XBBBBBBX.","..XBBBBX..","..XXXXXX.."],
  candy:["..........","...XX.....","..XAFX....",".XAAAXXXX.","XAXFFXAAAX","XXXXXAAX..","....XAX...",".....XX..."],
  donut:["..XXXXXX..",".XAAAAAAX.","XAAFFFFAAX","XAFF..FFAX","XAFF..FFAX","XAAFFFFAAX",".XAAAAAAX.","..XXXXXX.."],
  dinosaur:[".....XXX..","...XXBBXX.","..XBBFFBX.","..XBBBBBX.",".XBBBBXX..","XBBBBBXXX.","XBBBBBBXX.","XXXBBXBX..","..XBBX.X..","..X..X.X.."],
  fossil:["..XX..XX..","..XFFFFX..","XXXFFFFXXX","XFFFXFFFX","XXFFXFFXX.","..XFFFFX..","..XFFFFX..","XXXFFFFXXX","..XXXXXX.."],
  volcano:["....XX....","...XAAX...","..XAAAAX..","..XBBXBBX..",".XBBXBBBX.","XBBXXBBBX.","XBBXXBBBX.","XXXXXXXXX."],
  gear:["..XX.XX...","..XBBBX...","XXXBBBXXX","XBBXFXBBX","XBBFFFBBX","XBBXFXBBX","XXXBBBXXX","..XBBBX...","..XX.XX..."],
  factory:["..XX..XX..","..XAX.XAX.","..XAX.XAX.","XXXXXXXXXX","XBBBBBBBBX","XBFXXFBFXX","XBFXXFBFBX","XBBBBBBBBX","XXXXXXXXXX"],
  robot:["....XX....","..XXXXXX..","..XBBBBX..","..XFAAFX..","..XBBBBX..","...XXXX...",".XXBBBBXX.","..XBFFBX..","..XBBBBX..","..XX..XX.."],
  column:["..XXXXXXXX","..XFFFFFFX","...XFFFFX.","...XBBFBX.","...XBBFBX.","...XBBFBX.","...XBBFBX.","..XFFFFFFX","..XXXXXXXX"],
  pyramid:["....XX....","...XBBX...","..XBBBBX..",".XBBBBBBX.","XBBBBBBBBX","XXXXXXXXXX"],
  amphora:["..XX..XX..","..XAXXAX..","..XAAAAX.","...XAAX..","...XBBX...","..XBBBBX..","..XBBBBX..","...XXXX..."],
  maze:["XXXXXXXXXX","XFFFFBFFFX","XFXXFBXXFX","XFXXFXXFFX","XFFFXXFFXX","XXXFFFFBFX","XFFFBXXFFX","XFXXFFFFFX","XXXXXXXXXX"],
  key:["....XXXX..","...XFFFFX.","...XFXFFX.","...XFFFFX.","....XXXX..",".....XX...",".....XX...",".....XXXX.",".....X.XX."],
  torch:["....AA....","...AAAA...","...XAAX..","....XX....","...XBBX...","...XBBX...","...XBBX...","...XXXX..."],
  mirror:["..XXXXXXXX","..XFFFFFFX","..XFFFFFFX","..XFAXAFX","..XFFFFFFX","..XFFFFFFX","..XXXXXXXX",".....XX...","...XXXXXX."],
  gem:["....XX....","..XXAAXX..",".XAAAAAAX.","XAAAAAAAAX","XXAAAAAAX","..XAAAAX.","...XAAX..","....XX...."],
  arch:["..XXXXXXXX","..XBBBBBBX","..XFFFFFBX","..XF...FBX","..XF...FBX","..XF...FBX","..XF...FBX","..XX...XXX"],
  lantern:["....XX....","...XBBX...","..XXXXXX..","..XFFFFX..","..XFAAFX..","..XFFFFX..","..XXXXXX..","...XBBX..."],
  prism:["....XX....","...XFFX...","..XFFFFX..",".XFFFFFBX.","XFFFFFBBBX","XXXXXXBBBX","..A..B..A."],
  moon:["...XXXXX..","..XFFFFFX.","..XFFFFX..",".XFFFFX...","XFFFFX....","XFFFFX....",".XFFFFX...","..XFFFFXX.","...XXXXX.."],
  constellation:[".X........","...A..X...","..A..A....",".....A....",".X..A..X..","..A.A.....","...X......"],
  telescope:["....XX....","...XFFX...","..XFFFFXX.","..XAAAAAX.","...XXXXXX.",".....XX...","....XXXX..","...XX..XX.","..XX....XX"],
  planet:["...XXXX...","..XBBBBX..",".XBBFFBBX.","XBBFFFFBBX","XBBFFFFBBX",".XBBFFBBX.","..XBBBBX..","...XXXX...","..AAAAAA.."],
  mountain:["....XX....","...XFFX...","..XFFBBX..",".XFFBBBBX.","XFFBBBBBBX","XXXXXXXXXX"],
  waterfall:["XXXFFFXXX","XBBBBBBBX","XFFBFFBFX","XFFBFFBFX","XFFBFFBFX","XFFBFFBFX","XAABAAABX","AAAAAAAAA"],
  pine:["....XX....","...XBBX...","..XBBBBX..",".XBBBBBBX.","..XBBBBX..",".XBBBBBBX.","XBBBBBBBBX","....XX....","....XX...."],
  book:["XX......XX","XFFFFFFFFX","XFFFAAAFFX","XFFFFFFFFX","XFFFFFFFFX","XFFFFFFFBX","XXBBBBBBXX","..XXXXXX.."],
  compass:["....XX....","...XAXX...","..XAAAFX..","XXAAFAAXXX","XAAFAAAAAX","XXAAFAAXXX","..XFFAFX..","...XXXX..."],
  hat:[".....XX...","....XAAX..","...XAAAAX.","..XAAAAAAX",".XAAAAAAAX","XXXXXXXXXXX","..XBBBBBX"],
  spellbook:["XXXXXXXXXX","XAAAAAFAAX","XAAFAAAAAX","XAAFAAAAAX","XAAAAAAAAX","XFFFFFFAAX","XXXXXXXXXX"],
  crystal:["....XX....","...XFFX...",".XXFFFXX.","XFFFAFFFFX",".XFFFFFFX.","..XFFFFX..","...XFFX...","....XX...."],
  castle:["XX......XX","XBX.XXXXBX","XBX.XBBXBX","XBBXXBBXBX","XBBBBBBBBX","XBBBFFBBBX","XBBXFFXBBX","XXXXXXXXXX"],
  crown:["X........X","XAA..XX..AX","XAAAAXAAAX","XAAAAAAAAX","XAAAAAAAAX","XXXXXXXXXXX"],
  shield:["..XXXXXX..",".XBBBBBBX.","XBBBBBBBBX","XBBBAABBBX",".XBBBBBBX.","..XBBBBX..","...XBBX...","....XX...."],
  satellite:["XX......XX","XFX....XFX","XXX.XX.XXX","...XFFX...","...XAFX...","..XFFFFX..","...XXXX..."],
  rocket:["....XX....","...XAAX..","..XAAAAX.","..XFFAFX..","..XFFAFX..",".XXFFAXX.","XAXFFFXAX","XAX...XAX","..A...A.."],
} as const;
type Painter = {
  box: (x:number,y:number,w:number,h:number,color?:string) => void;
  frame: (x:number,y:number,w:number,h:number,color?:string) => void;
  line: (x:number,y:number,endX:number,endY:number,color?:string) => void;
};
function draw(paint:(p:Painter)=>void):readonly string[] {
  const rows=Array.from({length:20},()=>Array<string>(20).fill('.'));
  function box(x:number,y:number,w:number,h:number,color='B') {
    for(let j=y;j<y+h;j++) for(let i=x;i<x+w;i++)
      if(i>=0&&i<20&&j>=0&&j<20) rows[j][i]=color;
  }
  function frame(x:number,y:number,w:number,h:number,color='B') {
    box(x,y,w,h,'X');box(x+1,y+1,w-2,h-2,color);
  }
  function line(x:number,y:number,endX:number,endY:number,color='X') {
    const steps=Math.max(Math.abs(endX-x),Math.abs(endY-y));
    for(let i=0;i<=steps;i++)
      box(Math.round(x+(endX-x)*i/(steps||1)),Math.round(y+(endY-y)*i/(steps||1)),1,1,color);
  }
  paint({box,frame,line});
  return rows.map(row=>row.join(''));
}
function building(style:'temple'|'library'|'school'|'tower'|'gate'|'mill'|'house'|'dome') {
  return draw(({box,frame,line})=>{
    if(style==='dome') {
      box(6,3,8,2,'X');box(3,5,14,2,'X');frame(2,7,16,4,'F');
      frame(3,11,14,7);frame(8,13,4,5,'A');box(10,1,1,5,'X');return;
    }
    if(style==='tower'||style==='mill') {
      frame(6,6,8,12);box(4,4,12,3,'A');box(7,2,6,2,'A');
      frame(8,9,4,3,'F');frame(8,14,4,4,'X');
      if(style==='mill') {line(3,2,17,14,'F');line(17,2,3,14,'F');}
      return;
    }
    if(style==='gate') {
      frame(1,5,5,14);frame(14,5,5,14);frame(5,6,10,4,'A');
      box(7,10,6,9,'.');box(2,2,3,4,'A');box(15,2,3,4,'A');
      frame(2,9,3,3,'F');frame(15,9,3,3,'F');return;
    }
    frame(2,7,16,11);
    if(style==='temple'||style==='library') {
      for(let n=0;n<5;n++) box(2+n,6-n,16-n*2,1,'A');
      for(const x of [4,8,12,16]) {box(x,9,1,7,'F');box(x-1,8,3,1,'X');}
      box(0,18,20,1,'X');
    } else {
      for(let n=0;n<6;n++) box(1+n,6-n,18-n*2,1,'A');
      frame(8,12,4,6,'X');
      for(const x of [4,13]) frame(x,9,3,3,'F');
      if(style==='school') frame(8,3,4,4,'F');
    }
  });
}
function animal(kind:'bear'|'fox'|'deer'|'owl'|'squirrel'|'bird'|'raccoon'|'mouse') {
  return draw(({box,frame,line})=>{
    if(kind==='bird') {
      frame(5,6,9,8);box(13,8,3,2,'A');box(4,10,5,4,'A');
      box(9,8,2,2,'X');line(7,14,6,17);line(11,14,12,17);return;
    }
    frame(5,10,10,7);frame(3,5,14,8,'F');
    if(kind==='deer') {
      line(6,6,3,0);line(13,6,16,0);line(4,3,1,3);line(15,3,18,3);
    } else if(kind==='owl'||kind==='fox'||kind==='raccoon') {
      box(3,2,3,5,'X');box(14,2,3,5,'X');box(4,4,2,3,'A');box(14,4,2,3,'A');
    } else {frame(2,2,5,5);frame(13,2,5,5);}
    box(6,8,2,2,'X');box(12,8,2,2,'X');box(9,11,2,1,'A');
    if(kind==='owl') {
      frame(4,6,5,5,'A');frame(11,6,5,5,'A');
      box(6,8,1,2,'X');box(13,8,1,2,'X');box(9,11,2,2,'A');
      line(5,12,7,16,'F');line(14,12,12,16,'F');
    }
    if(kind==='fox') {
      box(5,10,3,2,'B');box(12,10,3,2,'B');box(9,11,2,1,'X');
      box(15,13,4,4,'A');box(17,12,2,2,'F');
    }
    if(kind==='mouse') {
      frame(1,1,7,6,'A');frame(12,1,7,6,'A');
      line(2,11,6,12,'X');line(13,12,17,11,'X');
      line(15,15,19,14,'A');line(19,14,19,10,'A');
    }
    if(kind==='raccoon') {box(4,7,5,2,'B');box(11,7,5,2,'B');}
    if(kind==='squirrel') {frame(15,9,4,8,'A');box(16,11,2,3,'F');}
    box(4,17,5,2,'X');box(11,17,5,2,'X');
  });
}
const additions = {
  tree:draw(({frame,box})=>{
    frame(8,11,4,8,'A');frame(3,5,14,9);frame(6,2,8,5);
    box(4,7,12,5,'B');box(6,4,7,4,'F');box(12,10,3,3,'A');
  }),
  mountain:draw(({box})=>{
    for(let y=1;y<18;y++){
      const width=Math.min(18,2+Math.floor(y*1.15));
      box(Math.floor((20-width)/2),y,width,1,'X');
      if(width>3)box(Math.floor((20-width)/2)+1,y,width-2,1,y<7?'F':'B');
    }
    box(10,6,2,10,'A');
  }),
  volcano:draw(({box})=>{
    box(7,1,6,2,'X');box(8,2,4,2,'R');
    for(let y=4;y<18;y++){
      const width=Math.min(18,7+Math.floor(y*.7));
      box(Math.floor((20-width)/2),y,width,1,'X');
      box(Math.floor((20-width)/2)+1,y,width-2,1,'B');
    }
    box(8,4,4,4,'R');box(10,7,3,5,'R');box(12,11,3,6,'R');
    box(4,11,2,5,'A');
  }),
  dinosaur:draw(({frame,box})=>{
    frame(10,2,8,6);box(15,3,1,1,'X');box(14,6,5,1,'F');
    frame(8,7,7,8);box(6,10,6,5,'B');box(3,11,5,3,'B');
    box(1,9,3,3,'X');box(10,15,3,4,'X');box(5,14,3,5,'X');
    box(13,9,5,2,'A');
  }),
  castle:draw(({frame,box})=>{
    frame(1,5,5,14);frame(14,5,5,14);frame(5,9,10,10);
    for(const x of [1,4,14,17])box(x,2,2,4,'X');
    box(6,7,3,3,'A');box(11,7,3,3,'A');frame(8,13,4,6,'X');
    for(const x of [3,16])box(x,8,1,3,'F');
    box(6,11,8,1,'F');
  }),
  factory:draw(({frame,box})=>{
    frame(1,8,18,11);frame(3,1,4,8);frame(12,3,4,6);
    box(4,2,2,3,'R');box(13,4,2,2,'R');
    for(const x of [3,8,13])frame(x,11,4,4,'F');
    frame(7,16,5,3,'X');
  }),

  bear:animal('bear'),fox:animal('fox'),deer:animal('deer'),owl:animal('owl'),
  squirrel:animal('squirrel'),bird:animal('bird'),raccoon:animal('raccoon'),mouse:animal('mouse'),
  temple:building('temple'),library:building('library'),school:building('school'),
  tower:building('tower'),gate:building('gate'),windmill:building('mill'),
  cottage:building('house'),observatory:building('dome'),
  stump:draw(({frame,box})=>{frame(3,8,14,10);frame(2,5,16,5,'F');frame(6,6,8,2,'A');box(7,12,2,5,'X');}),
  acorn:draw(({frame,box})=>{box(9,2,2,3,'X');frame(4,5,12,4,'A');frame(6,9,8,7);box(8,16,4,2,'X');}),
  paw:draw(({box,frame})=>{for(const [x,y] of [[2,6],[6,2],[12,2],[16,6]])frame(x,y,3,4,'A');frame(6,10,8,6,'F');box(4,13,12,3,'F');}),
  leaf:draw(({line,box})=>{for(let i=0;i<7;i++)box(3+i,11-i,8-i,3,'B');line(3,16,15,4,'X');line(8,11,8,6,'F');}),
  fern:draw(({line})=>{line(10,2,10,18);for(let y=4;y<15;y+=3){line(10,y+3,3,y,'B');line(10,y+3,17,y,'B');}}),
  nest:draw(({frame,box})=>{frame(2,10,16,7);frame(5,6,4,6,'F');frame(10,5,4,7,'F');box(4,13,12,2,'A');}),
  cake:draw(({frame,box})=>{frame(2,9,16,9);frame(5,4,10,5,'F');box(3,12,14,2,'F');box(3,16,14,1,'A');box(9,0,2,4,'A');}),
  sweetHouse:draw(({frame,box})=>{for(let y=0;y<6;y++)box(1+y,7-y,18-y*2,1,'A');frame(3,8,14,10,'F');frame(8,12,4,6);for(const x of [4,13])frame(x,10,3,3,'A');}),
  parfait:draw(({frame,box,line})=>{frame(4,6,12,5,'F');frame(6,11,8,4,'A');box(9,15,2,3,'X');box(6,18,8,1,'X');box(6,3,8,3,'F');box(9,1,3,3,'A');line(14,7,17,1);}),
  cookie:draw(({frame,box})=>{frame(4,3,12,14,'A');box(2,6,2,8,'A');box(16,6,2,8,'A');for(const [x,y] of [[6,5],[11,8],[5,11],[10,14]])box(x,y,2,2,'X');}),
  pudding:draw(({frame,box})=>{frame(6,4,8,4,'A');frame(4,8,12,8,'F');box(2,16,16,2,'X');box(6,8,8,2,'A');}),
  macaron:draw(({frame,box})=>{frame(3,6,14,8,'A');box(2,10,16,2,'F');box(5,4,10,2,'A');box(5,14,10,2,'A');}),
  icecream:draw(({frame,box})=>{frame(5,2,10,8,'F');frame(3,5,5,7,'A');frame(12,5,5,7,'A');for(let y=12;y<19;y++)box(5+(y-12)/2|0,y,10-(y-12),1,'B');}),
  chocolate:draw(({frame})=>{frame(2,3,16,14,'A');for(let y=4;y<16;y+=4)for(let x=3;x<17;x+=4)frame(x,y,3,3,'B');}),
  lollipop:draw(({frame,box})=>{frame(4,1,12,12,'A');frame(7,4,6,6,'F');box(9,13,2,6,'X');}),
  biscuit:draw(({frame,box})=>{frame(2,5,16,10,'F');for(let y=7;y<14;y+=3)for(let x=5;x<16;x+=4)box(x,y,1,1,'A');}),
  cherry:draw(({frame,line})=>{line(5,9,11,2,'B');line(14,10,11,2,'B');frame(2,9,7,7,'A');frame(11,10,7,7,'A');}),
  sugar:draw(({frame,box})=>{frame(4,4,12,12,'F');box(6,6,2,2,'A');box(12,12,2,2,'B');}),
  spoon:draw(({frame,box})=>{frame(7,1,6,8,'F');box(9,9,2,10,'X');}),
  triceratops:draw(({frame,box})=>{frame(1,9,12,7);frame(11,5,7,10,'F');box(16,3,2,5,'A');box(18,9,2,2,'A');box(2,16,3,3,'X');box(10,16,3,3,'X');box(15,8,1,2,'X');}),
  pterosaur:draw(({box,line})=>{line(2,3,9,13);line(18,3,10,13);line(2,3,2,10);line(18,3,18,10);line(2,10,9,9,'B');line(18,10,10,9,'B');box(9,7,3,8,'X');box(11,5,4,2,'A');}),
  egg:draw(({frame,box})=>{frame(6,2,8,15,'F');box(4,7,12,8,'F');box(7,5,3,3,'A');box(11,12,3,3,'B');}),
  bone:draw(({frame,box})=>{frame(2,5,5,5,'F');frame(2,11,5,5,'F');frame(6,8,8,5,'F');frame(13,5,5,5,'F');frame(13,11,5,5,'F');box(5,9,10,3,'F');}),
  ammonite:draw(({frame,box})=>{frame(3,3,14,14,'F');frame(6,5,9,9,'A');frame(8,7,5,5);box(10,9,2,2,'X');}),
  footprint:draw(({box,line})=>{line(6,2,8,10);line(13,2,12,10);line(17,6,12,12);box(6,10,8,7,'A');}),
  lava:draw(({line,box})=>{for(let y=3;y<18;y+=5){line(2,y,9,y+3,'A');line(9,y+3,17,y,'A');}box(4,13,2,2,'X');}),
  rock:draw(({frame,box})=>{frame(4,5,12,11);box(2,10,16,6,'B');box(6,3,7,3,'X');box(6,6,4,2,'F');}),
  cliff:draw(({frame,box})=>{frame(2,3,16,15);box(3,4,14,3,'F');box(7,8,2,9,'X');box(13,9,2,8,'X');}),
  jaw:draw(({frame,box})=>{frame(2,7,16,8,'F');box(3,8,13,3,'X');for(let x=4;x<17;x+=4)box(x,8,2,2,'F');}),
  palm:draw(({box,line})=>{box(9,7,3,12,'X');for(const x of [1,5,15,19])line(10,5,x,10,'B');line(10,5,10,1,'B');}),
  arm:draw(({frame,box})=>{frame(2,15,8,4);frame(5,8,4,8,'A');frame(8,6,8,4);frame(14,7,4,7,'A');box(12,12,2,3,'X');}),
  engine:draw(({frame,box})=>{frame(2,7,16,9);frame(4,2,4,6,'A');frame(10,4,5,4,'F');for(const x of [4,13])frame(x,15,4,4,'X');}),
  conveyor:draw(({frame,box})=>{frame(1,10,18,5);for(let x=3;x<18;x+=4)box(x,12,2,2,'X');frame(4,5,6,5,'A');box(3,15,2,4,'X');box(15,15,2,4,'X');}),
  pipe:draw(({frame,box})=>{frame(2,3,14,5);frame(11,7,5,11);box(0,2,4,7,'A');box(10,15,7,4,'A');}),
  meter:draw(({frame,box,line})=>{frame(3,3,14,14,'F');box(4,13,12,3,'A');line(9,12,13,6);box(5,6,2,2,'B');}),
  bolt:draw(({frame,box})=>{frame(5,2,10,5,'F');box(8,7,4,10,'X');for(let y=9;y<18;y+=3)box(7,y,6,1,'A');}),
  spring:draw(({line})=>{for(let y=2;y<16;y+=4){line(4,y,15,y+2,'F');line(15,y+2,4,y+4,'X');}}),
  switch:draw(({frame,box})=>{frame(3,5,14,13);frame(7,3,6,10,'A');box(8,14,4,2,'F');}),
  nut:draw(({frame,box})=>{frame(4,3,12,14,'F');frame(7,7,6,6,'X');box(2,6,2,8,'A');box(16,6,2,8,'A');}),
  valve:draw(({frame,box})=>{frame(3,3,14,10,'A');box(9,4,2,7,'X');box(4,7,12,2,'X');frame(7,13,6,5);}),
  piston:draw(({frame,box})=>{frame(4,2,12,7);frame(8,9,4,8,'F');box(5,16,10,2,'X');}),
  tablet:draw(({frame,box})=>{frame(3,2,14,16,'F');for(let y=5;y<16;y+=4){box(5,y,3,1,'A');box(10,y,5,1,'X');}box(6,12,2,3,'X');}),
  obelisk:draw(({box,frame})=>{box(9,1,2,2,'X');box(7,3,6,2,'A');frame(7,5,6,12,'F');box(5,17,10,2,'X');box(9,7,1,7,'A');}),
  altar:draw(({frame,box})=>{frame(2,6,16,4,'F');frame(5,10,10,7);box(1,17,18,2,'X');box(9,2,2,4,'A');}),
  statue:draw(({frame,box})=>{frame(7,1,6,6,'F');frame(5,7,10,9);box(8,8,4,6,'F');frame(3,16,14,3,'A');}),
  mosaic:draw(({frame})=>{frame(2,2,16,16,'F');for(const [x,y]of [[5,5],[11,5],[8,11]])frame(x,y,4,4,'A');}),
  shard:draw(({line,box})=>{line(5,3,15,8);line(15,8,10,18);line(10,18,5,3);box(7,6,4,6,'A');}),
  scroll:draw(({frame,box,line})=>{frame(4,3,12,14,'F');frame(2,2,4,5,'A');frame(14,13,4,5,'A');for(let y=6;y<14;y+=3)line(7,y,12,y,'X');}),
  scarab:draw(({frame,box})=>{frame(5,5,10,12,'A');frame(8,2,4,4);box(9,6,2,10,'X');for(let y=7;y<16;y+=4){box(2,y,3,1,'X');box(15,y,3,1,'X');}}),
  chest:draw(({frame,box})=>{frame(2,5,16,12);box(3,10,14,2,'A');frame(8,9,4,5,'F');box(4,6,2,10,'A');box(14,6,2,10,'A');}),
  stairs:draw(({box})=>{for(let i=0;i<5;i++){box(2+i*3,16-i*3,16-i*3,3,'X');box(3+i*3,16-i*3,14-i*3,1,'F');}}),
  portcullis:draw(({frame,line})=>{frame(2,2,16,17,'A');for(let x=5;x<16;x+=4)line(x,4,x,18);for(let y=7;y<16;y+=4)line(3,y,16,y);}),
  chain:draw(({frame})=>{for(let y=1;y<16;y+=5)frame(7,y,6,7,'F');}),
  lock:draw(({frame,box})=>{frame(6,2,8,10,'F');frame(3,9,14,9,'A');box(9,12,2,4,'X');}),
  brick:draw(({frame,box})=>{frame(2,5,16,10);box(3,10,14,1,'X');box(8,6,1,4,'X');box(12,11,1,3,'X');}),
  arrow:draw(({line,box})=>{line(3,6,15,6,'A');line(15,6,11,2,'A');line(15,6,11,10,'A');box(4,6,2,11,'B');}),
  skull:draw(({frame,box})=>{frame(4,3,12,11,'F');frame(7,14,6,3,'F');box(6,6,3,3,'X');box(11,6,3,3,'X');}),
  crystalTower:draw(({frame,box})=>{frame(7,4,6,14,'F');box(8,1,4,3,'A');box(5,7,2,10,'A');box(13,7,2,10,'A');box(4,17,12,2,'X');}),
  glass:draw(({frame,box})=>{frame(4,2,12,16,'F');box(6,4,2,10,'A');box(12,7,2,8,'B');}),
  diamond:draw(({line,box})=>{for(let y=1;y<10;y++)box(10-y,y,y*2,1,'A');for(let y=10;y<19;y++)box(y-8,y,(19-y)*2,1,'F');line(10,2,10,17);}),
  sun:draw(({frame,line})=>{frame(6,6,8,8,'A');for(const [x,y]of [[10,0],[19,10],[10,19],[0,10],[2,2],[17,2],[2,17],[17,17]])line(x,y,Math.round((x+10)/2),Math.round((y+10)/2),'A');}),
  shadowTree:draw(({frame,box,line})=>{frame(5,3,10,10);box(3,6,14,5,'B');box(9,12,2,6,'X');line(10,10,5,7,'X');}),
  lightTower:draw(({frame,box})=>{frame(7,7,6,12,'F');frame(4,3,12,5,'A');box(6,0,8,3,'F');box(8,8,2,8,'A');}),
  shadowTower:draw(({frame,box})=>{frame(5,5,10,14);box(3,3,14,3,'X');box(6,1,2,4,'X');box(12,1,2,4,'X');frame(8,9,4,6,'A');}),
  sundial:draw(({frame,line})=>{frame(2,6,16,10,'F');line(10,14,10,2,'X');line(10,2,16,12,'X');}),
  star:draw(({box})=>{box(9,2,2,16,'A');box(2,9,16,2,'A');box(6,6,8,8,'A');box(8,8,4,4,'F');}),
  comet:draw(({frame,line})=>{frame(2,11,7,7,'F');line(8,12,17,2,'A');line(9,14,19,6,'A');}),
  astrolabe:draw(({frame,box,line})=>{frame(3,2,14,14,'A');box(5,4,10,10,'.');line(3,14,16,2,'X');box(8,16,4,2,'X');box(5,18,10,1,'X');}),
  chart:draw(({frame,line})=>{frame(2,3,16,14,'F');line(5,7,9,11,'B');line(9,11,14,6,'B');for(const[x,y]of[[5,7],[9,11],[14,6]])frame(x-1,y-1,3,3,'A');}),
  bridge:draw(({frame,box})=>{frame(1,6,18,4);for(const x of [2,8,14])box(x,10,2,7,'X');box(2,3,1,4,'X');box(17,3,1,4,'X');}),
  flowers:draw(({box})=>{for(const [x,y] of [[4,5],[12,9],[6,14]]){box(x+1,y-2,2,6,'A');box(x-1,y,6,2,'A');box(x+1,y,2,2,'F');box(x+1,y+4,1,3,'B');}}),
  log:draw(({frame,box})=>{frame(2,7,16,7);frame(13,6,5,9,'F');box(15,9,1,4,'A');}),
  cloud:draw(({frame,box})=>{frame(5,3,10,8,'F');frame(1,7,18,7,'F');box(3,9,14,3,'F');}),
  clockTower:draw(({frame,box})=>{frame(6,5,8,13,'F');frame(6,5,8,7,'A');box(9,7,1,4,'X');box(10,10,2,1,'X');for(let y=0;y<5;y++)box(5+y,y+4,10-y*2,1,'B');}),
  globe:draw(({frame,box,line})=>{frame(4,2,12,12,'F');line(6,3,13,12,'B');box(5,6,4,3,'A');box(11,8,3,3,'A');box(9,14,2,4,'X');box(5,18,10,1,'X');}),
  blackboard:draw(({frame,box,line})=>{frame(1,3,18,12);box(3,5,14,8,'X');line(5,7,9,7,'F');line(5,10,13,10,'F');box(3,15,2,4,'A');box(15,15,2,4,'A');}),
  quill:draw(({box,line})=>{for(let y=2;y<15;y++)box(8+(y%3),y,5,1,'F');line(5,18,14,2,'X');}),
  inkpot:draw(({frame,box})=>{frame(5,8,10,10);box(7,5,6,3,'X');box(7,10,6,3,'A');}),
  wand:draw(({line,box})=>{line(3,18,14,5,'X');line(4,18,15,5,'F');box(12,2,6,3,'A');box(14,0,2,7,'A');}),
  flask:draw(({frame,box})=>{frame(8,1,4,9,'F');frame(4,10,12,8,'F');box(5,13,10,4,'A');box(7,1,6,2,'X');}),
  cauldron:draw(({frame,box})=>{frame(3,7,14,10);box(1,6,18,3,'X');box(5,8,10,2,'A');box(4,17,3,2,'X');box(13,17,3,2,'X');}),
  broom:draw(({box,line})=>{line(13,1,7,12);for(let x=3;x<13;x+=2)line(8,10,x,18,'A');box(6,10,5,2,'X');}),
  rune:draw(({line})=>{line(6,2,6,18,'A');line(6,2,14,7,'A');line(14,7,6,11,'A');line(6,10,14,17,'A');}),
  potion:draw(({frame,box})=>{frame(7,2,6,5);frame(5,7,10,11,'F');box(6,12,8,5,'A');box(7,2,6,2,'A');}),
  throne:draw(({frame,box})=>{frame(5,2,10,14,'A');frame(3,10,14,5);box(4,15,3,4,'X');box(13,15,3,4,'X');box(8,5,4,6,'F');}),
  flag:draw(({box,line})=>{box(4,1,2,18,'X');box(6,2,12,7,'A');box(15,7,3,3,'A');line(4,18,10,18);}),
  sword:draw(({box,line})=>{box(9,1,2,12,'F');box(7,3,2,8,'F');box(6,12,8,2,'A');box(9,14,2,5,'X');}),
  wall:draw(({frame,box})=>{frame(1,5,18,14);for(let x=2;x<19;x+=5)box(x,2,3,4,'X');for(let y=9;y<18;y+=4)box(2,y,16,1,'X');box(7,6,1,3,'X');box(12,10,1,3,'X');}),
  carriage:draw(({frame,box})=>{frame(4,3,12,11,'A');frame(6,5,8,6,'F');box(2,13,16,2,'X');for(const x of [3,13])frame(x,14,4,4,'X');}),
  helmet:draw(({frame,box})=>{frame(4,3,12,13,'F');box(9,2,2,14,'A');box(5,9,10,3,'X');}),
  ufo:draw(({frame,box})=>{frame(7,3,6,5,'F');frame(2,8,16,6);box(4,14,12,2,'A');for(const x of[4,9,14])box(x,10,2,2,'A');}),
  station:draw(({frame,box})=>{frame(7,4,6,12,'F');frame(0,7,6,6,'A');frame(14,7,6,6,'A');box(6,9,8,2,'X');box(9,1,2,3,'X');}),
  base:draw(({frame,box})=>{frame(2,8,16,10,'F');frame(5,4,10,4);frame(8,11,4,7,'X');box(10,1,1,3,'X');}),
  meteor:draw(({frame,box})=>{frame(4,4,12,12);box(5,5,4,3,'F');frame(10,10,4,4,'X');box(3,8,2,4,'A');}),
  antenna:draw(({line,frame})=>{line(9,7,9,18);line(3,3,9,10,'F');line(15,3,9,10,'F');line(3,3,15,3);frame(8,1,3,3,'A');line(5,18,14,18);}),
  capsule:draw(({frame,box})=>{frame(5,4,10,12,'F');frame(7,1,6,3,'A');box(7,6,6,4,'A');box(6,16,8,2,'X');}),
  crater:draw(({frame,box})=>{frame(2,6,16,9);frame(5,8,10,5,'X');box(5,7,10,1,'F');}),
  ribbon:draw(({frame,box})=>{frame(2,4,6,10,'A');frame(12,4,6,10,'A');frame(8,7,4,4,'F');box(7,11,2,6,'A');box(11,11,2,6,'A');}),
  cushion:draw(({frame,box})=>{frame(2,4,16,12,'F');box(4,6,12,8,'A');box(8,9,4,2,'F');}),
  button:draw(({frame,box})=>{frame(3,3,14,14,'A');for(const x of[6,11])for(const y of[6,11])box(x,y,2,2,'X');}),
  spool:draw(({frame,box})=>{frame(5,4,10,12,'F');box(3,2,14,3,'A');box(3,15,14,3,'A');for(let y=6;y<15;y+=3)box(6,y,8,1,'B');}),
  patch:draw(({frame,box})=>{frame(3,3,14,14,'A');for(let x=5;x<16;x+=4){box(x,4,1,2,'F');box(x,14,1,2,'F');}for(let y=6;y<14;y+=4){box(4,y,2,1,'F');box(14,y,2,1,'F');}}),
  car:draw(({frame,box})=>{frame(5,5,10,6,'A');frame(1,11,18,5);box(6,6,4,4,'F');box(11,6,3,4,'F');for(const x of[3,13])frame(x,15,4,4,'X');}),
  train:draw(({frame,box})=>{frame(2,7,16,9,'A');frame(10,2,7,6);box(11,3,5,4,'F');frame(4,2,3,5);for(const x of[3,9,15])frame(x,15,3,3,'X');}),
  ball:draw(({frame,box})=>{frame(4,3,12,14,'A');box(9,4,2,12,'F');box(5,9,10,2,'B');}),
  top:draw(({box,frame})=>{frame(8,2,4,5,'F');for(let y=7;y<13;y++)box(y-5,y,30-y*2,1,'A');box(9,13,2,5,'X');}),
  puzzle:draw(({frame,box})=>{frame(3,4,14,13,'A');box(8,5,3,11,'F');box(4,9,12,3,'F');}),
  drum:draw(({frame,box,line})=>{frame(2,5,16,12,'A');box(3,6,14,3,'F');line(3,10,16,15,'F');line(16,10,3,15,'F');}),
  boat:draw(({box,line})=>{box(2,13,16,3,'B');box(4,16,12,2,'X');line(9,1,9,13);for(let y=3;y<12;y++)box(10,y,y-2,1,'F');}),
  blocks:draw(({frame})=>{frame(1,11,9,8,'A');frame(10,6,9,13);frame(2,3,7,7,'F');}),
  rail:draw(({box})=>{box(3,2,2,16,'X');box(15,2,2,16,'X');for(let y=4;y<17;y+=4)box(1,y,18,2,'A');}),
  kendama:draw(({frame,box,line})=>{frame(7,1,7,7,'A');box(9,8,3,10,'B');box(4,9,13,3,'X');line(7,5,2,15);}),
} as const;

export const ISLAND_SPRITES = {...legacySprites,...additions};
export type IslandSpriteId = keyof typeof ISLAND_SPRITES;

export type PixelRun = {x:number;y:number;width:number;color:string};
export function pixelRuns(rows:readonly string[]):PixelRun[] {
  const runs:PixelRun[]=[];
  rows.forEach((row,y)=>{
    for(let x=0;x<row.length;) {
      const color=row[x];
      let end=x+1;
      while(end<row.length&&row[end]===color)end++;
      if(color!=='.')runs.push({x,y,width:end-x,color});
      x=end;
    }
  });
  return runs;
}
export const ISLAND_SPRITE_RUNS=Object.fromEntries(Object.entries(ISLAND_SPRITES)
  .map(([name,rows])=>[name,pixelRuns(rows)])) as Record<IslandSpriteId,PixelRun[]>;
