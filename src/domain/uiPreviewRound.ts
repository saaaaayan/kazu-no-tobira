import type { WorldStage } from './worldCatalog';
import type { BankQuestion } from './questionBank';

// UI fixtures are generated without reading a question bank or a learner record.
export function uiPreviewRound(stage: WorldStage): BankQuestion[] {
  return Array.from({ length: 10 }, (_, index) => {
    const first = index % 5 + 1;
    const second = (index * 3 + 1) % 4 + 1;
    const sum = first + second;
    return {
      id: 'ui-preview-' + stage.id + '-' + index, skillId: 'e1.addition',
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
