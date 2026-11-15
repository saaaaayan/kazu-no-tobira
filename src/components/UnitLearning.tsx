import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { CompanionMoment } from './AdventureCompanion';
import { SparkleBurst } from './AdventureJuice';
import {
  advanceLesson, answerLessonCheck, lessonCheckStart, lessonEnd,
  type LessonDiagram, type LessonProgress, type PictureName, type UnitLesson,
} from '../domain/unitLessons';

const pictureLabels: Record<PictureName, string> = { bell: 'すず', berry: 'きのみ', star: 'ほし' };
function Picture({ name, faded = false }: { name: PictureName; faded?: boolean }) {
  return <Svg width={28} height={28} viewBox="0 0 32 32" accessible={false} opacity={faded ? 0.5 : 1}>
    {name === 'bell' && <>
      <Path d="M6 23h20c-4-3-3-5-4-10a6 6 0 0 0-12 0c-1 5 0 7-4 10Z" fill="#ffcf62" stroke="#825027" strokeWidth={2}/>
      <Circle cx={16} cy={6} r={2} fill="#825027"/><Circle cx={16} cy={26} r={2.4} fill="#af6133"/>
    </>}
    {name === 'berry' && <>
      <Path d="M16 10q3-8 11-7-1 8-11 9" fill="#34846c"/>
      <Circle cx={15} cy={18} r={10} fill="#c64863" stroke="#833958" strokeWidth={2}/>
      <Circle cx={12} cy={15} r={2.4} fill="#ffacb0"/>
    </>}
    {name === 'star' && <Path d="m16 3 4 8 9 1-6 7 1 9-8-4-8 4 1-9-6-7 9-1Z" fill="#f4c458" stroke="#8f5c26" strokeWidth={2}/>}
  </Svg>;
}

function Action({ label, onPress, disabled, secondary }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}
    onPress={onPress}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
  </Pressable>;
}

function Diagram({ diagram, action, revealed }: { diagram: LessonDiagram; action?: 'count' | 'pair'; revealed: number }) {
  const [counted, setCounted] = useState<number[]>([]);
  const [paired, setPaired] = useState(0);
  if (diagram.kind === 'path') {
    const numbers = Array.from({ length: diagram.last - diagram.first + 1 }, (_, i) => diagram.first + i);
    return <View style={styles.chart}>
      <View style={styles.route}>
        {numbers.map(value => {
          const visited = diagram.start !== undefined && diagram.end !== undefined &&
            value >= diagram.start && (value === diagram.start ? revealed >= 1 : value <= diagram.end && revealed >= 2);
          return <View key={value} style={[styles.numberTile, visited && styles.visited]}>
            <Text style={styles.number}>{value === diagram.hidden ? '？' : value}</Text>
          </View>;
        })}
      </View>
      <Text style={styles.small}>← ちいさい　　おおきい →</Text>
    </View>;
  }
  if (diagram.kind === 'pairs') {
    const columns = Math.max(diagram.left, diagram.right);
    const pairs = Math.min(diagram.left, diagram.right);
    return <View style={styles.chart}>
      <Text style={styles.small}>うえ</Text>
      <View style={styles.route}>{Array.from({length:columns}, (_, i) =>
        <View key={i} style={styles.pairColumn}>
          <View accessible={i < diagram.left} accessibilityLabel={i < diagram.left ? 'うえの きのみ' : undefined} style={styles.pairSlot}>{i < diagram.left && <Picture name="berry" />}</View>
          <View style={[styles.pairLink, i < paired && styles.pairLinkOn]} />
          <View accessible={i < diagram.right} accessibilityLabel={i < diagram.right ? 'したの きのみ' : undefined} style={styles.pairSlot}>{i < diagram.right && <Picture name="berry" />}</View>
        </View>)}</View>
      <Text style={styles.small}>した</Text>
      {action === 'pair' && <>
        {paired < pairs
          ? <Action secondary label="ひとくみ つくる" onPress={() => setPaired(paired + 1)} />
          : <Text accessibilityLiveRegion="polite" style={styles.activityFeedback}>{diagram.left === diagram.right ? 'のこりは ないね。おなじ かずだよ。' : 'ペアに なれない きのみが ある ほうが おおいね。'}</Text>}
      </>}
    </View>;
  }
  return <View style={styles.chart}>
    {diagram.count === 0
      ? <View accessible accessibilityLabel="なにも はいっていない かご" style={styles.basket}>
          <Svg width={92} height={60} viewBox="0 0 92 60" accessible={false}>
            <Path d="M21 28C21 1 71 1 71 28" fill="none" stroke="#a46d45" strokeWidth={5}/>
            <Path d="M12 24h68l-9 28H21Z" fill="#e2a361" stroke="#a46d45" strokeWidth={3}/>
            <Path d="M22 36h48m-45 8h42" stroke="#fff0bb" strokeWidth={2}/>
          </Svg>
        </View>
      : <View style={styles.objects}>{Array.from({ length: diagram.count }, (_, i) => {
          if (action !== 'count') return <View key={i} accessible accessibilityLabel={pictureLabels[diagram.picture]} style={styles.token}><Picture name={diagram.picture}/></View>;
          const position = counted.indexOf(i);
          return <Pressable key={i} accessibilityRole="button" accessibilityLabel={pictureLabels[diagram.picture] + 'の え ' + (i + 1)}
            accessibilityState={{ selected: position >= 0 }} style={[styles.token, position >= 0 && styles.visited]}
            onPress={() => setCounted(current => current.includes(i) ? current : [...current, i])}>
            <Picture name={diagram.picture} faded={position >= 0} />
            {position >= 0 && <Text style={styles.tokenNumber}>{position + 1}</Text>}
          </Pressable>;
        })}</View>}
    {action === 'count' && <Text accessibilityLiveRegion="polite" style={styles.activityFeedback}>
      {counted.length === diagram.count ? 'ぜんぶで ' + counted.length + 'こ！' : counted.length ? counted.length + 'こ かぞえたよ。' : 'ひとつずつ さわろう。'}
    </Text>}
  </View>;
}

type LessonProps = {
  lesson: UnitLesson;
  progress: LessonProgress;
  busy: boolean;
  error: string;
  practice: boolean;
  onChange: (next: LessonProgress) => void;
  onBack: () => void;
  onChallenge?: () => void;
};

export function UnitLearning(props: LessonProps) {
  const { lesson, progress, busy, error, onBack } = props;
  const end = lessonEnd(lesson);
  return <View style={styles.panel}>
    <View style={styles.hero}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹ 島の マップへ</Text>
      </Pressable>
      <Text style={styles.eyebrow}>✦ ルミの まなびの とびら</Text>
      <Text accessibilityRole="header" style={styles.title}>{lesson.title}</Text>
      <Text style={styles.progressText}>{props.practice ? 'おためし・きろくなし　' : ''}{Math.min(progress.page + 1, end + 1)} / {end + 1}</Text>
      <View style={styles.meter} accessible={false}><View style={[styles.meterFill, { width: ((progress.page + 1) / (end + 1) * 100) + '%' as `${number}%` }]} /></View>
    </View>
    <LessonContent key={progress.page} {...props} />
    {error ? <Text accessibilityLiveRegion="polite" style={styles.problem}>{error}</Text> : null}
  </View>;
}

function LessonContent({ lesson, progress, busy, onChange, onBack, onChallenge }: LessonProps) {
  const [revealed, setRevealed] = useState(0);
  const goNext = () => onChange(advanceLesson(lesson, progress));
  const page = progress.page;
  const chapter = lesson.steps[page - 1];
  const example = lesson.workedExamples[page - 1 - lesson.steps.length];
  const check = lesson.checks[page - lessonCheckStart(lesson)];
  if (page >= lessonEnd(lesson)) return <View style={[styles.card, styles.completeCard]}>
    <SparkleBurst />
    <Text accessibilityRole="header" style={styles.heading}>がくしゅう クリア！</Text>
    <Text style={styles.text}>たしかめ もんだいに ぜんぶ せいかいしたね。</Text>
    <CompanionMoment mood="clear" speech={lesson.completionMessage} />
    {onChallenge && <Action label="ステージもんだいに チャレンジ" disabled={busy} onPress={onChallenge} />}
    <Action label="島の マップへ もどる" disabled={busy} secondary={Boolean(onChallenge)} onPress={onBack} />
  </View>;
  return <View style={styles.card}>
    {page === 0 && <>
      <Text accessibilityRole="header" style={styles.heading}>きょうの めあて</Text>
      {lesson.goals.map(goal => <Text key={goal} style={styles.text}>✦ {goal}</Text>)}
      <CompanionMoment mood="ready" variation={page} />
      <Text style={styles.text}>{lesson.readiness}</Text>
      <Action label="いっしょに はじめる" disabled={busy} onPress={goNext} />
    </>}
    {chapter && <>
      <Text accessibilityRole="header" style={styles.heading}>{chapter.title}</Text>
      <Text style={styles.text}>{chapter.text}</Text>
      {chapter.diagram && <Diagram diagram={chapter.diagram} revealed={0} action={chapter.action} />}
      <Action label="つぎへ" disabled={busy} onPress={goNext} />
    </>}
    {example && <>
      <Text accessibilityRole="header" style={styles.heading}>{example.title}</Text>
      <Text style={styles.text}>{example.text}</Text>
      <Diagram diagram={example.diagram} revealed={revealed} />
      {example.reveal.slice(0, revealed).map((text, i) => <Text key={i} style={styles.reveal}>{i + 1}. {text}</Text>)}
      {revealed < example.reveal.length
        ? <Action secondary label={revealed ? 'つぎの かんがえかたを みる' : 'かんがえかたを みる'} disabled={busy} onPress={() => setRevealed(revealed + 1)} />
        : <Action label={page + 1 === lessonCheckStart(lesson) ? 'たしかめ もんだいへ' : 'つぎへ'} disabled={busy} onPress={goNext} />}
    </>}
    {check && <>
      <Text accessibilityRole="header" style={styles.heading}>たしかめ {page - lessonCheckStart(lesson) + 1} / {lesson.checks.length}</Text>
      <Text style={styles.text}>{check.prompt}</Text>
      <Diagram diagram={check.diagram} revealed={0} />
      <View style={styles.options}>{check.choices.map(choice => <Pressable key={choice} accessibilityRole="button"
        accessibilityLabel={choice + ' を えらぶ'} disabled={busy || progress.checks[check.id]?.correct}
        style={[styles.choice, progress.checks[check.id]?.lastAnswer === choice && styles.visited]}
        onPress={() => onChange(answerLessonCheck(lesson, progress, choice, new Date().toISOString()))}>
        <Text style={styles.choiceText}>{choice}</Text>
      </Pressable>)}</View>
      {progress.checks[check.id] && (progress.checks[check.id].correct
        ? <View style={styles.right}><Text accessibilityLiveRegion="polite" style={styles.text}>せいかい！ {check.explanation}</Text></View>
        : <View style={styles.retry}><Text accessibilityLiveRegion="polite" style={styles.text}>もういちど。 {check.retryHint}</Text></View>)}
      {progress.checks[check.id]?.correct && <Action label={page + 1 === lessonEnd(lesson) ? 'がくしゅうの けっかを みる' : 'つぎの もんだいへ'} disabled={busy} onPress={goNext} />}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  panel: { alignSelf: 'center', width: '100%', maxWidth: 720, gap: 12 },
  hero: { backgroundColor: '#29355f', padding: 16, borderRadius: 20, gap: 6 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: '#dbe5ff', fontWeight: '800', fontSize: 15 },
  eyebrow: { color: '#ffdc92', fontWeight: '900', fontSize: 14 },
  title: { color: '#fff8e7', fontSize: 28, fontWeight: '900' },
  progressText: { color: '#e0e9ff', fontSize: 14 },
  meter: { height: 6, borderRadius: 6, backgroundColor: '#56638d', overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 6, backgroundColor: '#ffce77' },
  card: { backgroundColor: '#fffaf0', padding: 16, gap: 14, borderRadius: 20, borderWidth: 1, borderColor: '#e6d9b4' },
  completeCard: { position: 'relative', overflow: 'hidden', backgroundColor: '#fff3cd' },
  heading: { fontWeight: '900', fontSize: 23, lineHeight: 32, color: '#273558' },
  text: { fontSize: 17, lineHeight: 27, color: '#283750', fontWeight: '600' },
  small: { fontSize: 13, color: '#37486b', fontWeight: '700' },
  problem: { color: '#943e3e', fontSize: 16, padding: 10, backgroundColor: '#fff0e8', borderRadius: 10 },
  chart: { borderRadius: 16, backgroundColor: '#e8efff', padding: 10, alignItems: 'stretch', gap: 8 },
  objects: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  token: { height: 58, width: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderColor: '#a9b8db', borderWidth: 1, backgroundColor: '#fffcf3' },
  tokenNumber: { fontWeight: '900', color: '#233c5d', fontSize: 16 },
  route: { flexDirection: 'row', gap: 2 },
  numberTile: { flex: 1, borderRadius: 6, minHeight: 40, backgroundColor: '#fffaf0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#b8c7e3' },
  number: { color: '#243653', fontSize: 14, fontWeight: '900' },
  visited: { backgroundColor: '#ffe6a0', borderColor: '#ab7733' },
  pairColumn: { flex: 1, alignItems: 'center', borderRadius: 8, backgroundColor: '#fffaf0' },
  pairSlot: { height: 34, justifyContent: 'center' },
  pairLink: { width: 3, height: 15 },
  pairLinkOn: { backgroundColor: '#397b74', borderRadius: 3 },
  basket: { alignSelf: 'center', padding: 5 },
  activityFeedback: { color: '#2f4c62', fontWeight: '800', textAlign: 'center', fontSize: 16 },
  options: { flexDirection: 'row', gap: 9 },
  choice: { minHeight: 56, borderRadius: 12, flex: 1, backgroundColor: '#f0edf9', borderWidth: 2, borderColor: '#a5add3', justifyContent: 'center', alignItems: 'center' },
  choiceText: { fontSize: 26, fontWeight: '900', color: '#283658' },
  reveal: { fontSize: 16, lineHeight: 26, color: '#283750', backgroundColor: '#f6ebcc', borderRadius: 9, padding: 10 },
  right: { backgroundColor: '#e0f3de', borderRadius: 9, padding: 10 },
  retry: { backgroundColor: '#fff0cd', borderRadius: 9, padding: 10 },
  button: { backgroundColor: '#3e5597', minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 10 },
  secondary: { backgroundColor: '#fff2cc', borderWidth: 1, borderColor: '#d6b56b' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
  buttonText: { fontSize: 17, fontWeight: '900', textAlign: 'center', color: '#fff' },
  secondaryText: { color: '#344164' },
});
