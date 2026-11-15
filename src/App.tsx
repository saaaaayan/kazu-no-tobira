import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { generateAdditionRound, type AdditionProblem } from './domain/addition';
import { additionSkills, firstGradeStages, type AdditionStage } from './domain/curriculum';
import { gradeInteger } from './domain/grading';
import { recordAttempt, type Progress } from './domain/progress';
import { loadProgress, saveProgress } from './storage';

const stageIcons = ['🌲', '🌙', '✦'];
const ink = '#202c47';
const navy = '#182343';
const muted = '#535b73';

type Round = {
  stage: AdditionStage;
  problems: AdditionProblem[];
  index: number;
  correct: number;
  feedback?: 'correct' | 'incorrect';
  complete?: boolean;
};

function Adventure() {
  const [progress, setProgress] = useState<Progress>();
  const [round, setRound] = useState<Round>();
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const submitting = useRef(false);
  const answerInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    let active = true;
    loadProgress().then(
      data => { if (active) setProgress(data); },
      () => { if (active) setLoadFailed(true); },
    );
    return () => { active = false; };
  }, []);

  function start(stage: AdditionStage) {
    setInput('');
    setMessage('');
    setRound({ stage, problems: generateAdditionRound(stage.skillId), index: 0, correct: 0 });
  }

  async function submit() {
    if (!round || !progress || round.feedback || submitting.current) return;
    const problem = round.problems[round.index];
    const result = gradeInteger(problem.answer, input);
    if (result.status === 'invalid') {
      setMessage('0から9までの すうじで こたえを いれてね。');
      answerInput.current?.focus();
      return;
    }

    submitting.current = true;
    setSaving(true);
    setMessage('');
    const correct = round.correct + Number(result.status === 'correct');
    const next = recordAttempt(progress, {
      problemId: problem.id,
      stageId: round.stage.id,
      skillId: problem.skillId,
      submitted: result.submitted,
      correct: result.status === 'correct',
      answeredAt: new Date().toISOString(),
    }, round.index === round.problems.length - 1 && correct === round.problems.length);

    try {
      await saveProgress(next);
      setProgress(next);
      setRound({ ...round, correct, feedback: result.status });
    } catch {
      setMessage('きろくを ほぞんできなかったよ。もういちど おしてね。');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  function advance() {
    if (!round) return;
    setInput('');
    if (round.index === round.problems.length - 1) {
      setRound({ ...round, complete: true });
    } else {
      setRound({ ...round, index: round.index + 1, feedback: undefined });
    }
  }

  const problem = round?.problems[round.index];
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.shell}>
          <View style={styles.hero}>
            <View style={styles.moon} />
            <Text style={styles.brand}>数のトビラ</Text>
            <Text accessibilityRole="header" style={styles.title}>たしざんの冒険</Text>
            <Text style={styles.subtitle}>小学1年生 · たしざん</Text>
          </View>
          {!progress && (
            <Text accessibilityLiveRegion="polite" style={styles.notice}>
              {loadFailed ? 'きろくを よみこめなかったよ。アプリを ひらきなおしてね。' : 'きろくを よみこみちゅう…'}
            </Text>
          )}
          {progress && !round && (
            <View style={styles.map}>
              <Text accessibilityRole="header" style={styles.heading}>冒険マップ</Text>
              <View style={styles.trail}>
                {firstGradeStages.map((stage, index) => {
                  const skill = progress.skills[stage.skillId];
                  const cleared = Boolean(progress.stages[stage.id]);
                  const locked = index > 0 && !progress.stages[firstGradeStages[index - 1].id];
                  return (
                    <Pressable key={stage.id} accessibilityRole="button" accessibilityState={{ disabled: locked }}
                      disabled={locked} onPress={() => start(stage)}
                      style={({ pressed }) => [styles.stage, locked && styles.locked, pressed && styles.pressed]}>
                      <Text style={styles.icon} accessible={false}>{stageIcons[index]}</Text>
                      <View style={styles.stageInfo}>
                        <Text style={styles.stageTitle}>{stage.title}</Text>
                        <Text style={styles.detail}>{additionSkills[index].title}</Text>
                        <Text style={styles.detail}>{skill ? `せいかい ${skill.correct} / ${skill.answered}もん` : 'きろくなし'}</Text>
                      </View>
                      <Text style={styles.state}>{cleared ? 'クリア ✓' : locked ? '🔒' : 'すすむ ›'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          {round && problem && (
            <View style={styles.panel}>
              <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving }}
                onPress={() => setRound(undefined)} style={styles.back}>
                <Text style={styles.backText}>‹ マップにもどる</Text>
              </Pressable>
              <Text accessibilityRole="header" style={styles.heading}>{round.stage.title}</Text>
              {round.complete ? (
                <>
                  <Text style={styles.equation}>{round.correct === round.problems.length ? 'クリア！' : 'おつかれさま！'}</Text>
                  <Text style={styles.detail}>{round.problems.length}もんのうち {round.correct}もん せいかい</Text>
                  {round.correct < round.problems.length && <Text style={styles.detail}>ぜんもん せいかいで、ステージを クリアできるよ。</Text>}
                  <Action label="もういちど あそぶ" onPress={() => start(round.stage)} />
                </>
              ) : (
                <>
                  <Text style={styles.detail}>{round.index + 1} / {round.problems.length} もん</Text>
                  <Text style={styles.equation}>{problem.left} ＋ {problem.right} ＝ {round.feedback ? problem.answer : '?'}</Text>
                  {round.feedback ? (
                    <>
                      <View accessibilityLiveRegion="polite" style={styles.feedback}>
                        <Text style={styles.stageTitle}>{round.feedback === 'correct' ? 'せいかい！' : 'おしい！'}</Text>
                        <Text style={styles.detail}>{problem.explanation}</Text>
                      </View>
                      <Action label={round.index + 1 === round.problems.length ? 'けっかを みる' : 'つぎの もんだい'} onPress={advance} />
                    </>
                  ) : (
                    <>
                      <TextInput ref={answerInput} accessibilityLabel="こたえ" enterKeyHint="done" inputMode="numeric"
                        key={problem.id} value={input} onChangeText={value => { setInput(value); setMessage(''); }}
                        onSubmitEditing={submit} editable={!saving} placeholder="こたえ" placeholderTextColor={muted}
                        style={styles.input} />
                      {!!message && <Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text>}
                      <Action label={saving ? 'ほぞんちゅう…' : 'こたえあわせ'} onPress={submit} disabled={saving} />
                    </>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.action, (disabled || pressed) && styles.pressed]}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  return <SafeAreaProvider><Adventure /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0eee8' },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  shell: { width: '100%', maxWidth: 660, alignSelf: 'center', gap: 20 },
  hero: { backgroundColor: navy, overflow: 'hidden', paddingHorizontal: 24, paddingVertical: 32, borderRadius: 24, gap: 8 },
  moon: { position: 'absolute', width: 104, height: 104, right: -20, top: -20, borderRadius: 52, backgroundColor: '#34466b' },
  brand: { color: '#f6cf8b', fontSize: 16, fontWeight: '700' },
  title: { color: 'white', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#d6deef', fontSize: 15 },
  map: { gap: 16, paddingHorizontal: 4 },
  heading: { fontSize: 22, fontWeight: '800', color: ink },
  trail: { gap: 12, paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: '#9aa9a2' },
  stage: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, backgroundColor: '#fffdf8', borderWidth: 1, borderColor: '#d8dcca', borderRadius: 16 },
  stageInfo: { flex: 1, gap: 3 },
  icon: { fontSize: 22, color: ink },
  stageTitle: { color: ink, fontWeight: '700', fontSize: 17 },
  detail: { color: muted, lineHeight: 23, fontSize: 15 },
  state: { color: '#265342', fontWeight: '700', fontSize: 13 },
  locked: { backgroundColor: '#e7e8e4' },
  pressed: { opacity: 0.8 },
  panel: { backgroundColor: '#fffdf8', borderRadius: 20, padding: 20, gap: 12 },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: '#265342', fontWeight: '700' },
  equation: { color: ink, fontSize: 30, fontWeight: '800', marginVertical: 6 },
  input: { color: ink, backgroundColor: 'white', borderColor: '#858da3', borderWidth: 1, fontSize: 20, padding: 12, borderRadius: 10 },
  action: { minHeight: 48, borderRadius: 12, backgroundColor: '#275645', justifyContent: 'center', alignItems: 'center', padding: 12 },
  actionLabel: { color: 'white', fontWeight: '700', fontSize: 16 },
  feedback: { backgroundColor: '#e9efe3', padding: 14, borderRadius: 12, gap: 5 },
  notice: { padding: 12, color: ink },
  error: { color: '#922b2b' },
});
