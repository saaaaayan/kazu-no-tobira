import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { generateAdditionRound, type AdditionProblem } from './domain/addition';
import { firstGradeStages, type AdditionStage } from './domain/curriculum';
import { gradeInteger } from './domain/grading';
import { applyNumberPadKey } from './domain/answerInput';
import { recordAttempt, type Progress } from './domain/progress';
import { loadProgress, saveProgress } from './storage';
import CalculationMemo from './components/CalculationMemo';
import NumberPad from './components/NumberPad';
import HandwritingAnswer from './components/HandwritingAnswer';
import AdventureMap from './components/AdventureMap';
import WorldMap from './components/WorldMap';
import { ClearScene, CorrectSpark, QuestionTrail, type AnswerFeedback } from './components/AdventureEffects';
import { CompanionMoment, TreasureChest } from './components/AdventureCompanion';
import VersionNotice from './components/VersionNotice';
import { MagicMeter, ComboBadge, SparkleBurst } from './components/AdventureJuice';

const answerModes = [
  { id: 'keyboard', label: 'キーボード' },
  { id: 'panel', label: 'すうじパネル' },
  { id: 'handwriting', label: 'てがき' },
] as const;
type AnswerMode = typeof answerModes[number]['id'];

const ink = '#202c47';
const navy = '#182343';
const muted = '#535b73';

type Round = {
  stage: AdditionStage;
  problems: AdditionProblem[];
  index: number;
  correct: number;
  dialogueOffset: number;
  results: AnswerFeedback[];
  feedback?: AnswerFeedback;
  complete?: boolean;
};

function Adventure() {
  const [progress, setProgress] = useState<Progress>();
  const [showFirstGradeIsland, setShowFirstGradeIsland] = useState(false);
  const [round, setRound] = useState<Round>();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AnswerMode>('keyboard');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const submitting = useRef(false);
  const blockedRef = useRef(false);
  const [handwritingBlocked, setHandwritingBlocked] = useState(false);

  function blockHandwriting(blocked: boolean) {
    blockedRef.current = blocked;
    setHandwritingBlocked(blocked);
  }
  const [drawing, setDrawing] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const wide = useWindowDimensions().width >= 760;
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
    blockHandwriting(false);
    setMessage('');
    scroll.current?.scrollTo({ y: 0, animated: false });
    setRound({ stage, problems: generateAdditionRound(stage.skillId), index: 0, correct: 0,
      dialogueOffset: progress?.attempts.length ?? 0, results: [] });
  }

  async function submit() {
    if (!round || !progress || round.feedback || submitting.current || (mode === 'handwriting' && (blockedRef.current || drawing))) return;
    const problem = round.problems[round.index];
    // Grade the exact operands shown on screen, even if cached problem metadata is inconsistent.
    const expected = problem.left + problem.right;
    const result = gradeInteger(expected, input);
    if (result.status === 'invalid') {
      setMessage('こたえを すうじで いれてね。');
      if (mode === 'keyboard') answerInput.current?.focus();
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
      setRound({ ...round, correct, feedback: result.status, results: [...round.results, result.status] });
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
    blockHandwriting(false);
    setDrawing(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (round.index === round.problems.length - 1) {
      setRound({ ...round, complete: true });
    } else {
      setRound({ ...round, index: round.index + 1, feedback: undefined });
    }
  }

  const problem = round?.problems[round.index];
  const perfectRound = round && round.correct === round.problems.length;
  const nextStage = round && firstGradeStages[firstGradeStages.findIndex(stage => stage.id === round.stage.id) + 1];
  const canContinue = perfectRound && nextStage && progress?.stages[round.stage.id];
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scroll} scrollEnabled={!drawing} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={[styles.shell, round && !round.complete && styles.practiceShell]}>
          <View style={[styles.hero, round && styles.compactHero]}>
            <View style={styles.moon} />
            <Text accessibilityRole="header" style={round ? styles.brand : styles.title}>数のトビラ</Text>
            <VersionNotice />
            {!round && <Text style={styles.subtitle}>ひとつ解くたび、世界がひらく。</Text>}
          </View>
          {!progress && (
            <Text accessibilityLiveRegion="polite" style={styles.notice}>
              {loadFailed ? 'きろくを よみこめなかったよ。アプリを ひらきなおしてね。' : 'きろくを よみこみちゅう…'}
            </Text>
          )}
          {progress && !round && (
            showFirstGradeIsland ? (
              <>
                <Pressable accessibilityRole="button"
                  onPress={() => setShowFirstGradeIsland(false)} style={styles.back}>
                  <Text style={styles.backText}>‹ 世界地図にもどる</Text>
                </Pressable>
                <AdventureMap progress={progress} onStart={start} />
              </>
            ) : (
              <WorldMap onEnterFirstGrade={() => setShowFirstGradeIsland(true)} />
            )
          )}
          {round && problem && (
            <View style={[styles.panel, !round.complete && styles.practicePanel]}>
              <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving }}
                onPress={() => { setDrawing(false); setRound(undefined); }} style={styles.back}>
                <Text style={styles.backText}>‹ マップにもどる</Text>
              </Pressable>
              {round.complete ? (
                <>
                  {perfectRound ? (
                    <View style={styles.clearStage}>
                      <ClearScene title={round.stage.title} />
                      <SparkleBurst big />
                    </View>
                  ) : (
                    <>
                      <Text style={styles.detail}>{round.stage.title}</Text>
                      <Text accessibilityRole="header" style={styles.equation}>おつかれさま！</Text>
                    </>
                  )}
                  <CompanionMoment mood={perfectRound ? 'clear' : 'encourage'}
                    variation={round.dialogueOffset + round.index} />
                  <TreasureChest open={Boolean(perfectRound)} stageId={round.stage.id} />
                  <Text style={styles.resultSummary}>{round.problems.length}もんのうち {round.correct}もん せいかい</Text>
                  {canContinue ? (
                    <>
                      <Text style={styles.detail}>つぎは {nextStage.title}</Text>
                      <Action label="つぎの場所へ" onPress={() => start(nextStage)} accent />
                    </>
                  ) : perfectRound ? (
                    <Action label="マップへ" onPress={() => setRound(undefined)} />
                  ) : (
                    <Text style={styles.detail}>ぜんもん せいかいで、ステージを クリアできるよ。</Text>
                  )}
                  <Action label="もういちど あそぶ" onPress={() => start(round.stage)} secondary={!!perfectRound} />
                </>
              ) : (
                <>
                  <View style={styles.question}>
                    <QuestionTrail stage={round.stage.title} results={round.results} index={round.index} total={round.problems.length} />
                    <MagicMeter results={round.results} total={round.problems.length} />
                    <CompanionMoment mood={round.feedback === 'correct' ? 'correct' : round.feedback === 'incorrect' ? 'incorrect' : 'ready'}
                      variation={round.dialogueOffset + round.index} onDark compact />
                    <Text style={styles.prompt}>あわせると いくつ？</Text>
                    <Text style={[styles.formula, wide && styles.wideFormula]}>
                      {problem.left} ＋ {problem.right} ＝ {round.feedback ? problem.left + problem.right : '？'}
                    </Text>
                  </View>
                  <View style={[styles.practice, wide && styles.practiceWide]}>
                    <View style={[styles.answerPanel, wide && (mode === 'handwriting' && !round.feedback ? styles.handwritingWide : styles.answerWide)]}>
                      {round.feedback ? (
                        <>
                          <View accessibilityLiveRegion="polite" style={[styles.feedback, round.feedback === 'incorrect' && styles.incorrect]}>
                            {round.feedback === 'correct' && <SparkleBurst />}
                            <View style={styles.feedbackHeader}>
                              <Text accessibilityLabel={round.feedback === 'correct' ? '正解' : '不正解'}
                                style={[styles.feedbackSymbol, round.feedback === 'incorrect' && styles.incorrectSymbol]}>
                                {round.feedback === 'correct' ? '〇' : '✕'}
                              </Text>
                              <View style={styles.feedbackHeading}>
                                <Text accessibilityRole="header" style={[styles.feedbackTitle, round.feedback === 'incorrect' && styles.incorrectTitle]}>
                                  {round.feedback === 'correct' ? 'せいかい！' : 'ちがうよ'}
                                </Text>
                                {round.feedback === 'correct' && <CorrectSpark />}
                              </View>
                            </View>
                            <Text style={styles.detail}>きみの こたえは {input.trim()}</Text>
                            {round.feedback === 'incorrect' && (
                              <Text style={styles.rightAnswer}>ただしい こたえは {problem.left + problem.right}</Text>
                            )}
                            <Text style={styles.detail}>{problem.explanation}</Text>
                          </View>
                          {round.feedback === 'correct' && <ComboBadge results={round.results} />}
                          <Action label={round.index + 1 === round.problems.length ? 'けっかを みる' : 'つぎの もんだい'} onPress={advance} accent />
                        </>
                      ) : (
                        <>
                          <Text style={styles.answerTitle}>こたえ</Text>
                          <View style={styles.modeRow}>
                            {answerModes.map(option => (
                              <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label}
                                accessibilityState={{ selected: option.id === mode, disabled: saving || drawing }}
                                disabled={saving || drawing}
                                onPress={() => { if (option.id !== mode) { setMode(option.id); blockHandwriting(false); setMessage(''); } }}
                                style={[styles.mode, option.id === mode && styles.modeActive]}>
                                <Text style={[styles.modeText, option.id === mode && styles.modeTextActive]}>{option.label}</Text>
                              </Pressable>
                            ))}
                          </View>
                          {mode === 'keyboard' ? (
                            <TextInput ref={answerInput} accessibilityLabel="こたえ" enterKeyHint="done" inputMode="numeric"
                              key={problem.id} value={input} onChangeText={value => { setInput(value); setMessage(''); }}
                              onSubmitEditing={submit} editable={!saving} placeholder="すうじ" placeholderTextColor={muted}
                              style={styles.input} />
                          ) : mode === 'panel' && (
                            <View accessibilityLiveRegion="polite" style={styles.readout}>
                              <Text accessibilityLabel={input ? `こたえ ${input}` : 'こたえは まだありません'}
                                style={input ? styles.readoutValue : styles.readoutHint}>{input || 'すうじ'}</Text>
                            </View>
                          )}
                          {mode === 'panel' && <NumberPad disabled={saving} onChange={key => {
                            setInput(value => applyNumberPadKey(value, key));
                            setMessage('');
                          }} />}
                          {mode === 'handwriting' && (
                            <HandwritingAnswer key={problem.id} value={input} disabled={saving} onDrawingChange={setDrawing}
                              onBlockedChange={blockHandwriting} onChange={value => { setInput(value); setMessage(''); }} />
                          )}
                          {!!message && <Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text>}
                          <Action label={saving ? 'ほぞんちゅう…' : 'こたえあわせ'} onPress={submit}
                            disabled={saving || (mode === 'handwriting' && (handwritingBlocked || drawing))} />
                        </>
                      )}
                    </View>
                    <CalculationMemo key={problem.id} onDrawingChange={setDrawing} />
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ label, onPress, disabled = false, secondary = false, accent = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; accent?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.action, accent && styles.highlightAction, secondary && styles.secondaryAction, (disabled || pressed) && styles.pressed]}>
      <Text style={[styles.actionLabel, (accent || secondary) && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  return <SafeAreaProvider><Adventure /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0eef4' },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  shell: { width: '100%', maxWidth: 952, alignSelf: 'center', gap: 20 },
  hero: { backgroundColor: navy, overflow: 'hidden', paddingHorizontal: 24, paddingVertical: 20, borderRadius: 24, gap: 8 },
  moon: { position: 'absolute', width: 104, height: 104, right: -20, top: -20, borderRadius: 52, backgroundColor: '#34466b' },
  brand: { color: '#f6cf8b', fontSize: 16, fontWeight: '700' },
  title: { color: 'white', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#d6deef', fontSize: 15 },
  detail: { color: muted, lineHeight: 23, fontSize: 15 },
  pressed: { opacity: 0.8 },
  panel: { backgroundColor: '#fffdf8', borderRadius: 20, padding: 20, gap: 12 },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: '#265342', fontWeight: '700' },
  equation: { color: ink, fontSize: 30, fontWeight: '800', marginVertical: 6 },
  practiceShell: { maxWidth: 1032 },
  clearStage: { position: 'relative' },
  compactHero: { paddingVertical: 14 },
  practicePanel: { backgroundColor: '#fbfaff', padding: 14 },
  question: { padding: 16, gap: 6, borderRadius: 14, backgroundColor: '#21294f' },
  prompt: { color: '#fff', fontSize: 21, fontWeight: '700' },
  formula: { color: '#fff', fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  wideFormula: { fontSize: 50 },
  practice: { gap: 14 },
  practiceWide: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  answerPanel: { minWidth: 0, gap: 8, backgroundColor: '#f4f6fd', borderRadius: 18, padding: 14 },
  answerWide: { width: 300 },
  handwritingWide: { flex: 1.4 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  mode: { flexGrow: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, borderRadius: 8, backgroundColor: '#e8ecfa' },
  modeActive: { backgroundColor: '#36488c' },
  modeText: { color: '#232b56', fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: 'white' },
  readout: { minHeight: 50, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: 'white',
    borderWidth: 1, borderColor: '#777fa8', borderRadius: 10 },
  readoutValue: { color: ink, fontSize: 24, fontWeight: '700' },
  readoutHint: { color: muted, fontSize: 24, fontWeight: '700' },
  answerTitle: { color: '#232b56', fontSize: 17, fontWeight: '800' },
  input: { color: ink, backgroundColor: 'white', borderColor: '#777fa8', borderWidth: 1,
    fontSize: 24, fontWeight: '700', paddingHorizontal: 12, minHeight: 50, borderRadius: 10 },
  action: { minHeight: 48, borderRadius: 12, backgroundColor: '#36488c', justifyContent: 'center', alignItems: 'center', padding: 12 },
  actionLabel: { color: 'white', fontWeight: '700', fontSize: 16 },
  highlightAction: { backgroundColor: '#f2cf7a', borderWidth: 2, borderColor: '#d89e48', elevation: 3 },
  resultSummary: { color: ink, fontSize: 18, fontWeight: '800', textAlign: 'center', paddingVertical: 3 },
  secondaryAction: { backgroundColor: '#ede9f6' },
  secondaryLabel: { color: '#34386a' },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  feedbackHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  feedback: { backgroundColor: '#e2eee8', borderColor: '#3c9470', borderWidth: 2, padding: 14, borderRadius: 12, gap: 8 },
  incorrect: { backgroundColor: '#fff0f0', borderColor: '#c33443' },
  feedbackSymbol: { color: '#176b4c', fontSize: 64, lineHeight: 74, fontWeight: '900', minWidth: 70, textAlign: 'center' },
  incorrectSymbol: { color: '#b42335' },
  feedbackTitle: { color: '#176b4c', fontSize: 24, fontWeight: '900' },
  incorrectTitle: { color: '#b42335' },
  rightAnswer: { color: '#a01d2d', fontSize: 18, fontWeight: '800', lineHeight: 26 },
  notice: { padding: 12, color: ink },
  error: { color: '#922b2b' },
});
