const objective = '10と いまの かずの ちがいから、たりない かずを みつける。';

function problem(kind, values, stem, answer, focus, rule, hint, solution, proof, caution, difficulty = 2) {
  return { kind, values, stem, answer, hints: [focus, rule, hint],
    steps: ['10を つくるために、きかれて いる かずを みつけるよ。', rule, solution, proof, caution], difficulty };
}

export function makeTenPools() {
  const pools = new Map();
  function add(question) {
    if (!pools.has(question.kind)) pools.set(question.kind, []);
    pools.get(question.kind).push(question);
  }
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    const gap = 10 - a;
    const otherGap = 10 - b;
    if (a < b) {
      add(problem('tenCompareGaps', [a,b],
        `ルミの はこには ${a}こ、ミオの はこには ${b}こ たまが あります。それぞれの はこを 10こに します。ルミは ミオより なんこ おおく いれますか？`, gap-otherGap,
        'ふたりの はこで、あと いくつ いるかを くらべよう。', '10から いま ある かずを ひくと、あとで いれる かずが わかるよ。',
        `ルミは 10−${a}、ミオは 10−${b}で、たりない かずを もとめよう。`,
        `10−${a}＝${gap}。10−${b}＝${otherGap}。 ${gap}−${otherGap}＝${gap-otherGap}。`,
        `はじめの さは ${b}−${a}＝${gap-otherGap}。そのぶんだけ ルミに おおく いるよ。`,
        'たまが すくない ほうに、おおく いれるよ。'));
    }
    // Reverse a removal before finding the complement. Both actions affect the answer.
    if (b < a) {
      const after = a-b;
      const fill = 10-after;
      add({ ...problem('tenAfterRemoval', [a,b],
        `カードは ${a}まい あります。${b}まいを かたづけてから、のこった カードを 10まいに ふやします。あと なんまい いりますか？`, fill,
        'かたづけた あとの かずを かんがえよう。', 'たりない かずは、いまの かずを 10から ひくと わかるよ。',
        `${a}−${b}で のこりを しらべ、その かずを 10から ひこう。`,
        `${a}−${b}＝${after}。10−${after}＝${fill}。`, `${after}＋${fill}＝10。かたづけた あとから 10に なったね。`,
        'はじめの まいすうを 10から ひくと、かたづけた ぶんが ぬけるよ。'), diagram: { kind: 'takeAway', total: a, used: b } });
    }
    for (let c = 1; c <= 9; c++) {
      // Given two sources, find how much of the second must be used.
      if (a+b<10 && c>10-a-b && a<=b) {
        const remain = 10-a-b;
        add(problem('tenSecondSource', [a,b,c],
          `かごに たまが ${a}こ あります。あかの はこの ${b}こは ぜんぶ かごへ いれます。あおの はこには ${c}こ あります。あおの はこから たまを うつして、かごを 10こに します。あおの はこに なんこ のこりますか？`, c-remain,
          'あかの たまを いれてから、あおを かんがえよう。', '10までの たりない かずは、たまを いれるたびに へるよ。',
          `${a}＋${b}を 10から ひくと、あおから うつす かずが わかるよ。その かずを あおの ${c}こから ひこう。`,
          `${a}＋${b}＝${a+b}。10−${a+b}＝${remain}。 ${c}−${remain}＝${c-remain}。`,
          `${a+b}＋${remain}＝10。あおは うつした ${remain}こと のこりの ${c-remain}こで ${remain}＋${c-remain}＝${c}だね。`,
          'あおを ぜんぶ いれると、10より おおく なるよ。'));
      }
      // One batch is reserved, so there is a genuine shortfall to work out.
      if (c<b && a+b-c<10 && a+b>=10) {
        const available = b-c;
        const now = a+available;
        add(problem('tenReserved', [a,b,c],
          `はこに ${a}こ たまが あります。そとの ${b}この うち ${c}こは べつの あそびに つかいます。のこりを ぜんぶ はこに いれても 10こに たりません。さらに なんこ ひつようですか？`, 10-now,
          'べつの あそびに つかう たまを のぞこう。', 'はこに いれられる かずを もとめてから、10までの さを しらべよう。',
          `${b}−${c}を もとめて ${a}に たす。そのあとで 10までの さを みつけよう。`,
          `${b}−${c}＝${available}。 ${a}＋${available}＝${now}。10−${now}＝${10-now}。`,
          `${now}＋${10-now}＝10。べつに とって おいた ${c}こは つかって いないよ。`,
          'とって おく たままで はこに いれると、はこの かずが ちがって しまうよ。', 3));
      }
      if (a<b && c<otherGap) {
        // The same increment affects both complements.
        const red = a+c;
        const blue = b+c;
        add(problem('tenEqualShare', [a,b,c],
          `あかの はこに ${a}こ、あおの はこに ${b}こ たまが あります。どちらにも ${c}こずつ いれました。りょうほうを 10こずつに するには、ぜんぶで あと なんこ いれますか？`, 20-red-blue,
          'りょうほうの はこで ふえた ぶんを みよう。', 'はこごとに 10まで いくつ いるかを しらべて、たそう。',
          `${a}＋${c}と ${b}＋${c}で いまの かずを もとめ、それぞれを 10から ひこう。`,
          `${a}＋${c}＝${red}。 ${b}＋${c}＝${blue}。10−${red}＝${10-red}。10−${blue}＝${10-blue}。 ${10-red}＋${10-blue}＝${20-red-blue}。`,
          `${red}＋${10-red}＝10。 ${blue}＋${10-blue}＝10。どちらも 10に なるね。`,
          'ひとつの はこだけの かずで おわらないよ。', 2));
      }
      if (a+b<10 && b<=c && a+b+c>10) {
        const partial = a+b;
        const full = partial+c;
        add(problem('tenTrimAfterTwo', [a,b,c],
          `かごに ${a}こ たまが あります。はじめに ${b}こ、つぎに ${c}こ いれると、10こを こえました。10こに へらすには、なんこ とりだしますか？`, full-10,
          '2かい いれた あとの かずを しらべよう。', '10を こえた ぶんだけ とりだすと 10に なるよ。',
          `${a}＋${b}＋${c}で たまの かずを もとめ、10を ひこう。`,
          `${a}＋${b}＝${partial}。 ${partial}＋${c}＝${full}。 ${full}−10＝${full-10}。`,
          `${full}−${full-10}＝10。とりだした あとに 10こ のこるね。`,
          'いれた たまを ぜんぶ とりださず、10を こえた ぶんだけ とりだすよ。', 3));
      }
      if (a+b<=9 && c<b && a+c>b-c) {
        const donor = b-c;
        const recipient = a+c;
        add(problem('tenShift', [a,b,c],
          `あかに ${a}こ、あおに ${b}こ たまが あります。あおから あかへ ${c}こ うつしました。どちらも 10こに します。あおには あかより なんこ おおく いれますか？`, recipient-donor,
          'どちらの たまが へったかを たしかめよう。', 'うつした あとの かずから、10まで いくつ いるかを べつべつに しらべるよ。',
          `${a}＋${c}が あか、${b}−${c}が あお。どちらも 10までの かずを しらべて くらべよう。`,
          `${a}＋${c}＝${recipient}。 ${b}−${c}＝${donor}。10−${recipient}＝${10-recipient}。10−${donor}＝${10-donor}。 ${10-donor}−${10-recipient}＝${recipient-donor}。`,
          `${donor}＋${10-donor}＝10。 ${recipient}＋${10-recipient}＝10。どちらの はこも 10に なるね。`,
          'あおは たまを うけとった のではなく、あかへ わたしたよ。', 3));
      }
    }
  }
  return pools;
}

export const makeTenObjective = objective;
export const makeTenStages = [
  ['e1.n16', { tenCompareGaps: 24, tenAfterRemoval: 26, tenSecondSource: 30, tenTrimAfterTwo: 20 }],
  ['e1.n17', { tenCompareGaps: 12, tenAfterRemoval: 10, tenSecondSource: 35, tenEqualShare: 23, tenTrimAfterTwo: 20 }],
  ['e1.n18', { tenSecondSource: 30, tenReserved: 30, tenEqualShare: 20, tenShift: 20 }],
  ['e1.n19', { tenTrimAfterTwo: 30, tenReserved: 25, tenShift: 25, tenEqualShare: 20 }],
  ['e1.n20', { tenTrimAfterTwo: 33, tenReserved: 30, tenShift: 16, tenEqualShare: 21 }],
];
