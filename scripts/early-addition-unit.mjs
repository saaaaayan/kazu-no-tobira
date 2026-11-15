// Each pattern has its own question, explanation and teaching intent.
// Parameters are canonicalized where changing their order changes only the wording.
export const earlyAdditionStages = [
  ['e1.n06', { joinThree: 23, target: 27, splitTotal: 20, returnSome: 30 }],
  ['e1.n07', { target: 14, splitTotal: 21, compareGroups: 35, returnSome: 30 }],
  ['e1.n08', { compareGroups: 35, returnSome: 30, refill: 35 }],
  ['e1.n09', { compareGroups: 36, returnSome: 30, refill: 34 }],
  ['e1.n10', { returnSome: 43, refill: 15, twoCollections: 42 }],
];

const item = (kind, values, stem, answer, hints, steps, difficulty, diagram) => ({
  kind, values, stem, answer, hints, steps, difficulty, diagram,
});

function joinThree(a, b, c) {
  const ab = a + b;
  const total = ab + c;
  return item('joinThree', [a,b,c],
    `あかの たまが ${a}こ、あおが ${b}こ、きいろが ${c}こ あります。ぜんぶで なんこ ですか？`, total,
    ['いろごとの まとまりを みつけよう。', 'ふたつを さきに あわせて、あとで もう ひとつを たせるよ。', `${a}＋${b}を けいさんしてから、${c}を たそう。`],
    ['3つの まとまりを ぜんぶ あわせるよ。', 'はじめに 2つの まとまりを ひとつに できるよ。',
      `${a}＋${b}＝${ab}。つぎに ${ab}＋${c}＝${total}。`,
      `きいろの ${c}こを のぞくと ${total}−${c}＝${ab}。あかと あおを あわせた かずに もどるね。`,
      '2つの いろだけで おわらず、3つめの いろも いれよう。'], 1,
    { kind: 'tenFrame', first: a, second: b, third: c });
}

function target(a, b, c, goal) {
  const ab = a + b;
  const abc = ab + c;
  return item('target', [a,b,c,goal],
    `かごに あかの たまが ${a}こ、あおが ${b}こ、きいろが ${c}こ あります。${goal}こに するには、あと なんこ いれますか？`,
    goal - abc,
    ['かごに いま なんこ あるか、さきに しらべよう。', 'いまの かずから ほしい かずまで、いくつ ふやすかを かんがえよう。',
      `${a}＋${b}＋${c}で いまの かずを もとめて、${goal}から ひこう。`],
    [`かごが ${goal}こに なるまで、あと いくつかを もとめるよ。`, 'ほしい かずから、すでに ある たまを のぞくと、あとで いれる かずが わかるよ。',
      `${a}＋${b}＝${ab}。 ${ab}＋${c}＝${abc}。 ${goal}−${abc}＝${goal-abc}。`,
      `${abc}＋${goal-abc}＝${goal}。ほしい かずに なったね。`, 'きいろの たまも、すでに ある ぶんに いれよう。'], 2);
}

function splitTotal(a, b, c, d) {
  const total = a+b+c+d;
  const known = a+b+c;
  return item('splitTotal', [a,b,c,total],
    `カードは あわせて ${total}まい です。ルミに ${a}まい、ミオに ${b}まい、イオに ${c}まい わたしました。のこりは なんまい ですか？`,
    d,
    ['わたした カードと のこりを わけて かんがえよう。', 'わたした 3人ぶんを あわせると、へった まいすうが わかるよ。',
      `${a}＋${b}＋${c}を けいさんして、${total}から ひこう。`],
    ['まだ わたして いない カードを もとめるよ。', 'さいしょの カードは、わたした ぶんと のこりに わかれるよ。',
      `${a}＋${b}＝${a+b}。 ${a+b}＋${c}＝${known}。 ${total}−${known}＝${d}。`,
      `わたした ${known}まいと のこりの ${d}まいで ${known}＋${d}＝${total}。`,
      '1人ずつ わたした まいすうを、3人ぶん とも いれよう。'], 2);
}

function compareGroups(a, b, c, d) {
  const red = a+b;
  const blue = c+d;
  return item('compareGroups', [a,b,c,d],
    `あかの はこには、おおきい たまが ${a}こ、ちいさい たまが ${b}こ あります。あおの はこには、おおきい たまが ${c}こ、ちいさい たまが ${d}こ あります。あかの はこは あおより なんこ おおいですか？`,
    red-blue,
    ['はこごとの ぜんぶの かずを くらべよう。', 'それぞれの はこの ふたつの まとまりを あわせよう。',
      `あかは ${a}＋${b}、あおは ${c}＋${d}。あかの かずから あおの かずを ひこう。`],
    ['あかと あおの たまの かずの ちがいを もとめるよ。', 'ちがいは、おおい ほうから すくない ほうを ひくと わかるよ。',
      `${a}＋${b}＝${red}。 ${c}＋${d}＝${blue}。 ${red}−${blue}＝${red-blue}。`,
      `あおに ちがいの ぶんを たすと ${blue}＋${red-blue}＝${red}。あかと おなじ かずに なるよ。`,
      'はこの かたほうの まとまり だけを くらべないよ。'], 3);
}

function returnSome(start, added, returned) {
  const subtotal = start + added;
  const left = subtotal - returned;
  return item('returnSome', [start, added, returned],
    `ルミは シールを ${start}まい もっています。${added}まい もらい、そのあと ${returned}まい わたしました。いま なんまい ありますか？`,
    left,
    ['もらった ときと、わたした ときを わけて かんがえよう。', 'もらうと ふえるよ。わたすと へるよ。',
      `${start}＋${added}で もらった あとの かずが わかるよ。そこから ${returned}を ひこう。`],
    ['もらってから わたした あとの まいすうを もとめるよ。', 'おはなしの じゅんばんに、ふえたり へったり する かずを たどろう。',
      `${start}＋${added}＝${subtotal}。 ${subtotal}−${returned}＝${left}。`,
      `わたした ${returned}まいを もとに もどすと ${left}＋${returned}＝${subtotal}。もらった あとの かずだね。`,
      'わたした まいすうまで たさないよ。わたすと ルミの シールは へるよ。'], 2);
}

function refill(start, removed, goal) {
  const remaining = start - removed;
  const needed = goal - remaining;
  return item('refill', [start, removed, goal],
    `いれものに たまが ${start}こ ありました。${removed}こ とりだしました。いまから いくつ いれると ${goal}こに なりますか？`,
    needed,
    ['とりだした あと、いま いくつ あるかを かんがえよう。', 'ほしい かずまで、あと いくつ たすと とどくかな。',
      `${start}−${removed}で いまの かずが わかるよ。そこから ${goal}まで かぞえよう。`],
    ['たまを とりだした あとで、いくつ いれれば よいかを もとめるよ。',
      'はじめの かずではなく、いま ある かずを たしざんの はじまりに するよ。',
      `${start}−${removed}＝${remaining}。 ${goal}−${remaining}＝${needed}。`,
      `いま ある ${remaining}こに ${needed}こを いれると ${remaining}＋${needed}＝${goal}。`,
      'とりだした かずと、あとで いれる かずは、いつも おなじでは ないよ。'], 3);
}

function twoCollections(a, b, c, d) {
  const lumi = a + c;
  const mio = b + d;
  return item('twoCollections', [a, b, c, d],
    `ルミは ${a}こ、ミオは ${b}こ きのみを もっています。ルミが あとで ${c}こ、ミオが ${d}こ ひろいました。ふたりで いま なんこ もっていますか？`,
    lumi + mio,
    ['はじめに あった きのみと、あとから ひろった きのみを みつけよう。',
      'ひとりずつ いまの かずを もとめてから、ふたりぶんを あわせよう。',
      `ルミは ${a}＋${c}、ミオは ${b}＋${d}。それぞれの こたえを あわせよう。`],
    ['ふたりが いま もっている ぜんぶの きのみを もとめるよ。',
      'ひろった ぶんだけ、ふたりの きのみは ふえるよ。',
      `ルミは ${a}＋${c}＝${lumi}。ミオは ${b}＋${d}＝${mio}。 ${lumi}＋${mio}＝${lumi+mio}。`,
      `はじめは ${a}＋${b}＝${a+b}。ひろったのは ${c}＋${d}＝${c+d}。 ${a+b}＋${c+d}＝${lumi+mio}で おなじだね。`,
      'ひとりぶんだけで おわらず、さいごに ふたりの かずを あわせるよ。'], 3);
}

export function earlyAdditionPools() {
  const pools = new Map(['joinThree', 'target', 'splitTotal', 'compareGroups', 'returnSome', 'refill', 'twoCollections'].map(kind => [kind, []]));
  const add = question => pools.get(question.kind).push(question);
  for (let a=1; a<=7; a++) for (let b=a; a+b<=8; b++) {
    for (let c=b; a+b+c<=9; c++) {
      add(joinThree(a,b,c));
      for (let goal=a+b+c+1; goal<=9; goal++) add(target(a,b,c,goal));
    }
    for (let c=1; c<=7; c++) for (let d=c; c+d<a+b; d++) {
      add(compareGroups(a,b,c,d));
    }
  }
  for (let a=1; a<=6; a++) for (let b=a; a+b<=7; b++) {
    for (let c=b; a+b+c<9; c++) for (let total=a+b+c+1; total<=9; total++) {
      add(splitTotal(a,b,c,total-a-b-c));
    }
  }
  for (let start=1; start<=8; start++) for (let added=1; start+added<=9; added++) {
    for (let returned=1; returned<start+added; returned++) {
      if (returned !== added) add(returnSome(start, added, returned));
    }
  }
  for (let start=2; start<=8; start++) for (let removed=1; removed<start; removed++) {
    for (let goal=start+1; goal<=9; goal++) add(refill(start, removed, goal));
  }
  for (let a=1; a<=5; a++) for (let b=a; a+b<=7; b++) {
    for (let c=1; a+b+c<9; c++) for (let d=1; a+b+c+d<=9; d++) {
      if ((a !== b || c <= d) && a + c !== b + d) add(twoCollections(a, b, c, d));
    }
  }
  return pools;
}
