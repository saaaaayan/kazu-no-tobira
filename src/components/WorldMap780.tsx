import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { CompanionAvatar } from './AdventureCompanion';
import { worldGrades, type WorldGrade, type WorldStage } from '../domain/worldCatalog';
import { adventureTitles } from '../domain/titles';
import { gradeProgress, isWorldStageUnlocked, unlockSummary } from '../domain/worldProgress';
import type { Progress } from '../domain/progress';

const colors = [
  ['#56a6a2','#d3edbd'], ['#678fbf','#e0d6a5'], ['#7ba6bc','#cddca0'],
  ['#9b8cbd','#e2ca9a'], ['#4daeb9','#bfe2dc'], ['#7b96c7','#ece7b7'],
  ['#7386ae','#b7d5e2'], ['#ad86a4','#e7c6a9'], ['#8388c3','#d0d8f1'],
  ['#7292aa','#ede2c3'], ['#697bba','#d7d1eb'], ['#515ba1','#f2d6a7'],
];
const emblems = ['🌱','🌲','🌊','🏰','🧭','☁️','🪄','📈','🔮','⚖️','📐','✨'];

function islandUnlocked(progress: Progress, index: number): boolean {
  return index === 0 || gradeProgress(progress, worldGrades[index - 1].id).extrasCleared === 10;
}

function MiniIsland({ index }: { index: number }) {
  const [sea, land] = colors[index];
  return (
    <View style={styles.miniIsland}>
      <Svg width="100%" height="100%" viewBox="0 0 130 86" accessible={false}>
        <Rect width="130" height="86" fill={sea} rx="13" />
        <Circle cx="104" cy="16" r="9" fill="#fff3c8" opacity={0.9} />
        <Ellipse cx="62" cy="57" rx="53" ry="26" fill="#336d82" opacity={0.4} />
        <Path d="M8 55Q20 38 45 36Q62 18 85 37Q116 38 121 55Q109 72 83 77Q32 80 8 55Z" fill={land} stroke="#fff0c3" strokeWidth={3} />
        <Path d="M29 57Q62 35 103 57" fill="none" stroke="#f9dfa4" strokeWidth={5} strokeDasharray="3 7" strokeLinecap="round" />
        <Path d="M58 55L58 30L70 14L81 30V55Z" fill="#4c588d" stroke="#fcebc6" strokeWidth={2} />
        <Path d="M56 30H84L70 11Z" fill="#f7d28a" />
        <Rect x="67" y="39" width="7" height="16" rx="3" fill="#fff0bf" />
        <Circle cx="17" cy="15" r="2" fill="#fff8d7" />
        <Circle cx="29" cy="23" r="1.5" fill="#fff8d7" />
      </Svg>
    </View>
  );
}

export function WorldMap780({ progress, onGrade, onTitles }: {
  progress: Progress; onGrade: (grade: WorldGrade) => void; onTitles: () => void;
}) {
  const { width } = useWindowDimensions();
  const narrow = width < 620;
  const summary = unlockSummary(progress);
  return (
    <View style={styles.world}>
      <View style={styles.worldIntro}>
        <Text style={styles.kicker}>12の島をめぐる 数学の大冒険</Text>
        <Text style={styles.worldTitle}>数の世界を ひらこう！</Text>
        <Text style={styles.worldSubtitle}>小学1年生から高校3年生まで。ひとつずつ、自分のペースで進もう。</Text>
        <View style={styles.worldStats}>
          <View style={styles.stat}><Text style={styles.statNumber}>{summary.cleared}</Text><Text style={styles.statLabel}>/ 780 クリア</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>{summary.perfect}</Text><Text style={styles.statLabel}>パーフェクト</Text></View>
        </View>
        <Pressable accessibilityRole="button" onPress={onTitles} style={styles.bookButton}>
          <Text style={styles.bookText}>🏅 しょうごう ずかんを みる</Text>
        </Pressable>
      </View>
      <View style={styles.worldHeading}>
        <Text style={styles.sectionTitle}>ぼうけんの 島を えらぼう</Text>
        <Text style={styles.sectionHint}>順番にクリアすると 次の島が開くよ</Text>
      </View>
      <View style={styles.gradeGrid}>
        {worldGrades.map((grade,index) => {
          const unlocked = islandUnlocked(progress,index);
          const stats = gradeProgress(progress,grade.id);
          return (
            <Pressable key={grade.id} accessibilityRole="button"
              accessibilityLabel={grade.title + ' ' + grade.island + (unlocked ? ' ぼうけんできる' : ' まだ とじている')}
              accessibilityState={{ disabled: !unlocked }} disabled={!unlocked}
              onPress={() => onGrade(grade)}
              style={({pressed}) => [styles.gradeCard, { width: narrow ? '100%' : '48.7%' },
                !unlocked && styles.gradeLocked, pressed && styles.pressed]}>
              <MiniIsland index={index} />
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeNumber}>{String(index+1).padStart(2,'0')} / 12　{grade.title}</Text>
                <Text style={styles.gradeTitle}>{emblems[index]} {grade.island}</Text>
                <Text style={styles.gradeTheme}>{grade.theme}</Text>
                <View style={styles.gradeFoot}>
                  <Text style={styles.gradeCount}>{stats.cleared} / 65 ステージ</Text>
                  <Text style={unlocked ? styles.openText : styles.lockedText}>{unlocked ? 'すすむ ›' : '🔒 おたのしみに'}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function IslandStageMap({ grade, progress, onBack, onStart, onTitles }: {
  grade: WorldGrade; progress: Progress; onBack: () => void;
  onStart: (stage: WorldStage) => void; onTitles: () => void;
}) {
  const [tab, setTab] = useState<'normal'|'extra'|'secret'>('normal');
  const gradeIndex = worldGrades.findIndex(g => g.id === grade.id);
  const palette = colors[gradeIndex];
  const stats = gradeProgress(progress, grade.id);
  const stages = grade.stages.filter(stage => stage.kind === tab);
  const stageGroups = tab === 'normal' ? grade.units.map((unit, i) =>
    ({ title: unit.title, stages: stages.filter(stage => stage.unitIndex === i) })) :
    [{ title: tab === 'extra' ? '応用への チャレンジ' : '数学の ふしぎを 見つけよう', stages }];
  return (
    <View style={styles.island}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹ 12の島へもどる</Text></Pressable>
      <View style={[styles.islandBanner,{backgroundColor:palette[0]}]}>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTag}>{grade.title} の 島</Text>
          <Text style={styles.bannerTitle}>{grade.island}</Text>
          <Text style={styles.bannerSubtitle}>{grade.theme}</Text>
          <Text style={styles.bannerCount}>クリア {stats.cleared} / 65　✦ {stats.perfect} パーフェクト</Text>
        </View>
        <CompanionAvatar size={115} mood={stats.mainPerfect?'clear':'ready'} />
      </View>
      <View style={styles.islandMenu}>
        {([
          ['normal','ふつうの道','50'],
          ['extra','EXの道','10'],
          ['secret','ひみつの道','5'],
        ] as const).map(([kind,label,count]) => (
          <Pressable key={kind} accessibilityRole="button" accessibilityState={{selected:tab===kind}}
            onPress={() => setTab(kind)} style={[styles.tab,tab===kind && styles.tabCurrent]}>
            <Text style={[styles.tabTitle,tab===kind && styles.tabTitleCurrent]}>{label}</Text>
            <Text style={[styles.tabCount,tab===kind && styles.tabTitleCurrent]}>{count}ステージ</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'secret' && !stats.mainPerfect && (
        <View style={styles.secretNotice}>
          <Text style={styles.secretTitle}>🔒 ひみつのトビラ</Text>
          <Text style={styles.secretBody}>通常50＋EX10の 全60ステージを パーフェクトにすると ひらくよ！</Text>
          <Text style={styles.secretProgress}>いまのパーフェクト：{grade.stages.slice(0,60).filter(stage => {
            const record = progress.stages[stage.id] as {perfectAt?:string;clearedAt?:string}|undefined;
            return Boolean(record?.perfectAt || (grade.id==='e1' && ['e1.forest','e1.bridge','e1.tower'].includes(stage.id) && record?.clearedAt));
          }).length} / 60</Text>
        </View>
      )}
      {stageGroups.map(group => (
        <View key={group.title} style={styles.unitGroup}>
          <Text style={styles.unitTitle}>{group.title}</Text>
          <View style={styles.stageGrid}>
            {group.stages.map(stage => {
              const unlocked = isWorldStageUnlocked(progress,stage);
              const record = progress.stages[stage.id] as {clearedAt?:string;perfectAt?:string}|undefined;
              const cleared = Boolean(record?.clearedAt);
              const perfect = Boolean(record?.perfectAt || (grade.id==='e1' && ['e1.forest','e1.bridge','e1.tower'].includes(stage.id) && cleared));
              return (
                <Pressable key={stage.id} accessibilityRole="button" disabled={!unlocked}
                  accessibilityState={{disabled:!unlocked}} onPress={() => onStart(stage)}
                  style={({pressed})=>[styles.stageCard,!unlocked&&styles.stageLocked,perfect&&styles.stagePerfect,pressed&&styles.pressed]}>
                  <Text style={styles.stageIndex}>{stage.kind==='normal' ? 'STAGE '+String(stage.order+1).padStart(2,'0') : stage.kind==='extra'?'EX '+String(stage.order-49).padStart(2,'0'):'SECRET '+String(stage.order-59).padStart(2,'0')}</Text>
                  <Text style={styles.stageIcon}>{!unlocked?'🔒':perfect?'🌟':cleared?'✅':'✦'}</Text>
                  <Text style={styles.stageName}>{stage.title}</Text>
                  <Text style={styles.stageDesc}>{!unlocked?'まえの もんを クリア':perfect?'パーフェクト！':cleared?'クリア！ もういちど あそべる':stage.questions+'もんに ちょうせん'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <Pressable accessibilityRole="button" onPress={onTitles} style={styles.bookButton}>
        <Text style={styles.bookText}>🏅 しょうごう ずかんを みる</Text>
      </Pressable>
    </View>
  );
}

export function TitleAlbum({ progress, onBack }: {progress:Progress;onBack:()=>void}) {
  const [all, setAll] = useState(false);
  const titles = adventureTitles(progress);
  const won = titles.filter(title => title.unlocked);
  const current = all ? titles : won;
  return (
    <View style={styles.album}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹ もどる</Text></Pressable>
      <Text style={styles.albumTitle}>🏅 しょうごう ずかん</Text>
      <Text style={styles.albumLead}>ぼうけんや パーフェクトで あたらしい称号を あつめよう！</Text>
      <Text style={styles.albumCount}>{won.length} / {titles.length} こ あつめたよ</Text>
      <Pressable accessibilityRole="button" onPress={()=>setAll(value=>!value)} style={styles.showAll}>
        <Text style={styles.showAllText}>{all?'みつけた称号だけをみる':'まだみつけていない称号もみる'}</Text>
      </Pressable>
      {current.length === 0 && <Text style={styles.empty}>ステージを クリアして はじめての称号を もらおう！</Text>}
      <View style={styles.titleList}>
        {current.map(title=>(
          <View key={title.id} style={[styles.titleRow,!title.unlocked&&styles.titleDim]}>
            <Text style={styles.titleMedal}>{title.unlocked?'🏅':'🔒'}</Text>
            <View style={styles.titleInfo}>
              <Text style={styles.titleName}>{title.unlocked?title.name:'？？？'}</Text>
              <Text style={styles.titleDetail}>{title.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function WorldChest({ opened, perfect, stage }: {opened:boolean;perfect:boolean;stage:WorldStage}) {
  const gradeIndex = worldGrades.findIndex(grade=>grade.id===stage.gradeId);
  const glow = colors[gradeIndex][1];
  return (
    <View style={styles.chestWrap} accessible accessibilityLabel={opened?'たからばこがひらいた':'たからばこはまだとじている'}>
      <Svg width={180} height={138} viewBox="0 0 180 138" accessible={false}>
        {opened && (
          <G>
            <Circle cx={90} cy={58} r={52} fill={glow} opacity={0.45} />
            <Path d="M90 6L105 40 90 63 75 40Z" fill={perfect?'#ffe08b':'#8ce6d5'} stroke="#775c9f" strokeWidth={2.5}/>
            <Path d="M25 19L28 27 36 30 28 33 25 41 22 33 14 30 22 27Z" fill="#e6c16f"/>
            <Path d="M144 5L147 13 155 16 147 19 144 27 141 19 133 16 141 13Z" fill="#f7dc84"/>
          </G>
        )}
        <Ellipse cx={90} cy={130} rx={71} ry={8} fill="#35264e" opacity={0.2}/>
        <Path d={opened?'M25 60Q25 18 60 18H120Q155 18 155 60L145 68H35Z':'M25 82V64Q25 36 55 36H125Q155 36 155 64V82Z'}
          fill="#bd8855" stroke="#60485a" strokeWidth={4}/>
        <Path d={opened?'M36 56Q36 30 60 30H120Q144 30 144 56Z':'M35 78V63Q35 47 56 47H124Q145 47 145 63V78Z'}
          fill="#f6d88f"/>
        <Rect x={24} y={82} width={132} height={42} rx={8} fill="#a46c4c" stroke="#65435c" strokeWidth={4}/>
        <Path d="M47 84V121M133 84V121" stroke="#f3d38c" strokeWidth={8}/>
        <Rect x={79} y={81} width={22} height={24} rx={5} fill="#ffe6a1" stroke="#8f6550" strokeWidth={2}/>
      </Svg>
      <Text style={styles.chestTitle}>{perfect?'🌟 パーフェクト！ 宝石を発見！':opened?'✨ たからばこが ひらいた！':'もういちど ちょうせんしよう'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  world: { gap: 16 },
  worldIntro: { backgroundColor: '#202c53', padding: 20, borderRadius: 22, gap: 9 },
  kicker: { color: '#f9d394', fontWeight: '800', fontSize: 13 },
  worldTitle: { fontSize: 28, fontWeight: '900', color: '#fff8df' },
  worldSubtitle: { fontSize: 15, lineHeight: 23, color: '#dfebf9' },
  worldStats: { flexDirection: 'row', gap: 12, marginTop: 5 },
  stat: { flex: 1, borderWidth: 1, borderColor: '#6476a0', backgroundColor: '#334473', borderRadius: 14, padding: 9, gap: 2 },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#ffde8a' },
  statLabel: { fontSize: 12, color: '#e4ecfc' },
  bookButton: { borderRadius: 13, minHeight: 44, padding: 10, backgroundColor: '#f0d18d', alignItems: 'center', justifyContent: 'center' },
  bookText: { color: '#3f385c', fontWeight: '900', fontSize: 15 },
  worldHeading: { gap: 3 },
  sectionTitle: { color: '#28335d', fontSize: 21, fontWeight: '900' },
  sectionHint: { color: '#626b81', fontSize: 14 },
  gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2%', rowGap: 12 },
  gradeCard: { minHeight: 140, flexDirection: 'row', backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e0e0e6',
    borderRadius: 16, padding: 9, alignItems: 'center', gap: 10 },
  gradeLocked: { opacity: 0.5, backgroundColor: '#e9eaf0' },
  miniIsland: { width: 105, height: 82, overflow: 'hidden', borderRadius: 13 },
  gradeInfo: { flex: 1, minWidth: 0, gap: 3 },
  gradeNumber: { color: '#6a6080', fontSize: 12, fontWeight: '800' },
  gradeTitle: { color: '#29365d', fontSize: 17, fontWeight: '900' },
  gradeTheme: { color: '#646f81', fontSize: 12 },
  gradeFoot: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3, marginTop: 4 },
  gradeCount: { fontSize: 11, color: '#505879', fontWeight: '700' },
  openText: { fontSize: 12, color: '#167d66', fontWeight: '900' },
  lockedText: { fontSize: 11, color: '#4a4e70' },
  pressed: { opacity: 0.75 },
  island: { gap: 15 },
  back: { paddingVertical: 7, minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center' },
  backText: { color: '#315987', fontWeight: '900', fontSize: 15 },
  islandBanner: { borderRadius: 20, minHeight: 150, overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  bannerCopy: { flex: 1, gap: 5 },
  bannerTag: { color: '#fff6d8', fontWeight: '900', fontSize: 13 },
  bannerTitle: { color: 'white', fontWeight: '900', fontSize: 26 },
  bannerSubtitle: { color: '#f7f4e5', fontWeight: '700', fontSize: 14 },
  bannerCount: { marginTop: 5, color: '#fff6d5', fontSize: 12, fontWeight: '900' },
  islandMenu: { flexDirection: 'row', gap: 7 },
  tab: { flex: 1, minWidth: 0, paddingVertical: 11, paddingHorizontal: 5, borderRadius: 11, backgroundColor: '#e6e5f1', alignItems: 'center', gap: 3 },
  tabCurrent: { backgroundColor: '#3b4a86' },
  tabTitle: { color: '#464873', fontWeight: '900', fontSize: 13 },
  tabTitleCurrent: { color: 'white' },
  tabCount: { color: '#626585', fontSize: 11, fontWeight: '800' },
  unitGroup: { backgroundColor: '#fffdf7', borderWidth: 1, borderColor: '#dedce6', borderRadius: 16, padding: 11, gap: 8 },
  unitTitle: { color: '#25345b', fontSize: 17, fontWeight: '900' },
  stageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  stageCard: { width: '48.7%', minWidth: 0, backgroundColor: '#f0f7f7', borderWidth: 1.5, borderColor: '#8dbdb9',
    borderRadius: 12, padding: 10, gap: 3, minHeight: 108 },
  stageLocked: { backgroundColor: '#efeff3', borderColor: '#d9d8e0', opacity: 0.62 },
  stagePerfect: { backgroundColor: '#fff7de', borderColor: '#dbab57' },
  stageIndex: { color: '#586080', fontSize: 11, fontWeight: '900' },
  stageIcon: { fontSize: 21 },
  stageName: { color: '#28365c', fontSize: 13, fontWeight: '900', lineHeight: 19 },
  stageDesc: { color: '#65717a', fontSize: 11, lineHeight: 15 },
  secretNotice: { backgroundColor: '#2e325f', borderRadius: 15, padding: 15, gap: 5 },
  secretTitle: { color: '#f7d994', fontSize: 17, fontWeight: '900' },
  secretBody: { color: '#fff8dc', fontSize: 14, lineHeight: 21 },
  secretProgress: { color: '#bceade', fontSize: 13, fontWeight: '900' },
  album: { gap: 13 },
  albumTitle: { color: '#30365e', fontWeight: '900', fontSize: 27 },
  albumLead: { color: '#555b7b', lineHeight: 22 },
  albumCount: { fontWeight: '900', color: '#aa7625', fontSize: 18 },
  showAll: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#889ac3', borderRadius: 9, padding: 10, minHeight: 44, justifyContent: 'center' },
  showAllText: { color: '#40577b', fontWeight: '800' },
  empty: { color: '#555b7b', padding: 15 },
  titleList: { gap: 7 },
  titleRow: { flexDirection: 'row', gap: 10, backgroundColor: '#fffdf8', borderColor: '#e3d4ad', borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  titleDim: { opacity: 0.65, backgroundColor: '#ededf1' },
  titleMedal: { fontSize: 23 },
  titleInfo: { flex: 1, gap: 3 },
  titleName: { color: '#34355e', fontWeight: '900', fontSize: 14 },
  titleDetail: { color: '#626780', fontSize: 12, lineHeight: 17 },
  chestWrap: { alignItems: 'center', padding: 6, gap: 4 },
  chestTitle: { color: '#684568', fontSize: 18, fontWeight: '900', textAlign: 'center' },
});
