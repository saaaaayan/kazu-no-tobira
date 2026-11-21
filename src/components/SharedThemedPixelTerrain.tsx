import {useMemo} from 'react';
import Svg,{G,Rect,Path} from 'react-native-svg';
import type {WorldGrade} from '../domain/worldCatalog';
import {ISLAND_PIXEL_PALETTES,type StandardPixelIslandId} from '../domain/standardPixelIslandMap';
import {preschoolDecorationLayout} from '../domain/preschoolDecorLayout';
import {islandRouteByKind,routeThrough} from '../domain/worldMapLayout';

/** Small pixel silhouettes, never emoji. X=ink, B=body, A=accent, F=light.
 * The palette, land bands and set of landmarks differ for every island.
 */
const ICON_ROWS={
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
type IconKind=keyof typeof ICON_ROWS;
type PixelRun={x:number;y:number;w:number;value:string};
function compileIcon(lines:readonly string[]):PixelRun[]{
  const out:PixelRun[]=[];
  for(let y=0;y<lines.length;y++){
    const line=lines[y];
    for(let x=0;x<line.length;){
      const value=line[x];
      if(value==='.'||value===' '){x++;continue;}
      let end=x+1;
      while(end<line.length&&line[end]===value)end++;
      out.push({x,y,w:end-x,value});
      x=end;
    }
  }
  return out;
}
const ICON_RUNS=Object.fromEntries(Object.entries(ICON_ROWS).map(([name,lines])=>
  [name,compileIcon(lines)])) as Record<IconKind,PixelRun[]>;

function Landmark({kind,x,y,scale,color,accent,light,ink}:{
  kind:IconKind;x:number;y:number;scale:number;
  color:string;accent:string;light:string;ink:string;
}){
  const pixels=ICON_RUNS[kind];
  const source=ICON_ROWS[kind],width=Math.max(...source.map(row=>row.length));
  const unit=3;
  return <G transform={`translate(${x-width*unit*scale/2} ${y-16*scale}) scale(${scale})`}>
    {pixels.map((p,i)=><Rect key={i} x={p.x*unit} y={p.y*unit}
      width={p.w*unit+.12} height={unit+.12}
      fill={p.value==='X'?ink:p.value==='B'?color:p.value==='A'?accent:light}/>)}
  </G>;
}

/** Shared map silhouette and routes. Uses the preschool layout's geometry,
 * exclusion rectangles, scattered ornament positions, and accessible overlay.
 * No independent per-island route layout exists.
 */
export function SharedThemedPixelTerrain({width,height,positions,grade,next}:{
  width:number;height:number;positions:readonly {x:number;y:number}[];
  grade:WorldGrade;next:number;
}){
  const theme=ISLAND_PIXEL_PALETTES[grade.id as StandardPixelIslandId];
  const routes=islandRouteByKind(grade.stages,positions.map((p,order)=>({
    ...p,order,row:Math.floor(order/5),column:order%5,
  })));
  const ornaments=useMemo(()=>preschoolDecorationLayout(width,height,positions),
    [width,height,positions.length,positions[0]?.y,positions[positions.length-1]?.y]);
  // The preschool and grade-one legacy art retain their exact appearance;
  // only other themes enter this shared parameterised renderer.
  const types=theme.motifs as readonly string[];
  return <Svg testID={'all-16-island-pixel-themes-v1-'+grade.id}
    width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="none" accessible={false}>
    <Rect width={width} height={height} fill={theme.water}/>
    <Rect x={10} y={10} width={width-20} height={height-20} rx={9}
      fill={theme.land} stroke={theme.shore} strokeWidth={7}/>
    <Rect x={18} y={18} width={width-36} height={height-36} rx={3}
      fill="none" stroke={theme.stripe} strokeWidth={2}/>
    {Array.from({length:13},(_,row)=>{
      const y=positions[row*5].y;
      return <G key={row}>
        <Rect x={26} y={y-50} width={width-52} height={75}
          fill={row<10?(row%2===0?theme.bandA:theme.bandB):
            row<12?theme.trialBand:theme.legendBand}/>
        <Rect x={24} y={y+53} width={width-48} height={6}
          fill={theme.stripe}/>
      </G>;
    })}
    {/* Organic, collision-checked icon scatter. Every category has an
        actual themed silhouette and never covers route/pin/name/sign. */}
    {ornaments.map((item,i)=>{
      if(item.kind==='flower'){
        return <G key={'texture-'+i}>
          <Rect x={item.x-3*item.scale} y={item.y-4*item.scale}
            width={6*item.scale} height={6*item.scale} fill={theme.accent}/>
          <Rect x={item.x-1.5*item.scale} y={item.y-2*item.scale}
            width={3*item.scale} height={3*item.scale} fill={theme.paper}/>
        </G>;
      }
      const index=item.kind==='blocks'?(i+1)%types.length:i%types.length;
      const kind=types[index] as IconKind;
      return <Landmark key={'landmark-'+i} kind={kind} x={item.x} y={item.y}
        scale={item.scale*(item.kind==='blocks'?.75:1)}
        color={theme.stripe} accent={theme.accent} light={theme.paper} ink={theme.ink}/>;
    })}
    {[50,60].map((order,index)=><Rect key={order} x={24} y={positions[order].y-65}
      width={width-48} height={4} fill={index===0?theme.trialBand:theme.legendBand}/>)}
    <Path d={routeThrough(routes.normal)} fill="none" stroke={theme.pathBorder}
      strokeWidth={12} strokeLinejoin="miter"/>
    <Path d={routeThrough(routes.normal)} fill="none" stroke={theme.path}
      strokeWidth={8} strokeLinejoin="miter"/>
    <Path d={routeThrough(routes.normal)} fill="none" stroke={theme.paper}
      strokeWidth={2} strokeDasharray="5 8"/>
    <Path d={routeThrough(routes.extra)} fill="none" stroke={theme.pathBorder} strokeWidth={10}/>
    <Path d={routeThrough(routes.extra)} fill="none" stroke={theme.paper}
      strokeWidth={3} strokeDasharray="5 8"/>
    <Path d={routeThrough(routes.secret)} fill="none" stroke={theme.accent} strokeWidth={10}/>
    <Path d={routeThrough(routes.secret)} fill="none" stroke={theme.paper}
      strokeWidth={3} strokeDasharray="5 8"/>
    {next>=0&&<Rect x={positions[next].x-29} y={positions[next].y-29}
      width={58} height={58} fill="none" stroke={theme.accent} strokeWidth={2}/>}
  </Svg>;
}

/** Tiny symmetrical map-title emblems. These are SVG pixel icons, not emoji. */
export function IslandThemeStamp({id,compact=false,flipped=false}:{
  id:string;compact?:boolean;flipped?:boolean;
}){
  const theme=ISLAND_PIXEL_PALETTES[id as StandardPixelIslandId];
  const kind=theme.motifs[0] as IconKind;
  return <Svg testID={'island-stamp-'+id+(flipped?'-right':'-left')}
    width={compact?17:23} height={compact?17:23} viewBox="0 0 32 32" accessible={false}>
    <G transform={flipped?'translate(32 0) scale(-1 1)':undefined}>
      <Landmark kind={kind} x={16} y={21} scale={0.76}
        color={theme.stripe} accent={theme.accent} light={theme.paper} ink={theme.ink}/>
    </G>
  </Svg>;
}
