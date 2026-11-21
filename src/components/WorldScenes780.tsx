import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, {G,Rect} from 'react-native-svg';
import { CompanionAvatar } from './AdventureCompanion';
import { allWorldStages, hasGeneratedWorldQuestions, isPlannedIsland, worldIslands, type WorldGrade, type WorldStage } from '../domain/worldCatalog';
import { hasPremium, type Entitlement } from '../domain/accessPlan';
import { gradeProgress, isIslandUnlocked, unlockSummary } from '../domain/worldProgress';
import { worldStageAction, type PlayMode } from '../domain/playMode';
import { checkpointsFor, stageDisplayTitle, stageLabels, type Checkpoint } from '../domain/stageStructure';
import { PRESCHOOL_MAP_TITLE_INSET, compactIslandStageMap, islandCheckpointLayout, preschoolStageLabelLayout, islandStageLayout } from '../domain/worldMapLayout';
import { approvedWorldMapDimensions, approvedWorldMapHotspots, approvedWorldMapImageUrl } from '../domain/approvedWorldMap';
import { hasStageBank } from '../domain/questionBank';
import type { Progress } from '../domain/progress';
import { lessonStatus, unitLessons, type UnitLesson } from '../domain/unitLessons';
import { featureAccess } from '../domain/accessPlan';
import { uiPreviewSampleKind } from '../domain/uiPreviewRound';
import { stageCategoryName, stageRowCategoryName } from '../domain/islandCurriculumView';
import { preschoolStageMapInfo } from '../domain/preschoolStageMapInfo';
import { gradeOnePreviewStageInfo } from '../domain/gradeOnePreviewCurriculum';

import { IslandCurriculumPanel } from './IslandCurriculumPanel';
import { PreschoolPixelTerrain, ToyPixelTerrain } from './PreschoolPixelTerrain';
import { isStandardPixelIsland, standardPixelIslandConfig, islandPixelPalette } from '../domain/standardPixelIslandMap';
import { sharedIslandStageMapInfo } from '../domain/sharedIslandStageMapInfo';
import { SharedThemedPixelTerrain, IslandThemeStamp } from './SharedThemedPixelTerrain';

const legacy = new Set(['e1.forest','e1.bridge','e1.tower']);

function measuredWidth(width: number) {
  return Math.max(244, width || 360);
}

/** Muted 8-bit paw stamps: no emoji font differences, gradients or glitter. */
function PreschoolPawStamp({flipped=false,compact=false}:{
  flipped?:boolean;compact?:boolean;
}) {
  const shade='#9b8b77';
  return <Svg testID={flipped?'preschool-title-paw-right':'preschool-title-paw-left'}
    accessible={false} width={compact?17:23} height={compact?17:23} viewBox="0 0 24 24">
    <G transform={flipped?'translate(24 0) scale(-1 1)':undefined} fill={shade}>
      {/* Four small toe pads, kept separate from the larger stitched paw pad. */}
      <Rect x={2} y={8} width={4} height={5}/>
      <Rect x={7} y={3} width={4} height={6}/>
      <Rect x={14} y={3} width={4} height={6}/>
      <Rect x={19} y={8} width={4} height={5}/>
      <Rect x={8} y={12} width={9} height={8}/>
      <Rect x={6} y={15} width={13} height={4}/>
    </G>
  </Svg>;
}

function ToyBlockStamp({flipped=false,compact=false}:{flipped?:boolean;compact?:boolean}){
  return <Svg testID={flipped?'toy-title-block-right':'toy-title-block-left'}
    accessible={false} width={compact?17:23} height={compact?17:23} viewBox="0 0 24 24">
    <G transform={flipped?'translate(24 0) scale(-1 1)':undefined}>
      <Rect x={2} y={9} width={10} height={11} fill="#c99981" stroke="#344454" strokeWidth={1.5}/>
      <Rect x={12} y={4} width={9} height={16} fill="#b88974" stroke="#344454" strokeWidth={1.5}/>
      <Rect x={4} y={4} width={6} height={5} fill="#ddc68e"/>
    </G>
  </Svg>;
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
      <Text accessibilityRole="header" style={styles.bannerHeading}>数のトビラ 世界地図</Text>
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
            accessibilityLabel="16島それぞれのテーマを3つのドット絵で描いた、数のトビラの世界地図"
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

/** Every island shares the approved preschool stage/path geometry.
 * The two approved child-island silhouettes are preserved, while the other
 * fourteen use a palette-driven pixel terrain with collision-safe landmarks.
 */
function IslandTerrain({width,height,positions,grade,next}:{
  width:number;height:number;positions:readonly {x:number;y:number}[];
  grade:WorldGrade;next:number;
}){
  if(grade.id==='preschool')
    return <PreschoolPixelTerrain width={width} height={height}
      positions={positions} grade={grade} next={next}/>;
  if(grade.id==='e1')
    return <ToyPixelTerrain width={width} height={height}
      positions={positions} grade={grade} next={next}/>;
  return <SharedThemedPixelTerrain width={width} height={height}
    positions={positions} grade={grade} next={next}/>;
}

function stageText(stage:WorldStage):string {
  if (stage.gradeId === 'sage' && stage.order === 49) return '♜50';
  if (stage.gradeId === 'sage' && stage.kind === 'normal' && (stage.order+1)%5 === 0) return '◇' + (stage.order+1);
  if(stage.kind==='normal') return String(stage.order+1).padStart(2,'0');
  if(stage.kind==='extra') return '試'+String(stage.order-49);
  return '伝'+String(stage.order-59);
}

export function IslandStageMap({grade,progress,mode,access,onBack,onStart,onTitles,onLearn,onCheckpoint,preview=false,focusStageId,onFocusStagePosition,onMapLayout}: {
  grade:WorldGrade;progress:Progress;mode:PlayMode;access:Entitlement;onBack:()=>void;onStart:(stage:WorldStage)=>void;onTitles:()=>void;
  onLearn:(lesson:UnitLesson)=>void;
  onCheckpoint:(item:Checkpoint)=>void;
  preview?:boolean;
  focusStageId?:string;
  onFocusStagePosition?:(position:number)=>void;
  onMapLayout?:(position:number)=>void;
}) {
  const [width,setWidth]=useState(0);
  const [oceanTop,setOceanTop]=useState<number | undefined>();
  const [detailStageId,setDetailStageId]=useState<string|null>(null);
  const actual=measuredWidth(width);
  const compactStageMap=compactIslandStageMap(actual);
  const standardPixelMap=isStandardPixelIsland(grade.id);
  const standardTheme=standardPixelIslandConfig(grade.id);
  const islandColors=islandPixelPalette(grade.id);
  const geometry=islandStageLayout(actual,grade.stages.length,
    standardPixelMap?PRESCHOOL_MAP_TITLE_INSET:0,standardPixelMap);
  const detailStage=standardPixelMap ? grade.stages.find(stage=>stage.id===detailStageId) : undefined;
  const focusStage=focusStageId ? grade.stages.find(stage=>stage.id===focusStageId) : undefined;
  useEffect(() => {
    if (width <= 0 || oceanTop === undefined || !focusStage || !onFocusStagePosition) return;
    const position=geometry.positions[focusStage.order];
    if (position) onFocusStagePosition(oceanTop + position.y);
  }, [width, oceanTop, focusStage?.id, geometry.height, onFocusStagePosition]);
  const stageInfo=(stage:WorldStage)=>sharedIslandStageMapInfo(grade,stage);
  const stats=gradeProgress(progress,grade.id);
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
  // The preschool map is the primary navigation. Keep reference material,
  // the curriculum table and the optional shortcut BELOW the map so
  // children can see the first stage immediately on opening the island.
  // Other islands retain their original ordering.
  const supplementalPanels=(
    <>
      <IslandCurriculumPanel grade={grade} onStart={onStart} availability={curriculumAvailability} preview={preview}/>
      {preview && <View style={styles.previewCard}>
        {previewStage ? <>
          <Text accessibilityRole="header" style={styles.previewHeading}>{preview && grade.id==='e1' ? 'かずから じゅんに まなぼう！' : hasStageBank(previewStage.id)
            ? 'このステージから あそぼう！' : 'まずは ここから！'}</Text>
          <Pressable accessibilityRole="button" testID="kazu-preview-first-stage"
            accessibilityLabel={'ステージ '+stageText(previewStage)+' を はじめる'}
            onPress={()=>onStart(previewStage)}
            style={({pressed})=>[styles.previewStart,pressed&&styles.pressed]}>
            <Text style={styles.previewStartText}>▶ ステージ {stageText(previewStage)} {hasStageBank(previewStage.id)?'を はじめる':'を はじめる'}</Text>
          </Pressable>
          <Text style={styles.hintText}>{preview && grade.id==='e1' ? '50ステージ・各10問のカリキュラム試作版だよ。' : hasStageBank(previewStage.id)
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
        {grade.id!=='e1' && grade.stages.some(stage=>hasStageBank(stage.id)) &&
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
    </>
  );
  return (
    <View style={[styles.screen,standardPixelMap&&styles.preschoolScreen]} onLayout={event=>onMapLayout?.(event.nativeEvent.layout.y)}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>{standardPixelMap?'‹ せかいちずへ':'‹ 世界地図に もどる'}</Text>
      </Pressable>
      {!standardPixelMap && <View style={styles.islandBanner}>
        <View style={styles.islandBannerText}>
          <Text style={styles.eyebrow}>{grade.title} の ぼうけんマップ</Text>
          <Text style={styles.bannerHeading}>{grade.island}</Text>
          <Text style={styles.bannerDescription}>{grade.theme}</Text>
          <Text style={styles.islandBannerCount}>{preview ? (grade.id==='e1' ? '冒険の道50ステージ・確認テスト10を あそべるよ' : grade.stages.some(stage=>hasStageBank(stage.id))
            ? '問題がある '+grade.stages.filter(stage=>hasStageBank(stage.id)).length+'ステージを あそべるよ'
            : '65ステージと10か所の確認テスト · サンプル表示') : isPlannedIsland(grade.id) ? '教材を準備中 · 65地点' : grade.id === 'sage' ? (testing || isIslandUnlocked(progress, grade.id)
            ? `${grade.stages.filter(stage => hasStageBank(stage.id)).length} / 65 地点で出題中` : '高校3年生の冒険の道50・試練の道10をクリアすると解放') : testing ? (hasPremium(access) ? "65ステージ すべてプレイできるよ" : "冒険の道50ステージを 自由に あそべるよ") : `✦ ${stats.cleared} / 65 クリア　★ ${stats.perfect} パーフェクト`}</Text>
        </View>
        <CompanionAvatar size={88} mood={stats.mainPerfect?'clear':'ready'}/>
      </View>}
      {!standardPixelMap && supplementalPanels}
      {standardPixelMap && <Text testID={grade.id==='preschool'?'preschool-map-quick-hint':'toy-map-quick-hint'} style={styles.preschoolMapHint}>すうじを さわってね</Text>}
      {!standardPixelMap && <View style={styles.mapHeading}>
        <Text style={styles.mapTitle}>島のぼうけんルート</Text>
        <Text style={styles.hintText}>地図の丸い地点をタッチして ステージへ進もう！</Text>
      </View>}
      <View style={[styles.ocean,standardPixelMap&&styles.pixelOcean,{height:geometry.height}]} onLayout={event=>{
        const nextWidth=Math.round(event.nativeEvent.layout.width);
        if(nextWidth>0&&nextWidth!==width)setWidth(nextWidth);
        setOceanTop(event.nativeEvent.layout.y);
      }}>
        <View pointerEvents="none" testID={grade.id==='preschool'?'preschool-plush-pixel-v2':grade.id==='e1'?'toy-island-pixel-v1':'pixel-island-'+grade.id}
          style={StyleSheet.absoluteFill}>
          <IslandTerrain width={actual} height={geometry.height}
            positions={geometry.positions} grade={grade} next={next?.order ?? -1}/>
        </View>
        {grade.id==='preschool' && (
          <View testID="preschool-map-top-title" pointerEvents="none"
            style={[styles.preschoolMapTopTitle,compactStageMap&&styles.preschoolMapTopTitleCompact]}>
            <Text style={styles.preschoolMapTopGrade}>就学前</Text>
            <View style={styles.preschoolMapTopNameWithPaws}>
              <PreschoolPawStamp compact={compactStageMap}/>
              <Text style={[styles.preschoolMapTopName,compactStageMap&&styles.preschoolMapTopNameCompact]}>ぬいぐるみの島</Text>
              <PreschoolPawStamp flipped compact={compactStageMap}/>
            </View>
          </View>
        )}
        {grade.id==='e1' && (
          <View testID="toy-map-top-title" pointerEvents="none"
            style={[styles.preschoolMapTopTitle,compactStageMap&&styles.preschoolMapTopTitleCompact,
              {backgroundColor:'#f8e9d2',borderColor:'#b98173'}]}>
            <Text style={styles.preschoolMapTopGrade}>{standardTheme?.grade}</Text>
            <View style={styles.preschoolMapTopNameWithPaws}>
              <ToyBlockStamp compact={compactStageMap}/>
              <Text style={[styles.preschoolMapTopName,compactStageMap&&styles.preschoolMapTopNameCompact]}>
                {standardTheme?.title}
              </Text>
              <ToyBlockStamp flipped compact={compactStageMap}/>
            </View>
          </View>
        )}
        {standardPixelMap && grade.id!=='preschool' && grade.id!=='e1' && (
          <View testID={'themed-map-top-title-'+grade.id} pointerEvents="none"
            style={[styles.preschoolMapTopTitle,compactStageMap&&styles.preschoolMapTopTitleCompact,
              {backgroundColor:islandColors?.paper??'#f5edce',borderColor:islandColors?.accent??'#7e9a73'}]}>
            <Text style={styles.preschoolMapTopGrade}>{standardTheme?.grade}</Text>
            <View style={styles.preschoolMapTopNameWithPaws}>
              <IslandThemeStamp id={grade.id} compact={compactStageMap}/>
              <Text style={[styles.preschoolMapTopName,compactStageMap&&styles.preschoolMapTopNameCompact]}>
                {standardTheme?.title}
              </Text>
              <IslandThemeStamp id={grade.id} flipped compact={compactStageMap}/>
            </View>
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
                standardPixelMap&&styles.pixelZoneLabel,
                !standardPixelMap&&area.kind==='extra'&&styles.extraAreaLabel,
                !standardPixelMap&&area.kind==='secret'&&styles.secretAreaLabel,
                {top:y-(standardPixelMap?68:60),left:inset,right:inset,alignItems:'center'},
              ]}>
              <Text style={[
                styles.zoneName,standardPixelMap&&styles.pixelZoneName,
              ]}>{area.title}　{area.count}ステージ</Text>
            </View>
          );
        })}
        {/* On the preschool island, every stage displays its own learning
            title. Tap a title for the full objective; tap the round pin to play.
            Other islands keep the existing compact/wide curriculum labels. */}
        {standardPixelMap && grade.stages.map((stage,index)=>{
          const position=geometry.positions[index];
          const info=stageInfo(stage);
          const labelLayout=preschoolStageLabelLayout(actual,position,marker);
          return <Pressable key={'stage-topic-'+stage.id}
            accessibilityRole="button" accessibilityLabel={'ステージ '+String(index+1)+' の ないようを みる '+info.title}
            testID={(grade.id==='preschool'?'preschool-stage-topic-':
              grade.id==='e1'?'toy-stage-topic-':'island-stage-topic-'+grade.id+'-')+String(index+1)}
            onPress={()=>setDetailStageId(stage.id)}
            style={[styles.preschoolStageTopic,labelLayout]}>
            <Text numberOfLines={compactStageMap?3:2}
              style={[styles.preschoolStageTopicText,compactStageMap&&styles.preschoolStageTopicSmall]}>
              {info.title}
            </Text>
          </Pressable>;
        })}
        {!standardPixelMap && compactStageMap && Array.from({length:Math.ceil(grade.stages.length/5)},(_,row)=>{
          const position=geometry.positions[row*5];
          return <View key={'row-topic-'+row} testID={'island-row-topic-'+row}
            pointerEvents="none" style={[styles.compactRowTopic,{
              top:position.y+marker/2+13,
              left:Math.max(68,Math.ceil(actual*.16)),
              right:Math.max(68,Math.ceil(actual*.16)),
            }]}>
            <Text numberOfLines={2} style={styles.compactRowTopicText}>
              {preview && grade.id==='e1' ? gradeOnePreviewStageInfo(grade.stages[row*5])?.unit : stageRowCategoryName(grade,row)}
            </Text>
          </View>;
        })}
        {!standardPixelMap && !compactStageMap && grade.stages.map((stage,index)=>{
          const position=geometry.positions[index];
          return <View key={'category-'+stage.id} pointerEvents="none"
            style={[styles.pinCategoryBox,{
              width:84,left:Math.max(1,Math.min(actual-85,position.x-42)),
              top:position.y+marker/2+4,
            }]}>
            <Text numberOfLines={2} style={styles.pinCategoryText}>{preview && grade.id==='e1' ? gradeOnePreviewStageInfo(stage)?.title : stageCategoryName(grade,stage)}</Text>
          </View>;
        })}
        {checkpointsFor(grade).map(checkpoint=>{
          const end=geometry.positions[checkpoint.after.order];
          // All ten preschool five-stage checks are playable in preview.
          const enabled=preview ? (grade.id==='preschool'||grade.id==='e1') && checkpoint.number<=10
            : testing || checkpoint.sourceStageIds.every(id=>Boolean(progress.stages[id]?.clearedAt));
          const nextPoint=geometry.positions[checkpoint.after.order+1];
          const checkpointLayout=islandCheckpointLayout(actual,end,marker,nextPoint,standardPixelMap);
          return <Pressable key={checkpoint.id} accessibilityRole="button"
            testID={'island-checkpoint-'+checkpoint.number}
            accessibilityLabel={'確認テスト '+checkpoint.number+(enabled?' を はじめる':' は準備中')} disabled={!enabled} onPress={()=>onCheckpoint(checkpoint)}
            style={[{position:'absolute',left:checkpointLayout.left,top:checkpointLayout.top,
              width:checkpointLayout.width,height:checkpointLayout.height,
              borderRadius:standardPixelMap?7:10,
              justifyContent:'center',alignItems:'center',
              backgroundColor:standardPixelMap
                ? (enabled?'#f4e9c7':'#d9dfdf')
                : (enabled?'#fff0b5':'#d2d9e9'),
              borderWidth:standardPixelMap?3:1,
              borderColor:standardPixelMap?'#344454':'#66769a'},
              standardPixelMap&&styles.preschoolCheckpointSign]}>
            {standardPixelMap ? <>
              <Text style={styles.preschoolCheckpointHeading}>✓ かくにん</Text>
              <Text style={styles.preschoolCheckpointTitle}>テスト {checkpoint.number}</Text>
              <Text style={styles.preschoolCheckpointRange}>
                {(checkpoint.number-1)*5+1}〜{checkpoint.number*5} の もんだい
              </Text>
            </> : <>
              <Text style={{fontSize:checkpointLayout.compact?12:11,fontWeight:'800',color:'#263453'}}>
                {checkpointLayout.compact?'テスト':'確認テスト'}
              </Text>
              <Text style={{fontSize:11,color:'#263453'}}>{checkpoint.number}</Text>
            </>}
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
              accessibilityLabel={(preview && grade.id==='e1' ? gradeOnePreviewStageInfo(stage)?.title : stageDisplayTitle(stage))+'、単元 '+(preview && grade.id==='e1' ? gradeOnePreviewStageInfo(stage)?.unit : stageCategoryName(grade,stage))+'、'+(grade.id==='preschool'?'学習内容 '+preschoolStageMapInfo(stage).title+'、':'')+(preview ? (grade.id==='e1' && stage.kind==='normal' ? 'カリキュラム確認用10問' : hasStageBank(stage.id) ? '100問のなかから10問ずつ あそべる' : uiPreviewSampleKind(stage) ? 'サンプル問題' : '体験用問題は準備中') : action === 'premium' ? 'プレミアム限定' : perfect?'パーフェクト':cleared?'クリア済み':action === 'learn' ? 'まず まなぼう' : unlocked?'挑戦できる':!hasGeneratedWorldQuestions(stage.gradeId) && !hasStageBank(stage.id) ? '問題を準備中' : '未解放')}
              onPress={()=>onStart(stage)}
              style={({pressed})=>[
                styles.stagePin,standardPixelMap&&styles.pixelStagePin,stage.kind==='extra'&&styles.extraPin,stage.kind==='secret'&&styles.secretPin,
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
        {detailStage && (()=>{
          const info=stageInfo(detailStage);
          const position=geometry.positions[detailStage.order];
          const playable=preview
            ? Boolean(uiPreviewSampleKind(detailStage)) || hasStageBank(detailStage.id)
            : ['play','learn'].includes(worldStageAction(mode,progress,detailStage,access));
          return <View testID={grade.id==='preschool'?'preschool-stage-info-card':
            grade.id==='e1'?'toy-stage-info-card':'island-stage-info-card-'+grade.id}
            style={[styles.preschoolStageInfoCard,{
              top:Math.min(geometry.height-188,position.y+marker/2+48),
              left:compactStageMap?12:Math.max(30,Math.round(actual*.2)),
              right:compactStageMap?12:Math.max(30,Math.round(actual*.2)),
            }]}>
            <Text style={styles.preschoolStageInfoTitle}>
              {String(detailStage.order+1).padStart(2,'0')}　{info.title}
            </Text>
            <Text style={styles.preschoolStageInfoGoal}>{info.goal}</Text>
            <Text style={styles.preschoolStageInfoNotice}>がくしゅうないよう（あん）</Text>
            <View style={styles.preschoolStageInfoActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="とじる"
                onPress={()=>setDetailStageId(null)} style={styles.preschoolStageInfoClose}>
                <Text style={styles.preschoolStageInfoActionText}>とじる</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={!playable}
                accessibilityLabel={playable?'このステージで あそぶ':'このステージは じゅんびちゅう'}
                onPress={()=>onStart(detailStage)}
                style={[styles.preschoolStageInfoPlay,!playable&&styles.preschoolStageInfoDisabled]}>
                <Text style={styles.preschoolStageInfoActionText}>{playable?'あそぶ':'じゅんびちゅう'}</Text>
              </Pressable>
            </View>
          </View>;
        })()}
      </View>
      {standardPixelMap && supplementalPanels}
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
  preschoolScreen:{gap:5},
  preschoolMapHint:{color:'#344454',fontSize:15,fontWeight:'800',paddingHorizontal:6,paddingBottom:1},
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
  preschoolMapTopTitleCompact:{left:17,right:17},
  preschoolMapTopGrade:{color:'#526651',fontWeight:'900',fontSize:12,lineHeight:16,textAlign:'center'},
  preschoolMapTopNameWithPaws:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  preschoolMapTopName:{color:'#344454',fontWeight:'900',fontSize:20,lineHeight:24,textAlign:'center'},
  preschoolMapTopNameCompact:{fontSize:17,lineHeight:21},
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
  // The outer heading spans the map but is transparent. Only the text itself
  // gets a small muted frame, never a full-width banner.
  pixelZoneLabel:{borderRadius:0,backgroundColor:'transparent',borderWidth:0,
    paddingVertical:0,paddingHorizontal:0},
  extraAreaLabel:{backgroundColor:'#e0eae5',borderColor:'#90b4a8'},
  secretAreaLabel:{backgroundColor:'#eee2e9',borderColor:'#b39aaa'},
  pixelZoneName:{color:'#283e55',fontSize:15,lineHeight:21,
    fontWeight:'900',textAlign:'center',alignSelf:'center',
    backgroundColor:'rgba(247,239,214,0.96)',
    borderWidth:1,borderColor:'#849d81',borderRadius:4,
    paddingVertical:3,paddingHorizontal:9,overflow:'hidden'},
  pinCategoryBox:{position:'absolute',borderRadius:5,paddingHorizontal:2,paddingVertical:1,
    backgroundColor:'rgba(255,250,228,0.92)',alignItems:'center',justifyContent:'center'},
  pinCategoryText:{fontSize:10,fontWeight:'800',color:'#314661',textAlign:'center',lineHeight:12},
  compactRowTopic:{position:'absolute',alignItems:'center',justifyContent:'center',
    paddingHorizontal:4,paddingVertical:4,borderRadius:4,backgroundColor:'rgba(248,239,211,0.96)'},
  compactRowTopicText:{color:'#344454',fontWeight:'900',fontSize:13,lineHeight:17,textAlign:'center'},
  pixelCategoryBox:{borderRadius:1,backgroundColor:'rgba(247,238,207,0.94)'},
  pixelCategoryText:{color:'#344454'},
  // The full tappable target stays transparent. Only each title's actual
  // text has a tightly fitted, softly colored frame below its stage pin.
  preschoolCheckpointSign:{paddingHorizontal:4,paddingVertical:5,gap:1,shadowOpacity:0},
  preschoolCheckpointHeading:{fontSize:12,lineHeight:16,color:'#465d5b',
    fontWeight:'900',textAlign:'center'},
  preschoolCheckpointTitle:{fontSize:20,lineHeight:25,color:'#283f54',
    fontWeight:'900',textAlign:'center'},
  preschoolCheckpointRange:{fontSize:12,lineHeight:16,color:'#344454',
    fontWeight:'800',textAlign:'center'},
  preschoolStageTopic:{position:'absolute',paddingHorizontal:0,paddingVertical:0,
    backgroundColor:'transparent',borderWidth:0,
    alignItems:'center',justifyContent:'flex-start'},
  preschoolStageTopicText:{fontSize:12,lineHeight:16,color:'#283e55',
    fontWeight:'900',textAlign:'center',alignSelf:'center',maxWidth:'100%',
    backgroundColor:'rgba(247,241,219,0.95)',borderWidth:1,borderColor:'#8d9f86',
    borderRadius:3,paddingHorizontal:2,paddingVertical:2,overflow:'hidden'},
  preschoolStageTopicSmall:{fontSize:10,lineHeight:14},
  preschoolStageInfoCard:{position:'absolute',zIndex:30,backgroundColor:'#f8f0d8',
    borderWidth:3,borderColor:'#344454',borderRadius:4,padding:10,gap:8,
    shadowColor:'#344454',shadowOpacity:.22,shadowOffset:{width:2,height:3},shadowRadius:2},
  preschoolStageInfoTitle:{fontSize:16,lineHeight:22,fontWeight:'900',color:'#344454'},
  preschoolStageInfoGoal:{fontSize:13,lineHeight:21,color:'#344454',fontWeight:'700'},
  preschoolStageInfoNotice:{fontSize:10,color:'#65715f'},
  preschoolStageInfoActions:{flexDirection:'row',gap:10,justifyContent:'flex-end'},
  preschoolStageInfoClose:{minHeight:44,justifyContent:'center',paddingHorizontal:15,
    backgroundColor:'#d9dfd8',borderRadius:3,borderWidth:1,borderColor:'#344454'},
  preschoolStageInfoPlay:{minHeight:44,justifyContent:'center',paddingHorizontal:15,
    backgroundColor:'#eac68c',borderRadius:3,borderWidth:1,borderColor:'#344454'},
  preschoolStageInfoDisabled:{backgroundColor:'#d8dbd3'},
  preschoolStageInfoActionText:{color:'#344454',fontWeight:'900',fontSize:13},
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
