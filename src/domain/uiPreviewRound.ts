import type { WorldStage } from './worldCatalog';
import type { BankQuestion } from './questionBank';
import { countingTokenArt, preschoolCountingTokens } from './countingTokens.ts';
import { preschoolSample02to05 } from './preschoolSampleStages.ts';

type SampleStage = Pick<WorldStage,'id'|'gradeId'|'family'|'kind'>;

export function uiPreviewSampleKind(stage: SampleStage) {
  if (stage.kind !== 'normal') return undefined;
  if (stage.id === 'preschool.n01' && stage.gradeId === 'preschool' && stage.family === 'count') return 'counting';
  if (stage.gradeId === 'preschool' && /^preschool\\.n0[2-5]$/.test(stage.id)) return 'preschool-sample';
  if ((stage.id === 'e1.forest' || stage.id === 'e1.n06') && stage.gradeId === 'e1' && stage.family === 'addition') return 'addition';
}

// 公開試作版の練習問題。実DBの審査・公開準備完了と区別する。
// 1ステージの学習目標は「1〜3個をひとつずつ数える」。足し算などを混ぜない。
const countingPreviewBank: BankQuestion[] = preschoolCountingTokens.flatMap(token =>
  ([1,2,3] as const).map(count=>{
    const name=countingTokenArt[token][1];
    return {
      id:'ui-preview-preschool.n01-'+token+'-'+count,
      skillId:'preschool.objects',
      type:'choice',format:'counting',difficulty:1,
      question:name+'は いくつ？',
      prompt:name+'を さわって かぞえよう',
      choices:['1','2','3'],answer:String(count),
      hint:'ひとつずつ みてね。',
      hints:['ひだりから みてね。','ひとつ さわったら、つぎへ。','さいごに いった かずを えらぼう。'],
      explanation:name+'は '+count+' こ。ひとつずつ かぞえたよ。',
      steps:[{title:'ひとつずつ かぞえる',body:'ひだりから かぞえると '+count+' こ。'}],
      mistakes:[],
      diagram:{kind:'countingBoard',guide:true,rows:[{tokens:Array.from({length:count},()=>token)}]},
    } satisfies BankQuestion;
  })
).slice(0,100);

/** 公開用サンプルだけを返す。実教材DBや未審査の本番問題にはアクセスしない。 */
export function uiPreviewBank(stage: SampleStage): BankQuestion[] {
  const kind=uiPreviewSampleKind(stage);
  if (!kind) return [];
  if (kind==='counting') return [...countingPreviewBank];
  if (kind==='preschool-sample') return [...(preschoolSample02to05[stage.id] ?? [])];
  return Array.from({ length: 10 }, (_, index) => {
    const first = index % 5 + 1;
    const second = (index * 3 + 1) % 4 + 1;
    const sum = first + second;
    return {
      id: 'ui-preview-' + stage.id + '-' + index, skillId: 'e1.add.within-9',
      type: 'number', format: 'calculation', difficulty: 1,
      question: `画面確認用の例題　${first} ＋ ${second} は いくつ？`,
      prompt: 'こたえを 数字で いれてね', answer: String(sum),
      hint: '青いまると、黄色いまるを見てね。',
      hints: ['青いまると、黄色いまるを見てね。', '青いまるの数から、黄色いまるの数だけ進もう。', `${first} から ${second} 回かぞえよう。`],
      explanation: `${first} こに ${second} こを あわせると ${sum} こです。`,
      steps: [{ title: 'あわせて かぞえる', body: `${first} ＋ ${second} ＝ ${sum}` }],
      mistakes: [], diagram: { kind: 'tenFrame', first, second },
    };
  });
}

/** 偏りが少ない10問を、毎回ランダムに出す。1回の挑戦では図柄も重複させない。 */
function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){
    const raw=random();
    const fraction=Number.isFinite(raw) ? Math.max(0,Math.min(0.999999999,raw)) : 0;
    const j=Math.floor(fraction*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

function pictureKey(question: BankQuestion) {
  return question.diagram?.kind==='countingBoard'
    ? question.diagram.rows[0]?.tokens[0] ?? question.id
    : question.id;
}

function randomCountingRound(bank: readonly BankQuestion[], random: () => number): BankQuestion[] {
  const picked: BankQuestion[]=[];
  const pictures=new Set<string>();
  // 答え1・2・3を各3問ずつ出し、残り1問も無作為に選ぶ。
  for(const answer of ['1','2','3']){
    let count=0;
    for(const question of shuffled(bank.filter(q=>q.answer===answer),random)){
      const picture=pictureKey(question);
      if(pictures.has(picture)) continue;
      picked.push(question);
      pictures.add(picture);
      if(++count===3) break;
    }
  }
  const extra=shuffled(bank.filter(q=>!picked.includes(q)&&!pictures.has(pictureKey(q))),random)[0];
  if(extra) picked.push(extra);
  return shuffled(picked,random);
}

/** 一度のプレイは10問。再挑戦時は別の順番・組み合わせを無作為抽出する。 */
export function uiPreviewRound(stage: SampleStage, random: () => number = Math.random): BankQuestion[] {
  const kind=uiPreviewSampleKind(stage);
  if (!kind) return [];
  const bank=uiPreviewBank(stage);
  return kind==='counting' ? randomCountingRound(bank,random) : kind==='preschool-sample' ? [...bank] : shuffled(bank,random).slice(0,10);
}
