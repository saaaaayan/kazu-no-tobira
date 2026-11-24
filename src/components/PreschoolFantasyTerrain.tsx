import {Image,StyleSheet,View} from 'react-native';
import Svg,{Circle,G,Path,Rect} from 'react-native-svg';
import {plushTownScenery} from '../domain/plushTownScenery';
import {compactIslandStageMap,islandRouteByKind,routeThrough} from '../domain/worldMapLayout';
import type {WorldGrade} from '../domain/worldCatalog';

type Props={width:number;height:number;positions:readonly {x:number;y:number}[];grade:WorldGrade;next:number};
const wide=[plushTownScenery['0_wide'],plushTownScenery['1_wide'],plushTownScenery['2_wide']];
const narrow=[plushTownScenery['0_narrow'],plushTownScenery['1_narrow'],plushTownScenery['2_narrow']];
const scenes=[0,1,2,1,0,2,0,1,2,0,2,1] as const;

// All labels, stage pins, checkpoint signs and handlers live in IslandStageMap.
// Only scenery and a route from the existing coordinates are drawn here.
export function PreschoolFantasyTerrain({width,height,positions,grade,next}:Props){
  const compact=compactIslandStageMap(width);
  const groups=islandRouteByKind(grade.stages,positions.map((p,order)=>({...p,order,row:Math.floor(order/5),column:order%5})));
  const rows=Array.from({length:Math.ceil(positions.length/5)},(_,i)=>positions[i*5]);
  const topArtWidth=Math.min(width*.42,370);
  return <View testID="preschool-fantasy-town-v1" pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:'#2d4e3f'}]}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" accessible={false} style={StyleSheet.absoluteFill}>
      <Rect x={5} y={5} width={width-10} height={height-10} rx={12} fill="#2d4e3f" stroke="#a88e55" strokeWidth={3}/>
      {rows.map((p,i)=><G key={i}>
        <Rect x={12} y={p.y-34} width={width-24} height={95} rx={22} fill={i<10?'#3d6046':i<12?'#365b50':'#3e5452'}/>
        {Array.from({length:compact?8:20},(_,j)=>{
          const x=20+((j*97+i*53)%(Math.max(1,width-40)));
          const y=p.y+72+(j*23+i*13)%Math.max(1,Math.min(150,height-p.y-90));
          return <G key={j} opacity={.66}>
            <Path d={`M${x-5} ${y+5}l5 -9 4 9m-4 0l4 -5 4 5`} fill="none" stroke="#77935b" strokeWidth={1.8}/>
            {j%4===0&&<Circle cx={x+6} cy={y} r={2} fill="#c9b77d"/>}
          </G>;
        })}
      </G>)}
    </Svg>
    {[plushTownScenery['3_wide'],plushTownScenery['4_wide']].map((uri,i)=><Image key={'header-'+i}
      source={{uri}} resizeMode="stretch" accessible={false} style={{position:'absolute',top:79,left:i===0?10:width-topArtWidth-10,width:topArtWidth,height:64}}/>)}
    {rows.slice(0,-1).map((p,i)=>{
      const following=rows[i+1],signRight=(i%2===0);
      const artWidth=compact?Math.max(90,width*.51):Math.max(100,width-220);
      const artHeight=compact?Math.min(112,artWidth/2.45):Math.min(150,artWidth/5.3);
      const x=signRight?14:width-artWidth-14;
      const y=(p.y+following.y-artHeight)/2+9;
      const uri=(compact?narrow:wide)[scenes[i%scenes.length]];
      return <Image key={'scene-'+i} source={{uri}} resizeMode="stretch" accessible={false}
        style={{position:'absolute',left:x,top:y,width:artWidth,height:artHeight}}/>;
    })}
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" accessible={false} style={StyleSheet.absoluteFill}>
      <Rect x={9} y={9} width={width-18} height={height-18} rx={10} fill="none" stroke="#e0c58b" strokeWidth={2}/>
      {([['normal','#e5c78a'],['extra','#b9ccae'],['secret','#d0b0b6']] as const).map(([kind,color])=><G key={kind}>
        <Path d={routeThrough(groups[kind])} fill="none" stroke="#203f37" strokeWidth={15} strokeLinejoin="round" strokeLinecap="round"/>
        <Path d={routeThrough(groups[kind])} fill="none" stroke="#997846" strokeWidth={11} strokeLinejoin="round" strokeLinecap="round"/>
        <Path d={routeThrough(groups[kind])} fill="none" stroke={color} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round"/>
        <Path d={routeThrough(groups[kind])} fill="none" stroke="#f0dfb6" opacity={.64} strokeWidth={1.5} strokeDasharray="3 7"/>
      </G>)}
      {next>=0&&positions[next]&&<Circle cx={positions[next].x} cy={positions[next].y} r={32} fill="none" stroke="#e0c58b" strokeWidth={2}/>}
    </Svg>
  </View>;
}
