import { canAccessFeature, type Entitlement } from './accessPlan.ts';
import type { SkillId } from './curriculum.ts';
import type { Progress } from './progress.ts';
import { canPracticeSkill, practiceItems, savePracticeAnswer, skillEvidence, studySkillTitle, type PracticeItem } from './studyPractice.ts';
import { getWorldStage } from './worldProgress.ts';
import { worldIslands } from './worldCatalog.ts';

export type StudyMode = 'daily' | 'review';
export interface StudyPlan {
  date: string;
  questions: readonly PracticeItem[];
  answers: readonly number[];
  completedAt?: string;
}
type ReviewRecord = { dueAt: string; completedAt: string; consecutive: number };
export interface StudyRecords {
  daily?: StudyPlan;
  review?: StudyPlan;
  reviews?: Partial<Record<SkillId, ReviewRecord>>;
  dailyCompleted?: readonly string[];
  reviewHistory?: readonly { skill:SkillId; completedAt:string; correct:number; total:number }[];
}
const intervals = [1, 3, 7, 14, 30] as const;

function plusDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}
export function studyDate(date: Date): string {
  return [date.getFullYear(),date.getMonth()+1,date.getDate()].map(n=>String(n).padStart(2,'0')).join('-');
}
function orderedHistory(progress: Progress) {
  return progress.attempts.filter(item=>Number.isFinite(Date.parse(item.answeredAt)))
    .slice().sort((a,b)=>Date.parse(b.answeredAt)-Date.parse(a.answeredAt));
}
export function upcomingReviews(progress: Progress, now: Date) {
  const seen = new Set<SkillId>();
  return orderedHistory(progress).flatMap(attempt => {
    const skill=attempt.skillId;
    if (seen.has(skill) || !canPracticeSkill(skill)) return [];
    seen.add(skill);
    const record=progress.study?.reviews?.[skill];
    const dueAt = record?.dueAt ?? plusDays(new Date(attempt.answeredAt),1).toISOString();
    return [{skill, title:studySkillTitle(skill), dueAt, due:Date.parse(dueAt)<=now.getTime(), completedAt:record?.completedAt}];
  }).sort((a,b)=>a.dueAt.localeCompare(b.dueAt));
}

function getDailyQuestions(progress: Progress, now: Date) {
  const goodSkills = skillEvidence(progress).filter(entry=>canPracticeSkill(entry.skillId));
  const prioritized = [...new Set([
    ...upcomingReviews(progress,now).filter(entry=>entry.due).map(entry=>entry.skill),
    ...goodSkills.map(entry=>entry.skillId),
    ...orderedHistory(progress).map(attempt=>attempt.skillId).filter(canPracticeSkill),
    'e1.count' as const,
  ])].slice(0,3);
  const limit = 15;
  const started = Number(studyDate(now).replaceAll('-',''));
  const perSkill = prioritized.map(skill => {
    const evidence = goodSkills.find(item=>item.skillId===skill);
    const level = evidence && evidence.total >=5 && evidence.accuracy>=0.8 ? 2 : 1;
    return [...practiceItems(skill,level,started,progress.attempts,limit),
      ...practiceItems(skill,level===1?2:1,started,progress.attempts,limit)];
  });
  const items: PracticeItem[] = [];
  for (let i=0; i<limit && items.length<limit; i++) {
    for (const pool of perSkill) {
      const item=pool[i];
      if (item && !items.some(q=>q.prompt===item.prompt)) items.push(item);
      if (items.length===limit) break;
    }
  }
  return items;
}

function allowed(access:Entitlement,mode:StudyMode): boolean {
  return canAccessFeature(access,mode==='daily'?'personalizedPractice':'spacedReview');
}

export function openStudyPlan(access:Entitlement, progress:Progress, mode:StudyMode, now:Date): Progress {
  if (!allowed(access,mode)) return progress;
  const prior = progress.study?.[mode];
  const date = studyDate(now);
  if (prior && (prior.date===date && mode==='daily' || mode==='review' && !prior.completedAt)) return progress;
  const due = mode==='review' ? upcomingReviews(progress,now).find(item=>item.due) : undefined;
  const questions = mode==='daily' ? getDailyQuestions(progress,now)
    : due ? practiceItems(due.skill,1,now.getTime(),progress.attempts) : [];
  if (!questions.length) return progress;
  return {...progress,study:{...progress.study,[mode]:{date,questions,answers:[]}}};
}

export function answerStudyPlan(access:Entitlement, progress:Progress, mode:StudyMode, itemId:string, answer:number, now:Date): Progress {
  if (!allowed(access,mode) || !Number.isSafeInteger(answer)) return progress;
  const plan = progress.study?.[mode];
  const item = plan?.questions[plan.answers.length];
  if (!plan || !item || item.id!==itemId || plan.completedAt) return progress;
  const answeredAt = now.toISOString();
  const answers = [...plan.answers,answer];
  const completed = answers.length===plan.questions.length;
  const study: StudyRecords = {...progress.study,[mode]:{...plan,answers,...(completed?{completedAt:answeredAt}:{})}};
  if (completed && mode==='daily') study.dailyCompleted = [...new Set([...(study.dailyCompleted ?? []),plan.date])];
  if (completed && mode==='review') {
    const skill=item.skillId;
    const correct=answers.filter((value,i)=>value===plan.questions[i].answer).length;
    const prior=study.reviews?.[skill]?.consecutive ?? 0;
    const consecutive=correct/answers.length>=0.8 ? Math.min(prior+1,intervals.length) : 0;
    const days=intervals[Math.max(0,consecutive-1)];
    study.reviews={...study.reviews,[skill]:{consecutive,dueAt:plusDays(now,days).toISOString(),completedAt:answeredAt}};
    study.reviewHistory=[...(study.reviewHistory ?? []),{skill,completedAt:answeredAt,correct,total:answers.length}];
  }
  return {...savePracticeAnswer(access,progress,item,answer,answeredAt),study};
}

export interface ReportRow {
  id: string;
  title: string;
  attempted: number;
  correct: number;
  previousAttempted: number;
  previousCorrect: number;
  cleared: number;
  totalStages: number;
}
export function growthReport(progress:Progress,now:Date) {
  const newWindow = plusDays(now,-14).getTime();
  const oldWindow = plusDays(now,-28).getTime();
  const grades = new Map<string, ReportRow>();
  const units = new Map<string, ReportRow>();
  const row = (id:string,title:string): ReportRow=>({id,title,attempted:0,correct:0,previousAttempted:0,previousCorrect:0,cleared:0,totalStages:0});
  const add = (entry:ReportRow, time:number, correct:boolean) => {
    if (time>now.getTime() || time<oldWindow) return;
    if (time>=newWindow) { entry.attempted++; entry.correct+=Number(correct); }
    else { entry.previousAttempted++; entry.previousCorrect+=Number(correct); }
  };
  const total=row('all','すべての学年');
  const activeDays=new Set<string>();
  let practiceAnswers=0;
  for (const grade of worldIslands) {
    const current=row(grade.id,grade.title);
    grades.set(grade.id,current);
    for (const stage of grade.stages.filter(stage=>stage.gradeId!=='sage' && stage.kind==='normal')) {
      const unit = grade.units[stage.unitIndex];
      const id = grade.id+'.'+unit.code;
      const group=units.get(id) ?? row(id,unit.title);
      units.set(id,group);
      const cleared=Number(Boolean(progress.stages[stage.id]?.clearedAt));
      for (const item of [total,current,group]) { item.totalStages++; item.cleared+=cleared; }
    }
  }
  for (const attempt of orderedHistory(progress)) {
    const at = new Date(attempt.answeredAt);
    add(total,at.getTime(),attempt.correct);
    if (at.getTime()>=newWindow && at<=now) {
      activeDays.add(studyDate(at));
      if (attempt.problemId.startsWith('study:')) practiceAnswers++;
    }
    const stage = getWorldStage(attempt.stageId);
    if (!stage) continue;
    const island=worldIslands.find(grade=>grade.id===stage.gradeId);
    const current=grades.get(stage.gradeId);
    const unit=island && stage.kind!=='secret' ? units.get(island.id+'.'+island.units[stage.unitIndex].code) : undefined;
    if (current) add(current,at.getTime(),attempt.correct);
    if (unit) add(unit,at.getTime(),attempt.correct);
  }
  const filter = (r:ReportRow)=>r.attempted>0 || r.previousAttempted>0 || r.cleared>0;
  const reviewSessions=(progress.study?.reviewHistory ?? []).filter(entry=>{
    const time=Date.parse(entry.completedAt);
    return time>=newWindow && time<=now.getTime();
  }).length;
  return {total,activeDays:activeDays.size,practiceAnswers,reviewSessions,grades:[...grades.values()].filter(filter),units:[...units.values()].filter(filter),
    lessons:Object.values(progress.lessons ?? {}).filter(lesson=>lesson?.completedAt).length,
    dailyDays:(progress.study?.dailyCompleted ?? []).filter(date=>date>=studyDate(plusDays(now,-13)) && date<=studyDate(now)).length};
}
