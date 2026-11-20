import {worldStageById,type WorldStage} from './worldCatalog.ts';
import type { BankQuestion } from './questionBank';
import { countingTokenArt, preschoolCountingTokens } from './countingTokens.ts';
import { preschoolSample02to05 } from './preschoolSampleStages.ts';
import { preschoolPrototypeBank } from './preschoolPlayableStages.ts';
import { gradeOnePreviewBank } from './gradeOnePreviewBank.ts';
import { elementaryPilotBanks } from './elementaryPilotBanks.ts';
import { elementaryFollowupBanks } from './elementaryFollowupBanks.ts';
import { secondaryPilotBanks } from './secondaryPilotBanks.ts';
import { extensionPilotBanks } from './extensionPilotBanks.ts';

type SampleStage = Pick<WorldStage,'id'|'gradeId'|'family'|'kind'>;

export const firstStageLessonBanks:Readonly<Record<string,readonly BankQuestion[]>> = {
  ...elementaryPilotBanks,...secondaryPilotBanks,...extensionPilotBanks,
};
export const additionalStageLessonBanks:Readonly<Record<string,readonly BankQuestion[]>> = elementaryFollowupBanks;

export function uiPreviewSampleKind(stage: SampleStage) {
  if (stage.gradeId==='preschool' && /^preschool\.(?:n(?:0[6-9]|[1-4][0-9]|50)|x(?:0[1-9]|10)|s0[1-5])$/.test(stage.id)) {
    const expected=stage.id.includes('.n')?'normal':stage.id.includes('.x')?'extra':'secret';
    const full=stage as Partial<WorldStage>;
    // Never unlock a fabricated id-only stage: real prototype map objects
    // carry the canonical position and unit index from worldCatalog.
    const number=Number(stage.id.slice(stage.id.lastIndexOf('.')+2));
    const order=expected==='normal'?number-1:expected==='extra'?49+number:59+number;
    return stage.kind===expected && stage.family!=='unknown' &&
      full.order===order && Number.isInteger(full.unitIndex)
      ?'preschool-activity':undefined;
  }
  if (stage.gradeId==='e1' && stage.kind==='normal' && stage.family!=='unknown') {
    const canonical=worldStageById.get(stage.id);
    if(canonical?.kind==='normal' && canonical.gradeId==='e1' &&
       canonical.family===stage.family &&
       ((stage as Partial<WorldStage>).order===undefined ||
        canonical.order===(stage as Partial<WorldStage>).order))
      return 'grade-one-curriculum';
  }
  if (stage.kind !== 'normal') return undefined;
  if (additionalStageLessonBanks[stage.id] && stage.id.startsWith(stage.gradeId+'.') &&
      stage.family === (stage.gradeId==='e5'?'decimal':stage.gradeId==='e6'?'fraction':'place')) return 'foundation-stage';
  if (firstStageLessonBanks[stage.id] && stage.id.startsWith(stage.gradeId+'.') && stage.family!== 'unknown') return 'island-first-stage';
  if (stage.id === 'preschool.n01' && stage.gradeId === 'preschool' && stage.family === 'count') return 'counting';
  if (stage.gradeId === 'preschool' && stage.family === 'count' && ['preschool.n02','preschool.n03','preschool.n04','preschool.n05'].includes(stage.id)) return 'preschool-sample';
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
  if (kind==='grade-one-curriculum') return gradeOnePreviewBank(worldStageById.get(stage.id)!);
  if (kind==='island-first-stage') return [...firstStageLessonBanks[stage.id]];
  if (kind==='foundation-stage') return [...additionalStageLessonBanks[stage.id]];
  if (kind==='counting') return [...countingPreviewBank];
  if (kind==='preschool-sample') return [...(preschoolSample02to05[stage.id] ?? [])];
  if (kind==='preschool-activity') return preschoolPrototypeBank(stage as WorldStage);
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
  return kind==='counting' ? randomCountingRound(bank,random) : kind==='preschool-sample'||kind==='preschool-activity'||kind==='island-first-stage'||kind==='foundation-stage'||kind==='grade-one-curriculum' ? [...bank] : shuffled(bank,random).slice(0,10);
}


/**
 * 幼児・確認テスト1（公開試作版）。
 * 01→05の順に各2問ずつ選ぶ。ステージ間のシャッフルは禁止。
 * ステージ内では前半を易しい個数、後半を大きい個数に並べる。
 * 本番DBの審査・進捗とは独立した教材サンプルのみを使う。
 */
export function uiPreviewPreschoolCheckpointOne(random: () => number = Math.random): BankQuestion[] {
  const stageIds=['preschool.n01','preschool.n02','preschool.n03','preschool.n04','preschool.n05'] as const;
  return stageIds.flatMap(id => {
    const source:SampleStage={id,gradeId:'preschool',family:'count',kind:'normal'};
    const bank=uiPreviewBank(source);
    if(bank.length<2) throw new Error('確認テストのもんだいが たりません。');
    return shuffled(bank,random).slice(0,2).sort((a,b)=>Number(a.answer)-Number(b.answer));
  });
}

/** Prototype checkpoint 01–10: two tasks from each preceding stage.
 * Retains the original checkpoint 1's established round contract.
 */
export function uiPreviewPreschoolCheckpoint(number:number,random:()=>number=Math.random):BankQuestion[]{
 if(!Number.isInteger(number)||number<1||number>10)return [];
 if(number===1)return uiPreviewPreschoolCheckpointOne(random);
 const starts=(number-1)*5+1;
 const out:BankQuestion[]=[];
 for(let i=0;i<5;i++){
   const position=starts+i,stageId='preschool.n'+String(position).padStart(2,'0');
   const category=['count','count','tracing','count','comparison','sorting','shape','pattern','position','mixed'][Math.floor((position-1)/5)];
   const stage={id:stageId,gradeId:'preschool',kind:'normal',family:category,order:position-1,unitIndex:Math.floor((position-1)/5)} as WorldStage;
   const bank=uiPreviewBank(stage);
   if(bank.length<2)throw Error('No checkpoint prototype bank: '+stageId);
   out.push(...shuffled(bank,random).slice(0,2));
 }
 return out;
}

/** Grade-one trial checkpoints: two curriculum-aligned exercises from each
 * of the five immediately preceding stages. All ten checkpoints are playable.
 */
export function uiPreviewGradeOneCheckpoint(number:number,random:()=>number=Math.random):BankQuestion[]{
  if(!Number.isInteger(number)||number<1||number>10)return [];
  const picked:BankQuestion[]=[];
  // The three legacy first-grade IDs were deliberately moved in the map.
  // Source checkpoints by canonical display order, NEVER by ID numbering.
  const route=[...worldStageById.values()]
    .filter(stage=>stage.gradeId==='e1'&&stage.kind==='normal')
    .sort((left,right)=>left.order-right.order);
  for(let offset=0;offset<5;offset++){
    const stage=route[(number-1)*5+offset];
    if(!stage)throw Error('Missing grade-one checkpoint stage');
    const bank=gradeOnePreviewBank(stage);
    picked.push(...shuffled(bank,random).slice(0,2));
  }
  return picked;
}
