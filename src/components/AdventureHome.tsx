import { useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { worldIslands } from '../domain/worldCatalog';
import type { PlayMode } from '../domain/playMode';
import VersionNotice from './VersionNotice';

const EULER_HOME_ART = require('../../assets/euler-math-title.png');
const PUBLIC_HOME_URL = 'https://saaaaayan.github.io/kazu-no-tobira/';

/**
 * Preserve the approved pixel-art title scene while cropping its painted
 * button strip. Real, visible Pressables are rendered below the illustration
 * on every viewport, so actions never depend on transparent image hotspots.
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
      <View style={styles.illustrationClip}>
        <Image source={EULER_HOME_ART} resizeMode="stretch" style={styles.illustration} accessible
          accessibilityLabel="数のトビラ。数学記号が浮かぶ星空と遺跡、輝くトビラの前に立つオイラーの黒いシルエット。" />
      </View>
      <View style={[styles.mobileControls, !compact && styles.wideControls]}>
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
      </View>
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
  // Buttons in the artwork begin below y=761. Crop that strip on all screens.
  illustrationClip: { position: 'relative', width: '100%', aspectRatio: 1448 / 761, overflow: 'hidden' },
  illustration: { width: '100%', aspectRatio: 1448 / 1086 },
  mobileControls: { width: '100%', paddingHorizontal: 11, paddingBottom: 13, gap: 8 },
  wideControls: { maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 20, gap: 10 },
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
