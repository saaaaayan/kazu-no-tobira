import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { worldGrades, worldIslands, type WorldGrade, type WorldStage } from './domain/worldCatalog';
import type { MathQuestion } from './domain/worldQuestions';
import { checkMathAnswer, isValidMathAnswer } from './domain/mathAnswer';
import { stageDisplayTitle,stageLabels, type Checkpoint } from './domain/stageStructure';
import { liveOrigin, requestLiveRound, requestLiveGrade, requestLiveHint, type LiveMode, type LiveRound } from './domain/liveQuestions';
import type { SkillId } from './domain/curriculum';
import { isBankQuestion } from './domain/questionBank';
import { prepareStageRound } from './stageRounds';
import { QuestionDiagram, WorkedSolution, WrittenSolution } from './components/QuestionSupport';
import { emptyProgress, recordAttempt, type Progress } from './domain/progress';
import { uiPreviewRound } from './domain/uiPreviewRound';
import QuestionReadAloud from './components/QuestionReadAloud';
import { canAccessFeature, canAccessStage, freeAccess, hasPremium, type Entitlement } from './domain/accessPlan';
import { readServerEntitlement } from './domain/serverEntitlement';
import { canPlayWorldStage, progressAfterWorldAnswer, worldStageAction, type PlayMode } from './domain/playMode';
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
import { StudyFigureView } from './components/StudyFigureView';
import { ClockFace } from './components/ClockFace';
import { MathText } from './components/MathText';
import NumberPad from './components/NumberPad';
import AdventureHome, { ModeBadge, ModeControls } from './components/AdventureHome';
import { StudyPlanner } from './components/StudyPlanner';
import { StudyWorkshop } from './components/StudyWorkshop';
import { completeLiveStudy } from './domain/studyPlans';
import { savePracticeAnswer, type PracticeItem } from './domain/studyPractice';
import { UnitLearning } from './components/UnitLearning';
import QuestionReviewAdmin from './components/QuestionReviewAdmin';
import { lessonForStage, newLessonProgress, type LessonProgress, type UnitLesson } from './domain/unitLessons';

type Feedback = 'correct' | 'incorrect';
type AnswerMode = 'keyboard' | 'panel' | 'handwriting';
type Screen = 'home' | 'world' | 'island' | 'titles' | 'lesson' | 'study' | 'study-plan' | 'admin';
type Learning = { lesson: UnitLesson; progress: LessonProgress; target?: WorldStage; practice: boolean };
const uiPreview = process.env.EXPO_PUBLIC_KAZU_UI_PREVIEW === '1';
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
  liveHints?: readonly string[];
  noMoreHints?: boolean;
  live?: {origin:string; mode:LiveMode; round:LiveRound; eventId?:string};
};

type ReviewPreview = { stage: WorldStage; questions: MathQuestion[]; phone: boolean; detailed: boolean; onClose: () => void };

function AdventureWorld({ review }: { review?: ReviewPreview }) {
  const isolated = uiPreview || Boolean(review);
  const [progress, setProgress] = useState<Progress | undefined>(isolated ? emptyProgress : undefined);
  const [loadError, setLoadError] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [playMode, setPlayMode] = useState<PlayMode>(isolated ? 'test' : 'normal');
  const [access, setAccess] = useState<Entitlement>(freeAccess);
  const [showPlanInfo, setShowPlanInfo] = useState(false);
  const [showWorkedSolution, setShowWorkedSolution] = useState(false);
  const starting = useRef(false);
  const [loadingRound, setLoadingRound] = useState(false);
  const [startError, setStartError] = useState('');
  const testRoundSeed = useRef(0);
  const testing = playMode === 'test';
  const gameOrigin=isolated ? undefined : liveOrigin();
  const [grade, setGrade] = useState<WorldGrade>(worldGrades[0]);
  const [round, setRound] = useState<Round | undefined>(() => review ? {
    stage:review.stage, problems:review.questions, index:0, correct:0,
    results:[], dialogueOffset:0, usedHint:false, hintLevel:0,
  } : undefined);
  const [learning, setLearning] = useState<Learning>();
  const [lessonError, setLessonError] = useState('');
  const lessonWrite = useRef(false);
  const [studyError,setStudyError] = useState('');
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
  const viewport = useWindowDimensions().width;
  const wide = !review?.phone && viewport > 800;

  useEffect(() => {
    if (isolated) return;
    let active = true;
    loadProgress().then(
      saved => { if (active) setProgress(saved); },
      () => { if (active) setLoadError(true); },
    );
    return () => { active = false; };
  }, [isolated]);

  useEffect(() => {
    if (__DEV__ || isolated) return;
    const controller = new AbortController();
    const refresh = () => {
      void readServerEntitlement(process.env.EXPO_PUBLIC_ENTITLEMENT_URL, controller.signal).then(next => {
        if (!controller.signal.aborted) setAccess(next);
      });
    };
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [isolated]);

  useEffect(() => {
    if (!isolated && round && (!round.live || ['stage','test'].includes(round.live.mode)) && !canAccessStage(access, round.stage)) {
      setRound(undefined);
      setScreen('island');
    }
  }, [access, isolated, round]);

  function blockHandwriting(value: boolean) {
    blockRef.current = value;
    setBlocked(value);
  }
  function resetAnswer() {
    setAnswer('');
    setShowWorkedSolution(false);
    setMessage('');
    setDrawing(false);
    blockHandwriting(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  function openLesson(lesson: UnitLesson, target?: WorldStage) {
    if (!progress || lessonWrite.current || starting.current || submitting.current) return;
    const saved = progress.lessons?.[lesson.id];
    const practice = testing || Boolean(saved?.completedAt && !target);
    const record = practice ? newLessonProgress() : saved ?? newLessonProgress();
    setLessonError('');
    setStartError('');
    resetAnswer();
    setRound(undefined);
    setLearning({ lesson, progress: record, target, practice });
    setScreen('lesson');
  }

  async function updateLesson(next: LessonProgress) {
    if (!progress || !learning || lessonWrite.current || next === learning.progress) return;
    lessonWrite.current = true;
    setSaving(true);
    setLessonError('');
    try {
      if (!learning.practice) {
        const updated = { ...progress, lessons: { ...progress.lessons, [learning.lesson.id]: next } };
        await saveProgress(updated);
        setProgress(updated);
      }
      if (next.page !== learning.progress.page) scroll.current?.scrollTo({ y: 0, animated: false });
      setLearning({ ...learning, progress: next });
    } catch {
      setLessonError('がくしゅうを きろくできなかったよ。もういちど おしてね。');
    } finally {
      lessonWrite.current = false;
      setSaving(false);
    }
  }

  function answerPractice(item: PracticeItem, value: number) {
    return updateStudy(previous=>savePracticeAnswer(access,previous,item,value,new Date().toISOString()));
  }

  async function updateStudy(update: (previous: Progress)=>Progress) {
    if (!progress || testing || submitting.current) return false;
    const next = update(progress);
    if (next === progress) return false;
    submitting.current = true;
    setSaving(true);
    setStudyError('');
    try {
      await saveProgress(next);
      setProgress(next);
      return true;
    } catch {
      setStudyError('練習を保存できませんでした。もう一度お試しください。');
      return false;
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function startLive(stage:WorldStage, mode:LiveMode, eventId?:string, skills?:SkillId[]) {
    if (!progress || !gameOrigin || starting.current || submitting.current || lessonWrite.current) return;
    starting.current=true;
    setLoadingRound(true);
    setStartError('');
    try {
      const remote=await requestLiveRound(gameOrigin,{
        mode,stageId:mode==='checkpoint'?eventId:skills?undefined:stage.id,skills,
        excludeIds:progress.attempts.slice(-100).map(attempt=>attempt.problemId),
      });
      const problems:MathQuestion[]=remote.questions.map(card=>({
        ...card,answer:'',hint:'',explanation:'',clock:card.clock && {...card.clock,end:card.clock.start},
      }));
      resetAnswer();
      setLearning(undefined);
      setRound({stage,problems,index:0,correct:0,results:[],dialogueOffset:Math.floor(Math.random()*1000),
        usedHint:false,hintLevel:0,live:{origin:gameOrigin,mode,round:remote,eventId}});
    } catch (error) {
      setStartError(error instanceof Error ? error.message : '問題を読み込めませんでした。');
    } finally { starting.current=false; setLoadingRound(false); }
  }

  function startCheckpoint(item:Checkpoint) {
    if (uiPreview) { setStartError('確認テストの体験用問題は準備中です。'); return; }
    if (!gameOrigin) { setStartError('確認テストを準備しています。'); return; }
    void startLive({...item.after,title:'確認テスト '+item.number},'checkpoint',item.id);
  }

  function startLiveStudy(mode:'daily'|'review'|'remediation'|'diagnosis',skills:SkillId[]) {
    const stage=worldGrades[0].stages[0];
    const title={daily:'毎日の学習',review:'定期復習',remediation:'克服練習',diagnosis:'基礎をたしかめる'}[mode];
    void startLive({...stage,title},mode,undefined,skills);
  }

  async function start(stage: WorldStage) {
    if (!progress || starting.current || submitting.current || lessonWrite.current) return;
    if (uiPreview) {
      const problems=uiPreviewRound(stage);
      if (!problems.length) { setStartError('このステージの体験用問題は準備中です。'); return; }
      setStartError('');
      resetAnswer();
      setScreen('island');
      setRound({stage,problems,index:0,correct:0,results:[],dialogueOffset:0,usedHint:false,hintLevel:0});
      return;
    }
    const action = worldStageAction(playMode, progress, stage, access);
    if (action === 'premium') { setShowPlanInfo(true); scroll.current?.scrollTo({ y: 0 }); return; }
    if (action === 'locked') return;
    if (action === 'learn') {
      const lesson = lessonForStage(stage.id);
      if (lesson) openLesson(lesson, stage);
      return;
    }
    if (gameOrigin) { await startLive(stage,testing?'test':'stage'); return; }
    starting.current = true;
    setLoadingRound(true);
    setStartError('');
    const attemptSeed = testing ? testRoundSeed.current++ : progress.attempts.length;
    try {
      const problems = await prepareStageRound(stage, playMode, attemptSeed, access);
      resetAnswer();
      setLearning(undefined);
      setScreen('island');
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
  const canReadWorkedSolution = review ? review.detailed : uiPreview || canAccessFeature(access, 'workedSolutions');
  const liveCard=round?.live?.round.questions[round.index];
  const diagram=bankQuestion?.diagram ?? liveCard?.diagram;
  const countingGuide=round?.stage.id==='preschool.n01' && diagram?.kind==='countingBoard' && diagram.guide;
  const hints = liveCard ? round?.liveHints ?? [] : bankQuestion?.hints ?? question?.guidedHints ?? (question ? [question.hint] : []);
  const handwritingAllowed = question?.type === 'number' && (Boolean(liveCard) || Number.isInteger(Number(question.answer)) && Number(question.answer) >= 0);
  const shownMode: AnswerMode = mode === 'handwriting' && !handwritingAllowed ? 'panel' : mode;

  async function showHint() {
    if (!round || !question || round.feedback || submitting.current) return;
    if (!round.live) {
      setRound({...round,hintLevel:round.hintLevel+1,usedHint:true});
      return;
    }
    submitting.current=true;
    setSaving(true);
    setMessage('');
    try {
      const result=await requestLiveHint(round.live.origin,round.live.round.token,question.id,round.hintLevel);
      setRound({...round,liveHints:result.hint?[...hints,result.hint]:hints,noMoreHints:!result.more,
        hintLevel:result.hint?round.hintLevel+1:round.hintLevel,usedHint:round.usedHint||Boolean(result.hint)});
    } catch(error) {
      setMessage(error instanceof Error ? error.message : 'ヒントを読み込めませんでした。');
    } finally { submitting.current=false; setSaving(false); }
  }

  async function submit() {
    if (!round || !progress || !question || (!isolated && !round.live && !canAccessStage(access, round.stage)) || round.feedback || submitting.current || saving ||
      (shownMode === 'handwriting' && (blockRef.current || drawing))) return;
    if (!isValidMathAnswer(question, answer)) {
      setMessage(question.type === 'choice' ? 'こたえを ひとつ えらんでね。' : 'こたえを 数字で いれてね。');
      if (shownMode === 'keyboard') keyboard.current?.focus();
      return;
    }

    const now = new Date().toISOString();
    submitting.current = true;
    setSaving(true);
    setMessage('');
    const submitted = question.type === 'choice'
      ? question.choices?.indexOf(answer) ?? -1
      : Number(answer.normalize('NFKC').replaceAll('−', '-'));
    try {
      const graded=round.live ? await requestLiveGrade(round.live.origin,round.live.round.token,question.id,answer) : undefined;
      const correctAnswer=graded?.correct ?? checkMathAnswer(question,answer);
      const newCorrect=round.correct+Number(correctAnswer);
      const result:Feedback=correctAnswer?'correct':'incorrect';
      const attempt = {
        problemId: question.id,
        stageId: liveCard?.stageId ?? round.stage.id,
        skillId: question.skillId,
        submitted,
        correct: correctAnswer,
        answeredAt: now,
      };
      const liveMode=round.live?.mode;
      const activity=liveMode==='daily'||liveMode==='review'||liveMode==='remediation'||liveMode==='diagnosis' ? liveMode : undefined;
      const last=round.index===round.problems.length-1;
      const special=round.live && !['stage','test'].includes(round.live.mode);
      let saved=isolated ? undefined : special ? (testing ? undefined : recordAttempt(progress,{...attempt,activity},false))
        : progressAfterWorldAnswer(playMode,progress,attempt,last
          ? {stage:round.stage,correct:newCorrect,usedHint:round.usedHint}: undefined);
      if (saved && last && round.live?.mode==='checkpoint' && round.live.eventId) {
        saved={...saved,checkpoints:{...saved.checkpoints,[round.live.eventId]:{correct:newCorrect,total:round.problems.length,completedAt:now}}};
      }
      if (saved && last && (activity==='daily'||activity==='review')) {
        saved=completeLiveStudy(saved,activity,question.skillId,newCorrect,round.problems.length,new Date(now));
      }
      const problems=graded ? round.problems.map((item,index)=>index===round.index
        ? {...item,answer:graded.answer,explanation:graded.explanation,steps:graded.steps,clock:graded.clock??item.clock}
        : item) : round.problems;
      if (saved) {
        await saveProgress(saved);
        setProgress(saved);
      }
      setRound({ ...round, problems, correct: newCorrect, results: [...round.results, result], feedback: result });
    } catch (error) {
      setMessage(round.live && error instanceof Error ? error.message : 'きろくを ほぞんできなかったよ。もういちど おしてね。');
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
      setRound({ ...round, index: round.index + 1, feedback: undefined, hintLevel: 0, liveHints:undefined, noMoreHints:false });
    }
  }

  function goToIsland() {
    if (starting.current || submitting.current || lessonWrite.current) return;
    if (review) { review.onClose(); return; }
    setLearning(undefined);
    setStartError('');
    resetAnswer();
    setRound(undefined);
    setScreen(round?.live?.mode==='daily'||round?.live?.mode==='review'?'study-plan':
      round?.live?.mode==='diagnosis'||round?.live?.mode==='remediation'?'study':'island');
  }
  function openGrade(next: WorldGrade) {
    if (!uiPreview && next.id === 'sage' && !hasPremium(access)) { setShowPlanInfo(true); scroll.current?.scrollTo({ y: 0 }); return; }
    resetAnswer();
    setStartError('');
    setGrade(next);
    setScreen('island');
  }

  const perfect = Boolean(round && round.correct === round.problems.length && !round.usedHint);
  const specialRound=Boolean(round?.live && !['stage','test'].includes(round.live.mode));
  const cleared = Boolean(round && !specialRound && round.correct >= Math.ceil(round.stage.questions * 0.8));
  const nextStage = round && (!round.live || ['stage','test'].includes(round.live.mode)) && worldIslands.find(g=>g.id===round.stage.gradeId)?.stages[round.stage.order + 1];
  const canContinue = !review && nextStage && progress && (uiPreview || ['play', 'learn'].includes(worldStageAction(playMode, progress, nextStage, access)));
  const lessonStage = learning && (learning.target ?? grade.stages.find(stage => learning.lesson.linkedStageIds.includes(stage.id)));
  const canChallenge = lessonStage && progress && canPlayWorldStage(playMode, progress, lessonStage, access);
  const newlyEarnedTitles = round && progress && !testing ? adventureTitles(progress).filter(t=>t.unlocked).length : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" scrollEnabled={!drawing}
        contentContainerStyle={styles.scroll}>
        <View pointerEvents={loadingRound ? 'none' : 'auto'} accessibilityState={{ busy: loadingRound }}
          style={[styles.shell,round && !round.complete && styles.playShell]}>
          {uiPreview && <View style={styles.playPanel} testID="kazu-sample-only-preview">
            <Text accessibilityRole="header" style={styles.answerHeading}>数のトビラ 試作版</Text>
            <Text style={styles.explanation}>全16島の画面とサンプル問題を確認できます。回答は保存されません。</Text>
            <Text selectable style={styles.hintNote}>バージョン {process.env.EXPO_PUBLIC_KAZU_UI_PREVIEW_SHA}</Text>
          </View>}
          {__DEV__ && !review && <View style={styles.navigation}>
            <Text style={styles.logo}>開発用プラン　{hasPremium(access) ? '有料ユーザー' : '無料ユーザー'}</Text>
            <View style={styles.navigationHeader}>
              <GameButton label="無料ユーザー" secondary disabled={loadingRound || saving} onPress={() => { setAccess(freeAccess); setShowPlanInfo(false); }} />
              <GameButton label="有料ユーザー" secondary disabled={loadingRound || saving} onPress={() => { setAccess({ plan: 'premium', verifiedUntil: Infinity }); setShowPlanInfo(false); }} />
            </View>
          </View>}
          {showPlanInfo && <View style={styles.playPanel}>
            <Text accessibilityRole="header" style={styles.rewardMessage}>プレミアムのご案内</Text>
            <Text style={styles.explanation}>試練の道・伝説のトビラ・賢者の島でのプレイと、途中式や図を使った詳しい解説はプレミアムで利用できます。冒険の道、単元学習、基本の解説は無料です。</Text>
            <GameButton label="とじる" secondary onPress={() => setShowPlanInfo(false)} />
          </View>}
          {loadingRound && <Text accessibilityLiveRegion="polite">もんだいを よみこんでいるよ…</Text>}
          {!!startError && <Text accessibilityLiveRegion="polite" style={styles.error}>{startError}</Text>}
          {screen === 'home' && !round ? (
            <>
              <AdventureHome mode={playMode} onMode={setPlayMode} loading={!progress} preview={uiPreview}
                onStart={() => { resetAnswer(); setScreen('world'); }} />
              {process.env.EXPO_PUBLIC_KAZU_ONLINE_REVIEW === '1' && typeof window !== 'undefined' &&
                <GameButton label="管理者ログイン" secondary onPress={() => window.location.assign('/kazu-no-tobira/admin/')} />}
            </>
          ) : (
            <View style={styles.navigation}>
              <View style={styles.navigationHeader}>
                {round ? <Text style={styles.logo}>数のトビラ</Text> : (
                  <Pressable accessibilityRole="button" accessibilityLabel="トップへもどる" disabled={saving}
                    onPress={() => { resetAnswer(); setLearning(undefined); setScreen('home'); }} style={styles.homeLink}>
                    <Text style={styles.logo}>‹ 数のトビラ</Text>
                  </Pressable>
                )}
                <ModeBadge mode={playMode} />
              </View>
              {!uiPreview && !round && screen !== 'titles' && screen !== 'lesson' && screen !== 'study' && screen !== 'study-plan' && screen !== 'admin' && <ModeControls mode={playMode} onChange={setPlayMode} />}
            </View>
          )}
          {!progress && (
            <Text style={styles.loading}>{loadError ? 'きろくを よみこめなかったよ。アプリを ひらきなおしてね。' : 'ぼうけんの じゅんびを しているよ…'}</Text>
          )}
          {__DEV__ && process.env.EXPO_PUBLIC_KAZU_DB_ONLY !== '1' && !round && screen === 'home' && <GameButton label="開発用・端末内の問題レビュー" onPress={() => setScreen('admin')}/>}
          {__DEV__ && process.env.EXPO_PUBLIC_KAZU_DB_ONLY !== '1' && !round && screen === 'admin' && <QuestionReviewAdmin onBack={() => setScreen('home')}/>}
          {progress && !round && !testing && screen === 'world' && <GameButton label="まなびの広場" onPress={()=>{ setStudyError(''); setScreen('study'); }}/>}
          {progress && !round && screen === 'study' && <GameButton label="個別学習・復習・成長レポート"
            disabled={saving} onPress={()=>{setStudyError('');setScreen('study-plan');}}/>}
          {progress && !round && screen === 'study-plan' && <StudyPlanner access={access} progress={progress} busy={saving}
            error={studyError} onLiveStart={gameOrigin?startLiveStudy:undefined} onUpdate={updateStudy} onBack={()=>setScreen('study')}/>}
          {progress && !round && screen === 'study' && <StudyWorkshop access={access} progress={progress} busy={saving}
            error={studyError} onLiveStart={gameOrigin?startLiveStudy:undefined} onAnswer={answerPractice} onBack={()=>setScreen('world')}/>}
          {progress && !round && screen === 'world' &&
            <WorldMap780 progress={progress} mode={playMode} access={access} onGrade={openGrade} onTitles={()=>setScreen('titles')} preview={uiPreview}/>}
          {progress && !round && screen === 'island' &&
            <IslandStageMap key={grade.id} grade={grade} progress={progress} mode={playMode} access={access} onCheckpoint={startCheckpoint} onBack={()=>setScreen('world')}
              onTitles={()=>setScreen('titles')} onStart={start} onLearn={openLesson} preview={uiPreview}/>}
          {progress && !round && screen === 'titles' &&
            <TitleAlbum progress={progress} onBack={()=>setScreen('world')}/>}
          {progress && screen === 'lesson' && !round && learning &&
            <UnitLearning key={learning.lesson.id} lesson={learning.lesson} progress={learning.progress}
              practice={testing} busy={saving} error={lessonError} onChange={updateLesson} onBack={goToIsland}
              onChallenge={canChallenge ? () => start(lessonStage) : undefined}/>}
          {round && question && (isolated || canAccessStage(access, round.stage)) && (
            <View style={styles.playPanel}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={goToIsland} style={styles.back}>
                <Text style={styles.backText}>{review ? '‹ 審査に戻る' : countingGuide ? '‹ もどる' : '‹ '+grade.island+'のマップへ'}</Text>
              </Pressable>
              {round.complete ? (
                <View style={styles.finish}>
                  <View style={styles.finishHero}>
                    {!testing && cleared && <SparkleBurst big/>}
                    {!testing && <Text style={styles.finishEmoji}>{perfect?'🌟':cleared?'✨':'🌱'}</Text>}
                    <Text style={styles.finishStage}>{stageDisplayTitle(round.stage)}</Text>
                    <Text accessibilityRole="header" style={styles.finishTitle}>
                      {testing || specialRound ? 'けっか' : perfect?'パーフェクト！':cleared?'ステージ クリア！':'おつかれさま！'}
                    </Text>
                    <Text style={styles.finishCount}>{round.problems.length}もんのうち {round.correct}もん せいかい</Text>
                  </View>
                  <CompanionMoment mood={!testing && perfect?'clear':'encourage'} variation={round.dialogueOffset + round.index}/>
                  {testing ? <Text style={styles.hintNote}>テストの結果は 記録されません。</Text> : !specialRound && <WorldChest opened={cleared} perfect={perfect} stage={round.stage}/>}
                  {!testing && !specialRound && round.usedHint && (
                    <Text style={styles.hintNote}>ヒントをつかったので、パーフェクトは 次のチャレンジで めざそう！</Text>
                  )}
                  {!testing && cleared && <Text style={styles.rewardMessage}>しょうごう ずかん：{newlyEarnedTitles}こ はっけんずみ</Text>}
                  {canContinue && <GameButton label="つぎの ステージへ" onPress={()=>start(nextStage)} gold/>}
                  {!review && !specialRound && <GameButton label="この ステージに もういちど ちょうせん" onPress={()=>start(round.stage)} secondary/>}
                  {!isolated && !specialRound && lessonForStage(round.stage.id) && <GameButton label="がくしゅうを みなおす" secondary
                    onPress={() => { const lesson = lessonForStage(round.stage.id); if (lesson) openLesson(lesson); }}/>}
                  <GameButton label={review ? '審査に戻る' : specialRound && round.live?.mode!=='checkpoint'?'学習画面へ':'島のマップへ'} onPress={goToIsland}/>
                </View>
              ) : (
                <>
                  <View style={styles.questionPanel}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.stageTitle}>{countingGuide ? '1〜3こを かぞえよう' : stageDisplayTitle(round.stage)}</Text>
                      <Text style={styles.questionIndex}>{countingGuide ? round.index+1 : '第'+(round.index+1)+'問'} / {round.problems.length}</Text>
                    </View>
                    <MagicMeter results={round.results} total={round.problems.length}/>
                    <CompanionMoment compact onDark
                      mood={round.feedback === 'correct' ? 'correct' : round.feedback === 'incorrect' ? 'incorrect' : 'ready'}
                      variation={round.dialogueOffset + round.index}/>
                    {!countingGuide && <Text style={styles.difficulty}>{round.stage.kind==='secret'?stageLabels.secret:round.stage.kind==='extra'?stageLabels.extra:bankQuestion ? ['● きほん', '● ひょうじゅん', '★ おうよう'][bankQuestion.difficulty - 1]
                      : round.index<3?'● きほん':round.index<8?'● ひょうじゅん':'★ おうよう'}</Text>}
                    <MathText style={styles.questionText} value={question.question}/>
                    {question.figure && <StudyFigureView figure={question.figure}/>}
                    {question.clock && !round.feedback && <ClockFace time={question.clock.start} read={question.clock.read}/>}
                    {diagram && !round.feedback && (
                      <QuestionDiagram diagram={diagram} phase={round.hintLevel ? 'hint' : 'question'} />
                    )}
                    <MathText style={styles.prompt} value={question.prompt}/>
                    {countingGuide && !round.feedback && <QuestionReadAloud text={hints[round.hintLevel-1] ?? question.question+'。'+question.prompt}/>}
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
                            <MathText style={styles.answerHint} prefix="ただしい こたえ：" value={question.answer}/>
                            {question.clock && <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
                              <ClockFace time={question.clock.start} caption={question.clock.read ? 'よみとった じこく' : 'はじめ'}/>
                              {!question.clock.read && <ClockFace time={question.clock.end} caption="はりを うごかした あと"/>}
                            </View>}
                            <Text style={styles.answerHeading}>{countingGuide ? 'こたえの わけ' : '基本の かいせつ'}</Text>
                            {countingGuide && diagram && <QuestionDiagram diagram={diagram} phase="solution"/>}
                            <MathText style={styles.explanation} value={question.explanation}/>
                            {countingGuide && <QuestionReadAloud text={question.explanation}/>}
                            {(bankQuestion || question.steps) && <>
                              <GameButton secondary label={canReadWorkedSolution
                                ? showWorkedSolution ? 'くわしい かいせつを とじる' : 'くわしい かいせつを みる'
                                : 'くわしい かいせつ（プレミアム）'}
                                onPress={() => {
                                  if (canReadWorkedSolution) setShowWorkedSolution(value => !value);
                                  else { setShowPlanInfo(true); scroll.current?.scrollTo({ y: 0 }); }
                                }} />
                              {showWorkedSolution && canReadWorkedSolution && (bankQuestion
                                ? <WorkedSolution question={bankQuestion} wrongAnswer={round.feedback === 'incorrect' ? answer : undefined}/>
                                : question.steps ? <WrittenSolution steps={question.steps}/> : null)}
                            </>}
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
                              <MathText style={styles.hintText} prefix={hints.length > 1 ? 'ヒント ' + (i + 1) + '　' : '💡 '} value={hint}/>
                            </View>
                          ))}
                          {(round.live ? !round.noMoreHints : round.hintLevel<hints.length) && (
                            <Pressable accessibilityRole="button"
                              disabled={saving} onPress={showHint} style={styles.hintButton}>
                              <Text style={styles.hintButtonText}>{hints.length > 1
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
                    {!countingGuide && <CalculationMemo key={question.id} onDrawingChange={setDrawing}/>}
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

export function ReviewQuestionPreview(props: ReviewPreview) {
  return <SafeAreaProvider><AdventureWorld review={props}/></SafeAreaProvider>;
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
