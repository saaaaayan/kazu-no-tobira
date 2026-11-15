function exercise(kind, values, stem, answer, hints, solution, proof, caution, difficulty, diagram) {
  return { kind, values, stem, answer, hints, steps: [hints[0], hints[1], solution, proof, caution], difficulty, diagram };
}

function borrow(total, used) {
  const ones = total-10;
  const first = 10-used;
  return `${total}は 10と ${ones}。10の まとまりを くずして 10−${used}＝${first}。ばらを あわせて ${first}＋${ones}＝${total-used}。`;
}

export function borrowSubtractionPools() {
  const pools = new Map();
  function add(question) {
    if (!pools.has(question.kind)) pools.set(question.kind, []);
    pools.get(question.kind).push(question);
  }
  for (let total=11; total<=18; total++) for (let used=total-9; used<=9; used++) {
    const rest = total-used;
    const ones = total-10;
    add(exercise('borrowDirect', [total,used],
      `かごに たまが ${total}こ あります。${used}こ とりだすと、なんこ のこりますか？`, rest,
      ['10の まとまりと、ばらを みつけよう。', 'ばらだけでは たりないので、10の まとまりを くずして ひこう。',
        `${total}を 10と ${ones}に わけよう。10から ${used}を ひいて、ばらを たそう。`],
      borrow(total,used), `${rest}＋${used}＝${total}。とりだした ぶんを もどすと もとの かずだね。`,
      '10から ひいた あと、はじめの ばらを たすのを わすれないよ。', 1,
      { kind: 'borrowTen', total, used }));
    for (let later=1; later<rest; later++) {
      const left = rest-later;
      add(exercise('borrowThenUse', [total,used,later],
        `シールが ${total}まい あります。あさに ${used}まい、ひるに ${later}まい つかいました。いま なんまい のこっていますか？`, left,
        ['あさの あとの のこりを まず みつけよう。', 'はじめに 10の まとまりを くずして ひこう。それから ひるの ぶんも ひくよ。',
          `${total}から ${used}を ひき、そこから さらに ${later}を ひこう。`],
        borrow(total,used) + ` ${rest}−${later}＝${left}。`,
        `ひるの ぶんを もどすと ${left}＋${later}＝${rest}。あさの のこりに なるね。`,
        'あさの ぶんだけを ひいて おわらないよ。', 2));

      add(exercise('borrowFindLater', [total,used,left],
        `カードが ${total}まい ありました。ルミに ${used}まい わたし、ミオにも わたすと ${left}まい のこりました。ミオに なんまい わたしましたか？`, later,
        ['ルミに わたした あとの まいすうを しらべよう。', 'ルミに わたす ときに 10の まとまりを くずすよ。その のこりと さいごの かずを くらべよう。',
          `${total}−${used}で ルミに わたした あとの かずが わかるよ。そこから ${left}を ひこう。`],
        borrow(total,used) + ` ${rest}−${left}＝${later}。`,
        `${rest}−${later}＝${left}。ミオに わたした あとの のこりに もどるよ。`,
        'はじめの かずから さいごの かずを ひくと、ルミに わたした ぶんも まざるよ。', 3));

      add(exercise('borrowNeedMore', [total,used,rest+later],
        `はこに つみきが ${total}こ ありました。${used}こ つかいましたが、つぎの あそびに ${rest+later}こ いります。あと なんこ ひつようですか？`, later,
        ['つかった あとに いくつ のこって いるかを みつけよう。', 'のこりを もとめてから、ほしい かずまで いくつ たりないかを しらべよう。',
          `${total}−${used}が のこり。その かずを ${rest+later}から ひこう。`],
        borrow(total,used) + ` ${rest+later}−${rest}＝${later}。`,
        `${rest}＋${later}＝${rest+later}。つぎの あそびに いる かずだね。`,
        'つぎの あそびに いる ぜんぶの かずと、いま たりない かずを わけて かんがえよう。', 2));
    }
    for (let other=11; other<=18; other++) for (let otherUsed=other-9; otherUsed<=9; otherUsed++) {
      const otherRest = other-otherUsed;
      if (rest <= otherRest || used === otherUsed || total === other) continue;
      add(exercise('borrowCompare', [total,other,used,otherUsed],
        `あかの かごに ${total}こ、あおの かごに ${other}こ たまが あります。あかから ${used}こ、あおから ${otherUsed}こ とりだすと、あかは あおより なんこ おおいですか？`, rest-otherRest,
        ['2つの かごの のこりを べつべつに もとめよう。', 'どちらの かごも 10の まとまりを くずして ひこう。それから のこりを くらべよう。',
          `あかは ${total}−${used}、あおは ${other}−${otherUsed}。のこりが わかったら さを もとめよう。`],
        'あかは ' + borrow(total,used) + ' あおは ' + borrow(other,otherUsed) + ` ${rest}−${otherRest}＝${rest-otherRest}。`,
        `あおの のこりに さを たすと ${otherRest}＋${rest-otherRest}＝${rest}。あかと おなじ かずに なるね。`,
        'とりだす まえの かずを くらべないよ。', 3));
    }
  }
  return pools;
}

export const borrowSubtractionStages = [
  ['e1.n31', { borrowDirect: 36, borrowThenUse: 29, borrowFindLater: 15, borrowNeedMore: 20 }],
  ['e1.n32', { borrowThenUse: 32, borrowFindLater: 22, borrowNeedMore: 26, borrowCompare: 20 }],
  ['e1.n33', { borrowThenUse: 31, borrowFindLater: 24, borrowNeedMore: 22, borrowCompare: 23 }],
  ['e1.n34', { borrowThenUse: 24, borrowFindLater: 30, borrowNeedMore: 19, borrowCompare: 27 }],
  ['e1.n35', { borrowThenUse: 21, borrowFindLater: 26, borrowNeedMore: 20, borrowCompare: 33 }],
];
