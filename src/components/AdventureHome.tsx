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
    ['π',74,69,43],['∞',176,79,32],['Σ',282,73,37],['∫',665,68,40],['e',763,80,39],['i',830,63,25],
    ['x²',808,161,31],['√2',185,170,30],['a²+b²=c²',132,248,22],['f(x)',765,266,31],
    ['θ',696,226,29],['lim',620,234,23],['+',590,184,30],['−',623,184,30],['×',654,184,30],['÷',688,184,30],
    ['%',220,285,26],['Δ',827,300,28],['Σ',314,265,25],['r',718,298,19],
  ];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid meet" accessible={false}>
      <Rect width={900} height={540} fill="#0b2140"/>
      <G transform="translate(0 117)">
      <Rect y={175} width={900} height={235} fill="#18394c"/>
      <Path d="M0 237H35V215H69V197H112V219H150V195H194V223H223V262H0Z" fill="#284958"/>
      <Path d="M900 243H856V218H824V193H792V213H745V187H708V232H669V264H900Z" fill="#294a58"/>
      <Path d="M0 283H45V263H95V245H125V261H177V244H216V287H269V338H0Z" fill="#203c4b"/>
      <Path d="M900 282H858V260H806V239H764V262H719V247H670V284H630V340H900Z" fill="#1b3748"/>
      {stars.map(([x,y,s],i) => <G key={'star'+i} fill={i%3===0?'#edce82':'#aec7bc'}>
        <Rect x={x} y={y} width={s*2} height={s*2}/><Rect x={x-s} y={y+s/2} width={s*4} height={s}/><Rect x={x+s/2} y={y-s} width={s} height={s*4}/>
      </G>)}
      {symbols.map(([value,x,y,size],i) => (
        <SvgText key={'symbol'+i} x={x} y={y} textAnchor="middle" fontWeight="bold"
          fontSize={size} fill={i%3===0?'#f3d58f':'#d8e1cf'} opacity={0.92}>{value}</SvgText>
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
      </G>
      {/* Math in the title band, balanced on both sides of the title. */}
      <G fill="#eed18a" opacity={0.95}>
        <SvgText x={57} y={75} fontSize={36} fontWeight="bold">π</SvgText>
        <SvgText x={161} y={70} fontSize={26} fontWeight="bold">∞</SvgText>
        <SvgText x={239} y={74} fontSize={29} fontWeight="bold">Σ</SvgText>
        <SvgText x={633} y={70} fontSize={35}>∫</SvgText>
        <SvgText x={730} y={75} fontSize={31} fontWeight="bold">e</SvgText>
        <SvgText x={828} y={69} fontSize={29}>△</SvgText>
      </G>
      <G fill="#f7e2a9" opacity={0.85}>
        <Rect x={55} y={114} width={5} height={5}/>
        <Rect x={176} y={102} width={3} height={3}/>
        <Rect x={716} y={119} width={5} height={5}/>
        <Rect x={838} y={112} width={4} height={4}/>
      </G>
    </Svg>
  );
}

export default function AdventureHome({ mode, onMode, onStart, onTitles, loading, preview = false }: {
  mode: PlayMode; onMode: (mode: PlayMode) => void; onStart: () => void;
  onTitles?: () => void; loading: boolean; preview?: boolean;
}) {
  const width = useWindowDimensions().width;
  const small = width < 390;
  const [showHowTo, setShowHowTo] = useState(false);
  const [showPlayerNote, setShowPlayerNote] = useState(false);
  return (
    <View style={styles.hero}>
      <View style={styles.pixelFrame} accessible accessibilityLabel="数学記号が夜空に浮かび、魔法のトビラの前にオイラーの黒いシルエットが立っている">
        <EulerPixelPortal />
        <View style={styles.titleOverlay} pointerEvents="none">
          <Text style={styles.eyebrow}>──── MATH ADVENTURE ────</Text>
          <Text accessibilityRole="header" style={[styles.title,small&&styles.titleSmall]}>数のトビラ</Text>
          <Text style={styles.subtitle}>ひとつ解くたび、世界がひらく。</Text>
        </View>
      </View>
      <View style={styles.buttonStack}>
        <Pressable accessibilityRole="button" accessibilityState={{disabled:loading}} disabled={loading} onPress={onStart}
          style={({pressed})=>[styles.start,(pressed||loading)&&styles.dim]}>
          <Text style={[styles.startLabel,small&&styles.startSmall]}>{loading?'じゅんびちゅう…':'▶ ぼうけんを つづける'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setShowHowTo(v=>!v)} accessibilityState={{expanded:showHowTo}}
          style={styles.howToButton}>
          <Text style={styles.howToLabel}>{showHowTo?'▲ とじる':'▶ はじめて あそぶ'}</Text>
        </Pressable>
        {showHowTo && <View style={styles.howToPanel}>
          <Text style={styles.howToText}>せかいちずから 島を えらぼう。もんだいを といて、こまったら ヒントを みてね。</Text>
          <Text style={styles.howToText}>オイラーと いっしょに、{worldIslands.length}の島を めぐろう！</Text>
          <Pressable accessibilityRole="button" onPress={onStart} disabled={loading} style={styles.start}>
            <Text style={styles.startLabel}>▶ ぼうけんを はじめる</Text>
          </Pressable>
        </View>}
        <View style={styles.cardRow}>
          <Pressable accessibilityRole="button" accessibilityState={{expanded:showPlayerNote}}
            onPress={()=>setShowPlayerNote(v=>!v)} style={styles.menuCard}>
            <Text style={styles.menuIcon}>♟</Text>
            <View><Text style={styles.menuTitle}>プレイヤー</Text><Text style={styles.menuDetail}>きりかえ・ついか</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onTitles ?? onStart} style={styles.menuCard}>
            <Text style={styles.menuIcon}>🏆</Text>
            <View><Text style={styles.menuTitle}>しょうごう</Text><Text style={styles.menuDetail}>あつめた たからもの</Text></View>
          </Pressable>
        </View>
        {showPlayerNote&&<View style={styles.howToPanel}><Text style={styles.howToText}>
          プレイヤーの きりかえ・ついか は じゅんびちゅう だよ。
        </Text></View>}
      </View>
      {!preview && <View style={styles.modeSection}>
        <ModeControls mode={mode} onChange={onMode}/>
        <Text style={styles.modeHint}>{mode==='test'?'テストモードでは きろくは のこらないよ。':'あそんだ きろくを のこして すすもう。'}</Text>
      </View>}
      {!preview&&<VersionNotice/>}
    </View>
  );
}

const styles = StyleSheet.create({
  hero:{backgroundColor:'#0b2140',borderRadius:24,overflow:'hidden',padding:0,gap:0},
  pixelFrame:{width:'100%',aspectRatio:900/540,backgroundColor:'#0b2140',position:'relative'},
  titleOverlay:{position:'absolute',top:'1%',left:0,right:0,alignItems:'center',gap:1},
  eyebrow:{color:'#f4ddae',fontSize:16,letterSpacing:1.4,fontWeight:'900',textAlign:'center'},
  title:{color:'#ffe3a0',fontSize:51,lineHeight:65,fontWeight:'900',textAlign:'center',textShadowColor:'#4a352d',textShadowOffset:{width:3,height:3},textShadowRadius:0},
  titleSmall:{fontSize:33,lineHeight:42},
  subtitle:{color:'#fff0c4',fontSize:16,fontWeight:'900',textAlign:'center'},
  buttonStack:{paddingHorizontal:18,paddingBottom:17,gap:9,marginTop:-2},
  start:{backgroundColor:'#f6ca70',borderWidth:2,borderColor:'#fff0ad',borderRadius:9,minHeight:57,alignItems:'center',justifyContent:'center',paddingHorizontal:8},
  startLabel:{color:'#102441',fontSize:22,fontWeight:'900',textAlign:'center'},
  startSmall:{fontSize:17},
  howToButton:{borderWidth:2,borderColor:'#f5dfae',borderRadius:9,minHeight:56,alignItems:'center',justifyContent:'center'},
  howToLabel:{color:'#ffe9b4',fontSize:21,fontWeight:'900'},
  howToPanel:{backgroundColor:'#16364c',padding:12,gap:10,borderRadius:8},
  howToText:{color:'#fff0cc',fontSize:14,fontWeight:'700',lineHeight:22},
  cardRow:{flexDirection:'row',gap:10},
  menuCard:{flex:1,borderWidth:2,borderColor:'#9b9278',minWidth:0,borderRadius:9,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:9,paddingHorizontal:4,gap:9,backgroundColor:'#162d4b'},
  menuIcon:{fontSize:25,color:'#dfc681'},
  menuTitle:{color:'#f4e1af',fontWeight:'900',fontSize:17},
  menuDetail:{color:'#e6d6ac',fontSize:10,fontWeight:'700'},
  modeSection:{alignItems:'center',gap:6,padding:10},
  modeControls:{flexDirection:'row',gap:7,flexWrap:'wrap',justifyContent:'center'},
  modeButton:{minHeight:40,paddingHorizontal:14,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:'#dfe9e3',borderWidth:1,borderColor:'#8aa99d'},
  selected:{backgroundColor:'#28594b',borderColor:'#90ba9f'},
  selectedTest:{backgroundColor:'#57476c',borderColor:'#b5a0cf'},
  modeLabel:{color:'#223e3b',fontWeight:'800',fontSize:12},
  selectedLabel:{color:'#fff'},
  modeHint:{color:'#c6d8d2',fontSize:11,textAlign:'center'},
  dim:{opacity:0.6},
  badge:{alignSelf:'flex-start',paddingVertical:5,paddingHorizontal:9,backgroundColor:'#d8ede6',color:'#174b46',fontWeight:'800',borderRadius:12,fontSize:12,overflow:'hidden'},
  badgeTest:{backgroundColor:'#e9dcfb',color:'#4c346c'},
});
