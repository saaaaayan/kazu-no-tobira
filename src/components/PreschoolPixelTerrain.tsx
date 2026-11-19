import Svg, { G, Path, Rect } from 'react-native-svg';
import { islandRouteByKind, routeThrough } from '../domain/worldMapLayout';
import type { WorldGrade } from '../domain/worldCatalog';

// The preschool island is an actual interactive map. This artwork is drawn
// behind the existing accessible stage/checkpoint Pressables, not over them.
// Deliberately use flat colours, hard edges, and no gradients/sparkles.
type Animal = 'bear' | 'bunny' | 'panda' | 'elephant' | 'dog' | 'cat'
  | 'penguin' | 'lion' | 'lamb' | 'fox' | 'koala' | 'chick' | 'giraffe';
const INK = '#344454';
const FUR: Record<Animal,string> = {
  bear:'#c99867', bunny:'#f4d6d7', panda:'#f3eedc',
  elephant:'#9cb8c7', dog:'#d7b890', cat:'#b6bac0',
  penguin:'#5d7e9c', lion:'#d9ac68', lamb:'#e7dec9',
  fox:'#cc926a', koala:'#a6adb8', chick:'#e9d18a', giraffe:'#e0c17c',
};
const BLUSH = '#dca3a3';
const CREAM = '#f8edcd';

function Plush({animal,x,y,scale=1}:{animal:Animal;x:number;y:number;scale?:number}) {
  const fur=FUR[animal];
  const dark=animal==='panda'?'#47505a':fur;
  const bearEars=['bear','panda','lion','koala'].includes(animal);
  const longEars=animal==='bunny';
  const catEars=['cat','fox'].includes(animal);
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
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
    {animal==='chick'
      ? <Rect x={-3} y={-9} width={8} height={5} fill="#c8915e" stroke="#917348" strokeWidth={1}/>
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

function Flower({x,y}:{x:number;y:number}) {
  return <G transform={`translate(${x} ${y})`}>
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
const ANIMALS:Animal[] = [
  'bear','bunny','elephant','dog','panda','cat','lion','penguin',
  'fox','koala','chick','lamb','giraffe',
];

export function PreschoolPixelTerrain({width,height,positions,grade,next}:{
  width:number;height:number;positions:readonly {x:number;y:number}[];
  grade:WorldGrade;next:number;
}) {
  const paths=islandRouteByKind(grade.stages,positions.map((spot,order)=>({
    ...spot,order,row:Math.floor(order/5),column:order%5,
  })));
  const scale=Math.max(.49,Math.min(1.16,width/920));
  return <Svg testID="preschool-plush-pixel-v2" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="none" accessible={false}>
    <Rect width={width} height={height} fill="#80adc4"/>
    <Rect x={10} y={10} width={width-20} height={height-20}
      rx={9} fill="#a9cb83" stroke="#e9dfb6" strokeWidth={7}/>
    <Rect x={18} y={18} width={width-36} height={height-36}
      rx={3} fill="none" stroke="#7a9d6d" strokeWidth={2}/>
    {Array.from({length:13},(_,row)=>{
      const y=positions[row*5].y;
      const animals=[ANIMALS[(row*2)%ANIMALS.length],ANIMALS[(row*2+1)%ANIMALS.length]];
      return <G key={row}>
        <Rect x={26} y={y-50} width={width-52} height={75}
          fill={row<10
            ? (row%2===0?'#b2d28e':'#aacb83')
            : row<12
              ? (row%2===0?'#aac4b8':'#a2bdb0')
              : '#c5b5c4'}/>
        <Rect x={24} y={y+53} width={width-48} height={6}
          fill={row<10?'#94bc77':row<12?'#88a99e':'#aa98a8'}/>
        <Flower x={width*.39} y={y-17}/>
        <Flower x={width*.61} y={y-18}/>
        <Rect x={width*.17} y={y+14} width={3} height={7} fill="#62885d"/>
        <Rect x={width*.43} y={y+12} width={3} height={7} fill="#62885d"/>
        <Rect x={width*.74} y={y+12} width={3} height={7} fill="#62885d"/>
        {row%3===0&&<ToyBlocks x={width*.965} y={y-34} scale={scale*.8}/>}
        <Plush animal={animals[0]} x={width*.2} y={y-38} scale={scale}/>
        <Plush animal={animals[1]} x={width*.8} y={y-38} scale={scale}/>
      </G>;
    })}
    {/* Quiet separators mark the trial and legendary zones without
        interrupting the stage path or covering the clickable nodes. */}
    {[50,60].map((order,index)=>
      <Rect key={'area-divider-'+order}
        x={24} y={positions[order].y-65} width={width-48} height={4}
        fill={index===0?'#759c8c':'#9a8495'} />
    )}
    <Path d={routeThrough(paths.normal)} fill="none"
      stroke="#506d5e" strokeWidth={12} strokeLinejoin="miter"/>
    <Path d={routeThrough(paths.normal)} fill="none"
      stroke="#efe0b3" strokeWidth={8} strokeLinejoin="miter"/>
    <Path d={routeThrough(paths.normal)} fill="none"
      stroke="#fff6d9" strokeWidth={2} strokeDasharray="5 8"/>
    <Path d={routeThrough(paths.extra)} fill="none"
      stroke="#6b6685" strokeWidth={10}/>
    <Path d={routeThrough(paths.extra)} fill="none"
      stroke="#e5d8c2" strokeWidth={3} strokeDasharray="5 8"/>
    <Path d={routeThrough(paths.secret)} fill="none"
      stroke="#846b74" strokeWidth={10}/>
    <Path d={routeThrough(paths.secret)} fill="none"
      stroke="#f6dfc6" strokeWidth={3} strokeDasharray="5 8"/>
    {next>=0&&<Rect x={positions[next].x-29} y={positions[next].y-29}
      width={58} height={58} fill="none" stroke="#d8aa68" strokeWidth={2}/>}
  </Svg>;
}
