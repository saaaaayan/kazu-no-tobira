import { useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { worldIslands } from '../domain/worldCatalog';
import type { PlayMode } from '../domain/playMode';
import VersionNotice from './VersionNotice';

const EULER_HOME_ART = require('../../assets/euler-math-title.png');
const PUBLIC_HOME_URL = 'https://saaaaayan.github.io/kazu-no-tobira/';
type HomePanel = 'intro' | 'players' | 'settings' | null;

/**
 * The approved 1448x1086 picture already paints ALL SIX home buttons.
 * No extra button artwork is allowed underneath it. Transparent, accessible
 * Pressables are positioned directly over the corresponding painted buttons.
 * Percentages refer to the source image itself, not the page or screen.
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

export default function AdventureHome({ mode, onMode, onStart, onTitles, loading, preview = false, soundEnabled, onSoundChange }: {
  mode: PlayMode; onMode: (mode: PlayMode) => void; onStart: () => void;
  onTitles?: () => void; loading: boolean; preview?: boolean;
  soundEnabled:boolean; onSoundChange:(enabled:boolean)=>void;
}) {
  const [activePanel, setActivePanel] = useState<HomePanel>(null);
  const [shareMessage, setShareMessage] = useState('');

  function togglePanel(panel: Exclude<HomePanel, null>) {
    setShareMessage('');
    setActivePanel(current => current === panel ? null : panel);
  }

  function closePanel() {
    setActivePanel(null);
    setShareMessage('');
  }

  async function shareHome() {
    setActivePanel(null);
    setShareMessage('');
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

  return (
    <View style={styles.hero}>
      <View style={styles.illustrationFrame}>
        <Image source={EULER_HOME_ART} resizeMode="stretch" style={styles.illustration} accessible
          accessibilityLabel="数のトビラ。数学記号と、トビラの前に立つオイラー。下部に冒険開始などのメニューがある。" />
        <Pressable accessibilityRole="button" accessibilityLabel="ぼうけんを つづける"
          accessibilityState={{ disabled: loading }} disabled={loading} onPress={onStart}
          style={({ pressed }) => [styles.artHit, styles.artResumeHit, pressed && styles.artPressed]} />
        <Pressable accessibilityRole="button" accessibilityLabel="はじめて あそぶ"
          accessibilityState={{ expanded: activePanel === 'intro' }} onPress={() => togglePanel('intro')}
          style={({ pressed }) => [styles.artHit, styles.artIntroHit, pressed && styles.artPressed]} />
        <Pressable accessibilityRole="button" accessibilityLabel="プレイヤー きりかえ・ついか"
          accessibilityState={{ expanded: activePanel === 'players' }} onPress={() => togglePanel('players')}
          style={({ pressed }) => [styles.artHit, styles.artPlayersHit, pressed && styles.artPressed]} />
        <Pressable accessibilityRole="button" accessibilityLabel="しょうごう あつめた たからもの"
          onPress={onTitles ?? onStart}
          style={({ pressed }) => [styles.artHit, styles.artTitlesHit, pressed && styles.artPressed]} />
        <Pressable accessibilityRole="button" accessibilityLabel="せってい"
          accessibilityState={{ expanded: activePanel === 'settings' }} onPress={() => togglePanel('settings')}
          style={({ pressed }) => [styles.artHit, styles.artSettingsHit, pressed && styles.artPressed]} />
        <Pressable accessibilityRole="button" accessibilityLabel="きょうゆう" onPress={shareHome}
          style={({ pressed }) => [styles.artHit, styles.artShareHit, pressed && styles.artPressed]} />
        {(activePanel !== null || shareMessage !== '') && (
          <View style={styles.overlayPanel}>
            <Pressable accessibilityRole="button" accessibilityLabel="メニューを とじる"
              onPress={closePanel} style={styles.closeButton}>
              <Text style={styles.closeLabel}>× とじる</Text>
            </Pressable>
            {activePanel === 'intro' && <>
              <Text style={styles.noteTitle}>はじめての ぼうけん</Text>
              <Text style={styles.noteText}>せかいちずから しまを えらんで、もんだいに ちょうせんしよう。</Text>
              <Text style={styles.noteText}>こまったら ヒントを みてね。オイラーと {worldIslands.length}の しまを めぐろう！</Text>
              <Pressable accessibilityRole="button" disabled={loading} onPress={onStart} style={styles.panelButton}>
                <Text style={styles.panelButtonText}>▶ ぼうけんを はじめる</Text>
              </Pressable>
            </>}
            {activePanel === 'players' && <>
              <Text style={styles.noteTitle}>プレイヤー</Text>
              <Text style={styles.noteText}>とうろく・きりかえは、じゅんびちゅう だよ。</Text>
            </>}
            {activePanel === 'settings' && <>
              <Text style={styles.noteTitle}>せってい</Text>
              <ModeControls mode={mode} onChange={onMode} />
              <Text style={styles.noteText}>こうかおん（BGMは まだ ないよ）</Text>
              <Pressable testID="sound-settings-toggle" accessibilityRole="switch"
                accessibilityLabel="こうかおん" accessibilityState={{checked:soundEnabled}}
                onPress={()=>onSoundChange(!soundEnabled)}
                style={[styles.soundToggle,soundEnabled&&styles.soundToggleOn]}>
                <Text style={styles.soundToggleText}>{soundEnabled?'♪ こうかおん：オン':'♪ こうかおん：オフ'}</Text>
              </Pressable>
              <Text style={styles.noteText}>{mode === 'test'
                ? 'テストモードでは きろくは のこらないよ。'
                : 'あそんだ きろくを のこして すすもう。'}</Text>
            </>}
            {shareMessage !== '' && <Text style={styles.noteText} selectable>{shareMessage}</Text>}
          </View>
        )}
      </View>
      {!preview && <VersionNotice />}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%', maxWidth: 1050, alignSelf: 'center',
    backgroundColor: '#0c2140', borderRadius: 22, overflow: 'hidden',
    alignItems: 'center',
  },
  illustrationFrame: {
    position: 'relative', width: '100%', aspectRatio: 1448 / 1086,
    overflow: 'hidden',
  },
  illustration: { width: '100%', height: '100%' },
  artHit: { position: 'absolute', backgroundColor: 'transparent', borderRadius: 0 },
  artPressed: { backgroundColor: 'rgba(255,242,190,0.16)' },
  // Source-image positions. All rectangles are inset within their illustrated buttons.
  artResumeHit: { left: '19.5%', top: '72.5%', width: '61%', height: '7.5%' },
  artIntroHit: { left: '19.0%', top: '81.0%', width: '62%', height: '6.4%' },
  artPlayersHit: { left: '15.2%', top: '88.6%', width: '33.6%', height: '8%' },
  artTitlesHit: { left: '51.2%', top: '88.6%', width: '33.6%', height: '8%' },
  artSettingsHit: { left: '2.2%', top: '89.0%', width: '5.8%', height: '8%' },
  artShareHit: { left: '92.0%', top: '89.0%', width: '5.8%', height: '8%' },
  overlayPanel: {
    position: 'absolute', top: '14%', left: '7%', right: '7%',
    maxWidth: 620, alignSelf: 'center', backgroundColor: '#112a47',
    borderWidth: 3, borderColor: '#e9d5a4', padding: 12,
    gap: 7, shadowColor: '#041422', shadowOpacity: 0.8,
    shadowRadius: 0, shadowOffset: { width: 5, height: 5 }, elevation: 6,
  },
  closeButton: { minHeight: 36, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 10 },
  closeLabel: { color: '#fff0c8', fontSize: 14, fontWeight: '900' },
  noteTitle: { color: '#f8e0ab', fontWeight: '900', fontSize: 19 },
  noteText: { color: '#f4eedb', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  panelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, backgroundColor: '#f3d184', borderRadius: 0 },
  panelButtonText: { color: '#102b3c', fontWeight: '900', fontSize: 16 },
  soundToggle:{alignSelf:'flex-start',minHeight:46,minWidth:190,alignItems:'center',justifyContent:'center',paddingHorizontal:12,
    backgroundColor:'#374a63',borderRadius:9,borderWidth:2,borderColor:'#b5bed0'},
  soundToggleOn:{backgroundColor:'#2d6a60',borderColor:'#a7dcc4'},
  soundToggleText:{fontSize:16,fontWeight:'900',color:'#fff7d9'},
  modeControls: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 7 },
  modeButton: {
    minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8,
    paddingHorizontal: 12, backgroundColor: '#e7edf0', borderWidth: 1, borderColor: '#b9cdcf',
  },
  selected: { backgroundColor: '#1c5c59', borderColor: '#88b7aa' },
  selectedTest: { backgroundColor: '#614c8c', borderColor: '#c8b3ed' },
  modeLabel: { color: '#223c52', fontSize: 13, fontWeight: '800' },
  selectedLabel: { color: '#fff' },
  badge: {
    alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 9,
    backgroundColor: '#d8ede6', color: '#174b46', fontWeight: '800',
    borderRadius: 12, fontSize: 12, overflow: 'hidden',
  },
  badgeTest: { backgroundColor: '#e9dcfb', color: '#4c346c' },
});
