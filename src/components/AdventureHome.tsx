import { useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { worldIslands } from '../domain/worldCatalog';
import type { PlayMode } from '../domain/playMode';
import VersionNotice from './VersionNotice';

const EULER_HOME_ART = require('../../assets/euler-math-title.png');
const PUBLIC_HOME_URL = 'https://saaaaayan.github.io/kazu-no-tobira/';

/**
 * The approved title illustration includes its UI artwork. On wide screens,
 * invisible, accessible hit targets align with the four pictured buttons.
 * On narrow screens we crop the illustrated buttons and render real, large
 * buttons beneath the same artwork to meet touch-target needs.
 */
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

export default function AdventureHome({ mode, onMode, onStart, onTitles, loading, preview = false }: {
  mode: PlayMode; onMode: (mode: PlayMode) => void; onStart: () => void;
  onTitles?: () => void; loading: boolean; preview?: boolean;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 690;
  const [introOpen, setIntroOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  async function shareHome() {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await navigator.share({ title: '数のトビラ', url: PUBLIC_HOME_URL });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(PUBLIC_HOME_URL);
          setShareMessage('リンクを コピーしたよ！');
        } else {
          setShareMessage(PUBLIC_HOME_URL);
        }
      } else {
        await Share.share({ message: PUBLIC_HOME_URL, title: '数のトビラ' });
      }
    } catch {
      setShareMessage(PUBLIC_HOME_URL);
    }
  }

  const switchPlayers = () => setPlayersOpen(value => !value);
  const switchIntro = () => setIntroOpen(value => !value);

  return (
    <View style={styles.hero}>
      <View style={[styles.illustrationClip, compact && styles.illustrationClipCompact]}>
        <Image source={EULER_HOME_ART} resizeMode="stretch" style={styles.illustration} accessible
          accessibilityLabel="数のトビラ。数学記号が浮かぶ星空と遺跡、輝くトビラの前に立つオイラーの黒いシルエット。" />
        {!compact && <>
          <Pressable accessibilityRole="button" accessibilityLabel="ぼうけんを つづける"
            accessibilityState={{ disabled: loading }} disabled={loading} onPress={onStart}
            style={({ pressed }) => [styles.hotspot, styles.resumeHit, pressed && styles.hotspotPressed]} />
          <Pressable accessibilityRole="button" accessibilityLabel="はじめて あそぶ"
            accessibilityState={{ expanded: introOpen }} onPress={switchIntro}
            style={({ pressed }) => [styles.hotspot, styles.introHit, pressed && styles.hotspotPressed]} />
          <Pressable accessibilityRole="button" accessibilityLabel="プレイヤー きりかえ・ついか"
            accessibilityState={{ expanded: playersOpen }} onPress={switchPlayers}
            style={({ pressed }) => [styles.hotspot, styles.playersHit, pressed && styles.hotspotPressed]} />
          <Pressable accessibilityRole="button" accessibilityLabel="しょうごう あつめたたからもの"
            onPress={onTitles ?? onStart}
            style={({ pressed }) => [styles.hotspot, styles.titlesHit, pressed && styles.hotspotPressed]} />
          {!preview && <Pressable accessibilityRole="button" accessibilityLabel="せってい"
            accessibilityState={{ expanded: settingsOpen }} onPress={() => setSettingsOpen(value => !value)}
            style={({ pressed }) => [styles.hotspot, styles.settingsHit, pressed && styles.hotspotPressed]} />}
          <Pressable accessibilityRole="button" accessibilityLabel="このアプリを 共有する" onPress={shareHome}
            style={({ pressed }) => [styles.hotspot, styles.shareHit, pressed && styles.hotspotPressed]} />
        </>}
      </View>
      {compact && <View style={styles.mobileControls}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading }}
          disabled={loading} onPress={onStart} style={styles.mobileStart}>
          <Text style={styles.mobileStartLabel}>{loading ? 'じゅんびちゅう…' : '▶ ぼうけんを つづける'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={switchIntro}
          accessibilityState={{ expanded: introOpen }} style={styles.mobileIntro}>
          <Text style={styles.mobileIntroLabel}>▶ はじめて あそぶ</Text>
        </Pressable>
        <View style={styles.mobileRow}>
          <Pressable accessibilityRole="button" onPress={switchPlayers} style={styles.mobileCard}>
            <Text style={styles.mobileCardLabel}>♟ プレイヤー</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onTitles ?? onStart} style={styles.mobileCard}>
            <Text style={styles.mobileCardLabel}>🏆 しょうごう</Text>
          </Pressable>
        </View>
        <View style={styles.mobileRow}>
          {!preview && <Pressable accessibilityRole="button" onPress={() => setSettingsOpen(v => !v)} style={styles.mobileUtility}>
            <Text style={styles.mobileUtilityLabel}>⚙ せってい</Text>
          </Pressable>}
          <Pressable accessibilityRole="button" onPress={shareHome} style={styles.mobileUtility}>
            <Text style={styles.mobileUtilityLabel}>↥ きょうゆう</Text>
          </Pressable>
        </View>
      </View>}
      {introOpen && <View style={styles.note}>
        <Text style={styles.noteTitle}>はじめての ぼうけん</Text>
        <Text style={styles.noteText}>せかいちずから 島を えらんで、ステージの もんだいに ちょうせんしよう。</Text>
        <Text style={styles.noteText}>こまったら ヒントを みてね。オイラーと {worldIslands.length}の島を めぐろう！</Text>
        <Pressable accessibilityRole="button" disabled={loading} onPress={onStart} style={styles.panelButton}>
          <Text style={styles.panelButtonText}>▶ ぼうけんを はじめる</Text>
        </Pressable>
      </View>}
      {playersOpen && <View style={styles.note}>
        <Text style={styles.noteText}>プレイヤーの とうろく・きりかえは、じゅんびちゅう だよ。</Text>
      </View>}
      {settingsOpen && !preview && <View style={styles.note}>
        <Text style={styles.noteTitle}>せってい</Text>
        <ModeControls mode={mode} onChange={onMode} />
        <Text style={styles.noteText}>{mode === 'test'
          ? 'テストモードでは きろくは のこらないよ。'
          : 'あそんだ きろくを のこして すすもう。'}</Text>
      </View>}
      {shareMessage ? <Text style={styles.shareText} selectable>{shareMessage}</Text> : null}
      {!preview && <VersionNotice />}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%', maxWidth: 1050, alignSelf: 'center', backgroundColor: '#0c2140',
    borderRadius: 22, overflow: 'hidden', alignItems: 'center',
  },
  illustrationClip: { position: 'relative', width: '100%', aspectRatio: 1448 / 1086, overflow: 'hidden' },
  illustrationClipCompact: { aspectRatio: 1448 / 761 },
  illustration: { width: '100%', aspectRatio: 1448 / 1086 },
  hotspot: { position: 'absolute', borderRadius: 7 },
  hotspotPressed: { backgroundColor: 'rgba(255,244,196,0.17)', borderWidth: 2, borderColor: '#ffebaa' },
  resumeHit: { left: '18.5%', top: '70.5%', width: '60.7%', height: '7.3%' },
  introHit: { left: '18.2%', top: '78.5%', width: '61.5%', height: '7%' },
  playersHit: { left: '14.4%', top: '86%', width: '33.6%', height: '8%' },
  titlesHit: { left: '49.4%', top: '86%', width: '33.7%', height: '8%' },
  settingsHit: { left: '1.6%', top: '85.9%', width: '6.6%', height: '8.8%' },
  shareHit: { left: '89.4%', top: '85.9%', width: '6.9%', height: '8.8%' },
  mobileControls: { width: '100%', paddingHorizontal: 11, paddingBottom: 13, gap: 8 },
  mobileStart: {
    backgroundColor: '#f3ca70', borderWidth: 2, borderColor: '#ffedb0', borderRadius: 9,
    minHeight: 56, alignItems: 'center', justifyContent: 'center',
  },
  mobileStartLabel: { color: '#0b2140', fontWeight: '900', fontSize: 19 },
  mobileIntro: {
    backgroundColor: '#122a4b', borderWidth: 2, borderColor: '#ffedb0', borderRadius: 9,
    minHeight: 54, alignItems: 'center', justifyContent: 'center',
  },
  mobileIntroLabel: { color: '#fff0c8', fontWeight: '900', fontSize: 18 },
  mobileRow: { flexDirection: 'row', gap: 8 },
  mobileCard: {
    flex: 1, minWidth: 0, minHeight: 50, borderWidth: 2, borderRadius: 8, borderColor: '#c4aa71',
    backgroundColor: '#162c50', alignItems: 'center', justifyContent: 'center',
  },
  mobileCardLabel: { color: '#ffe9bc', fontWeight: '800', fontSize: 13 },
  mobileUtility: {
    flex: 1, borderWidth: 1, borderColor: '#788d9e', minHeight: 42, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  mobileUtilityLabel: { color: '#f3e1bd', fontSize: 13, fontWeight: '700' },
  note: { width: '96%', padding: 14, gap: 9, marginVertical: 7, borderRadius: 10, backgroundColor: '#203c52' },
  noteTitle: { color: '#f8e0ab', fontWeight: '900', fontSize: 19 },
  noteText: { color: '#f4eedb', fontSize: 14, fontWeight: '700', lineHeight: 22 },
  panelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, backgroundColor: '#f3d184', borderRadius: 8 },
  panelButtonText: { color: '#102b3c', fontWeight: '900', fontSize: 16 },
  shareText: { color: '#ffe9ba', padding: 10, fontWeight: '700' },
  modeControls: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 7 },
  modeButton: {
    minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 9,
    paddingHorizontal: 12, backgroundColor: '#e7edf0', borderWidth: 1, borderColor: '#b9cdcf',
  },
  selected: { backgroundColor: '#1c5c59', borderColor: '#88b7aa' },
  selectedTest: { backgroundColor: '#614c8c', borderColor: '#c8b3ed' },
  modeLabel: { color: '#223c52', fontSize: 13, fontWeight: '800' },
  selectedLabel: { color: '#fff' },
  badge: {
    alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 9, backgroundColor: '#d8ede6',
    color: '#174b46', fontWeight: '800', borderRadius: 12, fontSize: 12, overflow: 'hidden',
  },
  badgeTest: { backgroundColor: '#e9dcfb', color: '#4c346c' },
});
