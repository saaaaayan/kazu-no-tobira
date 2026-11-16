import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { worldIslands } from '../domain/worldCatalog';
import type { PlayMode } from '../domain/playMode';
import { CompanionAvatar } from './AdventureCompanion';
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

function PortalArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 580 500" preserveAspectRatio="xMidYMid slice" accessible={false}>
      <Defs>
        <LinearGradient id="homeSky" x2="0%" y2="100%">
          <Stop offset="0" stopColor="#142d49" /><Stop offset=".57" stopColor="#35616a" /><Stop offset="1" stopColor="#b2a471" />
        </LinearGradient>
        <RadialGradient id="homeHalo">
          <Stop offset="0" stopColor="#ffec9c" stopOpacity={0.88} /><Stop offset="1" stopColor="#f2ca72" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="homeDoor" x2="0%" y2="100%">
          <Stop offset="0" stopColor="#fff5bd" /><Stop offset=".55" stopColor="#b1edd3" /><Stop offset="1" stopColor="#59a99c" />
        </LinearGradient>
      </Defs>
      <Rect width={580} height={500} fill="url(#homeSky)" />
      <Circle cx={298} cy={231} r={226} fill="url(#homeHalo)" />
      <G fill="#e0e6c1" opacity={0.35}>
        <Path d="M0 186Q44 174 74 186Q109 165 164 190H0ZM368 148Q421 122 455 143Q483 128 530 150Z" />
        <Path d="M74 106Q124 86 165 104Q198 88 239 113H53Z" />
      </G>
      <Path d="M0 264L71 208 117 243 187 207 251 277 347 219 413 247 476 186 580 256V500H0Z" fill="#467378" />
      <Path d="M0 316Q74 244 139 283Q176 272 227 312Q305 249 365 277Q464 223 580 311V500H0Z" fill="#355c66" />
      <Path d="M0 378Q119 303 225 337Q310 373 410 314Q503 288 580 350V500H0Z" fill="#204650" />
      <Path d="M204 500Q346 449 279 415Q249 382 287 346L313 345Q292 392 346 413Q410 456 359 500Z"
        fill="#e2c481" opacity={0.52} />
      <Ellipse cx={300} cy={361} rx={102} ry={19} fill="#193e49" opacity={0.75} />
      <Path d="M226 359V222Q226 148 300 130Q374 148 374 222V359Z" fill="#2b4556" stroke="#b7a170" strokeWidth={12} />
      <Path d="M244 350V223Q244 164 300 150Q356 164 356 223V350Z"
        fill="url(#homeDoor)" stroke="#e0cf93" strokeWidth={5} />
      <Path d="M261 337V226Q261 179 300 167Q339 179 339 226V337" fill="none" stroke="#fff3c3" strokeWidth={2} opacity={0.74} />
      <Path d="M225 252H245M355 252H375M225 289H245M355 289H375M251 173L238 155M350 172L363 154M300 150V129"
        stroke="#decc94" strokeWidth={2} opacity={0.8} />
      <Path d="M217 355H383L394 367H206Z" fill="#b7a779" />
      {[[81,80],[131,151],[222,105],[406,111],[472,73],[526,197],[182,231],[412,211],[211,321],[395,313]].map(([x, y], i) => (
        <G key={i} transform={`translate(${x} ${y})`} fill="#ffeeac" opacity={i % 2 ? 0.65 : 0.94}>
          <Path d="M0-9Q1-1 8 0Q1 1 0 9Q-1 1-8 0Q-1-1 0-9Z" />
          <Circle cx={11} cy={-11} r={1.7} />
        </G>
      ))}
      <G fill="#173e46">
        <Path d="M29 387 58 285 78 355 99 308 129 397Z" />
        <Path d="M449 402 482 303 500 347 528 265 565 408Z" />
      </G>
    </Svg>
  );
}

export default function AdventureHome({ mode, onMode, onStart, loading }: {
  mode: PlayMode; onMode: (mode: PlayMode) => void; onStart: () => void; loading: boolean;
}) {
  const width = useWindowDimensions().width;
  const wide = width >= 740;
  const small = width < 390;

  return (
    <View style={[styles.hero, wide && styles.heroWide]}>
      <View style={[styles.art, wide && styles.artWide]} accessible accessibilityLabel="星のトビラの前で待つルミ">
        <View style={StyleSheet.absoluteFill} pointerEvents="none"><PortalArt /></View>
        <View style={[styles.lumi, wide && styles.lumiWide]} pointerEvents="none">
          <CompanionAvatar size={wide ? 196 : small ? 110 : 139} />
          <Text style={styles.lumiName}>ルミ</Text>
        </View>
      </View>
      <View style={[styles.copy, wide && styles.copyWide]}>
        <Text accessibilityRole="header" style={[styles.title, wide && styles.titleWide]}>数のトビラ</Text>
        <Text style={styles.subtitle}>ひとつ解くたび、世界がひらく。</Text>
        <Text style={styles.invitation}>ルミといっしょに、{worldIslands.length}の島をめぐろう。</Text>
        <ModeControls mode={mode} onChange={onMode} />
        <Text style={styles.modeHint}>{mode === 'test' ? '全ステージをためせるよ。記録やごほうびは のこらないよ。' : 'まなびの記録をのこしながら、島をひとつずつ開こう。'}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading} onPress={onStart}
          style={({ pressed }) => [styles.start, (pressed || loading) && styles.dim]}>
          <Text style={styles.startLabel}>{loading ? 'じゅんびちゅう…' : 'ぼうけんを はじめる'}</Text>
          <Text accessible={false} style={styles.arrow}>›</Text>
        </Pressable>
        <VersionNotice />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#132742', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#42626c' },
  heroWide: { flexDirection: 'row-reverse', minHeight: 522 },
  art: { height: 236, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  artWide: { flex: 1.16, height: 'auto', minHeight: 522 },
  lumi: { alignItems: 'center', marginBottom: 12 },
  lumiWide: { marginBottom: 56 },
  lumiName: { color: '#fff2c4', backgroundColor: '#173b4a', borderColor: '#a8966b', borderWidth: 1,
    fontSize: 13, fontWeight: '800', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  copy: { padding: 22, gap: 10, backgroundColor: '#132742' },
  copyWide: { flex: 1, justifyContent: 'center', padding: 36, gap: 13 },
  title: { color: '#fff2c8', fontSize: 38, lineHeight: 50, fontWeight: '900' },
  titleWide: { fontSize: 56, lineHeight: 68 },
  subtitle: { color: '#f4dc9c', fontSize: 17, fontWeight: '800', lineHeight: 25 },
  invitation: { color: '#d8e9e8', fontSize: 15, lineHeight: 24, marginBottom: 5 },
  modeControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  modeButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 9,
    paddingHorizontal: 12, backgroundColor: '#e7edf0', borderWidth: 1, borderColor: '#b9cdcf' },
  selected: { backgroundColor: '#1c5c59', borderColor: '#88b7aa' },
  selectedTest: { backgroundColor: '#614c8c', borderColor: '#c8b3ed' },
  modeLabel: { color: '#223c52', fontSize: 13, fontWeight: '800' },
  selectedLabel: { color: '#fff' },
  modeHint: { color: '#d6e1f3', fontSize: 13, lineHeight: 20 },
  start: { minHeight: 62, backgroundColor: '#f6d580', borderColor: '#ffedb7', borderWidth: 2, borderRadius: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 14, marginTop: 3 },
  startLabel: { color: '#273044', fontWeight: '900', fontSize: 19, flexShrink: 1 },
  arrow: { color: '#273044', fontWeight: '900', fontSize: 30 },
  dim: { opacity: 0.65 },
  badge: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 9, backgroundColor: '#d8ede6', color: '#174b46',
    fontWeight: '800', borderRadius: 12, fontSize: 12, overflow: 'hidden' },
  badgeTest: { backgroundColor: '#e9dcfb', color: '#4c346c' },
});
