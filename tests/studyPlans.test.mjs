import assert from 'node:assert/strict';
import test from 'node:test';
import {decodeProgress, emptyProgress} from '../src/domain/progress.ts';
import {freeAccess} from '../src/domain/accessPlan.ts';
import {answerStudyPlan,growthReport,openStudyPlan,studyDate,upcomingReviews} from '../src/domain/studyPlans.ts';
import {practiceItems,savePracticeAnswer} from '../src/domain/studyPractice.ts';

const premium={plan:'premium',verifiedUntil:Infinity};
const now=new Date('2026-11-16T08:00:00Z');
const days=(n)=>new Date(now.getTime()+n*86_400_000);
const restore=state=>decodeProgress(JSON.stringify(state));

test('毎日の15問は一日の途中から再開でき、完了を重複記録しない',()=>{
  assert.equal(openStudyPlan(freeAccess,emptyProgress,'daily',now),emptyProgress);
  let progress=openStudyPlan(premium,emptyProgress,'daily',now);
  const saved=progress.study.daily;
  assert.equal(saved.questions.length,15);
  assert.equal(new Set(saved.questions.map(item=>item.prompt)).size,15);
  const item=saved.questions[0];
  assert.equal(answerStudyPlan(freeAccess,progress,'daily',item.id,item.answer,now),progress);
  progress=answerStudyPlan(premium,progress,'daily',item.id,item.answer,now);
  progress=restore(progress);
  assert.deepEqual(progress.study.daily.questions,saved.questions);
  assert.equal(progress.study.daily.answers.length,1);
  assert.equal(openStudyPlan(premium,progress,'daily',now),progress);
  assert.equal(answerStudyPlan(premium,progress,'daily',item.id,item.answer,now),progress);
  for(const question of saved.questions.slice(1)) progress=answerStudyPlan(premium,progress,'daily',question.id,question.answer,now);
  assert.equal(progress.study.daily.completedAt,now.toISOString());
  assert.deepEqual(progress.study.dailyCompleted,[studyDate(now)]);
  const next=openStudyPlan(premium,progress,'daily',days(1));
  assert.equal(next.study.daily.answers.length,0);
  assert.deepEqual(next.study.dailyCompleted,[studyDate(now)]);
  assert.equal(progress.attempts.length,15);
  assert.deepEqual(progress.stages,{});
});

test('定期復習は履歴から期限を出し、正答率で次の間隔を変える',()=>{
  const item=practiceItems('j1.signed',1,10,[])[0];
  let progress=savePracticeAnswer(premium,emptyProgress,item,item.answer,now.toISOString());
  assert.equal(upcomingReviews(progress,now)[0].due,false);
  assert.equal(openStudyPlan(premium,progress,'review',now),progress);
  assert.equal(upcomingReviews(progress,days(1))[0].due,true);
  const finish=(state,date,correct)=>{
    let working=openStudyPlan(premium,state,'review',date);
    for(const question of working.study.review.questions) working=answerStudyPlan(premium,working,'review',question.id,question.answer+Number(!correct),date);
    return restore(working);
  };
  progress=finish(progress,days(1),true);
  assert.equal(upcomingReviews(progress,days(1))[0].completedAt,days(1).toISOString());
  assert.equal(upcomingReviews(progress,days(2))[0].due,true);
  progress=finish(progress,days(2),true);
  assert.equal(upcomingReviews(progress,days(4))[0].due,false);
  assert.equal(upcomingReviews(progress,days(5))[0].due,true);
  progress=finish(progress,days(5),false);
  assert.equal(upcomingReviews(progress,days(6))[0].due,true);
  assert.deepEqual(progress.study.reviewHistory.map(entry=>entry.correct),[5,5,0]);
});

test('成長レポートが解答・クリア・該当期間のデータなしを区別する',()=>{
  const calculus=practiceItems('h2.calculus',1,1,[])[0];
  let progress=savePracticeAnswer(premium,emptyProgress,calculus,calculus.answer+1,days(-20).toISOString());
  progress=savePracticeAnswer(premium,progress,calculus,calculus.answer,days(-1).toISOString());
  progress={...progress,stages:{[calculus.stageId]:{clearedAt:days(-1).toISOString()}}};
  const report=growthReport(restore(progress),now);
  assert.equal(report.total.attempted,1);
  assert.equal(report.total.previousAttempted,1);
  assert.equal(report.total.correct,1);
  assert.equal(report.total.previousCorrect,0);
  assert.equal(report.practiceAnswers,1);
  assert.equal(report.grades[0].id,'h2');
  assert.equal(report.units[0].id,'h2.derivative2');
  assert.equal(report.units[0].cleared,1);
  assert.equal(growthReport(emptyProgress,now).total.attempted,0);
});
