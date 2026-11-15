import { mkdir, writeFile } from 'node:fs/promises';
import { worldStageById } from '../src/domain/worldCatalog.ts';

const directory = new URL('../public/question-banks/', import.meta.url);
const definitions = [
  ['e1.forest', '9までの たしざん', 'あわせた かずが 9までの たしざんを かんがえる。'],
  ['e1.bridge', '10を つくる たしざん', 'いくつと いくつで 10に なるかを かんがえる。'],
  ['e1.tower', '10を こえる たしざん', '10の まとまりを つくって、のこりを たす。'],
];

const titles = ['なにを もとめる？', 'つかう かんがえかた', 'やってみよう', 'たしかめよう', 'まちがえやすい ところ'];
const turn = (a, b) => [a, b].map(Number);

export function makeBank([stageId, unit, objective]) {
  const stage = worldStageById.get(stageId);
  const pools = new Map();

  function add(format, key, question, answer, hints, bodies, wrong, diagram, difficulty) {
    const problem = {
      id: stageId + ':bank1:' + key,
      skillId: stage.gradeId + '.' + stage.family,
      type: 'number',
      format,
      difficulty,
      prompt: 'こたえを 数字で いれてね',
      question,
      answer: String(answer),
      hints,
      hint: hints[0],
      steps: bodies.map((body, i) => ({ title: titles[i], body })),
      explanation: bodies[2],
      mistakes: [{ explanation: bodies[4] }],
      ...(diagram ? { diagram } : {}),
    };
    if (wrong && wrong[0] !== answer) problem.mistakes.unshift({ answer: String(wrong[0]), explanation: wrong[1] });
    if (!pools.has(format)) pools.set(format, []);
    pools.get(format).push(problem);
  }

  for (let a = 0; a <= 9; a++) for (let b = 0; b <= 10; b++) {
    const total = a + b;
    const forest = stageId === 'e1.forest';
    const bridge = stageId === 'e1.bridge';
    if (forest ? total > 9 : bridge ? total !== 10 : total <= 10 || b > 9) continue;
    const gap = 10 - a;
    const count = (first, second) => ({ kind: 'tenFrame', first, second });
    const sum = total > 10
      ? `${b}こを ${gap}こと ${b - gap}こに わける。 ${a}＋${gap}＝10。 10＋${b - gap}＝${total}。`
      : `${a}から ${b}つ すすむと ${total}。`;
    const sumHints = [
      'はじめの かずと、あとから たす かずを みつけよう。',
      total > 10 ? 'はじめの かずを 10に してから、のこりを たせるよ。' : 'たしざんでは、ふえた ぶんだけ すすむよ。',
      total > 10 ? `${a}に ${gap}を たして 10。 ${b}の うち、つかって いない かずを たそう。` : `${a}から ${b}つ すすんだ ところの かずを みつけよう。`,
    ];
    const sumSteps = [
      `${a}と ${b}を あわせた かずを もとめるよ。`,
      'たしざんは、ふたつの まとまりを ひとつに する けいさんだよ。',
      sum,
      `${total}から あとで たした ${b}を ひくと ${a}。はじめの かずに もどるね。`,
      'はじめの かずは すすんだ 1つめに 入れないよ。',
    ];
    if (a <= b && !bridge) {
      add('calculation', `sum-${a}-${b}`, `${a}＋${b}＝？`, total, sumHints, sumSteps,
        b > 0 ? [total - 1, 'はじめの かずも すすんだ 1つめに したかも。はじめの かずの つぎから かぞえよう。'] : undefined, count(a, b), 1);
    }
    if (!bridge && a > 0 && b > 0) {
      add('story', `collect-${a}-${b}`, `どんぐりが ${a}こ あります。あとで ${b}こ ひろいました。いま なんこ ありますか？`,
        total, ['ひろう まえと、あとで ふえた かずを みつけよう。', ...sumHints.slice(1)],
        [`はじめの ${a}こと、あとで ひろった ${b}こを あわせるよ。`, ...sumSteps.slice(1)],
        [a, 'これは はじめに あった かずだね。あとで ひろった ぶんも いれよう。'], count(a, b), 2);
    }
    if (bridge || (a > 0 && b > 0)) {
      add('missingPart', `missing-${a}-${total}`, `${a}＋□＝${total}。 □に はいる かずは？`, b,
        ['□は、はじめの かずに たす ぶんだよ。', 'ぜんぶの かずから、もう わかって いる ぶんを ひくよ。',
          `${a}から ${total}まで、いくつ すすむか かぞえよう。`],
        [`${a}に いくつ たせば ${total}に なるか しらべるよ。`, 'たしざんで できた ぜんぶから、わかって いる ぶんを のぞくと、□の ぶんが のこるよ。',
          `${total}−${a}＝${b}。`, `${a}＋${b}＝${total}。□に ${b}を いれると もとの しきが できるね。`,
          'ぜんぶの かずを □に いれないよ。□は たりない ぶんだよ。'],
        [total, 'それは ぜんぶの かずだね。はじめから ある ぶんを のぞこう。'], count(a), 1);
    }
    for (let first = 1; first < b; first++) {
      const rest = b - first;
      if (a === 0 || a + first > 10) continue;
      if (bridge && a >= first) continue;
      if (forest && a > first) continue;
      const subtotal = a + first;
      add('decomposition', `parts-${a}-${first}-${total}`,
        `シールを ${total}まい に したいです。あかが ${a}まい、あおが ${first}まい あります。あと なんまい いりますか？`,
        rest,
        ['あかと あおを あわせて、いま ある かずを しらべよう。', 'さいごに ほしい かずと、いま ある かずの ちがいが たりない ぶんだよ。',
          `${a}＋${first}で いまの かずが わかるよ。それを ${total}から ひこう。`],
        [`シールは ぜんぶで ${total}まいに するよ。あかと あおは もう あるね。`, 'わかって いる ふたつの まとまりを あわせてから、のこりを もとめるよ。',
          `${a}＋${first}＝${subtotal}。 ${total}−${subtotal}＝${rest}。`, `${subtotal}＋${rest}＝${total}。ほしい かずに なったね。`,
          'あかだけでなく、あおの シールも いま ある ぶんに いれるよ。'],
        [b, 'あかだけを ひいたのかも。あおの シールも もう あるね。'], count(a, first), 2);
    }
    // Distances between two totals are different from finding one missing part.
    if (a > 0 && b > 0 && b <= 9) for (let other = 1; other < a; other++) {
      const otherTotal = other + b;
      const distance = total - otherTotal;
      if (bridge) {
        add('comparison', `fill-pair-${a}-${other}-${b}`,
          `ルミの はこに ${a}こ、ミオの はこに ${other}こ あります。どちらにも ${b}こ いれました。ミオの はこを 10こに するには、あと なんこ いりますか？`,
          distance,
          ['ミオの はこに いま なんこ あるかを さきに しらべよう。',
            '10から いま ある かずを ひくと、たりない ぶんが わかるよ。',
            `ミオの はこは ${other}＋${b}。その かずを 10から ひこう。`],
          ['ふたりの はこを くらべると、ルミは 10こ。ミオが 10こに なるまでの ぶんを もとめるよ。',
            'ミオの はこに あるのは、はじめの かずと あとで いれた かずを たした ものだよ。',
            `ルミは ${a}＋${b}＝10。ミオは ${other}＋${b}＝${otherTotal}。10−${otherTotal}＝${distance}。`,
            `${otherTotal}＋${distance}＝10。ミオの はこも 10こに なったね。`,
            'ミオの はこに あとで いれた ぶんも かぞえるよ。'],
          [10 - other, 'はじめの かずだけで かんがえたのかも。あとで いれた ぶんも たしてから かんがえよう。'],
          undefined, 3);
        continue;
      }
      add('comparison', `compare-${a}-${other}-${b}`,
        `ルミは ${a}こ、ミオは ${other}こ きのみを もっています。ふたりが ${b}こずつ もらいました。いま、ルミは ミオより なんこ おおく もっていますか？`,
        distance,
        ['ふたりが もらった かずを くらべよう。', 'おなじ かずを ふやすと、ふたりの かずの ちがいは かわらないよ。',
          `はじめの ${a}こと ${other}こを くらべよう。おおい ほうから、すくない ほうを ひくよ。`],
        ['あとで ふたりが もって いる かずの ちがいを もとめるよ。',
          'ふたりとも おなじ ぶんだけ ふえるから、ちがいは はじめの ままだよ。',
          `ルミは ${a}＋${b}＝${total}、ミオは ${other}＋${b}＝${otherTotal}。 ${total}−${otherTotal}＝${distance}。`,
          `はじめの かずでも ${a}−${other}＝${distance}。おなじ ちがいに なるね。`,
          'もらった かずを こたえるのでは なく、ふたりの かずの ちがいを もとめるよ。'],
        [b, 'それは もらった かずだね。ふたりの いまの かずの ちがいを くらべよう。'], undefined, 3);
    }
  }

  if (stageId === 'e1.bridge') {
    for (let have = 2; have <= 10; have++) for (let offered = 1; offered <= 9; offered++) {
      const needed = 10 - have;
      const left = offered - needed;
      if (left <= 0) continue;
      add('story', 'spare-' + have + '-' + offered,
        'はこに たまが ' + have + 'こ あります。そとに ' + offered + 'こ あります。はこの なかを 10こに したら、そとに なんこ のこりますか？',
        left,
        ['はこに あと いくつ はいるかを さきに しらべよう。',
          '10から はこの なかの かずを ひくと、あいて いる ぶんが わかるよ。',
          '10−' + have + 'で はこに 入れる ぶんを もとめて、それを そとの ' + offered + 'こから ひこう。'],
        ['はこを 10こに してから、そとに のこる かずを もとめるよ。',
          'そとの たまを 「はこに 入れる ぶん」と「そとに のこす ぶん」に わけられるよ。',
          'はこに 入れるのは 10−' + have + '＝' + needed + 'こ。そとは ' + offered + '−' + needed + '＝' + left + 'こ。',
          'はこの なかは ' + have + '＋' + needed + '＝10。そとの たまは ' + needed + '＋' + left + '＝' + offered + 'に わけられたね。',
          'はこに 入れた かずと、そとに のこった かずを とりちがえないよ。'],
        [needed, 'それは はこに 入れた かずかも。そとの たまから、はこに 入れた ぶんを ひこう。'],
        { kind: 'tenFrame', first: have }, 3);
    }
  }

  // Round-robin selection keeps small pools represented and spreads the numbers
  // across each authored format without sampling duplicate IDs.
  let seed = 271828;
  const queues = [...pools.values()].map(items => {
    const queue = [...items];
    for (let i = queue.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const index = seed % (i + 1);
      [queue[i], queue[index]] = [queue[index], queue[i]];
    }
    return queue;
  });
  const questions = [];
  while (questions.length < 100 && queues.some(queue => queue.length)) {
    for (const queue of queues) {
      if (questions.length < 100 && queue.length) questions.push(queue.pop());
    }
  }
  if (questions.length !== 100) throw new Error(stageId + ' has only ' + questions.length + ' questions');
  return { version: 1, stageId, gradeId: stage.gradeId, islandId: stage.gradeId, unit, objective, questions };
}

await mkdir(directory, { recursive: true });
for (const definition of definitions) {
  const bank = makeBank(definition);
  const json = JSON.stringify(bank, null, 2) + '\n';
  await writeFile(new URL(bank.stageId + '.v1.json', directory), json);
}
