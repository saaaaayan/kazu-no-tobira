import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { CompanionAvatar } from './AdventureCompanion';
import { allWorldStages, hasGeneratedWorldQuestions, isPlannedIsland, worldIslands, type WorldGrade, type WorldStage } from '../domain/worldCatalog';
import { hasPremium, type Entitlement } from '../domain/accessPlan';
import { gradeProgress, isIslandUnlocked, unlockSummary } from '../domain/worldProgress';
import { worldStageAction, type PlayMode } from '../domain/playMode';
import { checkpointsFor, stageDisplayTitle, stageLabels, type Checkpoint } from '../domain/stageStructure';
import { PRESCHOOL_MAP_TITLE_INSET, compactIslandStageMap, islandCheckpointLayout, islandRouteByKind, islandStageLayout, routeThrough } from '../domain/worldMapLayout';
import { approvedWorldMapDimensions, approvedWorldMapHotspots, approvedWorldMapImageUrl } from '../domain/approvedWorldMap';
import { hasStageBank } from '../domain/questionBank';
import type { Progress } from '../domain/progress';
import { lessonStatus, unitLessons, type UnitLesson } from '../domain/unitLessons';
import { featureAccess } from '../domain/accessPlan';
import { uiPreviewSampleKind } from '../domain/uiPreviewRound';
import { stageCategoryName, stageRowCategoryName } from '../domain/islandCurriculumView';
import { IslandCurriculumPanel } from './IslandCurriculumPanel';
import { PreschoolPixelTerrain } from './PreschoolPixelTerrain';

const palette = [
  { land: '#b6d793', dark: '#609d77', detail: '#306d6e', roof: '#efb6a0' },
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
  { land: '#8676b6', dark: '#474066', detail: '#2c284d', roof: '#f9d28b' },
  { land: '#cc9b76', dark: '#925a59', detail: '#57364d', roof: '#ffe2a1' },
  { land: '#a1addc', dark: '#4f5f96', detail: '#354172', roof: '#a9ebed' },
] as const;
const legacy = new Set(['e1.forest','e1.bridge','e1.tower']);

function measuredWidth(width: number) {
  return Math.max(244, width || 360);
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

export function WorldMap780({ progress, mode, access, onGrade, onTitles, preview = false }: {
  progress: Progress; mode: PlayMode; access: Entitlement;
  onGrade: (grade: WorldGrade) => void; onTitles: () => void; preview?: boolean;
}) {
  const [width,setWidth]=useState(0);
  const [zoomed,setZoomed]=useState(true);
  const [showIslandList,setShowIslandList]=useState(false);
  const {compact,imageWidth,imageHeight}=approvedWorldMapDimensions(width,zoomed);
  const testing=mode==='test';
  const summary=unlockSummary(progress);
  const stats=worldIslands.map(grade=>gradeProgress(progress,grade.id));
  const available=worldIslands.map(grade=>preview || (!isPlannedIsland(grade.id) &&
    (grade.id!=='sage'||hasPremium(access)) && (testing||isIslandUnlocked(progress,grade.id))));
  const current=testing?-1:available.findIndex((open,index)=>open&&worldIslands[index].id!=='sage'&&stats[index].regularCleared<50);
  const islandAction=(grade:WorldGrade,index:number)=>{
    if(preview)return '地図をみる';
    if(isPlannedIsland(grade.id))return '教材を準備中';
    if(grade.id==='sage'&&!hasPremium(access))return 'プレミアム限定';
    if(testing)return '自由にプレイ';
    if(index===current)return 'つぎの目的地';
    return available[index]?'ぼうけんへ':'未解放・地図をみる';
  };
  return <View style={styles.screen}>
    <View style={styles.worldBanner}>
      <Text accessibilityRole="header" style={styles.bannerHeading}>数のトビラの世界地図</Text>
      <Text style={styles.bannerDescription}>01から16へ、点線にそって進もう。島をタップすると学習マップが開くよ。</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>{worldIslands.length}の島 · {allWorldStages.length.toLocaleString('ja-JP')}地点</Text>
        {!testing&&<Text style={styles.stat}>{summary.cleared} / 780 クリア</Text>}
      </View>
    </View>
    <View style={styles.worldMapControls}>
      <Text style={styles.hintText}>{compact
        ? zoomed?'地図を左右にスワイプして島を見つけよう。':'16島の全体図。島をタップして進もう。'
        : '地図のイラストや島の名前をクリックして進もう。'}</Text>
      {compact&&<Pressable accessibilityRole="button" accessibilityLabel={zoomed?'地図全体を表示する':'地図を拡大する'}
        onPress={()=>setZoomed(value=>!value)} style={styles.mapZoomToggle}>
        <Text style={styles.mapZoomText}>{zoomed?'全体を見る':'拡大して見る'}</Text>
      </Pressable>}
    </View>
    <View style={[styles.atlas,{height:imageHeight}]} onLayout={event=>{
      const next=Math.round(event.nativeEvent.layout.width);
      if(next>0&&next!==width)setWidth(next);
    }}>
      <ScrollView horizontal scrollEnabled={compact&&zoomed}
        showsHorizontalScrollIndicator={compact&&zoomed}
        contentContainerStyle={{width:imageWidth,height:imageHeight}}
        style={{height:imageHeight}} nestedScrollEnabled>
        <View style={{width:imageWidth,height:imageHeight}}>
          <Image source={{uri:approvedWorldMapImageUrl}} resizeMode="stretch"
            accessibilityLabel="16島それぞれのテーマを幾何学的な線画で描いた、数のトビラの世界地図"
            style={{width:imageWidth,height:imageHeight}} />
          {worldIslands.map((grade,index)=>{
            const spot=approvedWorldMapHotspots[index];
            const label=islandAction(grade,index);
            return <Pressable key={grade.id} testID={'approved-world-island-'+grade.id}
              accessibilityRole="button"
              accessibilityLabel={String(index+1).padStart(2,'0')+' '+grade.title+' '+grade.island+'、'+label}
              onPress={()=>onGrade(grade)}
              style={({pressed})=>[styles.approvedMapTarget,{
                left:imageWidth*(spot.x-.099),
                top:imageHeight*(spot.y-.094),
                width:imageWidth*.198,
                height:imageHeight*.188,
              },pressed&&styles.approvedMapTargetPressed]}>
              <View />
            </Pressable>;
          })}
        </View>
      </ScrollView>
    </View>
    {compact&&<View style={styles.mobileWorldList}>
      <Pressable accessibilityRole="button" testID="approved-world-list-toggle"
        onPress={()=>setShowIslandList(value=>!value)}
        accessibilityState={{expanded:showIslandList}} style={styles.worldListToggle}>
        <Text style={styles.worldListToggleText}>{showIslandList?'島の一覧をとじる ▲':'16島の一覧から選ぶ ▼'}</Text>
      </Pressable>
      {showIslandList&&<View style={styles.worldListGrid}>
        {worldIslands.map((grade,index)=><Pressable key={grade.id} accessibilityRole="button"
          testID={'world-list-'+grade.id}
          accessibilityLabel={String(index+1).padStart(2,'0')+' '+grade.title+' '+grade.island}
          onPress={()=>onGrade(grade)} style={styles.worldListItem}>
          <Text style={styles.worldListItemText}>{String(index+1).padStart(2,'0')}　{grade.island}</Text>
          <Text style={styles.worldListGradeText}>{grade.title}</Text>
        </Pressable>)}
      </View>}
    </View>}
    {!testing&&<Pressable accessibilityRole="button" onPress={onTitles} style={styles.book}>
      <Text style={styles.bookText}>しょうごう ずかんを みる</Text>
    </Pressable>}
  </View>;
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

function IslandTerrain({gradeIndex,width,height,positions,grade,next}: {
  gradeIndex:number;width:number;height:number;
  positions:readonly {x:number;y:number}[];grade:WorldGrade;next:number;
}) {
  if (grade.id === 'preschool') {
    return <PreschoolPixelTerrain width={width} height={height} positions={positions} grade={grade} next={next}/>;
  }
  const p=palette[gradeIndex];
  const paths=islandRouteByKind(grade.stages,positions.map((spot,order)=>({...spot,order,row:Math.floor(order/5),column:0})));
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
  if (stage.gradeId === 'sage' && stage.order === 49) return '♜50';
  if (stage.gradeId === 'sage' && stage.kind === 'normal' && (stage.order+1)%5 === 0) return '◇' + (stage.order+1);
  if(stage.kind==='normal') return String(stage.order+1).padStart(2,'0');
  if(stage.kind==='extra') return '試'+String(stage.order-49);
  return '伝'+String(stage.order-59);
}

export function IslandStageMap({grade,progress,mode,access,onBack,onStart,onTitles,onLearn,onCheckpoint,preview=false}: {
  grade:WorldGrade;progress:Progress;mode:PlayMode;access:Entitlement;onBack:()=>void;onStart:(stage:WorldStage)=>void;onTitles:()=>void;
  onLearn:(lesson:UnitLesson)=>void;
  onCheckpoint:(item:Checkpoint)=>void;
  preview?:boolean;
}) {
  const [width,setWidth]=useState(0);
  const actual=measuredWidth(width);
  const compactStageMap=compactIslandStageMap(actual);
  const geometry=islandStageLayout(actual,grade.stages.length,
    grade.id==='preschool'?PRESCHOOL_MAP_TITLE_INSET:0);
  const stats=gradeProgress(progress,grade.id);
  const gradeIndex=worldIslands.findIndex(g=>g.id===grade.id);
  const testing = mode === 'test';
  const next = testing ? undefined : grade.stages.find(stage => ['play', 'learn'].includes(worldStageAction(mode, progress, stage, access)) && !progress.stages[stage.id]);
  const lessons = unitLessons.filter(lesson => lesson.grade === grade.id);
  const marker=Math.max(46,Math.min(57,Math.floor(actual/5)-9));
  const previewStage=preview ? grade.stages.find(stage=>Boolean(uiPreviewSampleKind(stage)) || hasStageBank(stage.id)) : undefined;
  const curriculumAvailability=(stage:WorldStage)=>{
    const action=worldStageAction(mode,progress,stage,access);
    if(preview){
      const ready=Boolean(uiPreviewSampleKind(stage))||hasStageBank(stage.id);
      return {enabled:ready,label:ready?'▶ あそぶ':'準備中'};
    }
    return {enabled:['play','learn','premium'].includes(action),
      label:action==='premium'?'プレミアム':action==='play'?'▶ あそぶ'
        :action==='learn'?'まず学ぶ':'未解放'};
  };
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
          <Text style={styles.islandBannerCount}>{preview ? (grade.stages.some(stage=>hasStageBank(stage.id))
            ? '問題がある '+grade.stages.filter(stage=>hasStageBank(stage.id)).length+'ステージを あそべるよ'
            : '65ステージと10か所の確認テスト · サンプル表示') : isPlannedIsland(grade.id) ? '教材を準備中 · 65地点' : grade.id === 'sage' ? (testing || isIslandUnlocked(progress, grade.id)
            ? `${grade.stages.filter(stage => hasStageBank(stage.id)).length} / 65 地点で出題中` : '高校3年生の冒険の道50・試練の道10をクリアすると解放') : testing ? (hasPremium(access) ? "65ステージ すべてプレイできるよ" : "冒険の道50ステージを 自由に あそべるよ") : `✦ ${stats.cleared} / 65 クリア　★ ${stats.perfect} パーフェクト`}</Text>
        </View>
        <CompanionAvatar size={88} mood={stats.mainPerfect?'clear':'ready'}/>
      </View>
      <IslandCurriculumPanel grade={grade} onStart={onStart} availability={curriculumAvailability}/>
      {preview && <View style={styles.previewCard}>
        {previewStage ? <>
          <Text accessibilityRole="header" style={styles.previewHeading}>{hasStageBank(previewStage.id)
            ? 'このステージから あそぼう！' : 'まずは ここから！'}</Text>
          <Pressable accessibilityRole="button" testID="kazu-preview-first-stage"
            accessibilityLabel={'ステージ '+stageText(previewStage)+' を はじめる'}
            onPress={()=>onStart(previewStage)}
            style={({pressed})=>[styles.previewStart,pressed&&styles.pressed]}>
            <Text style={styles.previewStartText}>▶ ステージ {stageText(previewStage)} {hasStageBank(previewStage.id)?'を はじめる':'を はじめる'}</Text>
          </Pressable>
          <Text style={styles.hintText}>{hasStageBank(previewStage.id)
            ? '100問のなかから、10問ずつ ちょうせんできるよ！'
            : 'えを みて、さわって、かぞえてみよう。'}</Text>
        </> : <>
          <Text style={styles.previewHeading}>このしまの もんだいは じゅんびちゅう</Text>
          <Text style={styles.hintText}>いまは ちずを みられるよ。ほかの しまも みてみよう。</Text>
        </>}
      </View>}
      {!preview && lessons.length > 0 && <View style={styles.studyCard}>
        <Text accessibilityRole="header" style={styles.mapTitle}>ルミと まなぶ</Text>
        {lessons.map(lesson => {
          const status = testing ? 'not-started' : lessonStatus(progress.lessons?.[lesson.id]);
          const first = grade.stages.find(stage => lesson.linkedStageIds.includes(stage.id));
          const action = first && worldStageAction(mode, progress, first, access);
          return <View key={lesson.id} style={styles.studyEntry}>
            <Text style={styles.mapTitle}>{lesson.title}</Text>
            <Text style={styles.hintText}>
              {featureAccess.unitLessons === 'free' ? 'むりょう　·　' : ''}
              {status === 'completed' ? 'がくしゅうずみ' : status === 'in-progress' ? 'がくしゅうの とちゅう' : lesson.summary}
            </Text>
            <View style={styles.studyButtons}>
              <Pressable accessibilityRole="button" onPress={()=>onLearn(lesson)} style={styles.studyButton}>
                <Text style={styles.studyButtonText}>{status === 'completed' ? 'がくしゅうを みなおす' : status === 'in-progress' ? 'がくしゅうの つづき' : 'まず まなぼう'}</Text>
              </Pressable>
              {first && action === 'play' && <Pressable accessibilityRole="button" onPress={()=>onStart(first)} style={styles.studyStage}>
                <Text style={styles.nextText}>ステージもんだいへ</Text>
              </Pressable>}
            </View>
          </View>;
        })}
      </View>}
      {preview && <View style={styles.legend}>
        <Text style={styles.legendText}>✦ あそべる</Text>
        {grade.stages.some(stage=>hasStageBank(stage.id)) &&
          <Text style={styles.legendText}>◆ 100問から10問ずつ</Text>}
        <Text style={styles.legendText}>● じゅんびちゅう</Text>
      </View>}
      {!preview && !testing && <View style={styles.legend}>
        <Text style={styles.legendText}>✦ 挑戦できる</Text>
        <Text style={styles.legendText}>✓ クリア</Text>
        <Text style={styles.legendText}>★ パーフェクト</Text>
        <Text style={styles.legendText}>🔒 未解放</Text>
      </View>}
      {next && (
        <Pressable accessibilityRole="button" onPress={()=>onStart(next)} style={styles.nextButton}>
          <Text style={styles.nextText}>✦ {worldStageAction(mode, progress, next, access) === 'learn' ? 'まず まなぼう' : 'つづきから ぼうけんする'}　ステージ {stageText(next)} ›</Text>
        </Pressable>
      )}
      <View style={styles.mapHeading}>
        <Text style={styles.mapTitle}>島のぼうけんルート</Text>
        <Text style={styles.hintText}>地図の丸い地点をタッチして ステージへ進もう！</Text>
        {grade.id==='preschool' && <Text style={styles.pixelMapNote}>ドットえの ぬいぐるみたちが いっぱい！</Text>}
      </View>
      <View style={[styles.ocean,grade.id==='preschool'&&styles.pixelOcean,{height:geometry.height}]} onLayout={event=>{
        const nextWidth=Math.round(event.nativeEvent.layout.width);
        if(nextWidth>0&&nextWidth!==width)setWidth(nextWidth);
      }}>
        <View pointerEvents="none" testID={grade.id==='preschool'?'preschool-plush-pixel-v2':undefined}
          style={StyleSheet.absoluteFill}>
          <IslandTerrain gradeIndex={gradeIndex} width={actual} height={geometry.height}
            positions={geometry.positions} grade={grade} next={next?.order ?? -1}/>
        </View>
        {grade.id==='preschool' && (
          <View testID="preschool-map-top-title" pointerEvents="none"
            style={styles.preschoolMapTopTitle}>
            <Text style={styles.preschoolMapTopGrade}>就学前</Text>
            <Text style={styles.preschoolMapTopName}>ぬいぐるみの島</Text>
          </View>
        )}
        {/* Only one banner per adventure area. Normal = stages 01–50,
            trial = 51–60, legend = 61–65; all stage nodes remain clickable. */}
        {([
          {row:0,title:stageLabels.normal,count:50,kind:'normal'},
          {row:10,title:stageLabels.extra,count:10,kind:'extra'},
          {row:12,title:stageLabels.secret,count:5,kind:'secret'},
        ] as const).map(area=>{
          const y=geometry.positions[area.row*5]?.y??0;
          const inset=Math.min(78,Math.max(20,Math.round(actual*.06)));
          return (
            <View key={area.kind} testID={'island-area-'+area.kind} pointerEvents="none"
              style={[
                styles.zoneLabel,
                grade.id==='preschool'&&styles.pixelZoneLabel,
                area.kind==='extra'&&styles.extraAreaLabel,
                area.kind==='secret'&&styles.secretAreaLabel,
                {top:y-60,left:inset,right:inset,alignItems:'center'},
              ]}>
              <Text style={[
                styles.zoneName,grade.id==='preschool'&&styles.pixelZoneName,
              ]}>{area.title}　{area.count}ステージ</Text>
            </View>
          );
        })}
        {/* One lesson topic per five-stage row on BOTH phones and desktops.
            Repeating the same subtitle at every pin crowds the map. The
            individual stage names remain in each pin's accessibility label. */}
        {Array.from({length:Math.ceil(grade.stages.length/5)},(_,row)=>{
          const position=geometry.positions[row*5];
          return <View key={'row-topic-'+row} testID={'island-row-topic-'+row}
            pointerEvents="none" style={[styles.compactRowTopic,{
              top:position.y+marker/2+(compactStageMap?13:7),
              // Reserve edge lanes for the checkpoint controls.
              left:Math.max(68,Math.ceil(actual*.16)),
              right:Math.max(68,Math.ceil(actual*.16)),
            }]}>
            <Text numberOfLines={2} style={styles.compactRowTopicText}>
              {stageRowCategoryName(grade,row)}
            </Text>
          </View>;
        })}
        {checkpointsFor(grade).map(checkpoint=>{
          const end=geometry.positions[checkpoint.after.order];
          // 試作版は幼児の確認テスト1のみ選択可。ほかは従来どおり。
          const enabled=preview ? grade.id==='preschool' && checkpoint.number===1
            : testing || checkpoint.sourceStageIds.every(id=>Boolean(progress.stages[id]?.clearedAt));
          const nextPoint=geometry.positions[checkpoint.after.order+1];
          const checkpointLayout=islandCheckpointLayout(actual,end,marker,nextPoint);
          return <Pressable key={checkpoint.id} accessibilityRole="button"
            testID={'island-checkpoint-'+checkpoint.number}
            accessibilityLabel={'確認テスト '+checkpoint.number+(enabled?' を はじめる':' は準備中')} disabled={!enabled} onPress={()=>onCheckpoint(checkpoint)}
            style={{position:'absolute',left:checkpointLayout.left,top:checkpointLayout.top,
              width:checkpointLayout.width,height:checkpointLayout.height,
              borderRadius:grade.id==='preschool'?3:10,
              justifyContent:'center',alignItems:'center',
              backgroundColor:grade.id==='preschool'
                ? (enabled?'#f3e5b9':'#d9dfdf')
                : (enabled?'#fff0b5':'#d2d9e9'),
              borderWidth:grade.id==='preschool'?2:1,
              borderColor:grade.id==='preschool'?'#344454':'#66769a'}}>
            <Text style={{fontSize:checkpointLayout.compact?12:11,fontWeight:'800',color:'#263453'}}>
              {checkpointLayout.compact?'テスト':'確認テスト'}
            </Text>
            <Text style={{fontSize:11,color:'#263453'}}>{checkpoint.number}</Text>
          </Pressable>;
        })}
        {grade.stages.map((stage,index)=>{
          const position=geometry.positions[index];
          const record=(testing ? undefined : progress.stages[stage.id]) as {clearedAt?:string;perfectAt?:string}|undefined;
          const action=worldStageAction(mode,progress,stage,access);
          const unlocked=preview ? Boolean(uiPreviewSampleKind(stage)) || hasStageBank(stage.id) : action === 'play' || action === 'learn';
          const selectable=preview ? unlocked : unlocked || action === 'premium';
          const cleared=Boolean(record?.clearedAt);
          const perfect=Boolean(record?.perfectAt||(legacy.has(stage.id)&&cleared));
          const current=stage.id===next?.id;
          return (
            <Pressable key={stage.id} accessibilityRole="button" disabled={!selectable}
              accessibilityState={{disabled:!selectable}}
              accessibilityLabel={stageDisplayTitle(stage)+'、単元 '+stageCategoryName(grade,stage)+'、'+(preview ? (hasStageBank(stage.id) ? '100問のなかから10問ずつ あそべる' : uiPreviewSampleKind(stage) ? 'サンプル問題' : '体験用問題は準備中') : action === 'premium' ? 'プレミアム限定' : perfect?'パーフェクト':cleared?'クリア済み':action === 'learn' ? 'まず まなぼう' : unlocked?'挑戦できる':!hasGeneratedWorldQuestions(stage.gradeId) && !hasStageBank(stage.id) ? '問題を準備中' : '未解放')}
              onPress={()=>onStart(stage)}
              style={({pressed})=>[
                styles.stagePin,grade.id==='preschool'&&styles.pixelStagePin,stage.kind==='extra'&&styles.extraPin,stage.kind==='secret'&&styles.secretPin,
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
      {!testing && <View style={styles.footer}>
        <Text style={styles.footerTitle}>✦ この島には 65のステージ</Text>
        <Text style={styles.footerInfo}>冒険の道 50こ → 試練の道 10こ → 伝説のトビラ 5こ。伝説のトビラは最初の60ステージをぜんぶパーフェクトにすると開くよ。</Text>
        <Text style={styles.footerInfo}>伝説のトビラまで パーフェクト：{grade.stages.slice(0,60).filter(stage=>{
          const r=progress.stages[stage.id] as {perfectAt?:string;clearedAt?:string}|undefined;
          return Boolean(r?.perfectAt||(legacy.has(stage.id)&&r?.clearedAt));
        }).length} / 60</Text>
      </View>}
      {!testing && <Pressable accessibilityRole="button" onPress={onTitles} style={styles.book}>
        <Text style={styles.bookText}>🏅 しょうごう ずかんを みる</Text>
      </Pressable>}
    </View>
  );
}

const styles=StyleSheet.create({
  screen:{gap:13},
  worldBanner:{borderRadius:20,padding:18,gap:8,backgroundColor:'#263b51'},
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
  pixelMapNote:{color:'#536c57',fontSize:14,fontWeight:'800'},
  pixelOcean:{borderRadius:9,backgroundColor:'#80adc4',borderWidth:4,borderColor:'#344454'},
  preschoolMapTopTitle:{position:'absolute',top:18,left:40,right:40,height:58,
    backgroundColor:'#f5edce',borderWidth:2,borderColor:'#7e9a73',
    borderRadius:2,alignItems:'center',justifyContent:'center',gap:2},
  preschoolMapTopGrade:{color:'#526651',fontWeight:'900',fontSize:12,lineHeight:16,textAlign:'center'},
  preschoolMapTopName:{color:'#344454',fontWeight:'900',fontSize:20,lineHeight:24,textAlign:'center'},
  atlas:{borderRadius:22,backgroundColor:'#244e68',overflow:'hidden',position:'relative',borderWidth:1,borderColor:'#4e7180'},
  worldMapControls:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,paddingHorizontal:4},
  mapZoomToggle:{paddingVertical:9,paddingHorizontal:11,minHeight:39,borderRadius:10,backgroundColor:'#e7e6db',
    borderWidth:1,borderColor:'#a3afad'},
  mapZoomText:{color:'#30516a',fontWeight:'900',fontSize:12},
  approvedMapTarget:{position:'absolute',borderRadius:10,minWidth:35,minHeight:39},
  approvedMapTargetPressed:{backgroundColor:'rgba(244,236,206,.25)',borderWidth:2,borderColor:'#eadbbd'},
  mobileWorldList:{gap:8},
  worldListToggle:{padding:12,minHeight:44,backgroundColor:'#e4e9e9',borderRadius:10,alignItems:'center'},
  worldListToggleText:{color:'#304c65',fontWeight:'900',fontSize:14},
  worldListGrid:{flexDirection:'row',flexWrap:'wrap',gap:7},
  worldListItem:{width:'48%',minHeight:56,flexGrow:1,borderRadius:10,
    backgroundColor:'#f2efe1',borderColor:'#b6c3c1',borderWidth:1,padding:10,justifyContent:'center',gap:4},
  worldListItemText:{color:'#25445c',fontWeight:'900',fontSize:13},
  worldListGradeText:{color:'#6a7580',fontWeight:'700',fontSize:11},
  atlasTarget:{position:'absolute',minHeight:114,paddingTop:61,alignItems:'stretch'},
  islandTag:{backgroundColor:'#f3f1e5',borderRadius:9,paddingVertical:6,paddingHorizontal:5,alignItems:'center',borderWidth:1,
    borderColor:'#bbb7a5',shadowColor:'#0e2d48',shadowOpacity:0.14,shadowRadius:3,shadowOffset:{width:0,height:2}},
  islandTagCurrent:{backgroundColor:'#eee8cb',borderColor:'#c1ae79',borderWidth:2},
  gradeName:{fontSize:10,color:'#566471',fontWeight:'800',lineHeight:14,textAlign:'center'},
  islandName:{fontSize:13,color:'#213950',fontWeight:'900',textAlign:'center',lineHeight:18},
  islandCount:{fontSize:10,color:'#3c625b',fontWeight:'800',textAlign:'center',lineHeight:14},
  book:{minHeight:47,padding:12,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:'#f1d18b'},
  bookText:{color:'#433d60',fontSize:15,fontWeight:'900'},
  back:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',paddingHorizontal:6},
  backText:{color:'#345d80',fontSize:15,fontWeight:'900'},
  studyCard:{borderRadius:18,backgroundColor:'#fff2ce',borderWidth:1,borderColor:'#e5c682',padding:15,gap:9},
  previewCard:{borderRadius:17,backgroundColor:'#fff6dc',borderWidth:2,borderColor:'#d7ad5a',padding:15,gap:9},
  previewHeading:{color:'#29446e',fontWeight:'900',fontSize:18},
  previewStart:{minHeight:58,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'#245e89',paddingHorizontal:15,paddingVertical:12},
  previewStartText:{color:'#ffffff',fontWeight:'900',fontSize:20,textAlign:'center'},
  studyEntry:{backgroundColor:'#fffaf0',borderRadius:12,padding:12,gap:8},
  studyButtons:{flexDirection:'row',flexWrap:'wrap',gap:8},
  studyButton:{backgroundColor:'#3f548f',minHeight:46,justifyContent:'center',paddingHorizontal:12,borderRadius:10},
  studyStage:{backgroundColor:'#f3d896',minHeight:46,justifyContent:'center',paddingHorizontal:12,borderRadius:10},
  studyButtonText:{color:'#fff',fontSize:15,fontWeight:'900'},
  legend:{flexDirection:'row',flexWrap:'wrap',gap:7,alignItems:'center'},
  legendText:{backgroundColor:'#e7eaf1',color:'#485779',paddingVertical:5,paddingHorizontal:8,borderRadius:9,fontSize:12,fontWeight:'800'},
  nextButton:{minHeight:49,justifyContent:'center',alignItems:'center',padding:11,borderRadius:13,backgroundColor:'#f4d188',borderWidth:2,borderColor:'#d19e56'},
  nextText:{color:'#544268',fontWeight:'900',fontSize:15,textAlign:'center'},
  zoneLabel:{position:'absolute',paddingVertical:5,paddingHorizontal:9,backgroundColor:'#fff8dd',borderRadius:9,borderWidth:1,borderColor:'#ecdfb3',maxWidth:'90%'},
  zoneName:{color:'#545078',fontWeight:'900',fontSize:13},
  pixelZoneLabel:{borderRadius:2,backgroundColor:'#f5edce',borderWidth:2,borderColor:'#d9caa6'},
  extraAreaLabel:{backgroundColor:'#e0eae5',borderColor:'#90b4a8'},
  secretAreaLabel:{backgroundColor:'#eee2e9',borderColor:'#b39aaa'},
  pixelZoneName:{color:'#344454'},
  pinCategoryBox:{position:'absolute',borderRadius:5,paddingHorizontal:2,paddingVertical:1,
    backgroundColor:'rgba(255,250,228,0.92)',alignItems:'center',justifyContent:'center'},
  pinCategoryText:{fontSize:10,fontWeight:'800',color:'#314661',textAlign:'center',lineHeight:12},
  compactRowTopic:{position:'absolute',alignItems:'center',justifyContent:'center',
    paddingHorizontal:4,paddingVertical:4,borderRadius:4,backgroundColor:'rgba(248,239,211,0.96)'},
  compactRowTopicText:{color:'#344454',fontWeight:'900',fontSize:13,lineHeight:17,textAlign:'center'},
  pixelCategoryBox:{borderRadius:1,backgroundColor:'rgba(247,238,207,0.94)'},
  pixelCategoryText:{color:'#344454'},
  stagePin:{position:'absolute',borderRadius:50,backgroundColor:'#fffaf0',borderWidth:3,borderColor:'#d2ae66',
    alignItems:'center',justifyContent:'center',shadowColor:'#24445b',shadowOpacity:0.25,shadowRadius:3,shadowOffset:{width:0,height:2}},
  pixelStagePin:{borderColor:'#344454',borderRadius:50,shadowOpacity:0,backgroundColor:'#fff8e2'},
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
