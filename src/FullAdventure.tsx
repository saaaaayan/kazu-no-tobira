import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { worldGrades, worldIslands, type WorldGrade, type WorldStage } from './domain/worldCatalog';
import { isStandardPixelIsland } from './domain/standardPixelIslandMap';
import type { MathQuestion } from './domain/worldQuestions';
import { checkMathAnswer, isValidMathAnswer } from './domain/mathAnswer';
import { stageDisplayTitle,stageLabels, type Checkpoint } from './domain/stageStructure';
import { stageCategoryName } from './domain/islandCurriculumView';
import { preschoolStageMapInfo } from './domain/preschoolStageMapInfo';
import { gradeOnePreviewStageInfo } from './domain/gradeOnePreviewCurriculum';
import { shouldAutoGradePreschoolChoice } from './domain/preschoolAnswerFlow';
import { displayedChoiceOptions } from './domain/choicePresentation';
import { preschoolSpatialChoiceEmoji } from './domain/preschoolSpatialChoice';
import PreschoolTracePad from './components/PreschoolTracePad';
import PreschoolSequenceFillPanel, {PreschoolSequenceQuestion} from './components/PreschoolSequenceFillPanel';
import PreschoolPictureNumberMatch from './components/PreschoolPictureNumberMatch';
import { liveOrigin, requestLiveRound, requestLiveGrade, requestLiveHint, type LiveMode, type LiveRound } from './domain/liveQuestions';
import type { SkillId } from './domain/curriculum';
import { hasStageBank,isBankQuestion } from './domain/questionBank';
import { prepareStageRound } from './stageRounds';
import { QuestionDiagram, WorkedSolution, WrittenSolution } from './components/QuestionSupport';
import { emptyProgress, recordAttempt, type Progress } from './domain/progress';
import { uiPreviewRound, uiPreviewPreschoolCheckpointOne, uiPreviewPreschoolCheckpoint, uiPreviewGradeOneCheckpoint } from './domain/uiPreviewRound';
import { publicBankStageRound } from './domain/publicBankStageRound';
import QuestionReadAloud from './components/QuestionReadAloud';
import { canAccessFeature, canAccessStage, freeAccess, hasPremium, type Entitlement } from './domain/accessPlan';
import { readServerEntitlement } from './domain/serverEntitlement';
import { canPlayWorldStage, progressAfterWorldAnswer, worldStageAction, type PlayMode } from './domain/playMode';
import { adventureTitles } from './domain/titles';
import { loadProgress, saveProgress } from './storage';
import { applyNumberPadKey } from './domain/answerInput';
import { TitleAlbum, WorldChest } from './components/WorldMap780';
import { WorldMap780, IslandStageMap } from './components/WorldScenes780';
import VersionNotice from './components/VersionNotice';
import { CompanionMoment } from './components/AdventureCompanion';
import { MagicMeter, ComboBadge, SparkleBurst } from './components/AdventureJuice';
import { playSound, unlockSound, soundEnabled, setSoundEnabled, soundVolume, setSoundVolume } from './domain/gameSound';
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
// 幼児のステージ01〜05は、同じ「絵をさわる→大きな数字を1回さわって答える」画面を使う。
const preschoolGuideTitles: Readonly<Record<string,string>> = {
  'preschool.n01': '1〜3こを かぞえよう',
  'preschool.n02': '4・5こを かぞえよう',
  'preschool.n03': '6〜10こを かぞえよう',
  'preschool.n04': 'おなじ ものを かぞえよう',
  'preschool.n05': 'ならべても かずは おなじ',
};
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
  checkpoint?: {id:string; number:number};
};

type ReviewPreview = { stage: WorldStage; questions: MathQuestion[]; phone: boolean; detailed: boolean; onClose: () => void };

function AdventureWorld({ review }: { review?: ReviewPreview }) {
  const isolated = uiPreview || Boolean(review);
  const [progress, setProgress] = useState<Progress | undefined>(isolated ? emptyProgress : undefined);
  const [loadError, setLoadError] = useState(false);
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [soundLevel, setSoundLevel] = useState(soundVolume);
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
  const autoTraceSubmitted = useRef<string | undefined>(undefined);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [returnStageId, setReturnStageId] = useState<string | undefined>();
  const [mapTop, setMapTop] = useState<number | undefined>();
  const [mapStageOffset, setMapStageOffset] = useState<number | undefined>();
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const keyboard = useRef<ComponentRef<typeof TextInput>>(null);
  const viewport = useWindowDimensions().width;
  const wide = !review?.phone && viewport > 800;

  useEffect(() => {
    if (review || typeof document === 'undefined') return;
    const unlock = () => unlockSound();
    document.addEventListener('pointerup', unlock, true);
    document.addEventListener('touchend', unlock, true);
    document.addEventListener('keydown', unlock, true);
    return () => {
      document.removeEventListener('pointerup', unlock, true);
      document.removeEventListener('touchend', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
  }, [review]);

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

  // Restore the most recently played stage once the returned map is measured.
  useEffect(() => {
    if (!returnStageId || round || screen !== 'island' || mapTop === undefined || mapStageOffset === undefined || scrollViewportHeight <= 0) return;
    scroll.current?.scrollTo({ y: Math.max(0, mapTop + mapStageOffset - scrollViewportHeight * 0.48), animated: false });
    setReturnStageId(undefined);
  }, [returnStageId, round, screen, mapTop, mapStageOffset, scrollViewportHeight]);

  function blockHandwriting(value: boolean) {
    blockRef.current = value;
    setBlocked(value);
  }
  function resetAnswer() {
    autoTraceSubmitted.current=undefined;
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
    if (uiPreview) {
      if(!['preschool','e1'].includes(item.after.gradeId)||item.number<1||item.number>10){
        setStartError('この かくにんテストは じゅんびちゅうだよ。'); return;
      }
      const problems=item.after.gradeId==='e1'
        ? uiPreviewGradeOneCheckpoint(item.number)
        : item.number===1?uiPreviewPreschoolCheckpointOne()
          :uiPreviewPreschoolCheckpoint(item.number);
      if (problems.length!==10) {
        setStartError('かくにんテストの もんだいを ひらけなかったよ。'); return;
      }
      resetAnswer();
      setStartError('');
      setScreen('island');
      setRound({stage:{...item.after,title:'かくにんテスト '+item.number},checkpoint:{id:item.id,number:item.number},
        problems,index:0,correct:0,results:[],dialogueOffset:0,usedHint:false,hintLevel:0});
      return;
    }
    if (!gameOrigin) { setStartError('確認テストを準備しています。'); return; }
    void startLive({...item.after,title:'確認テスト '+item.number},'checkpoint',item.id);
  }

  function startLiveStudy(mode:'daily'|'review'|'remediation'|'diagnosis',skills:SkillId[]) {
    const stage=worldGrades[0].stages[0];
    const title={daily:'毎日の学習',review:'定期復習',remediation:'克服練習',diagnosis:'基礎をたしかめる'}[mode];
    void startLive({...stage,title},mode,undefined,skills);
  }

  async function start(stage: WorldStage) {
    if (!review) playSound('tap');
    if (!progress || starting.current || submitting.current || lessonWrite.current) return;
    if (uiPreview) {
      if (stage.gradeId==='e1' && stage.kind==='normal') {
        // Grade-one trial uses the newly reviewed scope of ten per stage.
        // Keep the archived 100-question banks intact for separate QA/migration.
        const problems=uiPreviewRound(stage);
        if(problems.length!==10){setStartError('この ステージは じゅんびちゅうだよ。');return;}
        resetAnswer();setStartError('');setScreen('island');
        setRound({stage,problems,index:0,correct:0,results:[],
          dialogueOffset:0,usedHint:false,hintLevel:0});
        return;
      }
      if (hasStageBank(stage.id)) {
        // Public trial: these existing banks are now playable in the normal
        // adventure screen, without a login or a separate admin route.
        starting.current=true;
        setLoadingRound(true);
        setStartError('');
        try {
          const problems=await publicBankStageRound(stage);
          resetAnswer();
          setLearning(undefined);
          setScreen('island');
          setRound({stage,problems,index:0,correct:0,results:[],
            dialogueOffset:Math.floor(Math.random()*1000),usedHint:false,hintLevel:0});
        } catch(error) {
          setStartError(error instanceof Error ? error.message : '問題を読み込めませんでした。');
        } finally {
          starting.current=false;
          setLoadingRound(false);
        }
        return;
      }
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
  const preschoolStage=Boolean(round?.stage.gradeId==='preschool' && (preschoolGuideTitles[round.stage.id] || uiPreview));
  const countingGuide=Boolean(preschoolStage && diagram?.kind==='countingBoard' && diagram.guide);
  const numeralGuide=Boolean(preschoolStage && bankQuestion?.preschoolNumberActivity);
  const pictureMatching=Boolean(preschoolStage && bankQuestion?.preschoolNumberMatch);
  const sequenceFill=Boolean(preschoolStage && bankQuestion?.preschoolSequenceFill && !review && !round?.live);
  const traceActivity=Boolean(uiPreview && bankQuestion?.preschoolTrace && !round?.feedback);
  const autoTraceEnabled=Boolean(uiPreview && !review && bankQuestion?.preschoolTrace);
  const autoGradePreschoolChoice=shouldAutoGradePreschoolChoice(
    round?.stage,question?.type,Boolean(review),
    Boolean(bankQuestion?.preschoolTrace || bankQuestion?.preschoolNumberMatch),
  );
  // Every ordinary choice question is answered below the problem with a
  // single tap. Keep tracing, picture-to-number linking and admin review
  // on their dedicated input flows.
  const inlineChoice=Boolean(question?.type==='choice' && !countingGuide && !numeralGuide &&
    !pictureMatching && !sequenceFill && !bankQuestion?.preschoolTrace && !review);
  // The memo is absent for choice questions, so the results must not keep
  // the old two-column desktop layout with an empty left side.
  const choiceFeedback=Boolean(round?.feedback && question?.type==='choice');
  const displayedChoices=displayedChoiceOptions(question?.choices);
  const directionalChoices=Boolean(displayedChoices && displayedChoices!==question?.choices);
  // Toy-identity questions should show the SAME toy picture as the scene,
  // whether it is laid out vertically or left-to-right.
  const spatialPictureChoices=Boolean(diagram?.kind==='countingBoard' &&
    (diagram.arrangement==='vertical-position' || diagram.arrangement==='position-row'));
  const hints = liveCard ? round?.liveHints ?? [] : bankQuestion?.hints ?? question?.guidedHints ?? (question ? [question.hint] : []);
  const handwritingAllowed = question?.type === 'number' && (Boolean(liveCard) || Number.isInteger(Number(question.answer)) && Number(question.answer) >= 0);
  const shownMode: AnswerMode = mode === 'handwriting' && !handwritingAllowed ? 'panel' : mode;

  async function showHint() {
    if (!round || !question || round.feedback || submitting.current) return;
    if (!review) playSound('tap');
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

  async function submit(selectedAnswer?: string) {
    if (!round || !progress || !question || (!isolated && !round.live && !canAccessStage(access, round.stage)) || round.feedback || submitting.current || saving ||
      (shownMode === 'handwriting' && (blockRef.current || drawing))) return;
    // 幼児の1タップ回答では、setStateの完了を待たず、押された数字をそのまま採点する。
    if (!review) unlockSound();
    const submittedAnswer = selectedAnswer ?? answer;
    if (selectedAnswer !== undefined) setAnswer(selectedAnswer);
    if (!isValidMathAnswer(question, submittedAnswer)) {
      setMessage(question.type === 'choice' ? 'こたえを ひとつ えらんでね。' : 'こたえを 数字で いれてね。');
      if (shownMode === 'keyboard') keyboard.current?.focus();
      return;
    }

    const now = new Date().toISOString();
    submitting.current = true;
    setSaving(true);
    setMessage('');
    const submitted = question.type === 'choice'
      ? question.choices?.indexOf(submittedAnswer) ?? -1
      : Number(submittedAnswer.normalize('NFKC').replaceAll('−', '-'));
    try {
      const graded=round.live ? await requestLiveGrade(round.live.origin,round.live.round.token,question.id,submittedAnswer) : undefined;
      const correctAnswer=graded?.correct ?? checkMathAnswer(question,submittedAnswer);
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
      if (!review) playSound(result);
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
      if (!review && !round.checkpoint && (!round.live || ['stage','test'].includes(round.live.mode)) && round.correct >= Math.ceil(round.stage.questions * 0.8)) playSound('clear');
      else if (!review) playSound('tap');
    } else {
      setRound({ ...round, index: round.index + 1, feedback: undefined, hintLevel: 0, liveHints:undefined, noMoreHints:false });
      if (!review) playSound('tap');
    }
  }

  // Digit recognition grades the tracing automatically. Moving to the next
  // question is always an explicit tap on the feedback screen's button.

  function goToIsland() {
    if (starting.current || submitting.current || lessonWrite.current) return;
    if (review) { review.onClose(); return; }
    const returningToIsland = !round?.live || ['stage', 'test'].includes(round.live.mode);
    setReturnStageId(returningToIsland ? round?.stage.id ?? learning?.target?.id : undefined);
    setMapTop(undefined);
    setMapStageOffset(undefined);
    setLearning(undefined);
    setStartError('');
    resetAnswer();
    setRound(undefined);
    setScreen(round?.live?.mode==='daily'||round?.live?.mode==='review'?'study-plan':
      round?.live?.mode==='diagnosis'||round?.live?.mode==='remediation'?'study':'island');
  }
  function openGrade(next: WorldGrade) {
    if (!review) playSound('tap');
    if (!uiPreview && next.id === 'sage' && !hasPremium(access)) { setShowPlanInfo(true); scroll.current?.scrollTo({ y: 0 }); return; }
    resetAnswer();
    setStartError('');
    setReturnStageId(undefined);
    setMapTop(undefined);
    setMapStageOffset(undefined);
    setGrade(next);
    setScreen('island');
  }

  const perfect = Boolean(round && round.correct === round.problems.length && !round.usedHint);
  const specialRound=Boolean(round?.checkpoint || (round?.live && !['stage','test'].includes(round.live.mode)));
  const cleared = Boolean(round && !specialRound && round.correct >= Math.ceil(round.stage.questions * 0.8));
  const nextStage = round && !round.checkpoint && (!round.live || ['stage','test'].includes(round.live.mode)) && worldIslands.find(g=>g.id===round.stage.gradeId)?.stages[round.stage.order + 1];
  const canContinue = !review && nextStage && progress && (uiPreview
    ? (hasStageBank(nextStage.id)||Boolean(uiPreviewRound(nextStage).length))
    : ['play', 'learn'].includes(worldStageAction(playMode, progress, nextStage, access)));
  const lessonStage = learning && (learning.target ?? grade.stages.find(stage => learning.lesson.linkedStageIds.includes(stage.id)));
  const canChallenge = lessonStage && progress && canPlayWorldStage(playMode, progress, lessonStage, access);
  const newlyEarnedTitles = round && progress && !testing ? adventureTitles(progress).filter(t=>t.unlocked).length : 0;
  // Child-facing preschool screens show only the controls needed to play.
  // Prototype details remain accessible from the home and world map.
  const preschoolMapFirst = !round && screen === 'island' && grade.id === 'preschool';
  const preschoolChildView = preschoolMapFirst || Boolean(!review && round?.stage.gradeId === 'preschool');
  const standardIslandMapFirst = !round && screen === 'island' && isStandardPixelIsland(grade.id);
  const standardIslandChildView = preschoolChildView || standardIslandMapFirst ||
    Boolean(!review && round?.stage.gradeId === 'e1');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" scrollEnabled={!drawing}
        onLayout={event=>setScrollViewportHeight(event.nativeEvent.layout.height)}
        contentContainerStyle={[styles.scroll,standardIslandMapFirst&&styles.preschoolScroll,screen==='world' && !round && styles.worldMapScroll]}>
        <View pointerEvents={loadingRound ? 'none' : 'auto'} accessibilityState={{ busy: loadingRound }}
          style={[styles.shell,standardIslandMapFirst&&styles.preschoolShell,round && !round.complete && styles.playShell,screen==='world' && !round && styles.worldMapSlightlyWider]}>
          {!round && screen !== 'lesson' && screen !== 'study-plan' && !standardIslandMapFirst && <VersionNotice/>}
          {uiPreview && !standardIslandChildView && <View style={styles.playPanel} testID="kazu-sample-only-preview">
            <Text accessibilityRole="header" style={styles.answerHeading}>数のトビラ 試作版</Text>
            <Text style={styles.explanation}>小1は全50ステージのカリキュラム確認用10問ずつを公開中です。以前の100問バンクは別途保管し、教材の見直し後に再統合します。幼児65ステージも遊べます。試作版の回答記録は保存されません。</Text>
            <Text selectable style={styles.hintNote}>バージョン {process.env.EXPO_PUBLIC_KAZU_UI_PREVIEW_SHA}</Text>
          </View>}
          {__DEV__ && !review && !standardIslandChildView && <View style={styles.navigation}>
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
                onStart={() => { playSound('tap'); resetAnswer(); setScreen('world'); }} onTitles={() => { playSound('tap'); setScreen('titles'); }}
                soundOn={soundOn} onSoundChange={next => { setSoundEnabled(next); setSoundOn(next); if (next) playSound('correct'); }}
                soundLevel={soundLevel} onSoundLevelChange={next => { setSoundVolume(next); setSoundLevel(next); if (soundOn && next > 0) playSound('correct'); }} />
              {process.env.EXPO_PUBLIC_KAZU_ONLINE_REVIEW === '1' && typeof window !== 'undefined' &&
                <GameButton label="管理者ログイン" secondary onPress={() => window.location.assign('/kazu-no-tobira/admin/')} />}
            </>
          ) : !standardIslandChildView ? (
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
          ) : null}
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
              onTitles={()=>setScreen('titles')} onStart={start} onLearn={openLesson} preview={uiPreview}
              focusStageId={returnStageId} onFocusStagePosition={setMapStageOffset} onMapLayout={setMapTop}/>}
          {progress && !round && screen === 'titles' &&
            <TitleAlbum progress={progress} onBack={()=>setScreen('world')}/>}
          {progress && screen === 'lesson' && !round && learning &&
            <UnitLearning key={learning.lesson.id} lesson={learning.lesson} progress={learning.progress}
              practice={testing} busy={saving} error={lessonError} onChange={updateLesson} onBack={goToIsland}
              onChallenge={canChallenge ? () => start(lessonStage) : undefined}/>}
          {round && question && (isolated || canAccessStage(access, round.stage)) && (
            <View style={styles.playPanel}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={goToIsland} style={styles.back}>
                <Text style={styles.backText}>{review ? '‹ 審査に戻る' : '‹ '+grade.island+'のマップへ'}</Text>
              </Pressable>
              {round.complete ? (
                <View style={styles.finish}>
                  <View style={styles.finishHero}>
                    {!testing && cleared && <SparkleBurst big/>}
                    {!testing && <Text style={styles.finishEmoji}>{perfect?'🌟':cleared?'✨':'🌱'}</Text>}
                    <Text style={styles.finishStage}>{uiPreview && gradeOnePreviewStageInfo(round.stage)?.title || stageDisplayTitle(round.stage)}</Text>
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
                      <Text style={styles.stageTitle}>{round.checkpoint ? 'かくにんテスト '+round.checkpoint.number : countingGuide ? preschoolGuideTitles[round.stage.id] : round.stage.gradeId==='preschool' ? preschoolStageMapInfo(round.stage).title : uiPreview && gradeOnePreviewStageInfo(round.stage)?.title || stageDisplayTitle(round.stage)}</Text>
                      <Text style={styles.questionIndex}>{countingGuide ? round.index+1 : '第'+(round.index+1)+'問'} / {round.problems.length}</Text>
                    </View>
                    <Text style={styles.stageCategory}>{round.checkpoint
                      ? '学習範囲：直前の冒険5ステージ'
                      : '単元・カテゴリ：'+(uiPreview && gradeOnePreviewStageInfo(round.stage)?.unit ||
                          stageCategoryName(worldIslands.find(island=>island.id===round.stage.gradeId)!,round.stage))}</Text>
                    <MagicMeter results={round.results} total={round.problems.length}/>
                    <CompanionMoment compact onDark
                      mood={round.feedback === 'correct' ? 'correct' : round.feedback === 'incorrect' ? 'incorrect' : 'ready'}
                      variation={round.dialogueOffset + round.index}/>
                    {!countingGuide && <Text style={styles.difficulty}>{round.stage.kind==='secret'?stageLabels.secret:round.stage.kind==='extra'?stageLabels.extra:bankQuestion ? ['● きほん', '● ひょうじゅん', '★ おうよう'][bankQuestion.difficulty - 1]
                      : round.index<3?'● きほん':round.index<8?'● ひょうじゅん':'★ おうよう'}</Text>}
                    {preschoolStage && bankQuestion?.preschoolTwoRules && !round.feedback && (
                      <View testID="preschool-two-rule-conditions" style={styles.preschoolRulesPanel}>
                        <Text style={styles.preschoolRuleText}>① いろは　{bankQuestion.preschoolTwoRules.color}</Text>
                        <Text style={styles.preschoolRuleText}>② かたちは　{bankQuestion.preschoolTwoRules.shape}</Text>
                      </View>
                    )}
                    {sequenceFill ? (
                      <PreschoolSequenceQuestion question={question.question}/>
                    ) : round.stage.gradeId==='preschool' && question.question.includes('\n') ? (
                      <View testID="preschool-sequence-two-line-question"
                        accessibilityLabel={question.question} style={styles.preschoolSequenceQuestion}>
                        {question.question.split('\n').map((line,index)=>(
                          <MathText key={index} value={line} style={index===0
                            ? styles.preschoolSequenceNumbers
                            : styles.preschoolSequenceInstruction}/>
                        ))}
                      </View>
                    ) : <MathText style={styles.questionText} value={question.question}/>}
                    {numeralGuide && bankQuestion?.preschoolNumeral!==undefined && !round.feedback && (
                      <View testID="preschool-numeral-target" style={styles.preschoolNumeralTarget}>
                        <Text style={styles.preschoolNumeralTargetText}>{bankQuestion.preschoolNumeral}</Text>
                      </View>
                    )}
                    {preschoolStage && !round.feedback &&
                      <QuestionReadAloud text={[
                        ...(bankQuestion?.preschoolTwoRules
                          ? ['いろは '+bankQuestion.preschoolTwoRules.color,
                             'かたちは '+bankQuestion.preschoolTwoRules.shape] : []),
                        question.question,question.prompt,
                        round.hintLevel ? hints[round.hintLevel-1] : ''
                      ].filter(Boolean).join('。')}/>}
                    {question.figure && <StudyFigureView figure={question.figure}/>}
                    {question.clock && !round.feedback && <ClockFace time={question.clock.start} read={question.clock.read}/>}
                    {diagram && !round.feedback && (
                      <QuestionDiagram diagram={diagram} phase={round.hintLevel ? 'hint' : 'question'} />
                    )}
                    <MathText style={styles.prompt} value={question.prompt}/>
                    {traceActivity && bankQuestion?.preschoolTrace && <PreschoolTracePad key={question.id}
                      digit={bankQuestion.preschoolTrace} disabled={saving} autoGrade={autoTraceEnabled}
                      onChange={value=>{
                        setAnswer(value);
                        setMessage('');
                        // Pass the recognized result directly: React may not
                        // have committed setAnswer yet. The ref also prevents
                        // StrictMode replays / repeated recognition from grading twice.
                        if(value==='できた' && autoTraceEnabled &&
                          !round?.feedback && autoTraceSubmitted.current!==question.id){
                          autoTraceSubmitted.current=question.id;
                          void submit('できた');
                        }
                      }}/>}
                    {countingGuide && !round.feedback && (
                      <View style={styles.preschoolAnswerSection}>
                        <Text style={styles.preschoolInstruction}>すうじを さわってね</Text>
                        <View style={styles.preschoolNumberRow}>
                          {question.choices?.map(option => (
                            <Pressable key={option} testID={'preschool-answer-'+option}
                              accessibilityRole="button"
                              accessibilityLabel={option+'こ と こたえる'}
                              accessibilityHint="さわると こたえあわせを するよ"
                              accessibilityState={{disabled:saving}}
                              disabled={saving} onPress={()=>void submit(option)}
                              style={({pressed})=>[styles.preschoolNumberButton,pressed&&styles.dim]}>
                              <Text style={styles.preschoolNumberText}>{option}</Text>
                            </Pressable>
                          ))}
                        </View>
                        {hints.slice(0,round.hintLevel).map((hint,i)=>(
                          <View key={i} style={styles.preschoolHintBox}>
                            <MathText style={styles.preschoolHintText} value={hint}/>
                          </View>
                        ))}
                        {(round.live ? !round.noMoreHints : round.hintLevel<hints.length) && (
                          <Pressable accessibilityRole="button" disabled={saving}
                            onPress={showHint} style={styles.preschoolHintButton}>
                            <Text style={styles.preschoolHintButtonText}>💡 ヒントを みる</Text>
                          </Pressable>
                        )}
                        {!!message && <Text accessibilityLiveRegion="polite" style={styles.preschoolError}>{message}</Text>}
                      </View>
                    )}
                    {pictureMatching && bankQuestion?.preschoolNumberMatch && !round.feedback && (
                      <View testID="preschool-connect-picture-number-panel"
                        style={styles.preschoolNumeralAnswerSection}>
                        <PreschoolPictureNumberMatch key={question.id} match={bankQuestion.preschoolNumberMatch}
                          disabled={saving} onChange={value=>{setAnswer(value);setMessage('');}}
                          onSubmit={value=>void submit(value)}/>
                        {hints.slice(0,round.hintLevel).map((hint,i)=>(
                          <View key={i} style={styles.preschoolHintBox}>
                            <MathText style={styles.preschoolHintText} value={hint}/>
                          </View>
                        ))}
                        {round.hintLevel<hints.length && (
                          <Pressable accessibilityRole="button" disabled={saving}
                            onPress={showHint} style={styles.preschoolHintButton}>
                            <Text style={styles.preschoolHintButtonText}>💡 ヒントを みる</Text>
                          </Pressable>
                        )}
                        {!!message && <Text accessibilityLiveRegion="polite"
                          style={styles.preschoolError}>{message}</Text>}
                      </View>
                    )}
                    {numeralGuide && !pictureMatching && !round.feedback && (
                      <View testID="preschool-numeral-choice-panel" style={styles.preschoolNumeralAnswerSection}>
                        <Text style={styles.preschoolInstruction}>こたえを ひとつ さわってね</Text>
                        <View style={styles.preschoolNumeralChoices}>
                          {question.choices?.map(option=>(
                            <Pressable key={option} testID={'preschool-numeral-choice-'+option}
                              accessibilityRole="button" accessibilityLabel={option+' を えらぶ'}
                              accessibilityHint="さわると こたえあわせを するよ"
                              accessibilityState={{disabled:saving}}
                              disabled={saving} onPress={()=>void submit(option)}
                              style={({pressed})=>[styles.preschoolNumeralOption,(saving||pressed)&&styles.dim]}>
                              <Text numberOfLines={2} adjustsFontSizeToFit
                                style={[styles.preschoolNumeralOptionText,option.length>8&&styles.preschoolNumeralOptionTextLong]}>
                                {option}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        {hints.slice(0,round.hintLevel).map((hint,i)=>(
                          <View key={i} style={styles.preschoolHintBox}>
                            <MathText style={styles.preschoolHintText} value={hint}/>
                          </View>
                        ))}
                        {round.hintLevel<hints.length && (
                          <Pressable accessibilityRole="button" disabled={saving}
                            onPress={showHint} style={styles.preschoolHintButton}>
                            <Text style={styles.preschoolHintButtonText}>💡 ヒントを みる</Text>
                          </Pressable>
                        )}
                        {!!message && <Text accessibilityLiveRegion="polite" style={styles.preschoolError}>{message}</Text>}
                      </View>
                    )}
                    {sequenceFill && bankQuestion?.preschoolSequenceFill && !round.feedback && (
                      <View testID="preschool-sequence-interactive-answer" style={styles.preschoolAnswerSection}>
                        <PreschoolSequenceFillPanel key={question.id}
                          sequence={bankQuestion.preschoolSequenceFill} disabled={saving}
                          onSubmit={value=>void submit(value)}/>
                        {hints.slice(0,round.hintLevel).map((hint,i)=>(
                          <View key={i} style={styles.preschoolHintBox}>
                            <MathText style={styles.preschoolHintText} value={hint}/>
                          </View>
                        ))}
                        {round.hintLevel<hints.length && (
                          <Pressable accessibilityRole="button" disabled={saving}
                            onPress={showHint} style={styles.preschoolHintButton}>
                            <Text style={styles.preschoolHintButtonText}>💡 ヒントを みる</Text>
                          </Pressable>
                        )}
                        {!!message && <Text accessibilityLiveRegion="polite"
                          style={styles.preschoolError}>{message}</Text>}
                      </View>
                    )}
                    {inlineChoice && !round.feedback && (
                      <View testID="kazu-inline-choice-panel" style={styles.preschoolAnswerSection}>
                        <Text style={styles.preschoolInstruction}>
                          {question.choices?.every(option=>/^\d+$/u.test(option)) ? 'すうじを さわってね' : 'こたえを さわってね'}
                        </Text>
                        <View style={[styles.preschoolNumberRow,styles.inlineChoiceRow]}>
                          {displayedChoices?.map(option=>(
                            <Pressable key={option} testID={'kazu-inline-choice-'+option}
                              accessibilityRole="button" accessibilityLabel={option+' と こたえる'}
                              accessibilityHint="さわると こたえあわせを するよ"
                              accessibilityState={{disabled:saving}}
                              disabled={saving} onPress={()=>void submit(option)}
                              style={({pressed})=>[styles.preschoolNumberButton,styles.inlineChoiceButton,
                                question.choices && question.choices.length>3 && styles.inlineChoiceWrap,
                                (saving||pressed)&&styles.dim]}>
                              {spatialPictureChoices ? (
                                <View style={styles.verticalPictureChoice}>
                                  <Text style={styles.verticalPictureChoiceEmoji}>
                                    {preschoolSpatialChoiceEmoji(diagram,option)}
                                  </Text>
                                  <Text style={styles.verticalPictureChoiceName}>{option}</Text>
                                </View>
                              ) : (
                                <MathText value={option} style={[styles.preschoolNumberText,
                                  option.length>2&&styles.inlineChoiceMedium,
                                  option.length>5&&styles.inlineChoiceLong,
                                  option.length>9&&styles.inlineChoiceVeryLong,
                                  directionalChoices&&styles.inlineDirectionalChoiceText,
                                  directionalChoices&&viewport<400&&styles.inlineDirectionalChoiceTextNarrow]}/>
                              )}
                            </Pressable>
                          ))}
                        </View>
                        {hints.slice(0,round.hintLevel).map((hint,i)=>(
                          <View key={i} style={styles.preschoolHintBox}>
                            <MathText style={styles.preschoolHintText} value={hint}/>
                          </View>
                        ))}
                        {(round.live ? !round.noMoreHints : round.hintLevel<hints.length) && (
                          <Pressable accessibilityRole="button" disabled={saving}
                            onPress={showHint} style={styles.preschoolHintButton}>
                            <Text style={styles.preschoolHintButtonText}>💡 ヒントを みる</Text>
                          </Pressable>
                        )}
                        {!!message && <Text accessibilityLiveRegion="polite" style={styles.preschoolError}>{message}</Text>}
                      </View>
                    )}
                  </View>
                  {((!countingGuide && !numeralGuide && !inlineChoice && !sequenceFill) || round.feedback) && <View testID={choiceFeedback?'choice-feedback-centered':undefined}
                    style={[styles.workArea,wide&&!countingGuide&&!numeralGuide&&question.type!=='choice'&&styles.workWide,
                      choiceFeedback&&styles.choiceFeedbackWork]}>
                    <View style={[styles.answerArea,
                      wide&&!countingGuide&&!numeralGuide&&question.type!=='choice'&&styles.answerWide,
                      choiceFeedback&&styles.choiceFeedbackArea]}>
                      {round.feedback ? (
                        <>
                          <View accessibilityLiveRegion="polite" style={[styles.feedbackBox,
                            choiceFeedback&&styles.choiceFeedbackBox,
                            round.feedback==='incorrect'&&styles.wrongBox]}>
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
                            {pictureMatching ? (
                              <Text style={styles.yourAnswer}>きみが つないだ すうじ：{answer.split('-').join('・')}</Text>
                            ) : (
                              <MathText style={styles.yourAnswer} prefix="きみの こたえ：" value={answer} format={question.type === 'choice'}/>
                            )}
                            {round.feedback==='incorrect' && (pictureMatching ? (
                              <Text style={styles.answerHint}>ただしい つなぎかた：{question.answer.split('-').join('・')}</Text>
                            ) : (
                              <MathText style={styles.answerHint} prefix="ただしい こたえ：" value={question.answer}/>
                            ))}
                            {question.clock && <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
                              <ClockFace time={question.clock.start} caption={question.clock.read ? 'よみとった じこく' : 'はじめ'}/>
                              {!question.clock.read && <ClockFace time={question.clock.end} caption="はりを うごかした あと"/>}
                            </View>}
                            <Text style={styles.answerHeading}>{countingGuide ? 'こたえの わけ' : '基本の かいせつ'}</Text>
                            {(countingGuide || diagram?.kind==='preschoolSplit') && diagram &&
                              <QuestionDiagram diagram={diagram} phase="solution"/>}
                            <MathText style={styles.explanation} value={question.explanation}/>
                            {preschoolStage && <QuestionReadAloud text={question.explanation}/>}
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
                          {traceActivity ? (
                            <Text style={styles.preschoolTraceNotice}>{autoTraceEnabled
                              ? 'すうじを かけたら、じどうで せいかいに なるよ。'
                              : 'おてほんを なぞったら、「こたえあわせ」を おしてね。'}</Text>
                          ) : question.type==='choice' ? (
                            <View style={styles.options}>
                              {question.choices?.map(option => (
                                <Pressable key={option} accessibilityRole="button" accessibilityLabel={option}
                                  accessibilityState={{selected:answer===option,disabled:saving}}
                                  disabled={saving} onPress={()=>{
                                    if(autoGradePreschoolChoice){
                                      // Read the tapped option, not potentially stale React state.
                                      void submit(option);
                                    } else {
                                      setAnswer(option);
                                      setMessage('');
                                    }
                                  }}
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
                                  editable={!saving} onSubmitEditing={()=>void submit()}/>
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
                          {!autoTraceEnabled && !autoGradePreschoolChoice && <GameButton label={saving?'きろくしているよ…':'こたえあわせ'} onPress={()=>void submit()}
                            disabled={saving||(traceActivity&&answer!=='できた')||(shownMode==='handwriting'&&(blocked||drawing))}/>}
                        </>
                      )}
                    </View>
                    {!countingGuide && !numeralGuide && !bankQuestion?.preschoolTrace && question.type!=='choice' &&
                      <CalculationMemo key={question.id} onDrawingChange={setDrawing}/>}
                  </View>}
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
  preschoolScroll: { paddingTop: 4, paddingHorizontal: 8, paddingBottom: 36 },
  // Remove only the 14px outer inset for the world atlas. The 1030px shell
  // maxWidth is intentionally unchanged (PR #187 made the map oversized).
  worldMapScroll: { paddingTop: 0, paddingHorizontal: 0 },
  shell: { width: '100%', maxWidth: 1030, alignSelf: 'center', gap: 15 },
  // Fill most desktop width without letting the atlas grow without limit.
  worldMapSlightlyWider: { maxWidth: 1120 },

  preschoolShell: { gap: 5 },
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
  stageCategory: { color:'#f2e2ad',fontSize:14,fontWeight:'800',lineHeight:20 },
  questionIndex: { color: '#e1e7ff', fontWeight: '800', fontSize: 13 },
  difficulty: { color: '#ffe09f', fontSize: 12, fontWeight: '800', paddingTop: 4 },
  questionText: { color: 'white', fontWeight: '900', fontSize: 29, lineHeight: 40 },
  preschoolRulesPanel:{alignSelf:'flex-start',width:'100%',maxWidth:520,marginBottom:14,
    backgroundColor:'#fff5d6',borderRadius:9,paddingVertical:13,paddingHorizontal:18,gap:9},
  preschoolRuleText:{color:'#293757',fontWeight:'900',fontSize:24,lineHeight:34},
  preschoolSequenceQuestion:{alignItems:'flex-start',justifyContent:'center',gap:14,
    marginBottom:8,minWidth:0,maxWidth:'100%'},
  preschoolSequenceNumbers:{color:'#fff0b5',fontWeight:'900',fontSize:38,
    lineHeight:54,letterSpacing:2,flexShrink:1},
  preschoolSequenceInstruction:{color:'white',fontWeight:'900',fontSize:27,
    lineHeight:38,flexShrink:1},
  prompt: { color: '#e3e9fc', fontSize: 13, fontWeight: '700' },
  workArea: { gap: 13 },
  workWide: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  answerArea: { gap: 9, backgroundColor: '#f0f4fc', borderRadius: 16, padding: 14, minWidth: 0 },
  answerWide: { width: 360 },
  choiceFeedbackWork: { alignItems: 'center' },
  choiceFeedbackArea: { width: '100%', alignSelf: 'stretch', padding: 0, backgroundColor: 'transparent' },
  choiceFeedbackBox: { borderRadius: 19, padding: 18 },
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
  // 幼児は問題のすぐ下で「すうじを1回さわる→採点」。右下の小さな回答欄は使わない。
  preschoolAnswerSection: { gap: 10, alignItems:'center', paddingTop: 4 },
  preschoolInstruction: { color:'#fff4ce', fontSize:20, fontWeight:'900', textAlign:'center' },
  preschoolTraceNotice:{fontSize:15,fontWeight:'800',color:'#344454',lineHeight:22},
  preschoolNumeralTarget:{minHeight:126,maxWidth:420,width:'100%',alignSelf:'center',
    justifyContent:'center',alignItems:'center',borderRadius:9,borderWidth:3,
    borderColor:'#8b997e',backgroundColor:'#fff8e2',paddingHorizontal:10},
  preschoolNumeralTargetText:{fontSize:100,lineHeight:118,fontWeight:'900',color:'#344454',textAlign:'center'},
  preschoolNumeralAnswerSection:{width:'100%',alignItems:'center',gap:11,paddingTop:6},
  preschoolNumeralChoices:{width:'100%',maxWidth:520,gap:9,flexDirection:'row'},
  preschoolNumeralOption:{minHeight:78,flex:1,minWidth:0,backgroundColor:'#fff2c8',
    borderWidth:3,borderColor:'#e8bf66',borderRadius:18,
    paddingHorizontal:3,paddingVertical:10,justifyContent:'center',alignItems:'center'},
  preschoolNumeralOptionText:{color:'#27335c',fontWeight:'900',fontSize:40,textAlign:'center'},
  preschoolNumeralOptionTextLong:{fontSize:18},

  preschoolNumberRow: { flexDirection:'row', width:'100%', maxWidth:440, gap:10 },
  preschoolNumberButton: { flex:1, minWidth:0, minHeight:78, borderWidth:3,
    borderColor:'#e8bf66', borderRadius:18, backgroundColor:'#fff2c8',
    alignItems:'center', justifyContent:'center' },
  preschoolNumberText: { color:'#27335c', fontSize:40, fontWeight:'900',textAlign:'center' },
  inlineChoiceRow:{maxWidth:560,flexWrap:'wrap'},
  inlineChoiceButton:{paddingHorizontal:4,paddingVertical:10},
  inlineChoiceWrap:{flexBasis:'40%'},
  inlineChoiceMedium:{fontSize:26},
  inlineChoiceLong:{fontSize:17},
  inlineChoiceVeryLong:{fontSize:13},
  inlineDirectionalChoiceText:{fontSize:30},
  inlineDirectionalChoiceTextNarrow:{fontSize:22},
  verticalPictureChoice:{alignItems:'center',justifyContent:'center',gap:3},
  verticalPictureChoiceEmoji:{fontSize:54,lineHeight:70,textAlign:'center'},
  verticalPictureChoiceName:{fontSize:19,lineHeight:27,fontWeight:'900',color:'#27335c',textAlign:'center'},
  preschoolHintButton: { minHeight:56, backgroundColor:'#fff0be',
    borderRadius:14, paddingHorizontal:24, justifyContent:'center', alignItems:'center' },
  preschoolHintButtonText: { color:'#29345d', fontSize:19, fontWeight:'900' },
  preschoolHintBox: { width:'100%', maxWidth:480, backgroundColor:'#fff4d3',
    borderRadius:12, padding:12 },
  preschoolHintText: { color:'#34345e', fontSize:17, fontWeight:'800', textAlign:'center' },
  preschoolError: { color:'#fff1bb', fontWeight:'800', fontSize:16 },
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
