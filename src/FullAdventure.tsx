import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { worldIslands, type WorldGrade, type WorldStage } from './domain/worldCatalog';
import { checkMathAnswer, isValidMathAnswer, type MathQuestion } from './domain/worldQuestions';
import { isBankQuestion } from './domain/questionBank';
import { prepareStageRound } from './stageRounds';
import { QuestionDiagram, WorkedSolution, WrittenSolution } from './components/QuestionSupport';
import type { Progress } from './domain/progress';
import { canPlayWorldStage, progressAfterWorldAnswer, type PlayMode } from './domain/playMode';
import { adventureTitles } from './domain/titles';
import { loadProgress, saveProgress } from './storage';
import { applyNumberPadKey } from './domain/answerInput';
import { TitleAlbum, WorldChest } from './components/WorldMap780';
import { WorldMap780, IslandStageMap } from './components/WorldScenes780';
import { CompanionMoment } from './components/AdventureCompanion';
import { MagicMeter, ComboBadge, SparkleBurst } from './components/AdventureJuice';
import { CorrectSpark } from './components/AdventureEffects';
import CalculationMemo from './components/CalculationMemo';
import HandwritingAnswer from './components/HandwritingAnswer';
import { ClockFace } from './components/ClockFace';
import { MathText } from './components/MathText';
import NumberPad from './components/NumberPad';
import AdventureHome, { ModeBadge, ModeControls } from './components/AdventureHome';

type Feedback = 'correct' | 'incorrect';
type AnswerMode = 'keyboard' | 'panel' | 'handwriting';
type Screen = 'home' | 'world' | 'island' | 'titles';
type Round = {
  stage: WorldStage;
  problems: MathQuestion[];
  index: number;
  correct: number;
  results: Feedback[];
  dialogueOffset: number;
  usedHint: boolean;
  hintLevel: number;
  feedback?: Feedback;
  complete?: boolean;
};

function AdventureWorld() {
  const [progress, setProgress] = useState<Progress>();
  const [loadError, setLoadError] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [playMode, setPlayMode] = useState<PlayMode>('normal');
  const starting = useRef(false);
  const [loadingRound, setLoadingRound] = useState(false);
  const [startError, setStartError] = useState('');
  const testRoundSeed = useRef(0);
  const testing = playMode === 'test';
  const [grade, setGrade] = useState<WorldGrade>(worldIslands[0]);
  const [round, setRound] = useState<Round>();
  const [answer, setAnswer] = useState('');
  const [mode, setMode] = useState<AnswerMode>('keyboard');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const blockRef = useRef(false);
  const submitting = useRef(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const keyboard = useRef<ComponentRef<typeof TextInput>>(null);
  const wide = useWindowDimensions().width > 800;

  useEffect(() => {
    let active = true;
    loadProgress().then(
      saved => { if (active) setProgress(saved); },
      () => { if (active) setLoadError(true); },
    );
    return () => { active = false; };
  }, []);

  function blockHandwriting(value: boolean) {
    blockRef.current = value;
    setBlocked(value);
  }
  function resetAnswer() {
    setAnswer('');
    setMessage('');
    setDrawing(false);
    blockHandwriting(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  async function start(stage: WorldStage) {
    if (!progress || starting.current || submitting.current || !canPlayWorldStage(playMode, progress, stage)) return;
    starting.current = true;
    setLoadingRound(true);
    setStartError('');
    const attemptSeed = testing ? testRoundSeed.current++ : progress.attempts.length;
    try {
      const problems = await prepareStageRound(stage, playMode, attemptSeed);
      resetAnswer();
      setRound({
        stage,
        problems,
        index: 0,
        correct: 0,
        results: [],
        dialogueOffset: Math.floor(Math.random() * 1000),
        usedHint: false,
        hintLevel: 0,
      });
    } catch {
      setStartError('もんだいを ひらけなかったよ。もういちど えらんでね。');
    } finally {
      starting.current = false;
      setLoadingRound(false);
    }
  }

  const question = round?.problems[round.index];
  const bankQuestion = question && isBankQuestion(question) ? question : undefined;
  const hints = bankQuestion?.hints ?? (question ? [question.hint] : []);
  const handwritingAllowed = question?.type === 'number' && Number.isInteger(Number(question.answer)) && Number(question.answer) >= 0;
  const shownMode: AnswerMode = mode === 'handwriting' && !handwritingAllowed ? 'panel' : mode;

  async function submit() {
    if (!round || !progress || !question || round.feedback || submitting.current || saving ||
      (shownMode === 'handwriting' && (blockRef.current || drawing))) return;
    if (!isValidMathAnswer(question, answer)) {
      setMessage(question.type === 'choice' ? 'こたえを ひとつ えらんでね。' : 'こたえを 数字で いれてね。');
      if (shownMode === 'keyboard') keyboard.current?.focus();
      return;
    }
    const correctAnswer = checkMathAnswer(question, answer);
    const newCorrect = round.correct + Number(correctAnswer);
    const result: Feedback = correctAnswer ? 'correct' : 'incorrect';
    const now = new Date().toISOString();
    submitting.current = true;
    setSaving(true);
    setMessage('');
    const submitted = question.type === 'choice'
      ? question.choices?.indexOf(answer) ?? -1
      : Number(answer.normalize('NFKC').replaceAll('−', '-'));
    const saved = progressAfterWorldAnswer(playMode, progress, {
      problemId: question.id,
      stageId: round.stage.id,
      skillId: question.skillId,
      submitted,
      correct: correctAnswer,
      answeredAt: now,
    }, round.index === round.problems.length - 1
      ? { stage: round.stage, correct: newCorrect, usedHint: round.usedHint }
      : undefined);
    try {
      if (saved) {
        await saveProgress(saved);
        setProgress(saved);
      }
      setRound({ ...round, correct: newCorrect, results: [...round.results, result], feedback: result });
    } catch {
      setMessage('きろくを ほぞんできなかったよ。もういちど おしてね。');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  function advance() {
    if (!round || !round.feedback) return;
    resetAnswer();
    if (round.index === round.problems.length - 1) {
      setRound({ ...round, complete: true, hintLevel: 0 });
    } else {
      setRound({ ...round, index: round.index + 1, feedback: undefined, hintLevel: 0 });
    }
  }

  function goToIsland() {
    if (starting.current || submitting.current) return;
    setStartError('');
    resetAnswer();
    setRound(undefined);
    setScreen('island');
  }
  function openGrade(next: WorldGrade) {
    resetAnswer();
    setGrade(next);
    setScreen('island');
  }

  const perfect = Boolean(round && round.correct === round.problems.length && !round.usedHint);
  const cleared = Boolean(round && round.correct >= Math.ceil(round.stage.questions * 0.8));
  const nextStage = round && worldIslands.find(g=>g.id===round.stage.gradeId)?.stages[round.stage.order + 1];
  const canContinue = nextStage && progress && canPlayWorldStage(playMode, progress, nextStage);
  const newlyEarnedTitles = round && progress && !testing ? adventureTitles(progress).filter(t=>t.unlocked).length : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" scrollEnabled={!drawing}
        contentContainerStyle={styles.scroll}>
        <View pointerEvents={loadingRound ? 'none' : 'auto'} accessibilityState={{ busy: loadingRound }}
          style={[styles.shell,round && !round.complete && styles.playShell]}>
          {loadingRound && <Text accessibilityLiveRegion="polite">もんだいを よみこんでいるよ…</Text>}
          {!!startError && <Text accessibilityLiveRegion="polite" style={styles.error}>{startError}</Text>}
          {screen === 'home' && !round ? (
            <AdventureHome mode={playMode} onMode={setPlayMode} loading={!progress}
              onStart={() => { resetAnswer(); setScreen('world'); }} />
          ) : (
            <View style={styles.navigation}>
              <View style={styles.navigationHeader}>
                {round ? <Text style={styles.logo}>数のトビラ</Text> : (
                  <Pressable accessibilityRole="button" accessibilityLabel="トップへもどる"
                    onPress={() => { resetAnswer(); setScreen('home'); }} style={styles.homeLink}>
                    <Text style={styles.logo}>‹ 数のトビラ</Text>
                  </Pressable>
                )}
                <ModeBadge mode={playMode} />
              </View>
              {!round && screen !== 'titles' && <ModeControls mode={playMode} onChange={setPlayMode} />}
            </View>
          )}
          {!progress && (
            <Text style={styles.loading}>{loadError ? 'きろくを よみこめなかったよ。アプリを ひらきなおしてね。' : 'ぼうけんの じゅんびを しているよ…'}</Text>
          )}
          {progress && !round && screen === 'world' &&
            <WorldMap780 progress={progress} mode={playMode} onGrade={openGrade} onTitles={()=>setScreen('titles')}/>}
          {progress && !round && screen === 'island' &&
            <IslandStageMap key={grade.id} grade={grade} progress={progress} mode={playMode} onBack={()=>setScreen('world')}
              onTitles={()=>setScreen('titles')} onStart={start}/>}
          {progress && !round && screen === 'titles' &&
            <TitleAlbum progress={progress} onBack={()=>setScreen('world')}/>}
          {round && question && (
            <View style={styles.playPanel}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={goToIsland} style={styles.back}>
                <Text style={styles.backText}>‹ {grade.island}のマップへ</Text>
              </Pressable>
              {round.complete ? (
                <View style={styles.finish}>
                  <View style={styles.finishHero}>
                    {!testing && cleared && <SparkleBurst big/>}
                    {!testing && <Text style={styles.finishEmoji}>{perfect?'🌟':cleared?'✨':'🌱'}</Text>}
                    <Text style={styles.finishStage}>{round.stage.title}</Text>
                    <Text accessibilityRole="header" style={styles.finishTitle}>
                      {testing ? 'テストの けっか' : perfect?'パーフェクト！':cleared?'ステージ クリア！':'おつかれさま！'}
                    </Text>
                    <Text style={styles.finishCount}>{round.problems.length}もんのうち {round.correct}もん せいかい</Text>
                  </View>
                  <CompanionMoment mood={!testing && perfect?'clear':'encourage'} variation={round.dialogueOffset + round.index}/>
                  {testing ? <Text style={styles.hintNote}>テストの結果は 記録されません。</Text> : <WorldChest opened={cleared} perfect={perfect} stage={round.stage}/>}
                  {!testing && round.usedHint && (
                    <Text style={styles.hintNote}>ヒントをつかったので、パーフェクトは 次のチャレンジで めざそう！</Text>
                  )}
                  {!testing && cleared && <Text style={styles.rewardMessage}>しょうごう ずかん：{newlyEarnedTitles}こ はっけんずみ</Text>}
                  {canContinue && <GameButton label="つぎの ステージへ" onPress={()=>start(nextStage)} gold/>}
                  <GameButton label="この ステージに もういちど ちょうせん" onPress={()=>start(round.stage)} secondary/>
                  <GameButton label="島のマップへ" onPress={goToIsland}/>
                </View>
              ) : (
                <>
                  <View style={styles.questionPanel}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.stageTitle}>{round.stage.title}</Text>
                      <Text style={styles.questionIndex}>第{round.index + 1}問 / {round.problems.length}</Text>
                    </View>
                    <MagicMeter results={round.results} total={round.problems.length}/>
                    <CompanionMoment compact onDark
                      mood={round.feedback === 'correct' ? 'correct' : round.feedback === 'incorrect' ? 'incorrect' : 'ready'}
                      variation={round.dialogueOffset + round.index}/>
                    <Text style={styles.difficulty}>{round.stage.kind==='secret'?'✦ ひみつの なぞ':round.stage.kind==='extra'?'★ EXチャレンジ':bankQuestion ? ['● きほん', '● ひょうじゅん', '★ おうよう'][bankQuestion.difficulty - 1]
                      : round.index<3?'● きほん':round.index<8?'● ひょうじゅん':'★ おうよう'}</Text>
                    <MathText style={styles.questionText} value={question.question}/>
                    {question.clock && !round.feedback && <ClockFace time={question.clock.start} read={question.clock.read}/>}
                    {bankQuestion?.diagram && !round.feedback && (
                      <QuestionDiagram diagram={bankQuestion.diagram} phase={round.hintLevel ? 'hint' : 'question'} />
                    )}
                    <MathText style={styles.prompt} value={question.prompt}/>
                  </View>
                  <View style={[styles.workArea,wide&&styles.workWide]}>
                    <View style={[styles.answerArea,wide&&styles.answerWide]}>
                      {round.feedback ? (
                        <>
                          <View accessibilityLiveRegion="polite" style={[styles.feedbackBox,round.feedback==='incorrect'&&styles.wrongBox]}>
                            {round.feedback==='correct' && <SparkleBurst/>}
                            <View style={styles.feedbackTop}>
                              <Text style={[styles.feedbackMark,round.feedback==='incorrect'&&styles.wrongMark]}>{round.feedback==='correct'?'〇':'✕'}</Text>
                              <View style={styles.feedbackHeading}>
                                <Text style={[styles.feedbackTitle,round.feedback==='incorrect'&&styles.wrongTitle]}>
                                  {round.feedback==='correct'?'せいかい！':'ちがうよ'}
                                </Text>
                                {round.feedback==='correct'&&<CorrectSpark/>}
                              </View>
                            </View>
                            <MathText style={styles.yourAnswer} prefix="きみの こたえ：" value={answer} format={question.type === 'choice'}/>
                            {round.feedback==='incorrect'&&<MathText style={styles.answerHint} prefix="ただしい こたえ：" value={question.answer}/>}
                            {question.clock && <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
                              <ClockFace time={question.clock.start} caption={question.clock.read ? 'よみとった じこく' : 'はじめ'}/>
                              {!question.clock.read && <ClockFace time={question.clock.end} caption="はりを うごかした あと"/>}
                            </View>}
                            {bankQuestion
                              ? <WorkedSolution question={bankQuestion} wrongAnswer={round.feedback === 'incorrect' ? answer : undefined}/>
                              : question.steps ? <WrittenSolution steps={question.steps}/>
                              : <MathText style={styles.explanation} value={question.explanation}/>}
                          </View>
                          {round.feedback==='correct'&&<ComboBadge results={round.results}/>}
                          <GameButton gold label={round.index+1===round.problems.length?'けっかを みる':'つぎの もんだいへ'} onPress={advance}/>
                        </>
                      ) : (
                        <>
                          <Text style={styles.answerHeading}>こたえ</Text>
                          {question.type==='choice' ? (
                            <View style={styles.options}>
                              {question.choices?.map(option => (
                                <Pressable key={option} accessibilityRole="button" accessibilityLabel={option}
                                  accessibilityState={{selected:answer===option,disabled:saving}}
                                  disabled={saving} onPress={()=>{setAnswer(option);setMessage('');}}
                                  style={[styles.option,answer===option&&styles.optionSelected]}>
                                  <MathText style={[styles.optionText,answer===option&&styles.optionTextSelected]} value={option}/>
                                </Pressable>
                              ))}
                            </View>
                          ) : (
                            <>
                              <View style={styles.modes}>
                                {([
                                  ['keyboard','キーボード'] as const,
                                  ['panel','すうじパネル'] as const,
                                  ...(handwritingAllowed ? [['handwriting','てがき'] as const] : []),
                                ]).map(([id,label])=>(
                                  <Pressable key={id} accessibilityRole="button"
                                    disabled={saving||drawing} accessibilityState={{selected:shownMode===id}}
                                    onPress={()=>{if (shownMode !== id) { setMode(id);setMessage('');blockHandwriting(false); }}}
                                    style={[styles.mode,shownMode===id&&styles.modeActive]}>
                                    <Text style={[styles.modeLabel,shownMode===id&&styles.modeLabelActive]}>{label}</Text>
                                  </Pressable>
                                ))}
                              </View>
                              {shownMode==='keyboard' ? (
                                <TextInput ref={keyboard} key={question.id} style={styles.input}
                                  accessible accessibilityLabel="こたえ" inputMode="decimal"
                                  placeholder="すうじを いれてね" placeholderTextColor="#697188" value={answer}
                                  onChangeText={value=>{setAnswer(value);setMessage('');}}
                                  editable={!saving} onSubmitEditing={submit}/>
                              ) : shownMode==='panel' ? (
                                <>
                                  <View style={styles.readout}><Text style={styles.readoutText}>{answer||'すうじ'}</Text></View>
                                  <NumberPad disabled={saving} onChange={key=>{
                                    setAnswer(value=>applyNumberPadKey(value,key));setMessage('');
                                  }}/>
                                  <View style={styles.specialRow}>
                                    <Pressable accessibilityRole="button" onPress={()=>setAnswer(value=>value.startsWith('-')?value.slice(1):'-'+value)} style={styles.specialKey}><Text style={styles.specialLabel}>±</Text></Pressable>
                                    <Pressable accessibilityRole="button" onPress={()=>setAnswer(value=>value.includes('.')?value:value+'.')} style={styles.specialKey}><Text style={styles.specialLabel}>.</Text></Pressable>
                                  </View>
                                </>
                              ) : (
                                <HandwritingAnswer key={question.id} value={answer} disabled={saving}
                                  onBlockedChange={blockHandwriting} onDrawingChange={setDrawing}
                                  onChange={value=>{setAnswer(value);setMessage('');}}/>
                              )}
                            </>
                          )}
                          {hints.slice(0, round.hintLevel).map((hint, i) => (
                            <View key={i} style={styles.hintBox}>
                              <MathText style={styles.hintText} prefix={bankQuestion ? 'ヒント ' + (i + 1) + '　' : '💡 '} value={hint}/>
                            </View>
                          ))}
                          {round.hintLevel < hints.length && (
                            <Pressable accessibilityRole="button"
                              onPress={() => setRound(current => current && !current.feedback && current.hintLevel < hints.length
                                ? { ...current, hintLevel: current.hintLevel + 1, usedHint: true }
                                : current)} style={styles.hintButton}>
                              <Text style={styles.hintButtonText}>{bankQuestion
                                ? ['ヒント1を みる', 'もうすこし ヒントを みる', 'さいごの ヒントを みる'][round.hintLevel]
                                : '💡 ヒントを みる'}</Text>
                            </Pressable>
                          )}
                          {!!message&&<Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text>}
                          <GameButton label={saving?'きろくしているよ…':'こたえあわせ'} onPress={submit}
                            disabled={saving||(shownMode==='handwriting'&&(blocked||drawing))}/>
                        </>
                      )}
                    </View>
                    <CalculationMemo key={question.id} onDrawingChange={setDrawing}/>
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

function GameButton({label,onPress,disabled=false,secondary=false,gold=false}: {
  label:string;onPress:()=>void;disabled?:boolean;secondary?:boolean;gold?:boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{disabled}} onPress={onPress}
    style={({pressed})=>[styles.button,gold&&styles.goldButton,secondary&&styles.secondaryButton,(disabled||pressed)&&styles.dim]}>
    <Text style={[styles.buttonText,(gold||secondary)&&styles.buttonTextDark]}>{label}</Text>
  </Pressable>;
}
export default function FullAdventure() {
  return <SafeAreaProvider><AdventureWorld/></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0edf6' },
  scroll: { flexGrow: 1, padding: 14, paddingBottom: 55 },
  shell: { width: '100%', maxWidth: 1030, alignSelf: 'center', gap: 15 },
  playShell: { maxWidth: 1090 },
  navigation: { borderRadius: 16, backgroundColor: '#162d48', padding: 12, gap: 7 },
  navigationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  homeLink: { minHeight: 44, justifyContent: 'center' },
  logo: { fontWeight: '900', color: '#ffedb8', fontSize: 19 },
  loading: { padding: 22, color: '#3e4569' },
  playPanel: { backgroundColor: '#fffdf7', borderRadius: 22, padding: 14, gap: 13 },
  back: { alignSelf: 'flex-start', paddingVertical: 7, minHeight: 40, justifyContent: 'center' },
  backText: { color: '#305a87', fontWeight: '900', fontSize: 15 },
  questionPanel: { backgroundColor: '#27335c', borderRadius: 19, padding: 17, gap: 9, overflow: 'hidden' },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 7, alignItems: 'center' },
  stageTitle: { color: '#f9e3b7', fontWeight: '900', fontSize: 17 },
  questionIndex: { color: '#e1e7ff', fontWeight: '800', fontSize: 13 },
  difficulty: { color: '#ffe09f', fontSize: 12, fontWeight: '800', paddingTop: 4 },
  questionText: { color: 'white', fontWeight: '900', fontSize: 29, lineHeight: 40 },
  prompt: { color: '#e3e9fc', fontSize: 13, fontWeight: '700' },
  workArea: { gap: 13 },
  workWide: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  answerArea: { gap: 9, backgroundColor: '#f0f4fc', borderRadius: 16, padding: 14, minWidth: 0 },
  answerWide: { width: 360 },
  answerHeading: { color: '#29345d', fontWeight: '900', fontSize: 19 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  mode: { backgroundColor: '#dfe5f5', borderRadius: 9, paddingVertical: 9, paddingHorizontal: 9, flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center' },
  modeActive: { backgroundColor: '#445695' },
  modeLabel: { color: '#343d72', fontSize: 12, fontWeight: '900' },
  modeLabelActive: { color: 'white' },
  input: { borderWidth: 1, borderColor: '#92a0ba', backgroundColor: 'white', borderRadius: 11, paddingHorizontal: 12, color: '#233152', fontSize: 24, minHeight: 52, fontWeight: '900' },
  readout: { borderWidth: 1, borderColor: '#92a0ba', backgroundColor: 'white', borderRadius: 11, minHeight: 52, paddingHorizontal: 12, justifyContent: 'center' },
  readoutText: { color: '#29345d', fontSize: 25, fontWeight: '900' },
  specialRow: { flexDirection: 'row', gap: 6 },
  specialKey: { flex: 1, backgroundColor: '#dfe6f8', minHeight: 43, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  specialLabel: { color: '#36447c', fontSize: 21, fontWeight: '900' },
  options: { gap: 8 },
  option: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#c4cbe0', borderRadius: 12, padding: 12, minHeight: 50, justifyContent: 'center' },
  optionSelected: { backgroundColor: '#dfebff', borderColor: '#4763aa' },
  optionText: { fontWeight: '800', fontSize: 17, color: '#344061' },
  optionTextSelected: { color: '#244b97' },
  hintButton: { alignSelf: 'flex-start', padding: 9, borderRadius: 9, backgroundColor: '#e9e4f6', minHeight: 40, justifyContent: 'center' },
  hintButtonText: { color: '#4d4e79', fontWeight: '800' },
  hintBox: { borderRadius: 10, backgroundColor: '#fff6d6', padding: 12 },
  hintText: { color: '#614e37', fontSize: 15, lineHeight: 23, fontWeight: '700' },
  hintNote: { color: '#775a43', fontSize: 14, textAlign: 'center' },
  error: { color: '#a42641', fontWeight: '800', fontSize: 14 },
  button: { minHeight: 50, borderRadius: 13, backgroundColor: '#465a9a', justifyContent: 'center', alignItems: 'center', padding: 12 },
  goldButton: { backgroundColor: '#f4d17f', borderWidth: 2, borderColor: '#d7a04d' },
  secondaryButton: { backgroundColor: '#e8e2f3' },
  buttonText: { fontWeight: '900', color: 'white', fontSize: 16, textAlign: 'center' },
  buttonTextDark: { color: '#424061' },
  dim: { opacity: 0.64 },
  feedbackBox: { position: 'relative', backgroundColor: '#e5f4ed', borderColor: '#399a7b', borderWidth: 2, borderRadius: 13, padding: 14, gap: 9, overflow: 'hidden' },
  wrongBox: { backgroundColor: '#fff0f1', borderColor: '#c84857' },
  feedbackTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  feedbackMark: { color: '#238567', fontWeight: '900', fontSize: 62, lineHeight: 70 },
  wrongMark: { color: '#c43548' },
  feedbackHeading: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  feedbackTitle: { fontWeight: '900', fontSize: 25, color: '#236d58' },
  wrongTitle: { color: '#b02f44' },
  yourAnswer: { color: '#4f5c72', fontSize: 15 },
  answerHint: { color: '#a72e41', fontSize: 18, fontWeight: '900' },
  explanation: { color: '#3c4b61', lineHeight: 22, fontSize: 14 },
  finish: { gap: 14 },
  finishHero: { position: 'relative', backgroundColor: '#333864', borderRadius: 17, padding: 19, alignItems: 'center', gap: 7, overflow: 'hidden' },
  finishEmoji: { fontSize: 56 },
  finishStage: { color: '#f4d89a', fontSize: 16, fontWeight: '900' },
  finishTitle: { color: 'white', fontWeight: '900', fontSize: 28 },
  finishCount: { color: '#f2e9d8', fontWeight: '900', fontSize: 18 },
  rewardMessage: { textAlign: 'center', color: '#705e3f', fontWeight: '900', fontSize: 14 },
});
