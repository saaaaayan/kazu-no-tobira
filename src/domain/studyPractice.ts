import { recordAttempt, type Attempt, type Progress } from './progress.ts';
import type { StageId } from './curriculum.ts';
import { getWorldStage } from './worldProgress.ts';
import type { SkillId } from './curriculum.ts';
import { canAccessFeature, type Entitlement } from './accessPlan.ts';

const minimumEvidence = 5;
const weakThreshold = 0.7;

export interface SkillEvidence {
  skillId: SkillId;
  title: string;
  correct: number;
  total: number;
  accuracy: number;
  earlierAccuracy?: number;
  status: 'insufficient' | 'needs-practice' | 'on-track';
}

const labels: Partial<Record<SkillId, string>> = {
  'e1.count':'数の順序', 'e1.addition':'足し算', 'e1.subtraction':'引き算', 'e2.place':'位取り',
  'j1.signed':'正負の数の加法', 'j2.expression':'文字式の計算',
  'h1.factor':'かっこの展開', 'h2.calculus':'べき関数の微分',
};

const prerequisites: Partial<Record<SkillId, readonly SkillId[]>> = {
  'e1.addition':['e1.count'],
  'e1.subtraction':['e1.addition','e1.count'],
  'e2.place':['e1.count'],
  'j1.signed':['e1.subtraction','e1.addition'],
  'j2.expression':['j1.signed'],
  'h1.factor':['j2.expression'],
  'h2.calculus':['j2.expression'],
};

export function studySkillTitle(skill: SkillId): string {
  return labels[skill] ?? skill;
}

const accuracy = (attempts: readonly Attempt[]) => attempts.filter(item => item.correct).length / attempts.length;

export function skillEvidence(progress: Progress): SkillEvidence[] {
  const groups = new Map<SkillId, Attempt[]>();
  for (const attempt of progress.attempts) {
    if (!Number.isFinite(Date.parse(attempt.answeredAt))) continue;
    const group = groups.get(attempt.skillId) ?? [];
    group.push(attempt);
    groups.set(attempt.skillId, group);
  }
  return [...groups].map(([skillId, attempts]): SkillEvidence => {
    attempts.sort((a,b)=>Date.parse(a.answeredAt)-Date.parse(b.answeredAt));
    const recent = attempts.slice(-10);
    const earlier = attempts.slice(-20,-10);
    const rate = accuracy(recent);
    const stage = getWorldStage(recent[recent.length-1].stageId);
    return {
      skillId, title: labels[skillId] ?? stage?.subtitle ?? skillId, total: recent.length,
      correct: recent.filter(item=>item.correct).length, accuracy:rate,
      earlierAccuracy: earlier.length >= minimumEvidence ? accuracy(earlier) : undefined,
      status: recent.length < minimumEvidence ? 'insufficient' : rate < weakThreshold ? 'needs-practice' : 'on-track',
    };
  }).sort((a,b) => Number(b.status==='needs-practice')-Number(a.status==='needs-practice') || a.accuracy-b.accuracy);
}

export function diagnosisCandidates(evidence: readonly SkillEvidence[], skill: SkillId) {
  if (evidence.find(item=>item.skillId===skill)?.status !== 'needs-practice') return [];
  return (prerequisites[skill] ?? []).map(id => ({
    skillId:id, title:studySkillTitle(id), evidence:evidence.find(item=>item.skillId===id),
  })).filter(item=>item.evidence?.status !== 'on-track');
}

export type PracticeItem = { id: string; skillId: SkillId; stageId: StageId; prompt: string; answer: number; explanation: string; difficulty: 1 | 2 };

type Template = { stageId: StageId; make: (a: number, b: number, difficulty: 1 | 2) => { prompt:string; answer:number; explanation:string } | undefined };
const templates: Partial<Record<SkillId, Template>> = {
  'e1.count': { stageId:'e1.n04', make:(a,b,d) => {
    const move = d === 1 ? 1 : b;
    const answer = d === 1 ? a+move : a-move;
    if (answer < 1 || answer > 10) return;
    return { prompt: d===1 ? a+'の ひとつ あとの かずは？' : a+'から '+move+'つ もどると どこ？', answer,
      explanation: 'かずの みちを '+(d===1 ? 'みぎに' : 'ひだりに')+' '+move+'つ うごくと '+answer+'。' };
  }},
  'e1.addition': { stageId:'e1.forest', make:(a,b,d) => {
    if (a+b>9 || (d===1 ? a+b>5 : a+b<6) || a>b) return;
    return {prompt:a+'＋'+b+'＝？',answer:a+b,explanation:a+'こ と '+b+'こを あわせると '+(a+b)+'こ。'};
  }},
  'e1.subtraction': { stageId:'e1.n11', make:(a,b,d) => {
    if (b>a || (d===1 ? a>5 : a<6)) return;
    return {prompt:a+'−'+b+'＝？',answer:a-b,explanation:a+'こ から '+b+'こを とると '+(a-b)+'こ。'};
  }},
  'e2.place': { stageId:'e2.n01', make:(a,b,d) => {
    const value=(d===1?0:100) + 10*a+b;
    return {prompt:value+'の 十の位の 数字は？',answer:a,explanation:'右から2番目が十の位。10のまとまりが '+a+'こ。'};
  }},
  'j1.signed': { stageId:'j1.n01', make:(a,b,d) => {
    const right=d===1?b:-b;
    return {prompt:'(−'+a+')＋('+right+')＝？',answer:-a+right,explanation:'−'+a+'から数直線を'+(d===1?'右':'左')+'へ'+b+'進むと '+(-a+right)+'。'};
  }},
  'j2.expression': { stageId:'j2.n01', make:(a,b,d) => {
    const right=d===1?b:-b;
    return {prompt:a+'x'+(right<0?'−':'＋')+b+'x を整理したときの x の係数は？',answer:a+right,
      explanation:'文字が同じなので係数を足す。'+a+'＋('+right+')＝'+(a+right)+'。'};
  }},
  'h1.factor': { stageId:'h1.n01', make:(a,b,d) => {
    const right=d===1?b:-b;
    return {prompt:'(x＋'+a+')(x'+(right<0?'−':'＋')+b+') を展開したときの x の係数は？',answer:a+right,
      explanation:'一次の項は '+a+'x と '+right+'x。係数の和は '+(a+right)+'。'};
  }},
  'h2.calculus': { stageId:'h2.n26', make:(a,b,d) => {
    const power=d===1?2:3;
    const answer=a*power*b**(power-1);
    return {prompt:'f(x)＝'+a+'x^'+power+' のとき、f\'('+b+') を求めよ。',answer,
      explanation:'べき乗の微分より f\'(x)＝'+(a*power)+'x^'+(power-1)+'。x＝'+b+' を代入すると '+answer+'。'};
  }},
};

export function canPracticeSkill(skill: SkillId): boolean { return Boolean(templates[skill]); }

export function practiceItems(skill: SkillId, difficulty: 1 | 2, seed: number, history: readonly Attempt[], limit = 5): PracticeItem[] {
  const template = templates[skill];
  if (!template) return [];
  const pool = new Map<string, PracticeItem>();
  for (let a=1;a<=9;a++) for (let b=1;b<=9;b++) {
    const item = template.make(a,b,difficulty);
    if (item && !pool.has(item.prompt)) pool.set(item.prompt,{
      ...item, id:'study:'+skill+':'+difficulty+':'+a+':'+b, skillId:skill, stageId:template.stageId, difficulty,
    });
  }
  const candidates = [...pool.values()];
  const offset = Math.abs(Math.trunc(seed)) % candidates.length;
  const seen = new Map(history.map((attempt,index)=>[attempt.problemId,index]));
  return [...candidates.slice(offset),...candidates.slice(0,offset)]
    .sort((a,b)=>(seen.get(a.id) ?? -1)-(seen.get(b.id) ?? -1)).slice(0,limit);
}

export function savePracticeAnswer(access: Entitlement, progress: Progress, item: PracticeItem, answer: number, now: string): Progress {
  if (!canAccessFeature(access,'remediation') || !Number.isFinite(answer)) return progress;
  return recordAttempt(progress, {
    problemId:item.id, stageId:item.stageId, skillId:item.skillId,
    submitted:answer, correct:answer===item.answer, answeredAt:now,
  }, false);
}
