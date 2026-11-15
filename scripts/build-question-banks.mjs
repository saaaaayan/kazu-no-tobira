import { countToHundredPools, countToHundredStages } from './count-to-hundred-unit.mjs';
import { validateCountToHundredBatch } from './validate-count-to-hundred.mjs';
import { borrowSubtractionPools, borrowSubtractionStages } from './borrow-subtraction-unit.mjs';
import { validateBorrowSubtractionBatch } from './validate-borrow-subtraction.mjs';
import { carryAdditionPools, carryAdditionStages } from './carry-addition-unit.mjs';
import { validateCarryAdditionBatch } from './validate-carry-addition.mjs';
import { countToTwentyPools, countToTwentyStages } from './count-to-twenty-unit.mjs';
import { validateCountToTwentyBatch } from './validate-count-to-twenty.mjs';
import { makeTenObjective, makeTenPools, makeTenStages } from './make-ten-unit.mjs';
import { validateMakeTenBatch } from './validate-make-ten.mjs';
import { earlySubtractionPools, earlySubtractionStages } from './early-subtraction-unit.mjs';
import { validateEarlySubtractionBatch } from './validate-early-subtraction.mjs';
import { earlyAdditionPools, earlyAdditionStages } from './early-addition-unit.mjs';
import { validateEarlyAdditionBatch } from './validate-early-addition.mjs';
import bridgeSlots from './bridge-bank-slots.json' with { type: 'json' };
import { addNumberOrderQuestions } from './number-order-questions.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { worldStages, worldStageById } from '../src/domain/worldCatalog.ts';

const directory = new URL('../public/question-banks/', import.meta.url);
const definitions = [
  ['e1.forest', '9までの たしざん', 'あわせた かずが 9までの たしざんを かんがえる。'],
  ['e1.bridge', '10を つくる たしざん', 'いくつと いくつで 10に なるかを かんがえる。'],
  ['e1.tower', '10を こえる たしざん', '10の まとまりを つくって、のこりを たす。'],
  ['e1.n04', 'かずの じゅんばん', '1から10までの ならびを つかって、まえ・あと・あいだの かずを みつける。'],
  ['e1.n05', 'かずの じゅんばん', 'かずの ならびから、ばしょと あいだの かずの こすうを かんがえる。'],
];

const titles = ['なにを もとめる？', 'つかう かんがえかた', 'やってみよう', 'たしかめよう', 'まちがえやすい ところ'];


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

  if (stageId === 'e1.n04' || stageId === 'e1.n05') addNumberOrderQuestions(stageId, add);
  else for (let a = 0; a <= 9; a++) for (let b = 0; b <= 10; b++) {
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
    for (let have = 3; have <= 8; have++) {
      const left = 2;
      const moved = 10 - have;
      add('reverseTransfer', 'before-move-' + have,
        `はこの なかに たまが ${have}こ ありました。そとから たまを いれると、なかは 10こ、そとは ${left}こに なりました。はじめに そとに なんこ ありましたか？`,
        moved + left,
        ['はこに うつした たまと、そとに のこった たまに わけて かんがえよう。',
          'はじめに そとに あった たまは、うつした ぶんと のこりを あわせた かずだよ。',
          `10−${have}で うつした かずを もとめよう。そこに ${left}こを たそう。`],
        ['はじめに そとに あった かずを もとめるよ。', 'うつしても、たまが ふえたり へったり する わけでは ないよ。',
          `10−${have}＝${moved}こを うつしたね。 ${moved}＋${left}＝${moved + left}。`,
          `そとに ${moved + left}こ あって ${moved}こを うつすと ${moved + left}−${moved}＝${left}。なかは ${have}＋${moved}＝10。`,
          'そとに のこった たまも、はじめは そとに あったよ。'],
        [moved, 'うつした ぶんだけを かぞえたかも。そとに のこった たまも あわせよう。'], undefined, 3);
    }
    for (let have = 2; have < 10; have++) for (let offered = 1; offered <= 9; offered++) {
      const needed = 10 - have;
      const left = offered - needed;
      if (left <= 0) continue;
      add('story', 'spare-' + have + '-' + offered,
        'はこに たまが ' + have + 'こ あります。そとに ' + offered + 'こ あります。そとから たまを いれて、はこの なかを 10こに します。そとに なんこ のこりますか？',
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
        { kind: 'transferToTen', inside: have, outside: offered }, 3);
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
  let questions = [];
  while (questions.length < 100 && queues.some(queue => queue.length)) {
    for (const queue of queues) {
      if (questions.length < 100 && queue.length) questions.push(queue.pop());
    }
  }
  if (stageId === 'e1.bridge') {
    // Keep saved draws and past attempt IDs valid. Replace only the retired slots.
    const bySlot = new Map([...pools.values()].flat().map(q => [q.id.split(':').at(-1), q]));
    const oldSlots = new Set(bridgeSlots);
    const replacements = [...bySlot.entries()].filter(([key]) => key.startsWith('before-move-') && !oldSlots.has(key));
    questions = bridgeSlots.map(slot => {
      if (!slot.startsWith('spare-10-')) return bySlot.get(slot);
      const replacement = replacements.shift()?.[1];
      if (!replacement) throw new Error('No valid replacement for ' + slot);
      return { ...replacement, id: stageId + ':bank1:' + slot };
    });
    if (questions.some(question => !question)) throw new Error('Bridge bank slot is missing');
  }
  if (questions.length !== 100) throw new Error(stageId + ' has only ' + questions.length + ' questions');
  return { version: 1, stageId, gradeId: stage.gradeId, islandId: stage.gradeId, unit, objective, questions };
}

const checkOnly = process.argv.includes('--check');
if (!checkOnly) await mkdir(directory, { recursive: true });
async function output(path, contents) {
  if (checkOnly) {
    if ((await readFile(path, 'utf8')).replaceAll('\r\n', '\n') !== contents) {
      throw new Error('Generated data is stale: ' + path.pathname);
    }
  } else {
    await writeFile(path, contents);
  }
}
const banks = definitions.map(makeBank);
function buildUnit(stages, pools, objective) {
  return stages.map(([stageId, quotas]) => {
  const stage = worldStageById.get(stageId);
  const questions = Object.entries(quotas).flatMap(([kind, count]) => {
    const pool = pools.get(kind);
    if (!pool || pool.length < count) throw new Error(stageId + ': insufficient ' + kind);
    return pool.splice(0, count).map(q => ({
      id: stageId + ':bank1:' + q.kind + '-' + q.values.join('-'),
      skillId: stage.gradeId + '.' + stage.family,
      type: 'number',
      format: q.kind,
      difficulty: q.difficulty,
      prompt: 'こたえを 数字で いれてね',
      question: q.stem,
      answer: String(q.answer),
      hint: q.hints[0],
      hints: q.hints,
      steps: q.steps.map((body, i) => ({ title: titles[i], body })),
      explanation: q.steps[2],
      mistakes: [{ explanation: q.steps[4] }],
      ...(q.diagram ? { diagram: q.diagram } : {}),
    }));
  });
  if (!stage || questions.length !== 100) throw new Error(stageId + ': invalid stage batch');
  return { version: 1, stageId, gradeId: stage.gradeId, islandId: stage.gradeId,
    unit: stage.subtitle, objective, questions };
  });
}
const addition = buildUnit(earlyAdditionStages, earlyAdditionPools(), 'まとまりを あわせて、9までの かずの かわりかたを かんがえる。');
const subtraction = buildUnit(earlySubtractionStages, earlySubtractionPools(), '9までの かずで、のこりや ちがいを かんがえる。');
validateEarlyAdditionBatch(addition);
validateEarlySubtractionBatch(subtraction);
const makeTen = buildUnit(makeTenStages, makeTenPools(), makeTenObjective);
validateMakeTenBatch(makeTen);
const counting = buildUnit(countToTwentyStages, countToTwentyPools(), '20までの かずを、まとまりと ならびで かんがえる。');
validateCountToTwentyBatch(counting);
const carry = buildUnit(carryAdditionStages, carryAdditionPools(), '10の まとまりを つくって、くりあがる たしざんを かんがえる。');
validateCarryAdditionBatch(carry);
const borrow = buildUnit(borrowSubtractionStages, borrowSubtractionPools(), '10の まとまりを くずして、くりさがる ひきざんを かんがえる。');
validateBorrowSubtractionBatch(borrow);
const hundred = buildUnit(countToHundredStages, countToHundredPools(), '100までの かずを 10の まとまりと ばらで かんがえる。');
validateCountToHundredBatch(hundred);
banks.push(...addition, ...subtraction, ...makeTen, ...counting, ...carry, ...borrow, ...hundred);
for (const bank of banks) {
  const json = JSON.stringify(bank, null, 2) + '\n';
  await output(new URL(bank.stageId + '.v1.json', directory), json);
}
const ids = banks.map(bank => bank.stageId);
const registry = '// Generated by scripts/build-question-banks.mjs.\nexport const bankStageIds = ' + JSON.stringify(ids) + ' as const;\n';
await output(new URL('../src/domain/bankStageIds.ts', import.meta.url), registry);
const cases = ids.map(id => "    case '" + id + "': return require('../public/question-banks/" + id + ".v1.json') as StageBank;");
await output(new URL('../src/stageBankLoader.ts', import.meta.url), [
  '// Generated by scripts/build-question-banks.mjs.',
  "import type { BankStageId, StageBank } from './domain/questionBank';", '',
  'export async function loadStageBank(stageId: BankStageId): Promise<StageBank> {',
  '  switch (stageId) {', ...cases, '  }', '}', '',
].join('\n'));
const byStage = new Map(banks.map(bank => [bank.stageId, bank]));
const entries = worldStages.map(stage => {
  const bank = byStage.get(stage.id);
  const review = bank ? ['自動検証', '自動検証', '代表例確認', '対象図の数値を照合', '3段階と代表例を確認', '構成・途中式と代表例を確認']
    : ['未実施', '未実施', '未実施', '未実施', '未実施', '未実施'];
  return [stage.id, stage.title, bank?.questions.length ?? 0, ...review, bank ? '完成' : '未着手'].join('\t');
});
const columns = 'ステージID\tステージ名\t制作済み\t重複\t正答\t問題文\t図解\tヒント\t解説\t状態';
await output(new URL('../docs/question-bank-progress.tsv', import.meta.url), [columns, ...entries].join('\n') + '\n');
