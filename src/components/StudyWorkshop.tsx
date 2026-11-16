import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { canAccessFeature, type Entitlement } from '../domain/accessPlan';
import type { SkillId } from '../domain/curriculum';
import type { Progress } from '../domain/progress';
import { canPracticeSkill, diagnosisCandidates, practiceItems, skillEvidence, studySkillTitle, type PracticeItem } from '../domain/studyPractice';
import { MathText } from './MathText';

type Session = { purpose:'practice'|'diagnosis'; questions: PracticeItem[]; results:number[]; checked?:number };
export type SavePractice = (item:PracticeItem, answer:number) => Promise<boolean>;

export function StudyWorkshop({ access, progress, busy, error, onAnswer, onBack,onLiveStart }: {
  access:Entitlement; progress:Progress; busy:boolean; error:string; onAnswer:SavePractice; onBack:()=>void; onLiveStart?:(mode:'remediation'|'diagnosis',skills:SkillId[])=>void;
}) {
  const [session,setSession] = useState<Session>();
  const [answer,setAnswer] = useState('');
  const evidence = skillEvidence(progress);
  const enabled = canAccessFeature(access,'weakPointAnalysis');
  const item = session?.questions[session.results.length];
  const completed = session && session.results.length===session.questions.length;
  function start(skill: SkillId, purpose:Session['purpose'], difficulty:1|2) {
    if (!canAccessFeature(access,'remediation')) return;
    if (onLiveStart) { onLiveStart(purpose==='practice'?'remediation':'diagnosis',[skill]); return; }
    const questions = practiceItems(skill,difficulty,Date.now(),progress.attempts);
    if (!questions.length) return;
    setAnswer('');
    setSession({purpose,questions,results:[]});
  }
  async function submit() {
    if (!session || !item || busy || session.checked!==undefined) return;
    const value = answer.trim().normalize('NFKC').replaceAll('−','-');
    if (!/^[+-]?\d+$/.test(value)) return;
    const submitted = Number(value);
    if (!await onAnswer(item,submitted)) return;
    setSession({...session,checked:submitted});
  }
  return <View style={styles.layout}>
    <Button label="世界地図へ もどる" onPress={onBack} disabled={busy}/>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>苦手分析と克服練習</Text>
      {!enabled ? <Text style={styles.body}>プレミアムでは、解答履歴を使って弱点を確認し、基礎を確かめる問題や練習問題を選べます。</Text>
        : session ? <>
          {completed ? <>
            <Text accessibilityRole="header" style={styles.heading}>練習の結果</Text>
            <Text style={styles.body}>{session.questions.length}問中 {session.results.filter((value,i)=>value===session.questions[i].answer).length}問 正解</Text>
            {session.purpose==='diagnosis' && <Text style={styles.body}>この結果は前提となる技能を見直す目安です。元の誤答の原因が確定したわけではありません。</Text>}
            <Button label="分析にもどる" onPress={()=>setSession(undefined)}/>
          </> : item && <>
            <Text style={styles.body}>{session.purpose==='diagnosis'?'基礎をたしかめる':'克服練習'}　{session.results.length+1} / {session.questions.length}</Text>
            <MathText value={item.prompt} style={styles.heading}/>
            <TextInput style={styles.input} accessibilityLabel="練習の答え" placeholder="数字を入力" value={answer} onChangeText={setAnswer}
              editable={!busy && session.checked===undefined} onSubmitEditing={submit}/>
            {session.checked===undefined ? <Button label="練習のこたえあわせ" onPress={submit} disabled={busy || !/^[+-]?\d+$/.test(answer.trim().normalize('NFKC').replaceAll('−','-'))}/>
              : <>
                <Text style={styles.body}>{session.checked===item.answer?'正解！':'正しい答えは '+item.answer+' です。'}</Text>
                <MathText value={item.explanation} style={styles.body}/>
                <Button label={session.results.length+1===session.questions.length?'練習の結果をみる':'次の練習問題へ'}
                  onPress={()=>{setAnswer('');setSession({...session,checked:undefined,results:[...session.results,session.checked!]});}}/>
              </>}
          </>}
        </> : <>
          <Text style={styles.body}>直近10問を技能ごとに集計します。5問未満の技能は判定に使いません。</Text>
          {!evidence.length && <Text style={styles.body}>解答履歴がありません。まず冒険の問題を解きましょう。</Text>}
          {evidence.map(entry => <View key={entry.skillId} style={styles.row}>
            <Text accessibilityRole="header" style={styles.title}>{entry.title}</Text>
            <Text style={styles.body}>{entry.correct} / {entry.total}問 正解　{entry.status==='insufficient'?'データ不足':entry.status==='needs-practice'?'見直し候補':'定着の目安を満たしています'}</Text>
            {entry.earlierAccuracy!==undefined && <Text style={styles.body}>前の集計 {Math.round(entry.earlierAccuracy*100)}% → 直近 {Math.round(entry.accuracy*100)}%</Text>}
            {diagnosisCandidates(evidence,entry.skillId).map(candidate => <View key={candidate.skillId} style={styles.row}>
              <Text style={styles.body}>前提技能「{candidate.title}」を確認してみましょう。{candidate.evidence?.status==='needs-practice'?'履歴に誤答が多い技能です。':'判定に必要な解答がそろっていません。'}</Text>
              {canPracticeSkill(candidate.skillId) && <Button label={candidate.title+'を診断する'} onPress={()=>start(candidate.skillId,'diagnosis',1)}/>}
            </View>)}
            {canPracticeSkill(entry.skillId) && <Button label={studySkillTitle(entry.skillId)+'を練習する'}
              onPress={()=>start(entry.skillId,'practice',entry.accuracy>=0.8 ? 2 : 1)}/>}
          </View>)}
        </>}
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.body}>{error}</Text>}
    </View>
  </View>;
}

export function Button({ label, onPress, disabled }: { label:string; onPress:()=>void; disabled?:boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button,disabled && {opacity:0.5}]}>
    <Text style={styles.buttonLabel}>{label}</Text>
  </Pressable>;
}

export const styles = StyleSheet.create({
  layout:{gap:12},
  card:{backgroundColor:'#fffaf0',borderRadius:18,padding:16,gap:12},
  row:{backgroundColor:'#edf1f9',borderRadius:10,padding:10,gap:8},
  heading:{fontSize:22,color:'#273556',fontWeight:'900'},
  title:{fontSize:17,color:'#273556',fontWeight:'800'},
  body:{color:'#354667',fontSize:16,lineHeight:23},
  button:{minHeight:48,backgroundColor:'#43568e',padding:10,justifyContent:'center',alignItems:'center',borderRadius:10},
  buttonLabel:{fontWeight:'800',fontSize:16,color:'#fff'},
  input:{minHeight:52,backgroundColor:'#fff',borderColor:'#798cac',borderWidth:1,borderRadius:9,padding:8,fontSize:20,color:'#223456'},
});
