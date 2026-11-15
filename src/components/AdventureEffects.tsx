import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type AnswerFeedback = 'correct' | 'incorrect';

function Star({ fill, stroke = '#8c713f', size = 22 }: { fill: string; stroke?: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
    <Path d="m12 1 3.4 7 7.7 1.2-5.5 5.5 1.2 7.8-6.8-3.7-6.8 3.7 1.2-7.8L.9 9.2 8.6 8Z"
      fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
  </Svg>;
}

export function QuestionTrail({ stage, results, index, total }: {
  stage: string; results: readonly AnswerFeedback[]; index: number; total: number;
}) {
  const correct = results.filter(result => result === 'correct').length;
  return (
    <View style={styles.trail}>
      <View style={styles.trailText}>
        <Text accessibilityRole="header" style={styles.location}>{stage}</Text>
        <Text style={styles.step}>{index + 1} / {total} もん</Text>
      </View>
      <View accessible accessibilityLabel={`${total}問中 ${results.length}問 回答、${correct}問 正解`} style={styles.stars}>
        {Array.from({ length: total }, (_, position) => {
          const result = results[position];
          return (
            <View key={position} style={[styles.starNode, !result && position === index && styles.currentNode]}>
              <Star fill={result === 'correct' ? '#f2ce83' : result ? '#d5c9ea' : 'transparent'}
                stroke={result === 'correct' ? '#ffe5a4' : '#aeb7db'} size={20} />
              {result === 'incorrect' && <View style={styles.usedDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Glow({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let subscribed = true;
    const animation = Animated.timing(opacity, { toValue: 1, duration: 340, useNativeDriver: false });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => {
      if (reduced) { animation.stop(); opacity.setValue(1); }
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (subscribed && !reduced) { opacity.setValue(0.45); animation.start(); }
    }).catch(() => {});
    return () => { subscribed = false; subscription.remove(); animation.stop(); };
  }, [opacity]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

export function CorrectSpark() {
  return <View accessible={false} importantForAccessibility="no-hide-descendants">
    <Glow><Star size={27} fill="#f1c773" /></Glow>
  </View>;
}

export function ClearScene({ title }: { title: string }) {
  return (
    <View style={styles.celebration} accessibilityLiveRegion="polite">
      <Glow>
        <Svg width={144} height={114} viewBox="0 0 144 114" accessible={false}>
          <Circle cx={72} cy={57} r={51} fill="#f5d489" opacity={0.10} />
          <Circle cx={72} cy={57} r={40} fill="#f5d489" opacity={0.14} />
          <Circle cx={72} cy={57} r={31} fill="#f5d489" opacity={0.19} />
          <Path d="M72 25l9.5 19.4 21.3 3.1-15.4 15 3.6 21.2L72 73.6 53 83.7l3.6-21.2-15.4-15 21.3-3.1Z" fill="#f5d489" stroke="#fff0c1" strokeWidth={2} strokeLinejoin="round" />
          <Path d="M23 30q0 7 7 7-7 0-7 7 0-7-7-7 7 0 7-7Zm99 38q0 8 8 8-8 0-8 8 0-8-8-8 8 0 8-8ZM108 14q0 5 5 5-5 0-5 5 0-5-5-5 5 0 5-5Z" fill="#ffe8ae" />
        </Svg>
      </Glow>
      <Text style={styles.clearLocation}>{title}</Text>
      <Text accessibilityRole="header" style={styles.clearTitle}>ステージ クリア！</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  trail: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, paddingBottom: 3 },
  trailText: { gap: 2 },
  location: { color: '#f9e6b4', fontSize: 17, fontWeight: '800' },
  step: { color: '#dce1f8', fontSize: 13, fontWeight: '700' },
  stars: { flexDirection: 'row', gap: 5, paddingVertical: 2 },
  starNode: { width: 28, height: 30, borderRadius: 8, borderColor: 'transparent', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative' },
  currentNode: { borderColor: '#f4dfa1', backgroundColor: '#4c4c72' },
  usedDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#555079' },
  celebration: { padding: 16, paddingBottom: 22, backgroundColor: '#292e58', alignItems: 'center', borderRadius: 19, gap: 4 },
  clearLocation: { color: '#f5d998', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  clearTitle: { color: '#fffceb', fontSize: 28, lineHeight: 36, fontWeight: '800', textAlign: 'center' },
});
