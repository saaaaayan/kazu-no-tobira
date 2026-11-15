import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { canAccessFeature, type Entitlement } from '../domain/accessPlan';
import { skillEvidence } from '../domain/studyPractice';
import type { Progress } from '../domain/progress';
import { answerStudyPlan, growthReport, openStudyPlan, studyDate, upcomingReviews, type ReportRow, type StudyMode } from '../domain/studyPlans';
import { MathText } from './MathText';
import { Button, styles } from './StudyWorkshop';

export type UpdateStudy = (update:(previous:Progress)=>Progress) => Promise<boolean>;

export function StudyPlanner({ access, progress, busy, error, onUpdate, onBack }: {
  access:Entitlement; progress:Progress; busy:boolean; error:string; onUpdate:UpdateStudy; onBack:()=>void;
}) {
  const [view,setView]=useState<StudyMode|'report'>();
  const [answer,setAnswer]=useState('');
  const [last,setLast]=useState<{answer:number; correct:number; explanation:string}>();
  const now=new Date();
  const reviews=upcomingReviews(progress,now);
  const canDaily=canAccessFeature(access,'personalizedPractice');
  const canReview=canAccessFeature(access,'spacedReview');
  const canReport=canAccessFeature(access,'progressReports');
  const daily=progress.study?.daily?.date===studyDate(now) ? progress.study.daily : undefined;
  const review=progress.study?.review;
  const hasDue=reviews.some(entry=>entry.due);
  const plan = view==='daily' ? daily : view==='review' ? review : undefined;
  const question=plan?.questions[plan.answers.length];
  const parsed=answer.trim().normalize('NFKC').replaceAll('−','-');

  async function start(mode:StudyMode) {
    if (busy || !(mode==='daily'?canDaily:canReview)) return;
    setAnswer('');
    setLast(undefined);
    const exists = mode==='daily' ? Boolean(daily) : Boolean(review && !review.completedAt);
    if (exists || await onUpdate(previous=>openStudyPlan(access,previous,mode,new Date()))) setView(mode);
  }

  async function submit() {
    if (busy || !question || (view!=='daily' && view!=='review') || !/^[+-]?\d+$/.test(parsed)) return;
    const value=Number(parsed);
    if (await onUpdate(previous=>answerStudyPlan(access,previous,view,question.id,value,new Date()))) {
      setLast({answer:value,correct:question.answer,explanation:question.explanation});
      setAnswer('');
    }
  }

  return <View style={styles.layout}>
    <Button label="まなびの広場へ もどる" onPress={onBack} disabled={busy}/>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>個別学習・復習・成長レポート</Text>
      {(!canDaily && !canReview && !canReport) ? <Text style={styles.body}>個別学習、復習日程、保護者向けの成長レポートはプレミアムで利用できます。</Text>
        : view==='report' && canReport ? <Report progress={progress} now={now}/>
        : view && plan ? <>
          <Text accessibilityRole="header" style={styles.title}>{view==='daily'?'毎日の学習（15分目安）':'定期復習'}</Text>
          {last && <View style={styles.row}>
            <Text style={styles.body}>{last.answer===last.correct?'正解！':'正しい答えは '+last.correct+' です。'}</Text>
            <MathText value={last.explanation} style={styles.body}/>
            {question && <Button label="次の問題へ" onPress={()=>setLast(undefined)}/>}
          </View>}
          {plan.completedAt ? <View style={styles.row}>
            <Text style={styles.title}>{view==='daily'?'今日の目標を達成！':'復習を完了しました'}</Text>
            <Text style={styles.body}>{plan.answers.filter((value,i)=>value===plan.questions[i].answer).length} / {plan.questions.length}問 正解</Text>
          </View> : question && !last && <>
            <Text style={styles.body}>{plan.answers.length+1} / {plan.questions.length}問</Text>
            <MathText value={question.prompt} style={styles.title}/>
            <TextInput accessibilityLabel="個別学習の答え" style={styles.input} value={answer} editable={!busy}
              placeholder="数字を入力" onChangeText={setAnswer} onSubmitEditing={submit}/>
            <Button label="こたえあわせ" onPress={submit} disabled={busy || !/^[+-]?\d+$/.test(parsed)}/>
          </>}
        </> : <>
          {canDaily && <Button label={daily?.completedAt?'今日の学習結果':daily?'今日の学習を再開':'毎日の学習を始める（15分目安）'} onPress={()=>start('daily')} disabled={busy}/>}
          {canReview && <>
            <Text style={styles.title}>定期復習</Text>
            {!reviews.length && <Text style={styles.body}>対象の技能に解答すると、次の復習日が決まります。</Text>}
            {reviews.map(entry=><Text key={entry.skill} style={styles.body}>{entry.title}　{entry.due?'復習できる日になりました':'次回 '+studyDate(new Date(entry.dueAt))}{entry.completedAt?'　前回 '+studyDate(new Date(entry.completedAt)):''}</Text>)}
            {(hasDue || !!review && !review.completedAt) && <Button label={review && !review.completedAt?'復習を再開':'期限の来た復習を始める'} onPress={()=>start('review')} disabled={busy}/>}
          </>}
          {canReport && <Button label="保護者向け成長レポート" onPress={()=>setView('report')}/>}
        </>}
      {view && <Button label="学習計画にもどる" onPress={()=>{setView(undefined);setLast(undefined);}} disabled={busy}/>}
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.body}>{error}</Text>}
    </View>
  </View>;
}

function Report({progress,now}:{progress:Progress; now:Date}) {
  const report=growthReport(progress,now);
  const weak = skillEvidence(progress).filter(item=>item.status==='needs-practice');
  const period=(correct:number,total:number)=>total?Math.round(correct*100/total)+'%（'+correct+'/'+total+'問）':'解答データなし';
  const line=(row:ReportRow)=><View key={row.id} style={styles.row}>
    <Text style={styles.title}>{row.title}</Text>
    <Text style={styles.body}>直近14日 {period(row.correct,row.attempted)}　その前の14日 {period(row.previousCorrect,row.previousAttempted)}</Text>
    {row.totalStages>0 && <Text style={styles.body}>通常ステージ {row.cleared} / {row.totalStages}地点 クリア</Text>}
  </View>;
  return <>
    <Text accessibilityRole="header" style={styles.heading}>保護者向け成長レポート</Text>
    {line(report.total)}
    <Text style={styles.body}>直近14日の学習日数 {report.activeDays}日、毎日の学習を完了 {report.dailyDays}日。教材完了は累計{report.lessons}件。</Text>
    <Text style={styles.body}>直近14日で練習 {report.practiceAnswers}問、定期復習 {report.reviewSessions}回。</Text>
    {!!report.grades.length && <Text style={styles.title}>学年別</Text>}
    {report.grades.map(line)}
    {!!report.units.length && <Text style={styles.title}>単元別</Text>}
    {report.units.map(row=>line({...row,title:row.id.split('.')[0].replace(/^e/,'小').replace(/^j/,'中').replace(/^h/,'高')+' '+row.title}))}
    {!!weak.length && <Text style={styles.title}>見直し候補</Text>}
    {weak.map(item=><Text key={item.skillId} style={styles.body}>{item.title}　{period(item.correct,item.total)}{item.earlierAccuracy!==undefined?'（前の集計 '+Math.round(item.earlierAccuracy*100)+'%）':''}</Text>)}
    <Text style={styles.body}>正答率は解答回数に基づきます。直近と前の期間で、解いた問題の難しさが異なる場合があります。</Text>
  </>;
}
