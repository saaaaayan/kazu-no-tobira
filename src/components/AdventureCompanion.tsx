import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { companionSpeech, type CompanionMood } from '../domain/companionSpeech';
import { firstGradeStages, type AdditionStage } from '../domain/curriculum';
import { earnedRewards, rewardForStage } from '../domain/rewards';
import type { Progress } from '../domain/progress';
export type { CompanionMood } from '../domain/companionSpeech';

// Original character: Lumi, a small star-bearing explorer of the math islands.
// The SVG is deliberately self-contained so it works on Web, Android and iOS.
export function CompanionAvatar({ mood = 'ready', size = 88 }: {
  mood?: CompanionMood;
  size?: number;
}) {
  const jump = useRef(new Animated.Value(0)).current;
  const tilt = jump.interpolate({ inputRange: [-20, -10, 0], outputRange: ['-9deg', '6deg', '0deg'] });

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    jump.setValue(0);
    if (mood === 'ready' || mood === 'encourage') return;

    // React Native respects the system's Reduce Motion setting.
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active || reduced) return;
      const height = mood === 'clear' ? -20 : mood === 'correct' ? -13 : -4;
      animation = Animated.sequence([
        Animated.timing(jump, { toValue: height, duration: 190, useNativeDriver: true }),
        Animated.spring(jump, { toValue: 0, friction: 4, tension: 85, useNativeDriver: true }),
      ]);
      animation.start();
    }).catch(() => {});

    return () => {
      active = false;
      animation?.stop();
    };
  }, [jump, mood]);

  const cheering = mood === 'correct' || mood === 'clear';
  const sparkles = cheering || mood === 'ready';

  return (
    <Animated.View
      accessible={false} importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, transform: [{ translateY: jump }, { rotate: tilt }] }}>
      <Svg width={size} height={size} viewBox="0 0 140 140" accessible={false}>
        <Circle cx={70} cy={69} r={61} fill="#fff1b9" opacity={mood === 'clear' ? 0.22 : 0.11} />
        <Ellipse cx={70} cy={126} rx={39} ry={8} fill="#1d345f" opacity={0.16} />
        {sparkles && (
          <G fill="#ffdc83">
            <Path d="M16 23L19 31 27 34 19 37 16 45 13 37 5 34 13 31Z" />
            <Path d="M112 11L115 19 123 22 115 25 112 33 109 25 101 22 109 19Z" />
            {cheering && <Path d="M118 69L121 75 127 78 121 81 118 87 115 81 109 78 115 75Z" />}
          </G>
        )}
        {/* A little purple cape, pointy ears and soft turquoise body. */}
        <Path d="M39 79Q13 100 25 120L45 111Q70 135 96 111L118 120Q125 100 100 78Z"
          fill="#7865bc" stroke="#4d4b88" strokeWidth={2.5} strokeLinejoin="round" />
        <Path d="M41 103Q32 121 40 126M98 103Q106 121 99 126"
          fill="none" stroke="#344e89" strokeWidth={10} strokeLinecap="round" />
        <Path d="M39 96Q25 90 21 75M102 96Q115 89 119 75"
          fill="none" stroke="#3295ad" strokeWidth={12} strokeLinecap="round" />
        <Circle cx={21} cy={75} r={7} fill="#99e4d9" />
        <Circle cx={119} cy={75} r={7} fill="#99e4d9" />
        <Path d="M42 42L27 12Q51 19 59 34Z" fill="#45b4c5" stroke="#286d95" strokeWidth={3} strokeLinejoin="round" />
        <Path d="M98 42L113 12Q89 19 81 34Z" fill="#45b4c5" stroke="#286d95" strokeWidth={3} strokeLinejoin="round" />
        <Path d="M42 32L35 22 51 35Z M98 32L105 22 89 35Z" fill="#efb6cc" />
        <Ellipse cx={70} cy={77} rx={48} ry={48} fill="#40acc6" stroke="#246d94" strokeWidth={3} />
        <Ellipse cx={70} cy={81} rx={37} ry={34} fill="#d5f9ea" />
        <Ellipse cx={55} cy={75} rx={6} ry={9} fill="#25385e" />
        <Ellipse cx={85} cy={75} rx={6} ry={9} fill="#25385e" />
        <Circle cx={57} cy={72} r={2.5} fill="white" />
        <Circle cx={87} cy={72} r={2.5} fill="white" />
        <Ellipse cx={44} cy={88} rx={7} ry={4} fill="#f3a7bb" opacity={0.77} />
        <Ellipse cx={96} cy={88} rx={7} ry={4} fill="#f3a7bb" opacity={0.77} />
        <Path d={mood === 'incorrect' ? 'M61 95Q70 98 79 95' : cheering ? 'M57 93Q70 111 83 93' : 'M60 94Q70 104 80 94'}
          fill="none" stroke="#30506b" strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M70 37L74.5 46.5 85 48 77.5 55.5 79.3 66 70 61 60.7 66 62.5 55.5 55 48 65.5 46.5Z"
          fill="#ffe08f" stroke="#cf9c4e" strokeWidth={2} strokeLinejoin="round" />
        <Ellipse cx={47} cy={61} rx={7} ry={3} fill="white" opacity={0.3} transform="rotate(-35 47 61)" />
      </Svg>
    </Animated.View>
  );
}

export function CompanionMoment({ mood, variation = 0, onDark = false, compact = false, speech }: {
  mood: CompanionMood;
  variation?: number;
  onDark?: boolean;
  compact?: boolean;
  speech?: string;
}) {
  return (
    <View style={[styles.moment, !compact && styles.momentBig]}>
      <CompanionAvatar mood={mood} size={compact ? 69 : 116} />
      <View style={[styles.speech, onDark ? styles.speechDark : styles.speechLight]}>
        <Text style={[styles.name, onDark && styles.nameDark]}>ルミ</Text>
        <Text accessibilityLiveRegion="polite" style={[styles.message, onDark && styles.messageDark]}>
          {speech ?? companionSpeech(mood, variation)}
        </Text>
      </View>
    </View>
  );
}

// A visual celebration, not a claimed persistent inventory reward.
export function TreasureChest({ open, stageId }: { open: boolean; stageId: AdditionStage['id'] }) {
  const reward = rewardForStage(stageId);
  const arrival = useRef(new Animated.Value(open ? 0 : 1)).current;

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!mounted) return;
      if (!open || reduced) { arrival.setValue(1); return; }
      arrival.setValue(0);
      animation = Animated.spring(arrival, { toValue: 1, friction: 7, tension: 46, useNativeDriver: true });
      animation.start();
    }).catch(() => arrival.setValue(1));
    return () => { mounted = false; animation?.stop(); };
  }, [arrival, open]);

  return (
    <View style={styles.treasure} accessible accessibilityLabel={open
      ? 'たからばこがひらいた。キラキラのほうせきをみつけたよ'
      : 'まだひらいていないたからばこ'}>
      <Animated.View style={{ opacity: arrival, transform: [{ scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }] }}>
      <Svg width={170} height={130} viewBox="0 0 200 150" accessible={false}>
        <Ellipse cx={100} cy={139} rx={73} ry={8} fill="#3b325b" opacity={0.19} />
        {open && (
          <G>
            <Circle cx={100} cy={58} r={48} fill="#ffde8d" opacity={0.28} />
            <Path d="M53 30L57 39 66 43 57 47 53 56 49 47 40 43 49 39Z" fill="#f7ca60" />
            <Path d="M143 16L146 22 152 25 146 28 143 34 140 28 134 25 140 22Z" fill="#f7ca60" />
            <Path d="M100 21L118 48 100 75 82 48Z" fill={reward.color} stroke="#51668e" strokeWidth={3} />
            <Path d="M100 25L109 48H91Z" fill={reward.highlight} />
          </G>
        )}
        {open ? (
          <G>
            <Path d="M35 66Q33 22 68 22H132Q167 22 165 66L156 75H44Z"
              fill="#bd7c47" stroke="#744c4e" strokeWidth={5} strokeLinejoin="round" />
            <Path d="M45 61Q44 33 70 33H130Q156 33 155 61Z" fill="#f8d490" />
            <Path d="M69 26V70M131 26V70" stroke="#ffe8a2" strokeWidth={8} />
            <Rect x={36} y={81} width={128} height={51} rx={9} fill="#a56446" stroke="#70404d" strokeWidth={5} />
          </G>
        ) : (
          <G>
            <Path d="M35 83V66Q35 35 67 35H133Q165 35 165 66V83Z"
              fill="#bd7c47" stroke="#744c4e" strokeWidth={5} />
            <Path d="M46 76V63Q46 46 68 46H132Q154 46 154 63V76Z" fill="#f3cb7e" />
            <Rect x={36} y={81} width={128} height={51} rx={9} fill="#a56446" stroke="#70404d" strokeWidth={5} />
          </G>
        )}
        <Path d="M59 87V127M141 87V127" stroke="#f2c77b" strokeWidth={10} />
        <Path d="M39 100H161" stroke="#f3c979" strokeWidth={5} />
        <Rect x={87} y={81} width={26} height={26} rx={6} fill="#ffe0a2" stroke="#9a6c4a" strokeWidth={3} />
        <Circle cx={100} cy={94} r={4} fill="#825b65" />
      </Svg>
      </Animated.View>
      <Text style={styles.treasureLabel}>
        {open ? `${reward.name}を みつけた！` : 'ぜんもん せいかいで ひらくよ'}
      </Text>
    </View>
  );
}

// The collectible book is a view of previously cleared stages, not a second save file.
export function TreasureCollection({ progress }: { progress: Progress }) {
  const collected = earnedRewards(progress);
  return (
    <View style={styles.collection}>
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionTitle}>たからもの ずかん</Text>
        <Text style={styles.collectionCount}>{collected.length} / {firstGradeStages.length} こ</Text>
      </View>
      <View style={styles.collectionRow}>
        {firstGradeStages.map(stage => {
          const reward = rewardForStage(stage.id);
          const owned = Boolean(progress.stages[stage.id]);
          return (
            <View key={stage.id} accessible accessibilityLabel={owned ? reward.name + 'を はっけんずみ' : stage.title + 'の たからものは まだ みつけていない'}
              style={[styles.collectionSlot, owned && styles.collectionOwned]}>
              <Text style={[styles.collectionGem, owned && { color: reward.color }]}>
                {owned ? '◆' : '？'}
              </Text>
              <Text style={[styles.collectionName, !owned && styles.collectionUnknown]}>
                {owned ? reward.name : '？？？'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  moment: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  momentBig: { alignSelf: 'center', maxWidth: 480, paddingVertical: 3 },
  speech: { flexShrink: 1, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, minWidth: 0 },
  speechLight: { backgroundColor: '#fff7de', borderColor: '#e3c78f' },
  speechDark: { backgroundColor: '#374673', borderColor: '#7286b4' },
  name: { color: '#7d5a35', fontWeight: '900', fontSize: 13 },
  nameDark: { color: '#f9da9d' },
  message: { color: '#263659', fontWeight: '800', lineHeight: 22, fontSize: 16 },
  messageDark: { color: '#fff9e7' },
  treasure: { alignItems: 'center', gap: 0, paddingVertical: 2 },
  treasureLabel: { color: '#51436b', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  collection: { borderWidth: 1, borderColor: '#dfd4a6', backgroundColor: '#fff8df', borderRadius: 18, padding: 12, gap: 9 },
  collectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collectionTitle: { fontSize: 17, color: '#473c65', fontWeight: '900' },
  collectionCount: { color: '#796743', fontWeight: '800', fontSize: 13 },
  collectionRow: { flexDirection: 'row', gap: 7 },
  collectionSlot: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9e7ec', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 3, gap: 2 },
  collectionOwned: { backgroundColor: '#fffdf7', borderColor: '#e5c681', borderWidth: 1 },
  collectionGem: { fontSize: 28, fontWeight: '900', color: '#a1a0b0' },
  collectionName: { fontSize: 12, color: '#584575', fontWeight: '800', textAlign: 'center' },
  collectionUnknown: { color: '#918ca0' },
});
