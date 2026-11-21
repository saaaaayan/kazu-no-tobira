import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { worldIslands } from '../domain/worldCatalog';
import type { PlayMode } from '../domain/playMode';
import VersionNotice from './VersionNotice';

export function ModeControls({ mode, onChange }: { mode: PlayMode; onChange: (mode: PlayMode) => void }) {
  return (
    <View style={styles.modeControls}>
      {(['normal', 'test'] as const).map(option => (
        <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: mode === option }}
          onPress={() => onChange(option)}
          style={[styles.modeButton, mode === option && styles.selected, mode === option && option === 'test' && styles.selectedTest]}>
          <Text style={[styles.modeLabel, mode === option && styles.selectedLabel]}>
            {option === 'normal' ? '通常モード' : 'テストモード'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ModeBadge({ mode }: { mode: PlayMode }) {
  return <Text style={[styles.badge, mode === 'test' && styles.badgeTest]}>
    {mode === 'normal' ? '通常モード' : 'テストモード・記録なし'}
  </Text>;
}

/** Crisp, scalable 8-bit style art, with the OFFICIAL Euler silhouette.
 * The same floppy hat, feather, cape and infinity staff define Euler in color and silhouette.
 * Drawn with SVG geometry so the hero needs no remote image and stays sharp at any viewport.
 */
function EulerPixelPortal() {
  const stars: ReadonlyArray<readonly [number, number, number]> = [
    [52,39,2],[121,77,3],[188,40,2],[262,112,3],[318,44,2],[590,35,2],
    [646,96,3],[711,48,2],[798,102,2],[852,39,3],[91,169,2],[779,164,2],
    [217,196,2],[693,193,3],[362,116,2],[542,113,2],
  ];
  const symbols: ReadonlyArray<readonly [string,number,number,number]> = [
    ['π',105,112,34],['∞',201,76,31],['Σ',304,153,26],
    ['∫',611,94,35],['e',710,138,31],['i',783,79,28],
    ['√',127,209,27],['x²',762,221,26],
  ];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 900 410" preserveAspectRatio="xMidYMid slice" accessible={false}>
      <Rect width={900} height={410} fill="#10273b"/>
      <Rect y={175} width={900} height={235} fill="#173b46"/>
      <Path d="M0 237H35V215H69V197H112V219H150V195H194V223H223V262H0Z" fill="#284958"/>
      <Path d="M900 243H856V218H824V193H792V213H745V187H708V232H669V264H900Z" fill="#294a58"/>
      <Path d="M0 283H45V263H95V245H125V261H177V244H216V287H269V338H0Z" fill="#203c4b"/>
      <Path d="M900 282H858V260H806V239H764V262H719V247H670V284H630V340H900Z" fill="#1b3748"/>
      {stars.map(([x,y,s],i) => <G key={'star'+i} fill={i%3===0?'#edce82':'#aec7bc'}>
        <Rect x={x} y={y} width={s*2} height={s*2}/><Rect x={x-s} y={y+s/2} width={s*4} height={s}/><Rect x={x+s/2} y={y-s} width={s} height={s*4}/>
      </G>)}
      {symbols.map(([value,x,y,size],i) => (
        <SvgText key={'symbol'+i} x={x} y={y} textAnchor="middle" fontWeight="bold"
          fontSize={size} fill={i%3===0?'#d4bf83':'#8bbaa7'} opacity={0.65}>{value}</SvgText>
      ))}
      {/* Portal: stepped stone blocks and a warm, restrained glow. */}
      <Rect x={334} y={126} width={232} height={236} fill="#334c50"/>
      <Rect x={354} y={89} width={192} height={273} fill="#435655"/>
      <Rect x={375} y={70} width={150} height={292} fill="#53615a"/>
      <Rect x={397} y={56} width={106} height={306} fill="#67705d"/>
      <Rect x={411} y={48} width={78} height={308} fill="#78795e"/>
      <Rect x={365} y={156} width={170} height={207} fill="#d8bf7b"/>
      <Rect x={380} y={129} width={140} height={234} fill="#e7d39a"/>
      <Rect x={396} y={106} width={108} height={257} fill="#eadbb0"/>
      <Rect x={412} y={91} width={76} height={272} fill="#86b6a7"/>
      <Rect x={427} y={83} width={46} height={280} fill="#4e8b82"/>
      <Path d="M400 359H499V273H477V244H456V228H436V244H417V275H400Z" fill="#4e8b82"/>
      <Path d="M405 362H500V312H482V296H462V280H442V298H425V320H405Z" fill="#2c6b67"/>
      {/* Pixelated portal frame */}
      <Path d="M321 360V153H339V115H356V92H377V70H406V55H494V70H523V92H544V115H561V153H579V360H544V157H527V130H510V107H486V93H414V107H390V130H373V157H356V360Z" fill="#a99266"/>
      <Path d="M329 359V157H347V119H364V99H382V78H410V64H490V78H518V99H536V119H553V157H571V359H554V155H536V124H517V103H489V87H411V103H383V124H364V155H346V359Z" fill="#e5cb8d"/>
      <G fill="#655d54">
        <Rect x={325} y={204} width={31} height={7}/><Rect x={325} y={266} width={31} height={7}/>
        <Rect x={545} y={204} width={29} height={7}/><Rect x={545} y={266} width={29} height={7}/>
        <Rect x={356} y={125} width={19} height={6}/><Rect x={525} y={125} width={20} height={6}/>
      </G>
      <Rect x={302} y={360} width={296} height={14} fill="#927c55"/>
      <Rect x={323} y={374} width={255} height={9} fill="#c1a472"/>
      <SvgText x={450} y={79} fontSize={24} fontWeight="bold" textAnchor="middle" fill="#203a3b">Σ</SvgText>
      {/* Euler: the official solid-black silhouette. No unrelated mascot. */}
      <G fill="#081923">
        {/* Wide, floppy hat with stepped brim and feather */}
        <Path d="M405 250H418V241H433V232H443V219H461V225H472V233H483V245H498V254H484V261H409Z"/>
        <Path d="M424 236H434V219H447V209H454V196H465V204H474V213H484V226H491V242H478V237H462V230H442V242H424Z"/>
        <Path d="M433 225H427V216H418V211H410V199H404V198H406V208H414V208H421V214H433Z"/>
        {/* Face stays black, hair hints define profile */}
        <Path d="M431 255H478V278H486V293H478V302H436V296H425V279H432Z"/>
        {/* Cape pointing left, sturdy little torso */}
        <Path d="M441 292H476V302H488V314H495V331H506V348H491V341H478V353H458V346H443V354H428V342H405V350H390V337H400V325H412V312H426V301H441Z"/>
        <Path d="M441 346H452V361H442V374H428V366H434V351H441Z"/>
        <Path d="M465 347H482V361H489V374H467V364H461V354H465Z"/>
        {/* Small raised hand */}
        <Rect x={410} y={296} width={15} height={18}/>
        {/* Staff, with clear infinity head */}
        <Rect x={500} y={272} width={9} height={105}/>
        <Rect x={493} y={274} width={19} height={10}/>
      </G>
      <G fill="none" stroke="#081923" strokeWidth={9} strokeLinecap="square">
        <Circle cx={494} cy={257} r={12}/><Circle cx={517} cy={257} r={12}/>
      </G>
      {/* Ground: old-school terrain tiles and reflections */}
      <Rect x={0} y={383} width={900} height={27} fill="#122e39"/>
      <Rect x={0} y={375} width={900} height={8} fill="#2c5352"/>
      {Array.from({length:17},(_,i)=><Rect key={'stone'+i} x={i*55-10} y={388+i%3*7} width={33} height={3} fill="#517469" opacity={0.5}/>)}
      <G fill="#254e4b">
        <Rect x={55} y={340} width={45} height={19}/><Rect x={61} y={323} width={12} height={17}/>
        <Rect x={150} y={354} width={36} height={9}/><Rect x={800} y={342} width={47} height={18}/>
        <Rect x={816} y={326} width={12} height={16}/>
      </G>
    </Svg>
  );
}

export default function AdventureHome({ mode, onMode, onStart, loading, preview = false }: {
  mode: PlayMode; onMode: (mode: PlayMode) => void; onStart: () => void; loading: boolean; preview?: boolean;
}) {
  const width = useWindowDimensions().width;
  const small = width < 390;
  const [showHowTo, setShowHowTo] = useState(false);
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>MATH ADVENTURE</Text>
      <Text accessibilityRole="header" style={[styles.title,small&&styles.titleSmall]}>数のトビラ</Text>
      <Text style={styles.subtitle}>ひとつ解くたび、世界がひらく。</Text>
      <View style={styles.pixelFrame} accessible accessibilityLabel="数学記号が浮かぶ夜のトビラの前に、魔法使いオイラーの黒いシルエットが立っている">
        <EulerPixelPortal />
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading} onPress={onStart}
        style={({ pressed }) => [styles.start,(pressed || loading) && styles.dim]}>
        <Text style={[styles.startLabel,small&&styles.startSmall]}>{loading ? 'じゅんびちゅう…' : '▶ ぼうけんを はじめる'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:showHowTo}}
        onPress={()=>setShowHowTo(previous=>!previous)} style={styles.howToButton}>
        <Text style={styles.howToLabel}>{showHowTo ? '▲ とじる' : '▷ あそびかた'}</Text>
      </Pressable>
      {showHowTo && (
        <View style={styles.howToPanel}>
          <Text style={styles.howToText}>1. せかいちずから 島を えらぼう。</Text>
          <Text style={styles.howToText}>2. ステージの もんだいに ちょうせんしよう。</Text>
          <Text style={styles.howToText}>3. むずかしいときは ヒントを みよう。</Text>
          <Text style={styles.howToText}>オイラーと いっしょに、{worldIslands.length}の島を ぼうけんしよう！</Text>
        </View>
      )}
      {!preview && <View style={styles.modeSection}>
        <ModeControls mode={mode} onChange={onMode}/>
        <Text style={styles.modeHint}>{mode === 'test'
          ? 'テストモードでは きろくは のこらないよ。'
          : 'あそんだ きろくを のこして すすもう。'}</Text>
      </View>}
      {!preview && <VersionNotice />}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width:'100%', backgroundColor:'#122b3a', borderRadius:22, borderWidth:1,
    borderColor:'#45665c', padding:16, gap:12, overflow:'hidden', alignItems:'center' },
  eyebrow: { color:'#d6ba79', fontSize:15, letterSpacing:3, fontWeight:'900', marginTop:12, textAlign:'center' },
  title: { color:'#f8e5b9', fontSize:47, lineHeight:61, fontWeight:'900', textAlign:'center' },
  titleSmall: { fontSize:37, lineHeight:50 },
  subtitle: { color:'#e3e7dc', fontSize:15, fontWeight:'700', textAlign:'center', marginBottom:3 },
  pixelFrame: { width:'100%', aspectRatio: 2.19, maxHeight:480, minHeight:160,
    backgroundColor:'#10273b', borderRadius:11, borderWidth:2, borderColor:'#62766c', overflow:'hidden' },
  start: { width:'100%', minHeight:64, borderRadius:13, backgroundColor:'#f3d384', borderWidth:2,
    borderColor:'#ffe8ad', justifyContent:'center', alignItems:'center', paddingHorizontal:12 },
  startLabel: { color:'#172e3c', fontWeight:'900', fontSize:21, textAlign:'center' },
  startSmall: { fontSize:17 },
  howToButton: { width:'100%', minHeight:52, borderWidth:1, borderColor:'#799187',
    borderRadius:12, alignItems:'center', justifyContent:'center' },
  howToLabel: { color:'#f3e9cc', fontSize:17, fontWeight:'800' },
  howToPanel: { width:'100%', borderRadius:10, padding:14, backgroundColor:'#21413e', gap:7 },
  howToText: { color:'#f5eedc', fontWeight:'700', fontSize:14, lineHeight:22 },
  modeSection: { width:'100%', alignItems:'center', gap:8, marginTop:2 },
  modeControls: { flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:7 },
  modeButton: { minHeight:44, alignItems:'center', justifyContent:'center', paddingHorizontal:14,
    borderRadius:9, backgroundColor:'#d9e5df', borderWidth:1, borderColor:'#91aa9f' },
  selected: { backgroundColor:'#266653', borderColor:'#a2c6b0' },
  selectedTest: { backgroundColor:'#57476c', borderColor:'#c0b0d3' },
  modeLabel: { color:'#223e3b', fontSize:13, fontWeight:'800' },
  selectedLabel: { color:'#fff' },
  modeHint: { color:'#c6d8d2', fontSize:12, textAlign:'center' },
  dim: { opacity:0.65 },
  badge: { alignSelf:'flex-start', paddingVertical:5, paddingHorizontal:9,
    backgroundColor:'#d8ede6', color:'#174b46', fontWeight:'800', borderRadius:12,
    fontSize:12, overflow:'hidden' },
  badgeTest: { backgroundColor:'#e9dcfb', color:'#4c346c' },
});
