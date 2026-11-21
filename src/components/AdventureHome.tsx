import { useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { worldIslands } from '../domain/worldCatalog';
import type { PlayMode } from '../domain/playMode';
import VersionNotice from './VersionNotice';

const EULER_HOME_ART = require('../../assets/euler-math-title.png');
const PUBLIC_HOME_URL = 'https://saaaaayan.github.io/kazu-no-tobira/';

/**
 * Use the gold start button already painted in the approved illustration.
 * Preserve all pixels and draw other actions as matching gold-trimmed
 * 8-bit controls. The transparent primary hit target is accessible.
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
          accessibilityLabel="数のトビラ。数学記号が浮かぶ星空と遺跡、輝くトビラの黒いシルエット。" />
        <Pressable accessibilityRole="button" accessibilityLabel="ぼうけんを つづける"
          accessibilityState={{ disabled: loading }} disabled={loading} onPress={onStart}
          hitSlop={8} style={styles.artStartHotspot} />
      </View>
      <View style={[styles.mobileControls, !compact && styles.wideControls]}>
        <Pressable accessibilityRole="button" onPress={switchIntro}
          accessibilityState={{ expanded: introOpen }} style={[styles.pixelFrame, styles.mobileIntro]}>
          <Text style={[styles.pixelLabel, styles.mobileIntroLabel]}>▶ はじめて あそぶ</Text>
        </Pressable>
        <View style={styles.mobileRow}>
          <Pressable accessibilityRole="button" onPress={switchPlayers} style={[styles.pixelFrame, styles.mobileCard]}>
            <Text style={[styles.pixelLabel, styles.mobileCardLabel]}>♟ プレイヤー</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onTitles ?? onStart} style={[styles.pixelFrame, styles.mobileCard]}>
            <Text style={[styles.pixelLabel, styles.mobileCardLabel]}>🏆 しょうごう</Text>
          </Pressable>
        </View>
        <View style={styles.mobileRow}>
          {!preview && <Pressable accessibilityRole="button" onPress={() => setSettingsOpen(v => !v)} style={[styles.pixelFrame, styles.mobileUtility]}>
            <Text style={[styles.pixelLabel, styles.mobileUtilityLabel]}>⚙ せってい</Text>
          </Pressable>}
          <Pressable accessibilityRole="button" onPress={shareHome} style={[styles.pixelFrame, styles.mobileUtility]}>
            <Text style={[styles.pixelLabel, styles.mobileUtilityLabel]}>↥ きょうゆう</Text>
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
  // Stretch image across its full 1448:1086 layout; no RN-web contain letterbox.
  illustrationClip: { position: 'relative', width: '100%', aspectRatio: 1448 / 1086, overflow: 'hidden' },
  illustration: { width: '100%', height: '100%' },
  artStartHotspot: { position: 'absolute', left: '19%', top: '90%', width: '62%', height: '9%', borderRadius: 0 },
  mobileControls: { width: '100%', paddingHorizontal: 12, paddingBottom: 16, paddingTop: 10, gap: 10 },
  wideControls: { maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 22, gap: 12 },
  pixelFrame: {
    borderRadius: 0, borderWidth: 3, borderColor: '#ffe5a0',
    shadowColor: '#091b32', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9, shadowRadius: 0, elevation: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  pixelLabel: { fontWeight: '900', textAlign: 'center' },
  mobileIntro: { backgroundColor: '#f2bf54', minHeight: 60, paddingHorizontal: 10 },
  mobileIntroLabel: { color: '#122846', fontSize: 19 },
  mobileRow: { flexDirection: 'row', gap: 10 },
  mobileCard: { flex: 1, minWidth: 0, minHeight: 56, backgroundColor: '#233858', paddingHorizontal: 8 },
  mobileCardLabel: { color: '#ffebbb', fontSize: 15 },
  mobileUtility: { flex: 1, minWidth: 0, minHeight: 50, backgroundColor: '#192e4e' },
  mobileUtilityLabel: { color: '#ffebbb', fontSize: 14 },
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
