import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { WorldStage } from '../domain/worldCatalog';
import { guideForStage } from '../domain/learningLibrary';
import { generateWorldQuestions, checkMathAnswer, isValidMathAnswer } from '../domain/worldQuestions';
import { MathText } from './MathText';

type Page = 'goal' | 'understand' | 'example' | 'quiz' | 'finish';
const pages: readonly Page[] = ['goal', 'understand', 'example', 'quiz', 'finish'];

export default function LearningExperience({ stage, completed, onBack, onComplete, onPlay }: {
  stage: WorldStage;
  completed: boolean;
  onBack: () => void;
  onComplete: () => void;
  onPlay: () => void;
}) {
  const guide = guideForStage(stage);
  const [page, setPage] = useState<Page>('goal');
  const [checkIndex, setCheckIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [right, setRight] = useState(false);
  const examples = useMemo(() => generateWorldQuestions(stage, 17).slice(0, 3), [stage.id]);
  const example = examples[0];
  const checking = examples[checkIndex + 1];
  const next = () => setPage(pages[pages.indexOf(page) + 1] ?? 'finish');
  const clear = () => { setInput(''); setFeedback(''); setRight(false); };
  const check = () => {
    if (!checking || !isValidMathAnswer(checking, input)) {
      setFeedback('こたえを 入力するか、えらんでね。');
      return;
    }
    const correct = checkMathAnswer(checking, input);
    setRight(correct);
    setFeedback(correct ? '正解！ 解き方がわかったね。' : 'もういちど考えてみよう。' + checking.explanation);
  };
  const goForward = () => {
    if (checkIndex === 1) { onComplete(); setPage('finish'); }
    else { setCheckIndex(1); clear(); }
  };
  return <View style={styles.wrap}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹ 島のマップへもどる</Text></Pressable>
    <View style={styles.banner}>
      <Text style={styles.eyebrow}>📖 まず学ぼう ・ {stage.subtitle}</Text>
      <Text accessibilityRole="header" style={styles.title}>{guide.title}</Text>
      <Text style={styles.bannerDetail}>学んでから、ステージで力を試してみよう。</Text>
    </View>
    <View style={styles.meter}>{pages.map((name, i) => <View key={name} style={[styles.meterBar, pages.indexOf(page) >= i && styles.meterActive]} />)}</View>
    {page === 'goal' && <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>🎯 この単元で学ぶこと</Text>
      <Text style={styles.body}>{guide.objective}</Text>
      <Text style={styles.body}>{guide.introduction}</Text>
      <View style={styles.note}><Text style={styles.body}>💡 {guide.keyPoint}</Text></View>
      <Action text="いっしょに まなぼう ›" onPress={next} />
    </View>}
    {page === 'understand' && <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>🔍 まずは考え方を知ろう</Text>
      <Text style={styles.body}>{guide.introduction}</Text>
      {stage.gradeId === 'e1' && <View style={styles.dots} accessible accessibilityLabel="丸を一つずつ数えよう">
        {Array.from({ length: Math.min(10, stage.order < 3 ? 5 : 7) }, (_,i)=><Text key={i} style={styles.dot}>●</Text>)}
      </View>}
      <View style={styles.note}><Text style={styles.body}>{guide.keyPoint}</Text></View>
      <Action text="れいだいを みる ›" onPress={next} />
    </View>}
    {page === 'example' && <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>✏️ いっしょに解く例題</Text>
      <MathText value={example.question} style={styles.question}/>
      <Text style={styles.caption}>まず自分で考えてから、答えを見てみよう。</Text>
      <View style={styles.answer}><MathText value={'こたえ：' + example.answer} style={styles.answerText}/></View>
      <MathText value={example.explanation} style={styles.body}/>
      <Text style={styles.caption}>{guide.exampleTip}</Text>
      <Action text="じぶんで といてみよう ›" onPress={next}/>
    </View>}
    {page === 'quiz' && checking && <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>🌟 りかいチェック {checkIndex + 1} / 2</Text>
      <MathText value={checking.question} style={styles.question}/>
      {checking.type === 'choice' ? <View style={styles.choices}>{checking.choices?.map(option =>
        <Pressable key={option} disabled={right} accessibilityRole="button" accessibilityState={{ selected: input === option }}
          onPress={() => { setInput(option); setFeedback(''); }} style={[styles.option, input === option && styles.optionActive]}>
          <MathText style={styles.optionText} value={option}/></Pressable>)}</View> :
        <TextInput inputMode="decimal" style={styles.input} accessibilityLabel="こたえ" value={input} editable={!right}
          onChangeText={value => {setInput(value);setFeedback('');}} placeholder="こたえを 入力してね"/>}
      {!!feedback && <View style={[styles.note, !right && styles.wrong]}><Text style={styles.body}>{feedback}</Text></View>}
      {right ? <Action text={checkIndex === 1 ? '学習を かんりょうする ›' : 'つぎの かくにんへ ›'} onPress={goForward}/>
        : <Action text="こたえあわせ" onPress={check}/>}
    </View>}
    {page === 'finish' && <View style={styles.sheet}>
      <Text style={styles.celebration}>🏅</Text>
      <Text style={styles.sheetTitle}>学習かんりょう！</Text>
      <Text style={styles.body}>学んだことを つかって、ステージの問題にチャレンジしよう。</Text>
      <Action text="⚔️ ステージ問題へ" onPress={onPlay}/>
      <Pressable onPress={() => setPage('goal')}><Text style={styles.backText}>もういちど学ぶ</Text></Pressable>
    </View>}
    {completed && page !== 'finish' && <View style={styles.note}>
      <Text style={styles.body}>✓ この単元は学習ずみです。いつでも見直せます。</Text>
      <Action text="ステージ問題へ ›" onPress={onPlay}/>
    </View>}
  </View>;
}
function Action({text,onPress}:{text:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
    <Text style={styles.actionText}>{text}</Text></Pressable>;
}
const styles = StyleSheet.create({
  wrap:{gap:13},back:{minHeight:44,justifyContent:'center'},backText:{color:'#33577f',fontSize:15,fontWeight:'800',padding:8},
  banner:{backgroundColor:'#28345f',padding:20,borderRadius:19,gap:9},
  eyebrow:{color:'#ffda96',fontSize:13,fontWeight:'800'},title:{fontSize:27,color:'#fff4d3',fontWeight:'900'},
  bannerDetail:{color:'#dfebff',fontSize:14,lineHeight:22},meter:{flexDirection:'row',gap:5},
  meterBar:{height:8,backgroundColor:'#d2d5e4',borderRadius:20,flex:1},meterActive:{backgroundColor:'#38ab8c'},
  sheet:{backgroundColor:'#fffcf3',borderRadius:20,padding:20,gap:17,minHeight:290},
  sheetTitle:{color:'#2e3e70',fontSize:23,fontWeight:'900'},body:{fontSize:17,lineHeight:28,color:'#2d3e63'},
  note:{backgroundColor:'#e6f1f0',borderRadius:12,padding:14,gap:7},wrong:{backgroundColor:'#fce4e7'},
  dots:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:7,padding:10},
  dot:{fontSize:30,color:'#3576b9'},question:{fontSize:24,color:'#25335f',fontWeight:'900',lineHeight:36},
  caption:{color:'#67708a',fontSize:14,lineHeight:22},
  answer:{backgroundColor:'#f6edcf',padding:15,borderRadius:12},answerText:{fontSize:24,fontWeight:'900',color:'#40527c'},
  input:{borderWidth:2,borderColor:'#aaaacc',padding:16,borderRadius:13,backgroundColor:'#fff',fontSize:23,minHeight:56},
  choices:{gap:9},option:{padding:12,minHeight:50,backgroundColor:'#eff0fa',borderRadius:10,borderWidth:2,borderColor:'#c1c8dd'},
  optionActive:{borderColor:'#7966bc',backgroundColor:'#e6defa'},optionText:{fontSize:20,color:'#29365d',fontWeight:'800'},
  action:{backgroundColor:'#584a9c',padding:15,borderRadius:13,minHeight:52,justifyContent:'center',alignItems:'center'},
  actionText:{color:'#fff',fontSize:17,fontWeight:'900'},celebration:{fontSize:56,textAlign:'center'}
});
