import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { approvedWorldMapImageUrl } from '../domain/approvedWorldMap';

type Island = { number: number; grade: string; name: string; column: number; row: number };

const islands: Island[] = [
  { number: 1, grade: '就学前', name: 'ぬいぐるみの島', column: 0, row: 0 },
  { number: 2, grade: '小学1年生', name: 'おもちゃの島', column: 1, row: 0 },
  { number: 3, grade: '小学2年生', name: 'どうぶつの島', column: 2, row: 0 },
  { number: 4, grade: '小学3年生', name: 'おかしの島', column: 3, row: 0 },
  { number: 5, grade: '小学4年生', name: '恐竜の島', column: 3, row: 1 },
  { number: 6, grade: '小学5年生', name: '機械の島', column: 2, row: 1 },
  { number: 7, grade: '小学6年生', name: '古代の島', column: 1, row: 1 },
  { number: 8, grade: '中学1年生', name: '迷宮の島', column: 0, row: 1 },
  { number: 9, grade: '中学2年生', name: '鏡の島', column: 0, row: 2 },
  { number: 10, grade: '中学3年生', name: '光と影の島', column: 1, row: 2 },
  { number: 11, grade: '高校1年生', name: '星座の島', column: 2, row: 2 },
  { number: 12, grade: '高校2年生', name: '大自然の島', column: 3, row: 2 },
  { number: 13, grade: '高校3年生', name: 'アカデミーの島', column: 3, row: 3 },
  { number: 14, grade: '理系大学入試', name: '魔法使いの島', column: 2, row: 3 },
  { number: 15, grade: '最難関入試・数学競技', name: '王国', column: 1, row: 3 },
  { number: 16, grade: '大学数学・探究', name: '宇宙の島', column: 0, row: 3 },
];

const COLUMN_LEFT = [2, 26, 50, 74];
const ROW_TOP = [10, 31, 52, 73];
const MAP_ASPECT_RATIO = 1452 / 1083;

export default function WorldMap({ onEnterFirstGrade }: { onEnterFirstGrade: () => void }) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const [selected, setSelected] = useState<Island | null>(null);
  const imageWidth = Math.max(availableWidth, 820);
  const showScrollHint = availableWidth > 0 && availableWidth < 820;

  function choose(island: Island) {
    if (island.number === 2) {
      onEnterFirstGrade();
    } else {
      setSelected(island);
    }
  }

  return (
    <View style={styles.frame} onLayout={event => setAvailableWidth(event.nativeEvent.layout.width)}>
      {showScrollHint && <Text style={styles.hint}>ちずは よこに うごかせるよ。しまを タップしてね。</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={showScrollHint} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.map, { width: imageWidth, height: imageWidth / MAP_ASPECT_RATIO }]}>
          <Image source={Platform.OS === 'web' ? { uri: approvedWorldMapImageUrl } : require('../../assets/world-map.jpg')} resizeMode="stretch" style={styles.image}
            accessibilityLabel="数のトビラ 世界地図。方位マーク付きの全16島が、点線の道でつながっているよ。" />
          {islands.map(island => (
            <Pressable
              key={island.number}
              accessibilityRole="button"
              accessibilityLabel={`${String(island.number).padStart(2, '0')} ${island.grade} ${island.name}${island.number === 2 ? '、ここから学べる' : '、準備中'}`}
              onPress={() => choose(island)}
              style={({ pressed }) => [
                styles.islandHitArea,
                { left: `${COLUMN_LEFT[island.column]}%`, top: `${ROW_TOP[island.row]}%` },
                pressed && styles.pressed,
              ]}
            />
          ))}
        </View>
      </ScrollView>
      {selected ? (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {selected.name} は いま じゅんびちゅうだよ。小学1年生の「おもちゃの島」は あそべるよ。
        </Text>
      ) : (
        <Text style={styles.message}>しまを タップして ぼうけんに でかけよう。いまは「おもちゃの島」で あそべるよ。</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', gap: 9 },
  scrollContent: { flexGrow: 1 },
  map: { position: 'relative', borderRadius: 16, overflow: 'hidden', backgroundColor: '#164362' },
  image: { width: '100%', height: '100%' },
  islandHitArea: {
    position: 'absolute', width: '22%', height: '19%', borderRadius: 20,
  },
  pressed: { backgroundColor: 'rgba(255, 249, 209, 0.22)', borderWidth: 2, borderColor: '#fff3cb' },
  message: {
    color: '#27395d', backgroundColor: '#fdf7e9', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 23, fontWeight: '700',
  },
  hint: { color: '#364d69', fontSize: 13, fontWeight: '700' },
});
