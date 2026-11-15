import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { firstGradeStages, type AdditionStage } from '../domain/curriculum';
import type { Progress } from '../domain/progress';
import IslandScene, { islandHeight, islandSites, islandWidth } from './IslandScene';

export default function AdventureMap({ progress, onStart }: { progress: Progress; onStart: (stage: AdditionStage) => void }) {
  const [width, setWidth] = useState(0);
  const compact = width < 620;
  const positions = islandSites(compact);
  const worldWidth = islandWidth(compact);
  const pinWidth = compact ? 146 : 180;
  const nextIndex = firstGradeStages.findIndex(stage => !progress.stages[stage.id]);
  const clearedCount = firstGradeStages.filter(stage => progress.stages[stage.id]).length;

  return (
    <View style={styles.frame}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.caption}>冒険マップ</Text>
          <Text accessibilityRole="header" style={styles.title}>たしざんの島</Text>
        </View>
        <Text style={styles.count}>{clearedCount} / {firstGradeStages.length} クリア</Text>
      </View>
      <View style={[styles.scene, compact ? styles.portrait : styles.landscape]}
        onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          pointerEvents="none" style={StyleSheet.absoluteFill}>
          <IslandScene compact={compact} nextIndex={nextIndex} />
        </View>
        {width > 0 && firstGradeStages.map((stage, index) => {
          const previous = firstGradeStages[index - 1];
          const cleared = Boolean(progress.stages[stage.id]);
          const locked = Boolean(previous && !progress.stages[previous.id]);
          const next = !locked && index === nextIndex;
          const state = locked ? 'まだ とじている' : cleared ? 'クリア' : 'つぎの 目的地';
          const skill = progress.skills[stage.skillId];
          const detail = locked ? '前の場所をクリアすると開く' : skill ? `せいかい ${skill.correct} / ${skill.answered}もん` : 'ここから はじめよう';
          const { x, y } = positions[index];
          const left = Math.min(width - pinWidth - 8, Math.max(8, x * width / worldWidth - pinWidth / 2));
          return (
            <Pressable key={stage.id} accessibilityRole="button" accessibilityState={{ disabled: locked }}
              accessibilityLabel={`${stage.title}、${state}、${detail}`}
              disabled={locked} onPress={() => onStart(stage)}
              style={({ pressed }) => [styles.pin, locked && styles.locked, next && styles.next,
                pressed && styles.pressed, { width: pinWidth, left, top: `${(y + 24) / islandHeight * 100}%` }]}>
              <View style={[styles.icon, next && styles.nextIcon]}>
                <Svg width={17} height={17} viewBox="0 0 20 20" accessible={false}>
                  {locked
                    ? <Path d="M6 9V6a4 4 0 0 1 8 0v3M4 9h12v8H4z" fill="none" stroke="#52465f" strokeWidth={1.8} strokeLinejoin="round" />
                    : cleared
                      ? <Path d="m4 10 4 4 8-8" fill="none" stroke="#246354" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                      : <Path d="M3 10h13m-5-5 5 5-5 5" fill="none" stroke="#603f11" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                </Svg>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{stage.title}</Text>
                <Text style={styles.state}>{state}</Text>
                {(locked || skill) && <Text style={styles.detail}>{detail}</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: '#fcfaf5', borderRadius: 24, borderColor: '#dedce3', borderWidth: 1, padding: 10, gap: 10 },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingHorizontal: 7, paddingVertical: 3 },
  heading: { gap: 2 },
  caption: { color: '#4d5270', fontSize: 13, fontWeight: '700' },
  title: { color: '#252c52', fontSize: 25, fontWeight: '800' },
  count: { alignSelf: 'center', backgroundColor: '#eee9f8', color: '#424474', fontSize: 13, fontWeight: '800', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  scene: { width: '100%', overflow: 'hidden', position: 'relative', backgroundColor: '#6793ae', borderRadius: 17 },
  portrait: { height: 540 },
  landscape: { aspectRatio: 1.66 },
  pin: { position: 'absolute', minHeight: 56, paddingHorizontal: 7, paddingVertical: 6, gap: 5,
    flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#d3e1d8', borderRadius: 12,
    backgroundColor: '#fffdf5', elevation: 4, shadowColor: '#21264f', shadowOpacity: 0.30, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 } },
  locked: { backgroundColor: '#f1eef6', borderColor: '#d3c9e0' },
  next: { borderColor: '#bd8542', backgroundColor: '#fff4d9', shadowColor: '#ffe9a9', shadowOpacity: 0.9 },
  icon: { width: 22, height: 24, borderRadius: 9, backgroundColor: '#e7e6ee', alignItems: 'center', justifyContent: 'center' },
  nextIcon: { backgroundColor: '#f0d49b' },
  copy: { flex: 1, gap: 1 },
  name: { color: '#20284b', fontWeight: '800', fontSize: 14, lineHeight: 18 },
  state: { color: '#465275', fontWeight: '700', fontSize: 12 },
  detail: { color: '#544a67', fontSize: 10, lineHeight: 14 },
  pressed: { opacity: 0.8 },
});
