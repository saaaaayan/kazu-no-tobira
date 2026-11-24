import { gradeStarterLessons } from './gradeStarterLessons.ts';
import type { GradeId } from './curriculum.ts';
import type { StageId780 } from './worldCatalog.ts';

export type PictureName = 'bell' | 'berry' | 'star';
export type LessonDiagram =
  | { kind: 'objects'; picture: PictureName; count: number }
  | { kind: 'pairs'; left: number; right: number }
  | { kind: 'path'; first: number; last: number; hidden?: number; start?: number; end?: number }
  | { kind: 'table'; cells: readonly (readonly string[])[] };
export type LessonCheck = { id: string; prompt: string; choices: readonly number[]; retryHint: string; explanation: string } &
  ({ diagram: LessonDiagram; answer?: never } | { diagram?: LessonDiagram; answer: number });
type LessonPage = { title: string; text: string; diagram?: LessonDiagram; action?: 'count' | 'pair' };
type WorkedExample = { title: string; text: string; diagram: LessonDiagram; reveal: readonly string[] };
export type UnitId = `${GradeId}.${string}`;
export type UnitLesson = {
  id: UnitId;
  grade: GradeId;
  title: string;
  goals: readonly string[];
  prerequisiteIds: readonly UnitId[];
  readiness: string;
  summary: string;
  completionMessage: string;
  steps: readonly LessonPage[];
  workedExamples: readonly WorkedExample[];
  checks: readonly LessonCheck[];
  linkedStageIds: readonly StageId780[];
};

export const countToTen: UnitLesson = {
  id: 'e1.number-order',
  grade: 'e1',
  title: '10までの かず',
  goals: ['ものを ひとつずつ かぞえ、0から10までの すうじで あらわす。', 'かずの ならびを たどり、どちらが おおいか くらべる。'],
  prerequisiteIds: [],
  readiness: 'はじめてでも だいじょうぶ。えを さわりながら いっしょに かぞえよう。',
  summary: 'ものを かぞえて、かずの みちを たどろう',
  completionMessage: 'かずの みちを おぼえたね。つぎは ぼうけんに でかけよう！',
  steps: [
    { title: 'すずを かぞえよう', text: 'オイラーが ぼうけんに もっていく すずだよ。ひとつずつ タッチしよう。さいごに となえた かずが、すずの ぜんぶの かずだよ。',
      diagram: { kind: 'objects', picture: 'bell', count: 6 }, action: 'count' },
    { title: 'かずを くらべよう', text: 'おやつを ふたりで くらべよう。うえと したで ひとつずつ くみに すると、のこった ほうが おおいよ。',
      diagram: { kind: 'pairs', left: 4, right: 6 }, action: 'pair' },
    { title: 'かずの みちを たどろう', text: 'みぎへ ひとつ すすむと、かずが 1おおきく なるよ。ひだりへ ひとつ もどると、1ちいさく なるよ。',
      diagram: { kind: 'path', first: 0, last: 10 } },
  ],
  workedExamples: [
    { title: 'れいだい：からっぽの かご', text: 'かごに きのみは なんこ あるかな？',
      diagram: { kind: 'objects', picture: 'berry', count: 0 },
      reveal: ['かごを よく みよう。きのみは ひとつも ないね。', 'ひとつも ないときは、すうじの 0で あらわすよ。こたえは 0こ。'] },
    { title: 'れいだい：かずの みち', text: '4から 3つ すすむと、どこに つくかな？',
      diagram: { kind: 'path', first: 4, last: 8, start: 4, end: 7 },
      reveal: ['4が スタート。4は すすんだ 1かいめに いれないよ。', 'となりへ 1つ うごくたびに かぞえるよ。5で1つ、6で2つ、7で3つ。', '3つ すすむと 7に つくよ。もどる ときは ぎゃくむきに かぞえよう。'] },
  ],
  checks: [
    { id: 'count', prompt: 'ほしは ぜんぶで なんこ？', diagram: { kind: 'objects', picture: 'star', count: 7 }, choices: [6, 7, 8],
      retryHint: 'ひだりから ひとつずつ。おなじ ほしを 2かい かぞえないように しよう。', explanation: '1から ひとつずつ かぞえると、さいごは 7。ほしは 7こだよ。' },
    { id: 'zero', prompt: 'かごに きのみは なんこ？', diagram: { kind: 'objects', picture: 'berry', count: 0 }, choices: [1, 0, 2],
      retryHint: 'かごの なかを よく みよう。ひとつでも あるかな？', explanation: 'ひとつも ないときは 0。きのみは 0こだね。' },
    { id: 'order', prompt: '？に はいる かずは どれ？', diagram: { kind: 'path', first: 7, last: 10, hidden: 9 }, choices: [10, 7, 9],
      retryHint: '8の つぎ、10の ひとつ まえを かんがえて みよう。', explanation: '7、8、9、10と じゅんに ならぶよ。8と10の あいだは 9だね。' },
    { id: 'compare', prompt: 'うえと した。きのみが おおい ほうは なんこ？', diagram: { kind: 'pairs', left: 5, right: 8 }, choices: [8, 5, 3],
      retryHint: 'うえと したを ひとつずつ くみに しよう。ペアに なれない きのみが ある ほうが おおいよ。', explanation: 'したは 8こ。5くみを つくると、したに まだ のこるね。' },
  ],
  linkedStageIds: ['e1.n04','e1.n05'],
};

export const unitLessons: readonly UnitLesson[] = [countToTen, ...gradeStarterLessons];
export const lessonForStage = (id: string) => unitLessons.find(lesson => lesson.linkedStageIds.some(stageId => stageId === id));

// Planned dependencies are curriculum metadata, not locks on unimplemented lessons.
export const elementaryLessonPlan = [
  { id: countToTen.id, prerequisiteIds: countToTen.prerequisiteIds },
  { id: 'e1.number-parts', prerequisiteIds: [countToTen.id] },
  { id: 'e1.ordinal', prerequisiteIds: [countToTen.id] },
  { id: 'e1.add-small', prerequisiteIds: ['e1.number-parts', 'e1.ordinal'] },
  { id: 'e1.sub-small', prerequisiteIds: ['e1.add-small'] },
] satisfies readonly { id: UnitId; prerequisiteIds: readonly UnitId[] }[];

export const lessonCheckStart = (lesson: UnitLesson) => 1 + lesson.steps.length + lesson.workedExamples.length;
export const lessonEnd = (lesson: UnitLesson) => lessonCheckStart(lesson) + lesson.checks.length;
export const newLessonProgress = (): LessonProgress => ({ page: 0, checks: {} });
export type LessonCheckResult = { attempts: number; lastAnswer: number; correct: boolean };
export type LessonProgress = {
  page: number;
  checks: Record<string, LessonCheckResult>;
  completedAt?: string;
};

export function expectedLessonAnswer(question: LessonCheck): number {
  if (question.answer !== undefined) return question.answer;
  const diagram = question.diagram;
  switch (diagram.kind) {
    case 'objects': return diagram.count;
    case 'pairs': return Math.max(diagram.left, diagram.right);
    case 'path': if (diagram.hidden !== undefined) return diagram.hidden;
  }
  throw new Error('No answer configured for ' + question.id);
}

export function answerLessonCheck(lesson: UnitLesson, progress: LessonProgress, answer: number, now: string): LessonProgress {
  const question = lesson.checks[progress.page - lessonCheckStart(lesson)];
  if (!question || !question.choices.includes(answer) || progress.checks[question.id]?.correct) return progress;
  const correct = expectedLessonAnswer(question) === answer;
  const checks = { ...progress.checks, [question.id]: { attempts: (progress.checks[question.id]?.attempts ?? 0) + 1, lastAnswer: answer, correct } };
  const completedAt = progress.completedAt ?? (lesson.checks.every(check => checks[check.id]?.correct) ? now : undefined);
  return { ...progress, checks, ...(completedAt ? { completedAt } : {}) };
}

export function advanceLesson(lesson: UnitLesson, progress: LessonProgress): LessonProgress {
  const check = lesson.checks[progress.page - lessonCheckStart(lesson)];
  if (progress.page >= lessonEnd(lesson) || (check && !progress.checks[check.id]?.correct)) return progress;
  return { ...progress, page: progress.page + 1 };
}

export function lessonStatus(progress?: LessonProgress) {
  return progress?.completedAt ? 'completed' : progress ? 'in-progress' : 'not-started';
}
