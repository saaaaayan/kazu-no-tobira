/** Owner-supplied private drafts. This module contains NO curriculum answers or private data. */
export type DraftDiagram = {
  kind: string;
  rows?: {tokens: string[]; label?: string}[];
  spokenText?: string;
  fallbackKana?: string;
  sourceNumeral?: string;
  emptyContainer?: {kind?: string};
  containers?: {id: string; tokens: string[]; kind?: string}[];
  pictureCards?: {id: string; rows: {tokens: string[]}[]}[];
  numberCards?: {id: string; text: string}[];
};
export type DraftQuestion = {
  id: string;
  question: string;
  prompt?: string;
  choices?: string[];
  answer: string | Record<string, string>;
  hints: string[];
  explanation: string;
  detailedExplanation?: string;
  steps?: {title: string; body: string}[];
  diagram?: DraftDiagram;
  activity?: {kind?: string};
  visualPlan?: {before?: {tokens?: string[]}; after?: {tokens?: string[]}};
};
export type PrivateDraftStage = {
  stageId: string;
  title: string;
  reviewStatus: 'draft';
  uiReady: false;
  uiGap?: string;
  questions: DraftQuestion[];
};
export type PrivateDraftPack = {
  schema: 'kazu-private-preschool-review-v1';
  reviewOnly: true;
  totalQuestions: number;
  stages: PrivateDraftStage[];
};

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function text(value: unknown, max = 2000): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}
const inStage = (id: string) => /^preschool\.(?:n(?:0[1-9]|[1-4][0-9]|50)|x(?:0[1-9]|10)|s0[1-5])$/.test(id);

/** Validate the untrusted local file before React renders it. No network or persistence. */
export function validatePrivateDraftPack(value: unknown): PrivateDraftPack {
  if (!object(value) || value.schema !== 'kazu-private-preschool-review-v1' || value.reviewOnly !== true ||
      !Array.isArray(value.stages) || !value.stages.length || value.stages.length > 65) {
    throw new Error('このファイルは数のトビラの非公開確認用原稿ではありません。');
  }
  let total = 0;
  const seenStages = new Set<string>();
  const seenQuestions = new Set<string>();
  for (const raw of value.stages as unknown[]) {
    if (!object(raw) || !text(raw.stageId, 40) || !inStage(raw.stageId) || seenStages.has(raw.stageId) ||
        !text(raw.title, 120) || raw.reviewStatus !== 'draft' || raw.uiReady !== false ||
        !Array.isArray(raw.questions) || raw.questions.length < 1 || raw.questions.length > 100) {
      throw new Error('ステージ情報に誤りがあります。');
    }
    seenStages.add(raw.stageId);
    for (const item of raw.questions as unknown[]) {
      if (!object(item) || !text(item.id, 200) || !item.id.startsWith(raw.stageId+':') ||
          seenQuestions.has(item.id) || !text(item.question, 1000) ||
          !(text(item.answer, 100) || (object(item.answer) && Object.keys(item.answer).length <= 10 &&
            Object.keys(item.answer).length > 0 && Object.values(item.answer).every(v=>text(v,100)))) ||
          !Array.isArray(item.hints) || item.hints.length !== 3 || !item.hints.every(v=>text(v,1000)) ||
          !text(item.explanation, 3000) || (item.choices !== undefined &&
            (!Array.isArray(item.choices) || !item.choices.every(v=>text(v,100))))) {
        throw new Error('問題の構造を確認してください。');
      }
      seenQuestions.add(item.id);
    }
    total += raw.questions.length;
  }
  if (total !== value.totalQuestions || total > 6500) throw new Error('問題数が一致しません。');
  return value as PrivateDraftPack;
}
