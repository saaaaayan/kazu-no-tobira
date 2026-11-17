import type { WorldStage } from './worldCatalog';
import type { BankQuestion } from './questionBank';

type SampleStage = Pick<WorldStage,'id'|'gradeId'|'family'|'kind'>;

export function uiPreviewSampleKind(stage: SampleStage) {
  if (stage.kind !== 'normal') return undefined;
  if (stage.id === 'preschool.n01' && stage.gradeId === 'preschool' && stage.family === 'count') return 'counting';
  if ((stage.id === 'e1.forest' || stage.id === 'e1.n06') && stage.gradeId === 'e1' && stage.family === 'addition') return 'addition';
}

// These fixtures are generated without reading a question bank or a learner record.
export function uiPreviewRound(stage: SampleStage): BankQuestion[] {
  const kind=uiPreviewSampleKind(stage);
  if (!kind) return [];
  if (kind==='counting') {
    // 学習目標は「横一列にある1〜3個を数える」。数字や図を増やすだけで別単元へ進まない。
    // この10問は公開サイトの操作確認専用で、実DBの審査済み教材ではない。
    const samples=[
      {count:1,token:'bear'}, {count:2,token:'bear'}, {count:3,token:'bear'},
      {count:1,token:'dot'}, {count:2,token:'dot'}, {count:3,token:'dot'},
      {count:1,token:'triangle'}, {count:2,token:'triangle'},
      {count:3,token:'square'}, {count:2,token:'square'},
    ] as const;
    const names={bear:'くま',dot:'まる',triangle:'さんかく',square:'しかく'} as const;
    return samples.map(({count,token},index)=>{
      const name=names[token];
      return {
        id:'ui-preview-'+stage.id+'-'+(index+1),skillId:'preschool.objects',
        type:'choice',format:'counting',difficulty:1,
        question:name+'は いくつ？',prompt:name+'を さわって かぞえよう',
        choices:['1','2','3'],answer:String(count),
        hint:'ひだりから みてね。',
        hints:['ひだりから みてね。','ひとつ さわったら、つぎの '+name+'へ。','さいごに いった かずを えらぼう。'],
        explanation:name+'は '+count+' こ。ひとつずつ かぞえたよ。',
        steps:[{title:'ひとつずつ かぞえる',body:'ひだりから かぞえると '+count+' こ。'}],
        mistakes:[],diagram:{kind:'countingBoard',guide:true,rows:[{tokens:Array.from({length:count},()=>token)}]},
      };
    });
  }
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
