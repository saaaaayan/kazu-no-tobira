import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { companionSpeech, type CompanionMood } from '../domain/companionSpeech';
import { firstGradeStages, type AdditionStage } from '../domain/curriculum';
import { earnedRewards, rewardForStage } from '../domain/rewards';
import type { Progress } from '../domain/progress';
export type { CompanionMood } from '../domain/companionSpeech';

// Temporary mathematical emblem for Euler until the approved standalone sprite is registered.
// Do not display the retired character or invent a new official portrait.
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

  return (
    <Animated.View
      accessible={false} importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, alignItems:'center', justifyContent:'center', transform: [{ translateY: jump }, { rotate: tilt }] }}>
      <View style={[styles.eulerMark, { width:size*.76, height:size*.76, borderRadius:size*.12 }]}>
        <Text style={[styles.eulerMarkText,{fontSize:size*.42}]}>e</Text>
        <Text style={[styles.eulerMarkSub,{fontSize:size*.15}]}>π · i · ∞</Text>
      </View>
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
        <Text style={[styles.name, onDark && styles.nameDark]}>オイラー</Text>
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
  eulerMark: { backgroundColor:'#214b40', borderColor:'#d6ba76', borderWidth:2, alignItems:'center', justifyContent:'center' },
  eulerMarkText: { color:'#f3d799', fontWeight:'900', lineHeight:undefined },
  eulerMarkSub: { color:'#f3d799', fontWeight:'700' },
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
