const item = (kind, values, stem, answer, hints, steps, difficulty, diagram) =>
  ({ kind, values, stem, answer, hints, steps, difficulty, diagram });

function take(total, used) {
  const left = total - used;
  return item('takeAway', [total, used],
    `かごに たまが ${total}こ あります。${used}こ とりだすと、いくつ のこりますか？`, left,
    ['はじめに あった かずを みつけよう。', 'とりだした ぶんだけ へるので、ひきざんを つかうよ。', `${total}から ${used}を ひこう。`],
    ['かごに のこった たまを もとめるよ。', 'とりだした たまは、のこりには いれないよ。',
      `${total}−${used}＝${left}。`, `もとに もどすと ${left}＋${used}＝${total}。`,
      'とりだした かずと、のこりの かずを とりちがえないように しよう。'], 1,
    { kind: 'takeAway', total, used });
}

function takeTwice(total, first, second) {
  const middle = total - first;
  const left = middle - second;
  return item('takeTwice', [total, first, second],
    `カードが ${total}まい あります。あさに ${first}まい、ひるに ${second}まい わたしました。いま なんまい のこっていますか？`, left,
    ['あさと ひるに わたした まいすうを みつけよう。', 'あさの ぶんを ひいてから、ひるの ぶんも ひくよ。',
      `${total}から ${first}を ひき、その のこりから ${second}を ひこう。`],
    ['2かい わたした あとの のこりを もとめるよ。', 'ひるに わたす まえに、あさの のこりが わかるよ。',
      `${total}−${first}＝${middle}。 ${middle}−${second}＝${left}。`,
      `わたした ぶんは ${first}＋${second}＝${first+second}。 ${left}＋${first+second}＝${total}だね。`,
      'あさと ひるの どちらか だけを ひいて おわらないよ。'], 2);
}

function startAmount(first, second, left) {
  const restored = left + second;
  const total = restored + first;
  return item('startAmount', [first, second, left],
    `シールを はじめに ${first}まい、つぎに ${second}まい つかうと、${left}まい のこりました。はじめに なんまい ありましたか？`, total,
    ['さいごに のこった かずから、じかんを まきもどそう。', 'つかった シールを 1かいずつ もどすと、はじめの かずに もどるよ。',
      `${left}に ${second}を たして、その あと ${first}を たそう。`],
    ['つかう まえの シールを もとめるよ。', 'つかって へった ぶんを たしもどすよ。',
      `${left}＋${second}＝${restored}。 ${restored}＋${first}＝${total}。`,
      `${total}−${first}＝${restored}。 ${restored}−${second}＝${left}。もとの おはなしと おなじだね。`,
      'これから つかう ときと ぎゃくに、つかった ぶんを たすよ。'], 3);
}

function unknownLast(total, first, left) {
  const afterFirst = total - first;
  const used = afterFirst - left;
  return item('unknownLast', [total, first, left],
    `シールが ${total}まい ありました。あさに ${first}まい つかい、ひるにも つかうと ${left}まい のこりました。ひるに なんまい つかいましたか？`, used,
    ['あさの あとに なんまい あったかを まず しらべよう。', 'ひるの まえの かずと、ひるの あとの かずの ちがいを もとめるよ。',
      `${total}−${first}で ひるの まえの かずを もとめて、${left}を ひこう。`],
    ['ひるに へった まいすうを もとめるよ。', 'ひるの まえから のこりまで、どれだけ へったかを しらべるよ。',
      `${total}−${first}＝${afterFirst}。 ${afterFirst}−${left}＝${used}。`,
      `${afterFirst}−${used}＝${left}。ひるの あとの のこりに なるね。`,
      'はじめの かずから そのまま のこりを ひくと、あさの ぶんも まざるよ。'], 2);
}

function compareAfter(a, b, c, d) {
  const red = a - b;
  const blue = c - d;
  const gap = red - blue;
  return item('compareAfter', [a,b,c,d],
    `ルミは ${a}まい、ミオは ${c}まい カードを もっています。ルミは ${b}まい、ミオは ${d}まい わたしました。いま ルミは ミオより なんまい おおいですか？`, gap,
    ['ふたりの はじめの かずと、わたした かずを わけよう。', 'ふたりの のこりを べつべつに もとめてから くらべるよ。',
      `ルミは ${a}−${b}、ミオは ${c}−${d}。ルミの のこりから ミオの のこりを ひこう。`],
    ['わたした あとの まいすうの ちがいを もとめるよ。', 'それぞれが わたした ぶんだけ、そのひとの カードが へるよ。',
      `${a}−${b}＝${red}。 ${c}−${d}＝${blue}。 ${red}−${blue}＝${gap}。`,
      `ミオの ${blue}まいに ちがいの ${gap}まいを たすと ${blue}＋${gap}＝${red}。`,
      'わたす まえの まいすうを くらべないよ。'], 3);
}

function moveAway(large, small, moved) {
  const red = large - moved;
  const blue = small + moved;
  const gap = red - blue;
  return item('moveAway', [large, small, moved],
    `あかの はこに ${large}こ、あおの はこに ${small}こ たまが あります。あかから あおへ ${moved}こ うつしました。いま あかは あおより なんこ おおいですか？`, gap,
    ['どちらの はこから、どちらへ うつすかを みよう。', 'あかは へって、あおは おなじ かずだけ ふえるよ。',
      `あかは ${large}−${moved}、あおは ${small}＋${moved}。うつした あとの かずを くらべよう。`],
    ['うつした あとの たまの かずの ちがいを もとめるよ。', 'うつすと りょうほうの はこの かずが かわるよ。',
      `${large}−${moved}＝${red}。 ${small}＋${moved}＝${blue}。 ${red}−${blue}＝${gap}。`,
      `はじめは ${large}＋${small}＝${large+small}。あとは ${red}＋${blue}＝${large+small}。ぜんぶの かずは おなじだね。`,
      'あかを へらす だけでなく、あおを ふやすよ。'], 3);
}

function equalize(a, b, c) {
  const target = a - b;
  const remove = c - target;
  return item('equalize', [a,b,c],
    `ルミの かごには たまが ${a}こ あり、${b}こ とりだしました。ミオの かごには ${c}こ あります。ルミと おなじ かずに するには、ミオは なんこ とれば いいですか？`, remove,
    ['ルミの いまの かずを たしかめよう。', 'ミオの たまを へらして、ルミの いまの かずに そろえるよ。',
      `${a}−${b}を もとめよう。その かずを ${c}から ひこう。`],
    ['ミオが いくつ とると、おなじ かずに なるかを もとめるよ。',
      'そろえたい かずは、ルミが とった あとの かずだよ。',
      `${a}−${b}＝${target}。 ${c}−${target}＝${remove}。`,
      `${c}−${remove}＝${target}。ミオの のこりも ルミと おなじだね。`,
      'ルミが とった かずと、ミオが とる かずを おなじに する わけでは ないよ。'], 3);
}

function comparedStart(a, b, d) {
  const smaller = a - b;
  const before = smaller + d;
  return item('comparedStart', [a,b,d],
    `ルミは ${a}まい カードを もっています。ミオが ${d}まい わたすと、ミオは ルミより ${b}まい すくなく なりました。ミオは はじめに なんまい もっていましたか？`, before,
    ['ミオが わたした あとの まいすうを しらべよう。', 'ルミより すくない まいすうを もとめて、ミオが わたした ぶんを たしもどすよ。',
      `${a}−${b}が ミオの のこり。そこに ${d}を たそう。`],
    ['ミオが カードを わたす まえの まいすうを もとめるよ。',
      'ルミの まいすうから ちがいを ひくと、ミオの のこりが わかるよ。',
      `${a}−${b}＝${smaller}。 ${smaller}＋${d}＝${before}。`,
      `${before}−${d}＝${smaller}。 ${a}−${smaller}＝${b}だから、もとの おはなしに あうね。`,
      'わたす まえを もとめる ときは、わたした ぶんを ひかずに もどすよ。'], 3);
}

export function earlySubtractionPools() {
  const pools = new Map(['takeAway','takeTwice','startAmount','unknownLast','compareAfter','moveAway','equalize','comparedStart'].map(kind => [kind, []]));
  const add = question => pools.get(question.kind).push(question);
  for (let total = 2; total <= 9; total++) for (let first = 1; first < total; first++) {
    add(take(total, first));
    for (let other = total - first + 1; other <= 9; other++) {
      if (other !== total) add(equalize(total, first, other));
    }
    for (let given = 1; total-first+given <= 9; given++) {
      if (given !== first) add(comparedStart(total, first, given));
    }
    for (let next = 1; next < total - first; next++) {
      add(unknownLast(total, first, next));
      // Swapping the two deductions changes only their order.
      if (next >= first) {
        add(takeTwice(total, first, next));
        add(startAmount(first, next, total-first-next));
      }
    }
  }
  for (let a = 2; a <= 9; a++) for (let c = 2; c <= 9; c++) {
    for (let b = 1; b < a; b++) for (let d = 1; d < c; d++) {
      if (b !== d && a-b > c-d) add(compareAfter(a,b,c,d));
    }
  }
  for (let large = 3; large <= 8; large++) for (let small = 1; large+small <= 9; small++) {
    for (let moved = 1; large-moved > small+moved; moved++) add(moveAway(large, small, moved));
  }
  return pools;
}

export const earlySubtractionStages = [
  ['e1.n11', { takeAway: 36, takeTwice: 30, unknownLast: 24, compareAfter: 10 }],
  ['e1.n12', { takeTwice: 20, unknownLast: 30, startAmount: 20, compareAfter: 30 }],
  ['e1.n13', { unknownLast: 20, startAmount: 20, compareAfter: 20, moveAway: 10, equalize: 30 }],
  ['e1.n14', { unknownLast: 10, startAmount: 10, compareAfter: 30, equalize: 25, comparedStart: 25 }],
  ['e1.n15', { compareAfter: 35, moveAway: 4, equalize: 26, comparedStart: 35 }],
];
