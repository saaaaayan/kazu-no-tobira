import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { firstGradeStages, type AdditionStage, type GradeId } from '../domain/curriculum';
import type { Progress } from '../domain/progress';
import { getAchievements } from '../domain/achievements';
import { canUnlockSecrets, isPerfect, isPlayable, perfectProgress,
  worldGrades, type StageKind, type WorldStage } from '../domain/worldPlan';

const tabs: readonly { id: StageKind; label: string }[] = [
  { id: 'normal', label: '通常 50' },
  { id: 'extra', label: 'EX 10' },
  { id: 'secret', label: 'ひみつ 5' },
];

export default function WorldOverview({ progress, onPlay }: {
  progress: Progress;
  onPlay: (stage: AdditionStage) => void;
}) {
  const [selectedGrade, setSelectedGrade] = useState<GradeId>('e1');
  const [kind, setKind] = useState<StageKind>('normal');
  const [showAchievements, setShowAchievements] = useState(false);
  const grade = worldGrades.find(item => item.id === selectedGrade) ?? worldGrades[0];
  const visible = grade.stages.filter(stage => stage.kind === kind);
  const secretUnlocked = canUnlockSecrets(selectedGrade, progress);
  const medals = getAchievements(progress);
  const owned = medals.filter(item => item.earned).length;

  function play(stage: WorldStage) {
    if (!isPlayable(stage)) return;
    if (stage.kind === 'secret' && !secretUnlocked) return;
    const existing = firstGradeStages.find(item => item.id === stage.id);
    if (existing) onPlay(existing);
  }

  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.title}>12の島の冒険</Text>
      <Text style={styles.note}>全780ステージの設計図。現在遊べるのは小学1年生のたし算3ステージです。</Text>
      <View style={styles.metrics}>
        <Text style={styles.metric}>全12島</Text>
        <Text style={styles.metric}>通常600 / EX120 / ひみつ60</Text>
      </View>
      <View style={styles.gradeGrid}>
        {worldGrades.map(item => {
          const selected = selectedGrade === item.id;
          const cleared = item.stages.filter(stage => Boolean(progress.stages[stage.id])).length;
          return (
            <Pressable key={item.id} accessibilityRole="button"
              accessibilityState={{ selected }} onPress={() => { setSelectedGrade(item.id); setKind('normal'); }}
              style={[styles.gradeButton, selected && styles.gradeButtonSelected]}>
              <Text style={[styles.gradeTitle, selected && styles.gradeSelectedText]}>{item.title}</Text>
              <Text style={[styles.gradeCount, selected && styles.gradeSelectedText]}>{cleared} / 65</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{grade.title}の島</Text>
        <Text style={styles.caption}>パーフェクト {perfectProgress(selectedGrade, progress)} / 60</Text>
        <Text style={styles.note}>通常50とEX10の全パーフェクトで、ひみつの5ステージが開きます。</Text>
      </View>
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <Pressable key={tab.id} accessibilityRole="button" accessibilityState={{ selected: kind === tab.id }}
            onPress={() => setKind(tab.id)} style={[styles.tab, kind === tab.id && styles.tabSelected]}>
            <Text style={[styles.tabText, kind === tab.id && styles.tabTextSelected]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      {kind === 'secret' && !secretUnlocked && (
        <Text style={styles.secretInfo}>🔒 この島の通常・EX全60ステージをパーフェクトで解放</Text>
      )}
      <View style={styles.stages}>
        {visible.map(stage => {
          const playable = isPlayable(stage) && (kind !== 'secret' || secretUnlocked);
          const cleared = Boolean(progress.stages[stage.id]);
          const perfect = isPerfect(stage, progress);
          return (
            <Pressable key={stage.id} accessibilityRole="button"
              accessibilityState={{ disabled: !playable }} disabled={!playable}
              accessibilityLabel={stage.title + '、' + (playable ? 'プレイ可能' : '制作中')}
              onPress={() => play(stage)} style={[styles.stage, playable && styles.playable]}>
              <Text style={styles.stageIndex}>{String(stage.index).padStart(2, '0')}</Text>
              <View style={styles.stageCopy}>
                <Text style={styles.stageName}>{stage.title}</Text>
                <Text style={styles.stageInfo}>{stage.implementation === 'demo'
                  ? '体験版・現在5問'
                  : '制作予定・目標' + stage.targetQuestions + '問'}</Text>
              </View>
              <Text style={styles.stageState}>{perfect ? '★' : cleared ? '✓' : playable ? '▶' : '🔒'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" onPress={() => setShowAchievements(value => !value)}
        style={styles.achievementToggle}>
        <Text style={styles.achievementToggleText}>🏅 称号図鑑　{owned} / {medals.length}　{showAchievements ? '▲' : '▼'}</Text>
      </Pressable>
      {showAchievements && (
        <View style={styles.achievements}>
          {medals.map(medal => (
            <View key={medal.id} style={[styles.medal, medal.earned && styles.medalEarned]}>
              <Text style={styles.medalIcon}>{medal.earned ? '🏅' : '◇'}</Text>
              <View style={styles.stageCopy}>
                <Text style={styles.medalTitle}>{medal.earned ? medal.title : '？？？'}</Text>
                <Text style={styles.stageInfo}>{medal.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.footer}>未制作のステージは選択できません。正式公開は全単元の問題・解説を検証してから行います。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: '#f9f8ff', borderWidth: 1, borderColor: '#ded8ee',
    borderRadius: 20, padding: 16, gap: 14 },
  title: { color: '#242a50', fontSize: 25, fontWeight: '900' },
  note: { color: '#515c78', fontSize: 13, lineHeight: 21 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { backgroundColor: '#eae8fa', paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 9, color: '#44416c', fontSize: 12, fontWeight: '700' },
  gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gradeButton: { width: '23%', flexGrow: 1, minWidth: 78, backgroundColor: '#e8eaf4',
    paddingVertical: 10, paddingHorizontal: 5, alignItems: 'center', borderRadius: 12 },
  gradeButtonSelected: { backgroundColor: '#4b4f99' },
  gradeTitle: { color: '#272d58', fontSize: 12, fontWeight: '800' },
  gradeCount: { color: '#66708c', fontSize: 11, marginTop: 3 },
  gradeSelectedText: { color: '#fff' },
  section: { gap: 4 },
  sectionTitle: { color: '#282f58', fontSize: 21, fontWeight: '800' },
  caption: { color: '#58527e', fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#e7e9f3', borderRadius: 10, paddingHorizontal: 2 },
  tabSelected: { backgroundColor: '#3d467e' },
  tabText: { color: '#4b5478', fontSize: 12, fontWeight: '800' },
  tabTextSelected: { color: '#fff' },
  secretInfo: { color: '#7157a1', backgroundColor: '#efe9fb', padding: 10, borderRadius: 10,
    lineHeight: 20, fontSize: 13, fontWeight: '700' },
  stages: { gap: 6 },
  stage: { flexDirection: 'row', gap: 9, alignItems: 'center', borderRadius: 11,
    backgroundColor: '#f0eff6', borderWidth: 1, borderColor: '#deddea',
    padding: 10, minHeight: 57 },
  playable: { borderColor: '#94bead', backgroundColor: '#eaf8f1' },
  stageIndex: { width: 27, color: '#72718e', fontWeight: '900', fontSize: 14 },
  stageCopy: { flex: 1, gap: 3 },
  stageName: { color: '#282c4f', fontSize: 14, fontWeight: '800' },
  stageInfo: { color: '#68738c', fontSize: 11 },
  stageState: { fontSize: 20, color: '#806ac1' },
  achievementToggle: { minHeight: 45, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#ece7fb', borderRadius: 11 },
  achievementToggleText: { color: '#51427d', fontSize: 15, fontWeight: '800' },
  achievements: { gap: 6 },
  medal: { flexDirection: 'row', alignItems: 'center', padding: 10,
    borderRadius: 11, gap: 10, backgroundColor: '#efeff3' },
  medalEarned: { backgroundColor: '#fff2ce' },
  medalIcon: { fontSize: 20 },
  medalTitle: { color: '#30345f', fontWeight: '800' },
  footer: { color: '#686c80', fontSize: 12, lineHeight: 18 },
});
