import type {WorldStage} from './worldCatalog.ts';
import {hasGeneratedWorldQuestions} from './worldCatalog.ts';
import type {MathQuestion} from './worldQuestions.ts';
import {generateWorldQuestions} from './worldQuestions.ts';
import {hasStageBank} from './questionBank.ts';
import {publicBankStageRound} from './publicBankStageRound.ts';
import {uiPreviewSampleKind,uiPreviewRound} from './uiPreviewRound.ts';
import {generateAdditionalIslandQuestions} from './additionalIslandQuestions.ts';

/**
 * All 16 islands × 65 stages are PLAYABLE in the prototype.
 * Existing 43 × 100 curated banks are never replaced.
 * Other stages have ten deterministic first-draft questions per stage.
 * The prototype does not write achievement or review records.
 */
const additionalHints:Readonly<Record<string,[string,string]>>={
  count:['ものを ひとつずつ かぞえよう。','ならびと かずの たいおうを みよう。'],
  addition:['あわせる ぶんを さがそう。','10の まとまりに できるか ためそう。'],
  subtraction:['のこる ぶんを かんがえよう。','たしざんに もどして たしかめよう。'],
  place:['くらいと まとまりを みよう。','10の まとまりを いくつ つくれるかな。'],
  shape:['ずを みながら かぞえよう。','へんと かどを まちがえないでね。'],
  time:['長い はりと 短い はりを たしかめよう。','1時間は60分。はりの うごきを かんがえよう。'],
  division:['何こずつに分けるかを整理しよう。','かけ算で元の数に戻るか確かめよう。'],
  fraction:['全体を何等分したかを考えよう。','分母と分子の意味を整理しよう。'],
  probability:['すべての場合を重複なく数えよう。','有利な場合と全場合の数を比べよう。'],
  calculus:['変化率と積分の意味を整理しよう。','微分と積分の関係から計算を確認しよう。'],
  geometry:['対応関係を図に書き込もう。','どの条件から言えるのか説明しよう。'],
  proof:['仮定と結論を区別しよう。','必要な条件を一つずつ確認しよう。'],
};
const defaultHints:[string,string]=[
  '問題の条件と、求めるものを分けて考えよう。',
  '使える公式や定義を、途中式に書いてみよう。',
];
function enrich(questions:MathQuestion[],stage:WorldStage):MathQuestion[] {
  const [second,third]=additionalHints[stage.family]??defaultHints;
  return questions.map(question=>({
    ...question,
    guidedHints:question.guidedHints??[question.hint,second,third],
    steps:question.steps??[
      {title:'何を求める？',body:question.hint},
      {title:'使う考え方',body:second},
      {title:'計算と確認',body:question.explanation}
    ]
  }));
}

export function hasPrototypeStageQuestions(stage:WorldStage):boolean {
  return stage.questions===10 && (hasStageBank(stage.id) ||
    Boolean(uiPreviewSampleKind(stage)) || hasGeneratedWorldQuestions(stage.gradeId) ||
    ['preschool','sage','champion','cosmos'].includes(stage.gradeId));
}

export async function everyIslandStageRound(stage:WorldStage):Promise<MathQuestion[]> {
  if(!hasPrototypeStageQuestions(stage))throw new Error('このステージは じゅんびちゅうだよ。');
  if(hasStageBank(stage.id))return publicBankStageRound(stage);
  if(uiPreviewSampleKind(stage))return uiPreviewRound(stage);
  const result=hasGeneratedWorldQuestions(stage.gradeId)
    ? enrich(generateWorldQuestions(stage,0),stage)
    : generateAdditionalIslandQuestions(stage);
  if(result.length!==10||new Set(result.map(item=>item.id)).size!==10||
     new Set(result.map(item=>(item.clock?.read?item.question+item.clock.start:item.question).normalize('NFKC'))).size!==10 ||
     result.some(q=>!q.question||!q.answer||!q.hint||!q.explanation||
       !(q.guidedHints?.length===3 || ('hints' in q && Array.isArray(q.hints) && q.hints.length===3)))) {
    throw new Error('このステージの10問を確認できませんでした: '+stage.id);
  }
  return result;
}
