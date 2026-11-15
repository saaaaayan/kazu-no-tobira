import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { CompanionAvatar } from './AdventureCompanion';
import { worldGrades, type WorldGrade, type WorldStage } from '../domain/worldCatalog';
import { gradeProgress, isWorldStageUnlocked, unlockSummary } from '../domain/worldProgress';
import { islandRouteByKind, islandStageLayout, routeThrough, worldMapLayout } from '../domain/worldMapLayout';
import type { Progress } from '../domain/progress';

const palette = [
  { land: '#8fcb86', dark: '#4e8f65', detail: '#315f5c', roof: '#cf8c63' },
  { land: '#9fcf75', dark: '#477d68', detail: '#31576a', roof: '#f3c06a' },
  { land: '#a2c3a0', dark: '#507b86', detail: '#285d73', roof: '#bf85a4' },
  { land: '#c7be8d', dark: '#8f906f', detail: '#585479', roof: '#d8a26b' },
  { land: '#97d1ba', dark: '#4a9a9d', detail: '#347a8e', roof: '#f2bf91' },
  { land: '#aebfd8', dark: '#6d8ab1', detail: '#515e94', roof: '#f4e0a9' },
  { land: '#c0c6a1', dark: '#6e8a82', detail: '#395a63', roof: '#c18b94' },
  { land: '#9fbb90', dark: '#5b947b', detail: '#5579a1', roof: '#d1be74' },
  { land: '#b6abd1', dark: '#77749e', detail: '#4c5c87', roof: '#e2c3e7' },
  { land: '#d4c7a8', dark: '#929c9e', detail: '#56718d', roof: '#f1cd8c' },
  { land: '#a8afcf', dark: '#737fb0', detail: '#465787', roof: '#a7d2c7' },
  { land: '#c5b3cd', dark: '#7375b1', detail: '#50528c', roof: '#ffe5a1' },
] as const;
const emblems = ['✿','♣','◈','♜','◉','☾','✧','◇','✵','△','✺','★'];
const legacy = new Set(['e1.forest','e1.bridge','e1.tower']);

function measuredWidth(width: number) {
  return Math.max(290, width || 360);
}

function OceanTexture({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  return (
    <G>
      {Array.from({ length: Math.ceil(height / 120) * 6 }, (_, i) => {
        const x = (i * 127 + seed * 73) % Math.max(1, width - 35) + 12;
        const y = ((i * 113 + seed * 23) % Math.max(1, height - 40)) + 18;
        return <Path key={i} d={`M${x - 11} ${y}q10-5 20 0m-14 7q7-3 14 0`}
          fill="none" stroke="#e3faf7" strokeWidth={2} opacity={i % 4 === 0 ? 0.5 : 0.2}/>;
      })}
    </G>
  );
}

function IslandArt({ index, x, y, scale = 1, locked = false }: {
  index: number; x: number; y: number; scale?: number; locked?: boolean;
}) {
  const p = palette[index];
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} opacity={locked ? 0.71 : 1}>
      <Ellipse cy={38} rx={87} ry={33} fill="#285c7c" opacity={0.23}/>
      <Path d="M-83 14Q-84-18-55-31Q-37-50-9-36Q12-57 36-39Q66-42 77-10Q98 16 71 34Q39 59 10 44Q-22 62-47 38Q-76 42-83 14Z"
        transform="translate(0 8)" fill="#2b7186" opacity={0.5}/>
      <Path d="M-83 14Q-84-18-55-31Q-37-50-9-36Q12-57 36-39Q66-42 77-10Q98 16 71 34Q39 59 10 44Q-22 62-47 38Q-76 42-83 14Z"
        fill={p.land} stroke="#f3e1ab" strokeWidth={5} strokeLinejoin="round"/>
      <Path d="M-63 8Q-57-9-40-16Q-22-20-11-9Q0-29 17-23Q32-25 52-6Q71 4 52 24Q35 43 14 26Q-7 42-29 22Q-48 32-63 8Z"
        fill={p.dark} opacity={0.39}/>
      <Path d="M-49 24Q-22 1 2 18T52 2" fill="none" stroke="#fcdf9d" strokeWidth={7} strokeLinecap="round" opacity={0.82}/>
      <Ellipse cx={-51} cy={-9} rx={20} ry={10} fill={p.dark} opacity={0.42}/>
      <Path d="M-53-8L-43-35-33-8Z" fill={p.detail}/>
      <Path d="M-46-15L-43-35-37-17Z" fill="#dcecf1" opacity={0.75}/>
      <Path d="M31-11L45-43 58-10Z" fill={p.detail} opacity={0.9}/>
      <Path d="M39-26L45-43 52-26Z" fill="#fcf5d9" opacity={0.84}/>
      <G transform="translate(-25 9)">
        <Path d="M-5 17V-10H5V17Z" fill="#765d5a"/>
        <Path d="M-19 1L0-26 19 1ZM-16 12L0-14 16 12Z" fill={p.detail}/>
        <Path d="M-7-7L0-24 7-7Z" fill="#9fd0b4" opacity={0.55}/>
      </G>
      <G transform="translate(25 15)">
        <Rect x={-12} y={-14} width={24} height={26} rx={3} fill="#f0dcb3" stroke="#74687a" strokeWidth={2}/>
        <Path d="M-17-14L0-31 17-14Z" fill={p.roof} stroke="#74687a" strokeWidth={2}/>
        <Rect x={-4} y={-2} width={8} height={14} rx={2} fill="#7e708b"/>
        <Circle cx={-7} cy={-6} r={3} fill="#fff7c8"/>
        <Circle cx={7} cy={-6} r={3} fill="#fff7c8"/>
      </G>
      {index >= 6 && (
        <G>
          <Path d="M-1 0L7-58 15 0Z" fill="#c9c0e2" stroke="#626b9d" strokeWidth={2}/>
          <Path d="M-7-56L7-76 22-56Z" fill={p.roof}/>
          <Path d="M7-82L10-74 18-71 10-68 7-60 4-68-4-71 4-74Z" fill="#ffe7a8"/>
        </G>
      )}
      <Circle cx={-72} cy={-33} r={2.5} fill="#fff8d3" opacity={0.85}/>
      <Circle cx={67} cy={-43} r={2.2} fill="#fff8d3" opacity={0.85}/>
      {locked && <Ellipse rx={84} ry={42} fill="#dbe5ec" opacity={0.25}/>}
    </G>
  );
}

function WorldSea({ width, height, positions, columns, current }: {
  width: number; height: number; positions: readonly {x:number;y:number}[];
  columns: number; current: number;
}) {
  const isMobile = columns === 2;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" accessible={false}>
      <Defs>
        <LinearGradient id="voyage-sea" x1="0" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#386a97"/><Stop offset=".48" stopColor="#4f95af"/>
          <Stop offset="1" stopColor="#82bdc4"/>
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#voyage-sea)"/>
      <OceanTexture width={width} height={height}/>
      <Path d={routeThrough(positions,0.2)} fill="none" stroke="#245a87"
        strokeWidth={11} opacity={0.36} strokeLinecap="round"/>
      <Path d={routeThrough(positions,0.2)} fill="none" stroke="#fff2bf"
        strokeWidth={3.5} strokeDasharray="7 13" opacity={0.94} strokeLinecap="round"/>
      {positions.map((spot,i) => (
        <G key={worldGrades[i].id}>
          {i === current && (
            <G>
              <Circle cx={spot.x} cy={spot.y-15} r={isMobile?68:84} fill="#fff3a7" opacity={0.23}/>
              <Circle cx={spot.x} cy={spot.y-15} r={isMobile?63:77}
                stroke="#ffe6a2" strokeWidth={2.5} strokeDasharray="6 8" fill="none"/>
            </G>
          )}
          <IslandArt index={i} x={spot.x} y={spot.y-20} scale={isMobile?0.87:1.12} locked={i>current && current>=0}/>
        </G>
      ))}
      {positions.length>0 && (
        <G transform={`translate(${positions[0].x-54} ${positions[0].y-72})`}>
          <Circle r={11} fill="#ffe9a0" opacity={0.75}/>
          <Path d="M0-10L3-3 10 0 3 3 0 10-3 3-10 0-3-3Z" fill="white"/>
        </G>
      )}
    </Svg>
  );
}

export function WorldMap780({ progress, onGrade, onTitles }: {
  progress: Progress; onGrade: (grade: WorldGrade) => void; onTitles: () => void;
}) {
  const [width,setWidth] = useState(0);
  const layout = worldMapLayout(measuredWidth(width));
  const summary=unlockSummary(progress);
  const current = worldGrades.findIndex((grade,i) => {
    if (i>0 && gradeProgress(progress,worldGrades[i-1].id).extrasCleared < 10) return true;
    return gradeProgress(progress,grade.id).extrasCleared < 10;
  });
  const size = layout.columns===3?206:Math.min(160,Math.floor(measuredWidth(width)/2)-10);
  return (
    <View style={styles.screen}>
      <View style={styles.worldBanner}>
        <Text style={styles.eyebrow}>12の島をめぐる すうがくの大ぼうけん</Text>
        <Text style={styles.bannerHeading}>数の世界地図</Text>
        <Text style={styles.bannerDescription}>島をタッチして ぼうけんに出発！ 小学1年生から高校3年生まで。</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>✦ {summary.cleared} / 780 クリア</Text>
          <Text style={styles.stat}>★ {summary.perfect} パーフェクト</Text>
        </View>
      </View>
      <View style={styles.mapHeading}>
        <Text style={styles.mapTitle}>✧ 12の島が つながる世界</Text>
        <Text style={styles.hintText}>どの島も地図で見られるよ。ステージは順番に開放されるよ。</Text>
      </View>
      <View style={[styles.ocean,{height:layout.height}]} onLayout={event=>{
        const next=Math.round(event.nativeEvent.layout.width);
        if(next>0 && next!==width) setWidth(next);
      }}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <WorldSea width={measuredWidth(width)} height={layout.height}
            positions={layout.positions} columns={layout.columns} current={current}/>
        </View>
        {worldGrades.map((grade,index)=>{
          const position=layout.positions[index];
          const locked=index>0 && gradeProgress(progress,worldGrades[index-1].id).extrasCleared<10;
          const count=gradeProgress(progress,grade.id).cleared;
          return (
            <Pressable key={grade.id} accessibilityRole="button"
              accessibilityLabel={grade.title+' '+grade.island+'、'+count+'／65ステージ、'+(locked?'まだ解放されていない島。マップを見られます':'冒険できます')}
              onPress={()=>onGrade(grade)}
              style={({pressed})=>[styles.islandTarget,{
                width:size,left:position.x-size/2,top:position.y-86,
              },pressed&&styles.pressed]}>
              <View style={styles.islandHeader}>
                <Text style={styles.islandOrder}>{String(index+1).padStart(2,'0')} / 12</Text>
                <Text style={styles.islandMark}>{locked?'🔒':emblems[index]}</Text>
              </View>
              <View style={styles.islandTag}>
                <Text style={styles.gradeName}>{grade.title}</Text>
                <Text style={styles.islandName} numberOfLines={1}>{grade.island}</Text>
                <Text style={styles.islandCount}>{count} / 65　{locked?'マップをみる':'ぼうけんへ ›'}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" onPress={onTitles} style={styles.book}>
        <Text style={styles.bookText}>🏅 しょうごう ずかんを みる</Text>
      </Pressable>
    </View>
  );
}

function longIslandCoast(width:number,height:number): string {
  const count=17;
  const left=Array.from({length:count},(_,i)=>{
    const y=24+(height-48)*i/(count-1);
    return {x:17+9*Math.sin(i*1.7)+5*Math.cos(i*2.6),y};
  });
  const right=Array.from({length:count},(_,i)=>{
    const y=24+(height-48)*i/(count-1);
    return {x:width-17-9*Math.sin(i*2.3+1)-5*Math.cos(i*1.6),y};
  }).reverse();
  return 'M'+[...left,...right].map(p=>`${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')+' Z';
}

function IslandTerrain({gradeIndex,width,height,positions,grade,progress}: {
  gradeIndex:number;width:number;height:number;
  positions:readonly {x:number;y:number}[];grade:WorldGrade;progress:Progress;
}) {
  const p=palette[gradeIndex];
  const paths=islandRouteByKind(grade.stages,positions.map((spot,order)=>({...spot,order,row:Math.floor(order/5),column:0})));
  const next=grade.stages.findIndex(stage=>isWorldStageUnlocked(progress,stage)&&!progress.stages[stage.id]);
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" accessible={false}>
      <Defs>
        <LinearGradient id="island-water" x1="0" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#528eaf"/><Stop offset="1" stopColor="#94c9cb"/>
        </LinearGradient>
        <LinearGradient id="island-land" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={p.land}/><Stop offset=".63" stopColor={p.land}/><Stop offset="1" stopColor={p.dark}/>
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#island-water)"/>
      <OceanTexture width={width} height={height} seed={gradeIndex+3}/>
      <Path d={longIslandCoast(width,height)} transform="translate(0 10)"
        fill="#2a5f82" opacity={0.38}/>
      <Path d={longIslandCoast(width,height)}
        fill="url(#island-land)" stroke="#f7e8bb" strokeWidth={8} strokeLinejoin="round"/>
      {Array.from({length:13},(_,row)=>{
        const y=130+row*119;
        const side=row%2===0?width*0.12:width*0.82;
        return (
          <G key={row}>
            <Ellipse cx={width/2} cy={y} rx={width*0.40} ry={43}
              fill={row>=12?'#d4acd8':row>=10?'#e8d39a':p.dark} opacity={row>=10?0.32:0.18}/>
            <G transform={`translate(${side} ${y-42})`}>
              <Path d="M-23 21L-7-14 11 21Z" fill={p.detail} opacity={0.77}/>
              <Path d="M-9 21L13-27 34 21Z" fill={p.detail} opacity={0.85}/>
              <Path d="M6-12L13-27 21-9Z" fill="#fff3d8"/>
              <Path d="M-15 2L-7-14 2 3Z" fill="#e0e6df"/>
            </G>
            {Array.from({length:3},(_,k)=>{
              const tx=width*(0.15+((row*3+k*2)%7)/10);
              const ty=y+31+(k%2)*12;
              return <G key={k} transform={`translate(${tx} ${ty})`}>
                <Path d="M-3 11V0H3V11Z" fill="#795f57"/>
                <Path d="M-12 2L0-24 12 2Z" fill={p.detail}/>
                <Path d="M-9-7L0-24 5-9Z" fill="#b7e8b9" opacity={0.55}/>
              </G>;
            })}
          </G>
        );
      })}
      <Path d={routeThrough(paths.normal)}
        fill="none" stroke="#46685d" strokeWidth={15} strokeLinecap="round" opacity={0.55}/>
      <Path d={routeThrough(paths.normal)}
        fill="none" stroke="#f8e4ac" strokeWidth={10} strokeLinecap="round"/>
      <Path d={routeThrough(paths.normal)}
        fill="none" stroke="#fff9df" strokeWidth={2} strokeDasharray="3 8" strokeLinecap="round"/>
      <Path d={routeThrough(paths.extra)}
        fill="none" stroke="#705aa2" strokeWidth={10} strokeLinecap="round"/>
      <Path d={routeThrough(paths.extra)}
        fill="none" stroke="#e9d0ff" strokeWidth={2} strokeDasharray="3 7"/>
      <Path d={routeThrough(paths.secret)}
        fill="none" stroke="#8a5d87" strokeWidth={10} strokeLinecap="round"/>
      <Path d={routeThrough(paths.secret)}
        fill="none" stroke="#ffe9bb" strokeWidth={2} strokeDasharray="3 7"/>
      {next>=0 && (
        <G>
          <Circle cx={positions[next].x} cy={positions[next].y}
            r={31} fill="#ffe09d" opacity={0.37}/>
          <Circle cx={positions[next].x} cy={positions[next].y}
            r={33} stroke="#fff8bc" strokeDasharray="4 6" strokeWidth={2} fill="none"/>
        </G>
      )}
    </Svg>
  );
}

function stageText(stage:WorldStage):string {
  if(stage.kind==='normal') return String(stage.order+1).padStart(2,'0');
  if(stage.kind==='extra') return 'EX'+String(stage.order-49);
  return '秘'+String(stage.order-59);
}

export function IslandStageMap({grade,progress,onBack,onStart,onTitles}: {
  grade:WorldGrade;progress:Progress;onBack:()=>void;onStart:(stage:WorldStage)=>void;onTitles:()=>void;
}) {
  const [width,setWidth]=useState(0);
  const actual=measuredWidth(width);
  const geometry=islandStageLayout(actual,grade.stages.length);
  const stats=gradeProgress(progress,grade.id);
  const gradeIndex=worldGrades.findIndex(g=>g.id===grade.id);
  const next=grade.stages.find(stage=>isWorldStageUnlocked(progress,stage)&&!progress.stages[stage.id]);
  const marker=Math.max(46,Math.min(57,Math.floor(actual/5)-9));
  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹ 世界地図に もどる</Text>
      </Pressable>
      <View style={styles.islandBanner}>
        <View style={styles.islandBannerText}>
          <Text style={styles.eyebrow}>{grade.title} の ぼうけんマップ</Text>
          <Text style={styles.bannerHeading}>{grade.island}</Text>
          <Text style={styles.bannerDescription}>{grade.theme}</Text>
          <Text style={styles.islandBannerCount}>✦ {stats.cleared} / 65 クリア　★ {stats.perfect} パーフェクト</Text>
        </View>
        <CompanionAvatar size={88} mood={stats.mainPerfect?'clear':'ready'}/>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>✦ 挑戦できる</Text>
        <Text style={styles.legendText}>✓ クリア</Text>
        <Text style={styles.legendText}>★ パーフェクト</Text>
        <Text style={styles.legendText}>🔒 未解放</Text>
      </View>
      {next && (
        <Pressable accessibilityRole="button" onPress={()=>onStart(next)} style={styles.nextButton}>
          <Text style={styles.nextText}>✦ つづきから ぼうけんする　ステージ {stageText(next)} ›</Text>
        </Pressable>
      )}
      <View style={styles.mapHeading}>
        <Text style={styles.mapTitle}>島のぼうけんルート</Text>
        <Text style={styles.hintText}>地図の丸い地点をタッチして ステージへ進もう！</Text>
      </View>
      <View style={[styles.ocean,{height:geometry.height}]} onLayout={event=>{
        const nextWidth=Math.round(event.nativeEvent.layout.width);
        if(nextWidth>0&&nextWidth!==width)setWidth(nextWidth);
      }}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <IslandTerrain gradeIndex={gradeIndex} width={actual} height={geometry.height}
            positions={geometry.positions} grade={grade} progress={progress}/>
        </View>
        {Array.from({length:13},(_,row)=>{
          const y=geometry.positions[row*5]?.y??0;
          const label=row<10 ? grade.units[row].title : row<12 ? '✦ エクストラの道' : '✧ ひみつの道';
          return (
            <View key={row} pointerEvents="none"
              style={[styles.zoneLabel,{top:y-76,left:Math.min(14,actual*0.035)}]}>
              <Text style={styles.zoneName}>{row<10?String(row+1).padStart(2,'0')+'  ':''}{label}</Text>
            </View>
          );
        })}
        {grade.stages.map((stage,index)=>{
          const position=geometry.positions[index];
          const record=progress.stages[stage.id] as {clearedAt?:string;perfectAt?:string}|undefined;
          const unlocked=isWorldStageUnlocked(progress,stage);
          const cleared=Boolean(record?.clearedAt);
          const perfect=Boolean(record?.perfectAt||(legacy.has(stage.id)&&cleared));
          const current=unlocked&&!cleared;
          return (
            <Pressable key={stage.id} accessibilityRole="button" disabled={!unlocked}
              accessibilityState={{disabled:!unlocked}}
              accessibilityLabel={stage.title+'、'+(perfect?'パーフェクト':cleared?'クリア済み':unlocked?'挑戦できる':'未解放')}
              onPress={()=>onStart(stage)}
              style={({pressed})=>[
                styles.stagePin,stage.kind==='extra'&&styles.extraPin,stage.kind==='secret'&&styles.secretPin,
                !unlocked&&styles.lockedPin,cleared&&styles.clearedPin,perfect&&styles.perfectPin,
                current&&styles.currentPin,pressed&&styles.pressed,
                {width:marker,height:marker,left:position.x-marker/2,top:position.y-marker/2},
              ]}>
              <Text style={[styles.stageNumber,!unlocked&&styles.lockedNumber,stage.kind!=='normal'&&styles.specialNumber]}>
                {stageText(stage)}
              </Text>
              {perfect&&<Text style={styles.pinStar}>★</Text>}
              {cleared&&!perfect&&<Text style={styles.pinCheck}>✓</Text>}
              {!unlocked&&<Text style={styles.pinLock}>●</Text>}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>✦ この島には 65のステージ</Text>
        <Text style={styles.footerInfo}>通常ステージ 50こ → EX 10こ → ひみつ 5こ。ひみつの道は通常とEXの60ステージをぜんぶパーフェクトにすると開くよ。</Text>
        <Text style={styles.footerInfo}>ひみつの道まで パーフェクト：{grade.stages.slice(0,60).filter(stage=>{
          const r=progress.stages[stage.id] as {perfectAt?:string;clearedAt?:string}|undefined;
          return Boolean(r?.perfectAt||(legacy.has(stage.id)&&r?.clearedAt));
        }).length} / 60</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onTitles} style={styles.book}>
        <Text style={styles.bookText}>🏅 しょうごう ずかんを みる</Text>
      </Pressable>
    </View>
  );
}

const styles=StyleSheet.create({
  screen:{gap:13},
  worldBanner:{borderRadius:20,padding:18,gap:8,backgroundColor:'#253354'},
  islandBanner:{borderRadius:20,padding:16,flexDirection:'row',alignItems:'center',backgroundColor:'#283d69',gap:8},
  islandBannerText:{flex:1,gap:5},
  eyebrow:{color:'#f7d799',fontWeight:'900',fontSize:13},
  bannerHeading:{color:'#fff8df',fontWeight:'900',fontSize:28},
  bannerDescription:{color:'#dfe7f7',fontSize:14,lineHeight:22},
  islandBannerCount:{color:'#e9d4a9',fontWeight:'800',fontSize:13,marginTop:4},
  stats:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:4},
  stat:{color:'#f9edc8',fontWeight:'900',fontSize:14,backgroundColor:'#3e5479',paddingHorizontal:10,paddingVertical:7,borderRadius:11},
  mapHeading:{gap:4,paddingHorizontal:4},
  mapTitle:{color:'#2b395e',fontWeight:'900',fontSize:19},
  hintText:{color:'#5c657d',fontSize:13,lineHeight:20},
  ocean:{borderRadius:22,backgroundColor:'#548cab',overflow:'hidden',position:'relative',borderWidth:3,borderColor:'#d1dbdd'},
  islandTarget:{position:'absolute',height:177,alignItems:'center',justifyContent:'space-between',paddingVertical:6},
  islandHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'81%',backgroundColor:'#edf0de',paddingHorizontal:8,paddingVertical:3,borderRadius:10,opacity:0.95},
  islandOrder:{color:'#445a66',fontSize:11,fontWeight:'900'},
  islandMark:{color:'#b98533',fontWeight:'900',fontSize:13},
  islandTag:{width:'100%',backgroundColor:'#fff9e9',borderRadius:11,paddingVertical:7,paddingHorizontal:6,alignItems:'center',borderWidth:2,borderColor:'#e5cda0',
    shadowColor:'#153958',shadowOpacity:0.18,shadowRadius:4,shadowOffset:{width:0,height:3}},
  gradeName:{fontSize:12,color:'#646079',fontWeight:'900'},
  islandName:{fontSize:14,color:'#2c3d5e',fontWeight:'900',textAlign:'center'},
  islandCount:{fontSize:11,color:'#457a73',fontWeight:'800',marginTop:2},
  book:{minHeight:47,padding:12,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:'#f1d18b'},
  bookText:{color:'#433d60',fontSize:15,fontWeight:'900'},
  back:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',paddingHorizontal:6},
  backText:{color:'#345d80',fontSize:15,fontWeight:'900'},
  legend:{flexDirection:'row',flexWrap:'wrap',gap:7,alignItems:'center'},
  legendText:{backgroundColor:'#e7eaf1',color:'#485779',paddingVertical:5,paddingHorizontal:8,borderRadius:9,fontSize:12,fontWeight:'800'},
  nextButton:{minHeight:49,justifyContent:'center',alignItems:'center',padding:11,borderRadius:13,backgroundColor:'#f4d188',borderWidth:2,borderColor:'#d19e56'},
  nextText:{color:'#544268',fontWeight:'900',fontSize:15,textAlign:'center'},
  zoneLabel:{position:'absolute',paddingVertical:5,paddingHorizontal:9,backgroundColor:'#fff8dd',borderRadius:9,borderWidth:1,borderColor:'#ecdfb3',maxWidth:'90%'},
  zoneName:{color:'#545078',fontWeight:'900',fontSize:13},
  stagePin:{position:'absolute',borderRadius:50,backgroundColor:'#fffaf0',borderWidth:3,borderColor:'#d2ae66',
    alignItems:'center',justifyContent:'center',shadowColor:'#24445b',shadowOpacity:0.25,shadowRadius:3,shadowOffset:{width:0,height:2}},
  extraPin:{backgroundColor:'#f5e6ff',borderColor:'#8b75c0'},
  secretPin:{backgroundColor:'#fce4ed',borderColor:'#d89bba'},
  lockedPin:{backgroundColor:'#d1d5dc',borderColor:'#899ba8',opacity:0.9},
  clearedPin:{backgroundColor:'#c1eedc',borderColor:'#3b9985'},
  perfectPin:{backgroundColor:'#ffeda5',borderColor:'#d7a444'},
  currentPin:{borderColor:'#ffdf8c',backgroundColor:'#fff9d6',borderWidth:4},
  stageNumber:{color:'#354469',fontSize:15,fontWeight:'900'},
  specialNumber:{fontSize:12},
  lockedNumber:{color:'#747f8c'},
  pinStar:{position:'absolute',top:-11,right:-4,fontSize:18,color:'#ce9030',fontWeight:'900'},
  pinCheck:{position:'absolute',top:-9,right:-4,fontSize:16,color:'#368c78',fontWeight:'900'},
  pinLock:{position:'absolute',bottom:1,fontSize:5,color:'#6d7c91'},
  footer:{padding:14,gap:7,backgroundColor:'#fff9e7',borderRadius:15,borderWidth:1,borderColor:'#e9dbb9'},
  footerTitle:{color:'#4f4775',fontWeight:'900',fontSize:17},
  footerInfo:{color:'#54566d',fontSize:13,lineHeight:21},
  pressed:{opacity:0.65,transform:[{scale:0.97}]},
});
