import {WILDLIFE_COLORS} from '../domain/wildlifePixelSprites';
import {useMemo} from 'react';
import Svg,{G,Rect,Path} from 'react-native-svg';
import type {WorldGrade} from '../domain/worldCatalog';
import {ISLAND_PIXEL_PALETTES,type StandardPixelIslandId,type IslandPixelPalette} from '../domain/standardPixelIslandMap';
import {islandScenery,type GroundDecoration,type IslandScene} from '../domain/islandScenery';
import {ISLAND_ART_SETS} from '../domain/islandArtSets';
import {ISLAND_SPRITES,ISLAND_SPRITE_RUNS,type IslandSpriteId} from '../domain/islandPixelSprites';
import {islandRouteByKind,routeThrough} from '../domain/worldMapLayout';

export function PixelLandmark({kind,x,y,width,height,theme}:{
  kind:IslandSpriteId;x:number;y:number;width:number;height:number;theme:IslandPixelPalette;
}) {
  const rows=ISLAND_SPRITES[kind];
  const sourceWidth=Math.max(...rows.map(row=>row.length));
  const pixel=Math.min(width/sourceWidth,height/rows.length);
  const colors:Record<string,string>={X:theme.ink,B:theme.stripe,A:theme.accent,F:theme.paper,R:'#b36d59',...WILDLIFE_COLORS[kind]};
  return <G transform={'translate('+x+' '+y+') scale('+pixel+')'}>
    {ISLAND_SPRITE_RUNS[kind].map((run,index)=><Rect key={index}
      x={run.x} y={run.y} width={run.width} height={1} fill={colors[run.color]}/>)}
  </G>;
}

export function GroundTile({item,theme}:{item:GroundDecoration;theme:IslandPixelPalette}) {
  const {kind,variant}=item;
  const family=Object.entries(ISLAND_ART_SETS).find(([,art])=>
    (art.ground as readonly string[]).includes(kind))?.[0];
  const rectangle=(x:number,y:number,w:number,h:number,color:string=theme.stripe)=>
    <Rect x={x} y={y} width={w} height={h} fill={color}/>;
  let drawing;
  switch(family) {
    case 'preschool':
      drawing=kind==='stitches'?<Path d="M1 3H4M7 3H10M13 3H16M3 1V5M10 1V5" stroke={theme.ink} strokeWidth={.6}/>
        :kind==='buttons'?<><Rect x={4} y={3} width={10} height={10} fill={theme.accent}/>{rectangle(6,5,2,2,theme.paper)}{rectangle(10,9,2,2,theme.paper)}</>
        :kind==='patchwork'?<><Rect x={1} y={2} width={15} height={12} fill={theme.accent}/><Path d="M3 3H15V12H3Z" fill="none" stroke={theme.paper} strokeDasharray="2 2"/></>
        :<Path d="M1 3H17M1 8H17M1 13H17M4 0V16M10 0V16M16 0V16" stroke={theme.stripe} strokeWidth={1}/>;
      break;
    case 'e1':
      drawing=kind==='rails'?<><Path d="M3 0V16M13 0V16" stroke={theme.ink} strokeWidth={1}/><Path d="M1 2H15M1 7H15M1 12H15" stroke={theme.accent} strokeWidth={2}/></>
        :kind==='blocks'?<>{rectangle(1,6,7,9)}{rectangle(9,2,7,13,theme.accent)}{rectangle(2,4,4,2,theme.paper)}{rectangle(11,0,3,2,theme.paper)}</>
        :kind==='woodgrain'?<Path d="M1 3H17M1 8H17M1 13H17M5 4H8V6H5Z" stroke={theme.stripe} fill="none"/>
        :<Path d="M1 1H7V7H1ZM9 9H16V16H9Z" stroke={theme.accent} fill="none"/>;
      break;
    case 'e2':
      drawing=<>
        <Path d="M2 3H7V1H13V3H17V12H14V16H5V14H1V7H2Z"
          fill={kind==='forestGlade'?'#b7bf98':kind==='forestLeafLitter'?'#9ca77d':'#809c79'}/>
        {kind==='forestGrove'?<>
          <Path d="M3 10H6V14H3ZM11 8H14V13H11Z" fill="#806e52"/>
          <Path d="M1 7H3V4H7V6H9V10H2ZM9 4H11V2H15V5H17V8H10Z" fill="#597c58"/>
          <Path d="M3 5H6M11 3H14" stroke="#91aa7b" strokeWidth={1.2}/>
        </>:kind==='forestGrass'?<Path d="M3 12V8L5 11L7 7M10 13V9L12 12L14 8"
          stroke="#4f7955" strokeWidth={1} fill="none"/>
        :kind==='forestLeafLitter'?<>
          <Path d="M3 6L7 4L6 8ZM10 12L15 9L14 14Z" fill="#b9a674"/>
          <Path d="M5 12L10 14M10 4L13 6" stroke="#687d55" strokeWidth={.8}/>
        </>:<Path d="M3 9H6M11 7H14M8 13H11" stroke="#d1d3ab" strokeWidth={.8}/>}
      </>;
      break;
    case 'h2':
      drawing=kind==='river'||kind==='lake'?<><Path d="M0 5H3V2H12V4H17V12H13V15H3V12H0Z" fill={theme.water}/><Path d="M3 8H8M10 11H14" stroke={theme.paper} strokeWidth={.7}/></>
        :kind==='mountainRidges'?<Path d="M1 14L6 4L11 14M8 14L13 2L18 14" stroke={theme.stripe} strokeWidth={2} fill="none"/>
        :kind==='roots'?<Path d="M8 0V6H3V10H0M8 6H14V12H18M8 6V16" stroke={theme.accent} strokeWidth={1.5} fill="none"/>
        :<Path d={variant%2?'M1 8V4L4 7V2M10 13V9L13 12V7':'M2 6L7 3L6 8ZM10 12L15 8L14 14Z'} stroke={theme.stripe} strokeWidth={1.2} fill="none"/>;
      break;
    case 'e3':
      drawing=kind==='chocolateTiles'?<><Rect x={1} y={1} width={16} height={14} fill={theme.ink} opacity={.4}/><Path d="M2 2H16M2 8H16M6 1V15M12 1V15" stroke={theme.accent} strokeWidth={2}/></>
        :kind==='wafer'?<Path d="M1 3H17M1 7H17M1 11H17M3 1V15M7 1V15M11 1V15M15 1V15" stroke={theme.accent} strokeWidth={.8}/>
        :kind==='icing'?<Path d="M1 3H17V6H14V9H11V6H8V10H5V6H1Z" fill={theme.paper}/>
        :<>{rectangle(2,3,2,2,theme.accent)}{rectangle(10,9,3,2,theme.ink)}{rectangle(6,13,2,2,theme.paper)}</>;
      break;
    case 'e4':
      drawing=<>
        <Path d="M2 2H12V4H17V12H14V16H4V14H1V6H2Z"
          fill={kind==='prehistoricFernBed'?'#8d9b73':kind==='prehistoricRocks'?'#9e9279':'#ae956e'}/>
        {kind==='prehistoricLava'?<>
          <Path d="M3 1V5H8V10H13V17" stroke="#796851" strokeWidth={4} fill="none"/>
          <Path d="M3 1V5H8V10H13V17" stroke="#b47956" strokeWidth={1.5} fill="none"/>
        </>:kind==='prehistoricFossils'?<>
          <Path d="M4 11L13 6M6 10L7 14M9 8L10 12M12 6L13 10"
            stroke="#ddd0a6" strokeWidth={1.5} fill="none"/>
          <Path d="M2 4H5M13 13H16" stroke="#877557" strokeWidth={1}/>
        </>:kind==='prehistoricFernBed'?<Path d="M8 15V4M8 7L3 4M8 7L13 4M8 11L2 7M8 11L14 7M8 14L3 11M8 14L13 11"
          stroke="#5c7c53" strokeWidth={1.2} fill="none"/>
        :<>
          <Path d="M3 12V6H8V12ZM11 14V10H16V14Z" fill="#7f7867"/>
          <Path d="M4 6H7M12 10H15" stroke="#d0c39d" strokeWidth={1}/>
        </>}
      </>;
      break;
    case 'e5':
      drawing=kind==='pipelines'?<><Path d="M0 3H10V12H18" stroke={theme.ink} strokeWidth={5} fill="none"/><Path d="M0 3H10V12H18" stroke={theme.paper} strokeWidth={2} fill="none"/></>
        :kind==='circuit'?<Path d="M1 1H7V8H15V14H18M1 6H4V14H10" stroke={theme.accent} strokeWidth={1} fill="none"/>
        :kind==='rivets'?<>{[2,12].flatMap(x=>[2,12].map(y=><Rect key={x+':'+y} x={x} y={y} width={3} height={3} fill={theme.paper}/>))}</>
        :<><Rect x={1} y={1} width={16} height={14} fill={theme.stripe}/><Path d="M2 3H15M3 2V13M15 3V13" stroke={theme.paper} strokeWidth={1}/></>;
      break;
    case 'e6':
      drawing=kind==='hieroglyphs'?<Path d="M2 2V13M2 3H6V7H2M10 2H15L12 6V13M10 10H15" stroke={theme.accent} strokeWidth={1.4} fill="none"/>
        :kind==='mosaicTiles'?<Path d="M1 1H8V8H1ZM10 10H17V17H10ZM10 1H17V8H10Z" fill={theme.accent} opacity={.6}/>
        :kind==='sandRipples'?<Path d="M1 3H8V5H16M1 8H8V10H16M1 13H8V15H16" stroke={theme.stripe} fill="none"/>
        :<Path d="M0 1H18V16H0ZM0 8H18M7 1V8M12 8V16" stroke={theme.stripe} strokeWidth={1.2} fill="none"/>;
      break;
    case 'j1':
      drawing=kind==='gravel'?<>{rectangle(2,3,3,2)}{rectangle(12,12,2,2)}{rectangle(8,5,2,2)}</>
        :<Path d={kind==='mortar'?'M0 4H18M0 11H18M5 4V11M13 11V17':'M1 1H17V16H1ZM2 8H16M8 2V7M12 9V15'} stroke={theme.stripe} fill="none"/>;
      break;
    case 'j2':
      drawing=<><Path d={kind==='reflection'?'M2 1H7V15H2ZM11 1H16V15H11Z':kind==='diamondTiles'?'M9 1L17 8L9 15L1 8Z':'M1 1H17V16H1ZM9 1V16M1 8H17'}
        fill={kind==='glassTiles'?theme.paper:'none'} stroke={theme.accent} strokeWidth={1}/>
        <Path d="M4 5L7 2M11 14L15 10" stroke={theme.paper} strokeWidth={1.4}/></>;
      break;
    case 'j3':
      drawing=kind==='lightField'?<Rect x={2} y={0} width={12} height={16} fill={theme.paper} opacity={.3}/>
        :kind==='shadowField'?<Path d="M2 2H12V7H17V16H7V11H2Z" fill={theme.ink} opacity={.25}/>
        :kind==='prismTiles'?<Path d="M2 15L9 2L17 15ZM9 2V15" fill="none" stroke={theme.accent}/>
        :<Path d="M12 1H6V4H3V12H6V15H12V12H9V4H12Z" fill={theme.accent}/>;
      break;
    case 'h1':case 'cosmos':
      drawing=kind==='starChart'||kind==='starGrid'?<><Path d="M2 4L7 10L14 5L17 12" stroke={theme.accent} strokeWidth={.7} fill="none"/>
        {[ [2,4],[7,10],[14,5],[17,12] ].map(([x,y])=><Rect key={x} x={x-1} y={y-1} width={2} height={2} fill={theme.paper}/>)}</>
        :kind==='craters'?<><Path d="M3 3H13V5H16V12H13V15H3V12H1V5H3Z" fill={theme.stripe}/>{rectangle(5,6,8,6,theme.ink)}{rectangle(5,5,7,1,theme.paper)}</>
        :kind==='orbits'||kind==='orbitChart'?<><Path d="M0 7L5 2H13L18 7V11L13 16H5L0 11Z" stroke={theme.accent} strokeWidth={.8} fill="none"/>{rectangle(10,2,3,3,theme.paper)}</>
        :kind==='nebula'?<Path d="M1 3H8V1H14V6H18V12H12V16H5V12H1Z" fill={theme.accent} opacity={.25}/>
        :<Path d="M1 4H6M3 2V7M11 12H16M13 10V15" stroke={theme.stripe} fill="none"/>;
      break;
    case 'h3':
      drawing=kind==='compassRose'?<Path d="M9 0V17M0 9H18M9 1L12 9L9 16L6 9Z" fill="none" stroke={theme.accent}/>
        :kind==='libraryTiles'?<Path d="M1 2H8V15H1ZM10 2H17V15H10ZM3 5H6M12 12H15" stroke={theme.accent} fill="none"/>
        :<Path d="M0 0H18V17H0ZM0 8H18M5 0V8M12 8V17" stroke={theme.stripe} strokeWidth={1} fill="none"/>;
      break;
    case 'sage':
      drawing=kind==='magicCircle'?<Path d="M5 1H13L18 6V12L13 17H5L0 12V6ZM9 3L15 14H3ZM3 5L15 5L9 15Z" stroke={theme.accent} strokeWidth={.8} fill="none"/>
        :kind==='runes'?<Path d="M3 2V15M3 2L8 6L3 9M12 3V15M9 11L16 6" stroke={theme.accent} strokeWidth={1.2} fill="none"/>
        :<Path d="M1 1H17V16H1ZM4 4L14 13M14 4L4 13" stroke={theme.stripe} fill="none"/>;
      break;
    case 'champion':
      drawing=kind==='fortress'||kind==='battlements'?<Path d="M1 15V5H4V2H7V5H11V2H14V5H17V15ZM2 10H16M6 6V10M12 11V15" stroke={theme.ink} opacity={.5} fill={theme.stripe}/>
        :kind==='copperTiles'?<><Rect x={1} y={1} width={16} height={14} fill={theme.accent} opacity={.6}/><Path d="M2 4H16M3 2V13" stroke={theme.paper} strokeWidth={1}/></>
        :<Path d="M1 1H8V7H1ZM10 3H17V10H10ZM2 10H8V16H2ZM11 12H17V17H11Z" fill="none" stroke={theme.stripe}/>;
      break;
  }
  return <G transform={'translate('+item.x+' '+item.y+') scale('+item.width/18+' '+item.height/18+')'}>
    {drawing}
  </G>;
}

export function IslandSceneryLayer({id,scene,layer}:{
  id:StandardPixelIslandId;scene:IslandScene;layer:'ground'|'objects';
}) {
  const theme=ISLAND_PIXEL_PALETTES[id];
  return <G testID={'island-scenery-'+layer+'-'+id}>
    {layer==='ground'?<>
      {scene.ground.map((item,index)=><GroundTile key={index} item={item} theme={theme}/>)}
      {scene.walls.length>0&&<G testID="labyrinth-stone-walls">
        <Path d={wallPath(scene)} fill="none" stroke={theme.stripe} strokeWidth={5} strokeLinejoin="miter" strokeLinecap="butt"/>
        <Path d={wallPath(scene)} fill="none" stroke={theme.paper} strokeWidth={1} strokeLinejoin="miter" strokeLinecap="butt" opacity={.5}/>
      </G>}
    </>:scene.decorations.map((item,index)=><PixelLandmark key={index} {...item} theme={theme}/>)}
  </G>;
}
function wallPath(scene:IslandScene) {
  return scene.walls.map(wall=>'M'+wall.x1+' '+wall.y1+'H'+wall.x2+'V'+wall.y2).join('');
}

/** Geometry, numbered pins and all ten checkpoint hit targets are inherited.
 * Themes contain artwork only and have no access to stage progression.
 */
export function SharedThemedPixelTerrain({width,height,positions,grade,next}:{
  width:number;height:number;positions:readonly {x:number;y:number}[];grade:WorldGrade;next:number;
}) {
  const id=grade.id as StandardPixelIslandId;
  const theme=ISLAND_PIXEL_PALETTES[grade.id as StandardPixelIslandId];
  const scene=useMemo(()=>islandScenery(id,width,height,positions),[id,width,height,positions]);
  const routes=islandRouteByKind(grade.stages,positions.map((p,order)=>({
    ...p,order,row:Math.floor(order/5),column:order%5,
  })));
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
          fill={row<10?(row%2===0?theme.bandA:theme.bandB):row<12?theme.trialBand:theme.legendBand}/>
        {id==='j3'&&<Rect x={width/2} y={y-45} width={width/2-26} height={200} fill={theme.ink} opacity={.1}/>}
      </G>;
    })}
    <IslandSceneryLayer id={id} scene={scene} layer="ground"/>
    <IslandSceneryLayer id={id} scene={scene} layer="objects"/>
    {[50,60].map((order,index)=><Rect key={order} x={24} y={positions[order].y-65}
      width={width-48} height={4} fill={index===0?theme.trialBand:theme.legendBand}/>)}
    <Path d={routeThrough(routes.normal)} fill="none" stroke={theme.pathBorder} strokeWidth={12} strokeLinejoin="miter"/>
    <Path d={routeThrough(routes.normal)} fill="none" stroke={theme.path} strokeWidth={8} strokeLinejoin="miter"/>
    <Path d={routeThrough(routes.normal)} fill="none" stroke={theme.paper} strokeWidth={2} strokeDasharray="5 8"/>
    <Path d={routeThrough(routes.extra)} fill="none" stroke={theme.pathBorder} strokeWidth={10}/>
    <Path d={routeThrough(routes.extra)} fill="none" stroke={theme.paper} strokeWidth={3} strokeDasharray="5 8"/>
    <Path d={routeThrough(routes.secret)} fill="none" stroke={theme.accent} strokeWidth={10}/>
    <Path d={routeThrough(routes.secret)} fill="none" stroke={theme.paper} strokeWidth={3} strokeDasharray="5 8"/>
    {next>=0&&<Rect x={positions[next].x-29} y={positions[next].y-29} width={58} height={58}
      fill="none" stroke={theme.accent} strokeWidth={2}/>}
  </Svg>;
}

export function IslandThemeStamp({id,compact=false,flipped=false}:{
  id:string;compact?:boolean;flipped?:boolean;
}) {
  const theme=ISLAND_PIXEL_PALETTES[id as StandardPixelIslandId];
  const kind=ISLAND_ART_SETS[id as StandardPixelIslandId].large[0];
  return <Svg testID={'island-stamp-'+id+(flipped?'-right':'-left')}
    width={compact?17:23} height={compact?17:23} viewBox="0 0 32 32" accessible={false}>
    <G transform={flipped?'translate(32 0) scale(-1 1)':undefined}>
      <PixelLandmark kind={kind} x={1} y={1} width={30} height={30} theme={theme}/>
    </G>
  </Svg>;
}
