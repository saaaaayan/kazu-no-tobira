import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { consecutiveCorrect } from '../domain/rewards';

type AnswerFeedback = 'correct' | 'incorrect';

export function MagicMeter({ results, total }: { results: readonly AnswerFeedback[]; total: number }) {
  const light = results.filter(result => result === 'correct').length;
  return (
    <View style={styles.meter} accessible accessibilityLabel={`まほうのひかり ${light}こ、ぜんぶで ${total}こ`}>
      <View style={styles.meterHeader}>
        <Text style={styles.meterTitle}>✦ まほうの ひかり</Text>
        <Text style={styles.meterCount}>{light} / {total}</Text>
      </View>
      <View style={styles.meterCells}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.meterCell, i < light && styles.meterFilled]}>
            <Text style={[styles.meterStar, i < light && styles.meterStarFilled]}>{i < light ? '✦' : '·'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ComboBadge({ results }: { results: readonly AnswerFeedback[] }) {
  const streak = consecutiveCorrect(results);
  if (streak < 2) return null;
  return (
    <View style={styles.combo} accessibilityLiveRegion="polite">
      <Text style={styles.comboSymbol}>✦ ✦</Text>
      <Text style={styles.comboText}>{streak}れんぞく せいかい！</Text>
      <Text style={styles.comboSymbol}>✦</Text>
    </View>
  );
}

const stars = [
  { x: 26, y: 4, dx: -24, dy: -54, size: 20, color: '#edbd4d' },
  { x: 68, y: 28, dx: -30, dy: -44, size: 16, color: '#69c8a7' },
  { x: 111, y: 6, dx: 10, dy: -62, size: 23, color: '#f3b9cf' },
  { x: 157, y: 37, dx: 24, dy: -49, size: 18, color: '#c6b3f6' },
  { x: 192, y: 10, dx: 46, dy: -45, size: 14, color: '#edbd4d' },
  { x: 12, y: 98, dx: -42, dy: 18, size: 16, color: '#f3b9cf' },
  { x: 70, y: 91, dx: -16, dy: 40, size: 21, color: '#ffe9a3' },
  { x: 132, y: 90, dx: 26, dy: 39, size: 18, color: '#69c8a7' },
  { x: 189, y: 105, dx: 42, dy: 30, size: 21, color: '#c6b3f6' },
];

export function SparkleBurst({ big = false }: { big?: boolean }) {
  const anims = useRef(stars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let live = true;
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!live) return;
      if (reduced) {
        for (const v of anims) v.setValue(0.3);
        return;
      }
      for (const v of anims) v.setValue(0);
      animation = Animated.parallel(anims.map((value, i) =>
        Animated.sequence([
          Animated.delay(i * 36),
          Animated.timing(value, { toValue: 1, duration: big ? 860 : 650, useNativeDriver: true }),
        ]),
      ));
      animation.start();
    }).catch(() => {});
    return () => { live = false; animation?.stop(); };
  }, [anims, big]);

  return (
    <View style={styles.burst} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
      {stars.map((star, i) => {
        const motion = anims[i];
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: star.x, top: star.y,
            opacity: motion.interpolate({ inputRange: [0, 0.25, 0.78, 1], outputRange: [0, 1, 0.8, 0] }),
            transform: [
              { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, star.dx * (big ? 1.5 : 1)] }) },
              { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, star.dy * (big ? 1.5 : 1)] }) },
              { rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', i % 2 ? '120deg' : '-105deg'] }) },
              { scale: motion.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.35, big ? 1.35 : 1, 0.7] }) },
            ],
          }}>
            <Svg width={star.size} height={star.size} viewBox="0 0 24 24" accessible={false}>
              <Path d="M12 1 15.2 8.8 23 12 15.2 15.2 12 23 8.8 15.2 1 12 8.8 8.8Z"
                fill={star.color} stroke="#fff8df" strokeWidth={1.5} />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { gap: 5, paddingTop: 6, paddingBottom: 3 },
  meterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meterTitle: { color: '#ffe2a3', fontWeight: '900', fontSize: 14 },
  meterCount: { color: '#f8f1cd', fontWeight: '800', fontSize: 13 },
  meterCells: { flexDirection: 'row', gap: 5 },
  meterCell: { flex: 1, height: 21, backgroundColor: '#3b456f', borderRadius: 7, borderWidth: 1,
    borderColor: '#6976a0', alignItems: 'center', justifyContent: 'center' },
  meterFilled: { backgroundColor: '#efc67e', borderColor: '#fff3bc' },
  meterStar: { fontSize: 15, lineHeight: 17, color: '#97a0c0', fontWeight: '900' },
  meterStarFilled: { color: '#80501c' },
  combo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff0ad', borderColor: '#e5ac4e', borderWidth: 2, borderRadius: 13,
    paddingHorizontal: 8, paddingVertical: 7, gap: 7 },
  comboSymbol: { color: '#ce7927', fontSize: 16, fontWeight: '900' },
  comboText: { color: '#7c4317', fontSize: 18, fontWeight: '900' },
  burst: { position: 'absolute', zIndex: 0, right: 0, top: 0, width: 220, height: 140 },
});
