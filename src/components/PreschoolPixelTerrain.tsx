import {ISLAND_ART_SETS} from '../domain/islandArtSets';
import {ISLAND_PIXEL_PALETTES} from '../domain/standardPixelIslandMap';
import {islandScenery} from '../domain/islandScenery';
import {IslandSceneryLayer,PixelLandmark,GroundTile} from './SharedThemedPixelTerrain';
import { useMemo } from 'react';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { islandRouteByKind, routeThrough } from '../domain/worldMapLayout';
import {preschoolDecorationLayout, PRESCHOOL_PLUSH_ANIMALS, type PreschoolPlushAnimal} from '../domain/preschoolDecorLayout';
import type { WorldGrade } from '../domain/worldCatalog';

// The preschool island is an actual interactive map. This artwork is drawn
// behind the existing accessible stage/checkpoint Pressables, not over them.
// Deliberately use flat colours, hard edges, and no gradients/sparkles.
type Animal=PreschoolPlushAnimal;
const INK = '#344454';
const FUR: Record<Animal,string> = {
  bear:'#c99867', bunny:'#f4d6d7', panda:'#f3eedc',
  elephant:'#9cb8c7', dog:'#d7b890', cat:'#b6bac0',
  penguin:'#5d7e9c', lion:'#d9ac68', lamb:'#e7dec9',
  fox:'#cc926a', koala:'#a6adb8', chick:'#e9d18a', giraffe:'#e0c17c',
  monkey:'#b58c70', frog:'#8fbc90', mouse:'#c1b5b7',
  duck:'#f0dcb4', raccoon:'#aab0ad', squirrel:'#c69c76',
  hedgehog:'#c7a27f', pig:'#e8bbbd', turtle:'#91b39a', owl:'#b0a08c',
};
const BLUSH = '#dca3a3';
const CREAM = '#f8edcd';

function Plush({animal,x,y,scale=1}:{animal:Animal;x:number;y:number;scale?:number}) {
  const fur=FUR[animal];
  const dark=animal==='panda'?'#47505a':fur;
  // Monkeys have side ears and owls have two tufts of their own.
  // Do not draw the generic bear ears on top of those silhouettes.
  const bearEars=['bear','panda','lion','koala'].includes(animal);
  const longEars=animal==='bunny';
  const catEars=['cat','fox','raccoon'].includes(animal);
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* Distinct muted pixel silhouettes; all toys have simple stitched faces. */}
    {animal==='squirrel'&&<G>
      {/* Two little pointed ears behind the squirrel's face. */}
      <Path d="M-17 -23 L-14 -38 L-2 -23 Z"
        fill={fur} stroke={INK} strokeWidth={2.4} strokeLinejoin="round"/>
      <Path d="M2 -23 L14 -38 L17 -23 Z"
        fill={fur} stroke={INK} strokeWidth={2.4} strokeLinejoin="round"/>
      <Path d="M-13 -29 L-12 -34 L-8 -29 Z" fill={BLUSH}/>
      <Path d="M8 -29 L12 -34 L13 -29 Z" fill={BLUSH}/>
      {/* A short curled tail beside the body, NOT a tall detached tower. */}
      <Path d="M14 12 V-5 H20 V-15 H30 V-10 H34 V2 H28 V12 H23 V17 H15 Z"
        fill="#af825e" stroke={INK} strokeWidth={2.5} strokeLinejoin="miter"/>
      <Rect x={21} y={-7} width={7} height={12} fill={fur}/>
      <Rect x={14} y={3} width={8} height={10} fill={fur}/>
    </G>}
    {animal==='hedgehog'&&<G>
      {[-22,-12,0,12].map((x,i)=><Rect key={i} x={x} y={-37-(i%2)*6}
        width={12} height={21} fill="#8f755f" stroke={INK} strokeWidth={2}/>)}
    </G>}
    {animal==='turtle'&&<G>
      <Rect x={-23} y={-19} width={46} height={34} fill="#7c9c80" stroke={INK} strokeWidth={3}/>
      <Rect x={-12} y={-15} width={24} height={13} fill="#aac0a0"/>
      <Rect x={-12} y={0} width={24} height={11} fill="#aac0a0"/>
    </G>}
    {/* Stuffed fabric feet and body, with deliberate blocky outlines */}
    <Rect x={-16} y={-4} width={32} height={21} fill={fur} stroke={INK} strokeWidth={2.8}/>
    <Rect x={-20} y={10} width={13} height={9} fill={fur} stroke={INK} strokeWidth={2.5}/>
    <Rect x={7} y={10} width={13} height={9} fill={fur} stroke={INK} strokeWidth={2.5}/>
    {bearEars && <G>
      <Rect x={-19} y={-30} width={12} height={13} fill={dark} stroke={INK} strokeWidth={2.5}/>
      <Rect x={7} y={-30} width={12} height={13} fill={dark} stroke={INK} strokeWidth={2.5}/>
      <Rect x={-16} y={-26} width={5} height={5} fill="#e5b9a2"/>
      <Rect x={11} y={-26} width={5} height={5} fill="#e5b9a2"/>
    </G>}
    {animal==='mouse'&&<G>
      <Rect x={-29} y={-38} width={20} height={20} fill={fur} stroke={INK} strokeWidth={2.6}/>
      <Rect x={9} y={-38} width={20} height={20} fill={fur} stroke={INK} strokeWidth={2.6}/>
      <Rect x={-25} y={-34} width={12} height={12} fill={BLUSH}/>
      <Rect x={13} y={-34} width={12} height={12} fill={BLUSH}/>
    </G>}
    {animal==='frog'&&<G>
      <Rect x={-18} y={-39} width={15} height={15} fill={fur} stroke={INK} strokeWidth={2.6}/>
      <Rect x={3} y={-39} width={15} height={15} fill={fur} stroke={INK} strokeWidth={2.6}/>
      <Rect x={-13} y={-33} width={4} height={5} fill={INK}/>
      <Rect x={9} y={-33} width={4} height={5} fill={INK}/>
    </G>}
    {animal==='owl'&&<G>
      {/* Just TWO small feather tufts; the old generic bear ears made four. */}
      <Rect x={-16} y={-34} width={9} height={12} fill={fur} stroke={INK} strokeWidth={2.3}/>
      <Rect x={7} y={-34} width={9} height={12} fill={fur} stroke={INK} strokeWidth={2.3}/>
    </G>}
    {animal==='duck'&&<G>
      <Rect x={-22} y={-15} width={9} height={17} fill="#e9cfa1" stroke={INK} strokeWidth={2}/>
      <Rect x={13} y={-15} width={9} height={17} fill="#e9cfa1" stroke={INK} strokeWidth={2}/>
    </G>}
    {longEars && <G>
      <Rect x={-13} y={-43} width={9} height={24} fill={fur} stroke={INK} strokeWidth={2.5}/>
      <Rect x={4} y={-43} width={9} height={24} fill={fur} stroke={INK} strokeWidth={2.5}/>
      <Rect x={-10} y={-37} width={3} height={13} fill={BLUSH}/>
      <Rect x={7} y={-37} width={3} height={13} fill={BLUSH}/>
    </G>}
    {catEars&&<G>
      <Path d="M-19 -15V-35H-12L-3 -24M19 -15V-35H12L3 -24" fill={fur} stroke={INK} strokeWidth={3} strokeLinejoin="miter"/>
      <Rect x={-14} y={-30} width={5} height={7} fill={BLUSH}/>
      <Rect x={9} y={-30} width={5} height={7} fill={BLUSH}/>
    </G>}
    {animal==='dog'&&<G>
      <Rect x={-25} y={-24} width={12} height={24} fill="#a17d62" stroke={INK} strokeWidth={2.5}/>
      <Rect x={13} y={-24} width={12} height={24} fill="#a17d62" stroke={INK} strokeWidth={2.5}/>
    </G>}
    {animal==='elephant'&&<G>
      <Rect x={-28} y={-26} width={17} height={19} fill={fur} stroke={INK} strokeWidth={2.5}/>
      <Rect x={11} y={-26} width={17} height={19} fill={fur} stroke={INK} strokeWidth={2.5}/>
      <Rect x={-24} y={-21} width={9} height={10} fill="#d3c7c4"/>
      <Rect x={15} y={-21} width={9} height={10} fill="#d3c7c4"/>
    </G>}
    {animal==='lion'&&<Rect x={-23} y={-35} width={46} height={41} fill="#b4824e" stroke={INK} strokeWidth={3}/>}
    {animal==='penguin'&&<Rect x={-13} y={-4} width={26} height={20} fill={CREAM}/>}
    {animal==='giraffe'&&<G>
      <Rect x={-10} y={-43} width={6} height={20} fill={fur} stroke={INK} strokeWidth={2}/>
      <Rect x={5} y={-43} width={6} height={20} fill={fur} stroke={INK} strokeWidth={2}/>
      <Rect x={-13} y={-12} width={26} height={17} fill={fur} stroke={INK} strokeWidth={2.5}/>
    </G>}
    {animal==='lamb'&&<G>
      <Rect x={-20} y={-34} width={40} height={21} fill="#f5f0e2" stroke={INK} strokeWidth={2}/>
      <Rect x={-15} y={-39} width={13} height={9} fill="#f5f0e2" stroke={INK} strokeWidth={2}/>
      <Rect x={2} y={-39} width={13} height={9} fill="#f5f0e2" stroke={INK} strokeWidth={2}/>
    </G>}
    {animal==='chick'&&<G>
      <Rect x={-9} y={-34} width={18} height={11} fill={fur} stroke={INK} strokeWidth={2}/>
    </G>}
    <Rect x={-17} y={-26} width={34} height={28} fill={animal==='lamb'?'#dbc6a5':fur} stroke={INK} strokeWidth={2.8}/>
    {animal==='monkey'&&<G>
      <Rect x={-27} y={-27} width={11} height={17} fill={fur} stroke={INK} strokeWidth={2.6}/>
      <Rect x={16} y={-27} width={11} height={17} fill={fur} stroke={INK} strokeWidth={2.6}/>
      <Rect x={-13} y={-23} width={26} height={19} fill="#f1d8b4"/>
    </G>}
    {animal==='raccoon'&&<G>
      <Rect x={-16} y={-21} width={32} height={12} fill="#6c737a"/>
      <Rect x={-12} y={-17} width={8} height={6} fill="#f8eacc"/>
      <Rect x={4} y={-17} width={8} height={6} fill="#f8eacc"/>
    </G>}
    {animal==='owl'&&<G>
      <Rect x={-15} y={-23} width={13} height={14} fill="#f8e7ce"/>
      <Rect x={2} y={-23} width={13} height={14} fill="#f8e7ce"/>
    </G>}
    {animal==='panda'&&<G>
      <Rect x={-15} y={-21} width={12} height={14} fill="#58606a"/>
      <Rect x={3} y={-21} width={12} height={14} fill="#58606a"/>
    </G>}
    {animal==='elephant'&&<G>
      <Rect x={-6} y={-9} width={12} height={21} fill={fur} stroke={INK} strokeWidth={2}/>
      <Rect x={1} y={8} width={8} height={4} fill={fur}/>
    </G>}
    <Rect x={-10} y={-17} width={4} height={5} fill={INK}/>
    <Rect x={6} y={-17} width={4} height={5} fill={INK}/>
    {['chick','duck','owl'].includes(animal)
      ? <Rect x={-5} y={-9} width={10} height={6} fill="#c8915e" stroke="#917348" strokeWidth={1}/>
      : animal==='pig' ? <G>
        <Rect x={-10} y={-11} width={20} height={11} fill="#d99c9e" stroke={INK} strokeWidth={1}/>
        <Rect x={-5} y={-8} width={3} height={4} fill="#8f6e72"/>
        <Rect x={2} y={-8} width={3} height={4} fill="#8f6e72"/>
      </G>
      : animal!=='elephant'&&<G>
        <Rect x={-6} y={-8} width={12} height={8} fill={CREAM}/>
        <Rect x={-2} y={-7} width={4} height={4} fill={INK}/>
      </G>}
    {animal==='giraffe'&&<G>
      <Rect x={-13} y={0} width={5} height={5} fill="#b9945f"/>
      <Rect x={7} y={4} width={5} height={5} fill="#b9945f"/>
    </G>}
    {animal==='bear'&&<G>
      <Rect x={-7} y={1} width={14} height={6} fill="#d49d96"/>
      <Rect x={-2} y={0} width={4} height={9} fill="#fff0d0"/>
    </G>}
    {animal==='bunny'&&<G>
      <Rect x={-6} y={2} width={12} height={5} fill="#d99e9e"/>
      <Rect x={-2} y={2} width={4} height={8} fill="#f8ecd8"/>
    </G>}
  </G>;
}

function Flower({x,y,scale=1}:{x:number;y:number;scale?:number}) {
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    <Rect x={-2} y={-10} width={4} height={11} fill="#66865b"/>
    <Rect x={-8} y={-13} width={6} height={6} fill="#e8d6a9"/>
    <Rect x={2} y={-13} width={6} height={6} fill="#e8d6a9"/>
    <Rect x={-3} y={-18} width={6} height={6} fill="#e8d6a9"/>
    <Rect x={-3} y={-8} width={6} height={6} fill="#e8d6a9"/>
    <Rect x={-3} y={-13} width={6} height={6} fill="#c99591"/>
  </G>;
}

function ToyBlocks({x,y,scale}:{x:number;y:number;scale:number}) {
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    <Rect x={-17} y={-13} width={16} height={16} fill="#dec38b" stroke={INK} strokeWidth={2}/>
    <Rect x={1} y={-13} width={16} height={16} fill="#aabccc" stroke={INK} strokeWidth={2}/>
    <Rect x={-8} y={-31} width={16} height={16} fill="#d4a3a0" stroke={INK} strokeWidth={2}/>
  </G>;
}
/** Shared pixel-art landmarks for the standard island map.
 * The preschool collision-checked positions are reused unchanged; only the
 * toy silhouettes are swapped for the first-grade theme.
 * All drawing stays inside the same plush decoration bounding box.
 */
const TOY_SYMBOLS=['robot','car','train','ball','blocks','top','rocket','kite','house','puzzle','drum','boat'] as const;
type ToySymbol=typeof TOY_SYMBOLS[number];
function ToyPixelIcon({kind,x,y,scale}:{kind:ToySymbol;x:number;y:number;scale:number}){
  const ink='#344454',cream='#f7ecd1',wood='#d8bd84',
    red='#ba817b',blue='#7b9eaf',green='#8fa987';
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    {kind==='robot'&&<G>
      <Rect x={-19} y={-27} width={38} height={30} fill={blue} stroke={ink} strokeWidth={3}/>
      <Rect x={-13} y={-20} width={8} height={7} fill={cream}/>
      <Rect x={5} y={-20} width={8} height={7} fill={cream}/>
      <Rect x={-5} y={-8} width={10} height={3} fill={ink}/>
      <Rect x={-14} y={5} width={28} height={17} fill={wood} stroke={ink} strokeWidth={2}/>
      <Rect x={-23} y={7} width={8} height={13} fill={blue} stroke={ink} strokeWidth={2}/>
      <Rect x={15} y={7} width={8} height={13} fill={blue} stroke={ink} strokeWidth={2}/>
      <Rect x={-9} y={22} width={6} height={6} fill={ink}/><Rect x={3} y={22} width={6} height={6} fill={ink}/>
      <Rect x={-2} y={-37} width={4} height={10} fill={ink}/>
    </G>}
    {kind==='car'&&<G>
      <Rect x={-25} y={-2} width={50} height={17} fill={red} stroke={ink} strokeWidth={3}/>
      <Path d="M-15 -2L-8 -19H12L20 -2Z" fill={blue} stroke={ink} strokeWidth={3}/>
      <Rect x={-6} y={-16} width={12} height={11} fill={cream}/>
      <Rect x={-17} y={13} width={10} height={10} fill={ink}/>
      <Rect x={9} y={13} width={10} height={10} fill={ink}/>
    </G>}
    {kind==='train'&&<G>
      <Rect x={-25} y={-21} width={23} height={33} fill={green} stroke={ink} strokeWidth={3}/>
      <Rect x={-19} y={-17} width={12} height={11} fill={cream}/>
      <Rect x={-2} y={-12} width={26} height={24} fill={wood} stroke={ink} strokeWidth={3}/>
      <Rect x={7} y={-19} width={12} height={7} fill={red} stroke={ink} strokeWidth={2}/>
      <Rect x={-19} y={12} width={9} height={9} fill={ink}/><Rect x={-1} y={12} width={9} height={9} fill={ink}/>
      <Rect x={14} y={12} width={9} height={9} fill={ink}/>
    </G>}
    {kind==='ball'&&<G>
      <Rect x={-17} y={-21} width={34} height={37} fill={wood} stroke={ink} strokeWidth={3}/>
      <Rect x={-24} y={-12} width={48} height={20} fill={red} stroke={ink} strokeWidth={2}/>
      <Rect x={-6} y={-27} width={12} height={47} fill={blue}/>
      <Rect x={-6} y={-6} width={12} height={11} fill={cream} stroke={ink} strokeWidth={2}/>
    </G>}
    {kind==='blocks'&&<G>
      <Rect x={-25} y={-8} width={22} height={23} fill={wood} stroke={ink} strokeWidth={3}/>
      <Rect x={3} y={-8} width={22} height={23} fill={green} stroke={ink} strokeWidth={3}/>
      <Rect x={-11} y={-33} width={22} height={24} fill={red} stroke={ink} strokeWidth={3}/>
      <Rect x={-6} y={-26} width={11} height={11} fill={cream}/>
    </G>}
    {kind==='top'&&<G>
      <Rect x={-4} y={-35} width={8} height={13} fill={ink}/>
      <Rect x={-18} y={-21} width={36} height={16} fill={blue} stroke={ink} strokeWidth={3}/>
      <Rect x={-25} y={-5} width={50} height={11} fill={red} stroke={ink} strokeWidth={3}/>
      <Path d="M-16 7L0 24L16 7Z" fill={wood} stroke={ink} strokeWidth={3}/>
    </G>}
    {kind==='rocket'&&<G>
      <Path d="M0 -40L-14 -20V15H14V-20Z" fill={blue} stroke={ink} strokeWidth={3}/>
      <Rect x={-7} y={-16} width={14} height={15} fill={cream} stroke={ink} strokeWidth={2}/>
      <Path d="M-14 3L-24 18H-14ZM14 3L24 18H14Z" fill={red} stroke={ink} strokeWidth={2}/>
      <Rect x={-4} y={16} width={8} height={10} fill={wood}/>
    </G>}
    {kind==='kite'&&<G>
      <Path d="M0 -39L21 -15L0 9L-21 -15Z" fill={green} stroke={ink} strokeWidth={3}/>
      <Path d="M0 -39V9M-21 -15H21" fill="none" stroke={cream} strokeWidth={3}/>
      <Path d="M0 9V27M0 19H-8M0 25H7" fill="none" stroke={ink} strokeWidth={2}/>
    </G>}
    {kind==='house'&&<G>
      <Rect x={-21} y={-13} width={42} height={33} fill={wood} stroke={ink} strokeWidth={3}/>
      <Path d="M-27 -13L0 -39L27 -13Z" fill={red} stroke={ink} strokeWidth={3}/>
      <Rect x={-7} y={0} width={14} height={20} fill={cream} stroke={ink} strokeWidth={2}/>
      <Rect x={-17} y={-9} width={9} height={9} fill={blue}/>
    </G>}
    {kind==='puzzle'&&<G>
      <Rect x={-22} y={-27} width={44} height={44} fill={green} stroke={ink} strokeWidth={3}/>
      <Rect x={-5} y={-27} width={10} height={44} fill={cream}/>
      <Rect x={-22} y={-9} width={44} height={10} fill={cream}/>
      <Rect x={-13} y={-19} width={9} height={9} fill={wood}/>
      <Rect x={9} y={6} width={9} height={8} fill={red}/>
    </G>}
    {kind==='drum'&&<G>
      <Rect x={-22} y={-23} width={44} height={35} fill={red} stroke={ink} strokeWidth={3}/>
      <Rect x={-24} y={-27} width={48} height={8} fill={cream} stroke={ink} strokeWidth={2}/>
      <Rect x={-24} y={10} width={48} height={8} fill={wood} stroke={ink} strokeWidth={2}/>
      <Path d="M-18 -15L18 9M18 -15L-18 9" stroke={cream} strokeWidth={3}/>
    </G>}
    {kind==='boat'&&<G>
      <Path d="M-27 6H27L17 22H-15Z" fill={wood} stroke={ink} strokeWidth={3}/>
      <Rect x={-2} y={-37} width={4} height={44} fill={ink}/>
      <Path d="M2 -33L20 -3H2Z" fill={blue} stroke={ink} strokeWidth={2}/>
      <Path d="M-4 -22L-20 -3H-4Z" fill={red} stroke={ink} strokeWidth={2}/>
    </G>}
  </G>;
}

export function PreschoolPixelTerrain({width,height,positions,grade,next,theme='plush'}:{
  width:number;height:number;positions:readonly {x:number;y:number}[];
  grade:WorldGrade;next:number;theme?:'plush'|'toys';
}) {
  const paths=islandRouteByKind(grade.stages,positions.map((spot,order)=>({
    ...spot,order,row:Math.floor(order/5),column:order%5,
  })));
  const decorations=useMemo(()=>preschoolDecorationLayout(width,height,positions),
    [width,height,positions.length,positions[0]?.y,positions[positions.length-1]?.y]);
  const sceneryId=theme==='toys'?'e1':'preschool';
  const scenery=useMemo(()=>islandScenery(sceneryId,width,height,positions),
    [sceneryId,width,height,positions]);
  const groundTheme=ISLAND_PIXEL_PALETTES[sceneryId];
  return <Svg testID={theme==='toys'?'toy-island-pixel-v1':'preschool-plush-pixel-v2'} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="none" accessible={false}>
    <Rect width={width} height={height} fill={theme==='toys'?'#688dad':'#80adc4'}/>
    <Rect x={10} y={10} width={width-20} height={height-20}
      rx={9} fill={theme==='toys'?'#d9ae99':'#a9cb83'} stroke="#e9dfb6" strokeWidth={7}/>
    <Rect x={18} y={18} width={width-36} height={height-36}
      rx={3} fill="none" stroke={theme==='toys'?'#b98173':'#7a9d6d'} strokeWidth={2}/>
    {Array.from({length:13},(_,row)=>{
      const y=positions[row*5].y;
      return <G key={row}>
        <Rect x={26} y={y-50} width={width-52} height={75}
          fill={theme==='toys'
            ? (row<10?(row%2===0?'#e5bba7':'#dcae9b'):
              row<12?'#bcb3b5':'#c6b5c5')
            : row<10
            ? (row%2===0?'#b2d28e':'#aacb83')
            : row<12
              ? (row%2===0?'#aac4b8':'#a2bdb0')
              : '#c5b5c4'}/>
        <Rect x={24} y={y+53} width={width-48} height={6}
          fill={theme==='toys'?(row<10?'#bc8c7b':row<12?'#a99ea3':'#b6a0b0'):
            row<10?'#94bc77':row<12?'#88a99e':'#aa98a8'}/>
      </G>;
    })}
    <IslandSceneryLayer id={sceneryId} scene={scenery} layer="ground"/>
    {/* Reuse some existing flower clearings for cloth/wood textures on narrow
        maps. They inherit the same tested bounds as the original small art. */}
    {decorations.map((item,i)=>item.kind==='flower'&&i%3===0
      ? <GroundTile key={'legacy-ground-'+i} theme={groundTheme} item={{
          kind:ISLAND_ART_SETS[sceneryId].ground[Math.floor(i/3)%4],
          x:item.x-8*item.scale,y:item.y-18*item.scale,width:16*item.scale,
          height:16*item.scale,variant:Math.floor(i/3)%4,
        }}/>
      : null)}
    <IslandSceneryLayer id={sceneryId} scene={scenery} layer="objects"/>
    {/* Stable, collision-checked organic scattering. Never obscure checkpoint
        signs, stage circles, names, routes or the three area headings. */}
    {decorations.map((item,i)=>item.kind==='flower'&&i%3===0?null:theme==='toys'
      ? item.kind==='plush'
        ? <ToyPixelIcon key={'toy-'+i}
            kind={TOY_SYMBOLS[PRESCHOOL_PLUSH_ANIMALS.indexOf(item.animal)%TOY_SYMBOLS.length]}
            x={item.x} y={item.y} scale={item.scale}/>
        : item.kind==='blocks'
          ? <ToyBlocks key={'toy-blocks-'+i} x={item.x} y={item.y} scale={item.scale}/>
          : <PixelLandmark key={'toy-charm-'+i}
              kind={ISLAND_ART_SETS.e1.small[i%ISLAND_ART_SETS.e1.small.length]}
              x={item.x-8*item.scale} y={item.y-18*item.scale}
              width={16*item.scale} height={16*item.scale} theme={ISLAND_PIXEL_PALETTES.e1}/>
      : item.kind==='plush'
        ? <Plush key={'plush-'+i} animal={item.animal}
            x={item.x} y={item.y} scale={item.scale}/>
        : item.kind==='blocks'
          ? <ToyBlocks key={'toy-blocks-'+i} x={item.x} y={item.y} scale={item.scale}/>
          : <Flower key={'flower-'+i} x={item.x} y={item.y} scale={item.scale}/>)}
    {/* Quiet separators mark the trial and legendary zones without
        interrupting the stage path or covering the clickable nodes. */}
    {[50,60].map((order,index)=>
      <Rect key={'area-divider-'+order}
        x={24} y={positions[order].y-65} width={width-48} height={4}
        fill={theme==='toys'?(index===0?'#ac8fa2':'#ba8ba3'):
          index===0?'#759c8c':'#9a8495'} />
    )}
    <Path d={routeThrough(paths.normal)} fill="none"
      stroke={theme==='toys'?'#835a57':'#506d5e'} strokeWidth={12} strokeLinejoin="miter"/>
    <Path d={routeThrough(paths.normal)} fill="none"
      stroke={theme==='toys'?'#f1d6a4':'#efe0b3'} strokeWidth={8} strokeLinejoin="miter"/>
    <Path d={routeThrough(paths.normal)} fill="none"
      stroke={theme==='toys'?'#fff3d8':'#fff6d9'} strokeWidth={2} strokeDasharray="5 8"/>
    <Path d={routeThrough(paths.extra)} fill="none"
      stroke={theme==='toys'?'#806b91':'#6b6685'} strokeWidth={10}/>
    <Path d={routeThrough(paths.extra)} fill="none"
      stroke="#e5d8c2" strokeWidth={3} strokeDasharray="5 8"/>
    <Path d={routeThrough(paths.secret)} fill="none"
      stroke={theme==='toys'?'#965f75':'#846b74'} strokeWidth={10}/>
    <Path d={routeThrough(paths.secret)} fill="none"
      stroke="#f6dfc6" strokeWidth={3} strokeDasharray="5 8"/>
    {next>=0&&<Rect x={positions[next].x-29} y={positions[next].y-29}
      width={58} height={58} fill="none" stroke={theme==='toys'?'#a96353':'#d8aa68'} strokeWidth={2}/>}
  </Svg>;
}

/** Grade one uses exactly the preschool landscape, route, and collision-safe
 * scatter engine, replacing plush toys with understated pixel-art toys only. */
export function ToyPixelTerrain(props:{
  width:number;height:number;positions:readonly {x:number;y:number}[];
  grade:WorldGrade;next:number;
}){
  return <PreschoolPixelTerrain {...props} theme="toys"/>;
}
