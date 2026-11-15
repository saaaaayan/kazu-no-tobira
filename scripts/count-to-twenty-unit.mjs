function task(kind, values, stem, answer, hints, steps, difficulty, diagram) {
  return { kind, values, stem, answer, hints, steps, difficulty, diagram };
}

export function countToTwentyPools() {
  const pools = new Map();
  function add(question) {
    if (!pools.has(question.kind)) pools.set(question.kind, []);
    pools.get(question.kind).push(question);
  }
  for (let ones = 1; ones <= 9; ones++) {
    const total = 10 + ones;
    add(task('twentyBundle', [ones],
      `10この まとまりが ひとつと、ばらの たまが ${ones}こ あります。ぜんぶで なんこ ですか？`, total,
      ['まとまりと ばらを わけて みよう。', 'まとまり ひとつは 10こだよ。', `10と ばらの ${ones}こを あわせよう。`],
      ['まとまりと ばらの たまを ぜんぶ かぞえるよ。', '10こは もう ひとつに まとまって いるよ。',
        `10＋${ones}＝${total}。`, `${total}−10＝${ones}。ばらの かずに もどるよ。`, 'まとまりは 1こではなく、10こと かぞえるよ。'],
      1, { kind: 'tenFrame', first: 10, second: ones }));
    add(task('twentyOnes', [total],
      `たまが ${total}こ あります。10こを ひとまとめに すると、ばらは なんこですか？`, ones,
      ['10こを ひとまとめに するよ。', 'ばらは、まとまりに いれなかった ぶんだよ。', `${total}から 10を ひこう。`],
      ['10こを まとめた あと、ばらが いくつか しらべるよ。', 'まとまりに つかった 10こは、ばらに いれないよ。',
        `${total}−10＝${ones}。`, `10＋${ones}＝${total}。ぜんぶの かずに もどるよ。`, 'まとまりの かずと、ばらの かずを わけよう。'], 1));
  }
  for (let start = 6; start < 20; start++) for (let end = Math.max(11, start+2); end <= 20; end++) {
    const span = end-start;
    add(task('twentyPosition', [start,span],
      `${start}から ${span}つ すすむと、どの かずに つきますか？`, end,
      ['はじめに いる かずを みつけよう。', 'ひとつ すすむと、ひとつ おおきな かずに つくよ。', `${start}の つぎから ${span}かい すすもう。`],
      ['すすんだ あとの かずを もとめるよ。', 'はじめの かずは、まだ うごいて いない ばしょだよ。',
        `すすんだ じゅんに ${Array.from({length:span}, (_,i)=>start+i+1).join('、')}。 ${start}＋${span}＝${end}。`,
        `${end}から ${span}つ もどると ${end}−${span}＝${start}。`, 'はじめの かずを 1かいめに かぞえないよ。'], 1));
    add(task('twentyInner', [start,end],
      `${start}から ${end}まで かずの カードを じゅんに ならべます。りょうはしを のぞくと、なんまい ありますか？`, span-1,
      ['りょうはしの カードは かぞえないよ。', 'はじめより ひとつ おおきい カードから、おわりの ひとつ まえまで かぞえるよ。',
        `${start}の つぎから、${end}の まえまでを かぞえよう。`],
      ['りょうはしの あいだの カードの まいすうを もとめるよ。', 'となりへ うごく かいすうと、あいだの カードの まいすうは ちがうよ。',
        `${end}−${start}＝${span}かい うごくね。おわりの カードを のぞくので ${span}−1＝${span-1}まい。`,
        `${start+1}から ${end-1}まで ならべて かぞえると ${span-1}まい。`, 'おわりの カードを いれないよ。'], 2));
    if (span % 2 === 0 && start+span/2>10) {
      const middle = start+span/2;
      add(task('twentyMiddle', [start,end],
        `${start}から ${end}までの カードを じゅんに ならべます。まんなかの かずは いくつですか？`, middle,
        ['りょうはしから おなじ まいすうずつ のぞこう。', 'まんなかから りょうはしまで、うごく かいすうが おなじだよ。',
          `${start}から ${end}まで ならべ、りょうはしを 1まいずつ はずそう。`],
        ['まんなかの カードを みつけるよ。', 'りょうはしから 1まいずつ はずすと、まんなかが のこるよ。',
          `それぞれから ${span/2}まい はずすと ${start}＋${span/2}＝${middle}。`,
          `${middle}−${start}＝${span/2}。 ${end}−${middle}＝${span/2}。りょうはしまで おなじだね。`, 'かずを とばさずに ならべよう。'], 2));
    }
    for (let pivot = start+1; pivot < end; pivot++) {
      const left = pivot-start;
      const right = end-pivot;
      if (start < 10 && pivot > 10) {
        const positions = [[end,start,pivot], [pivot,end,start], [start,pivot,end]];
        const order = positions[(start+pivot+end) % positions.length];
        const cards = order.join('、');
        add(task('twentyOrder', order,
          `カードは ${cards}です。ちいさい ほうから ならべると、まんなかは どの かずですか？`, pivot,
          ['ちいさい かずから じゅんに ならべよう。', '10より ちいさい かずを さきに みつけよう。',
            `${cards}の うち、10より おおきい ふたつを くらべよう。`],
          ['まんなかに くる カードを えらぶよ。', '10を こえる カードは、10より ちいさい カードより あとに くるよ。',
            `${start}<${pivot}<${end}。まんなかは ${pivot}。`,
            `${pivot}より ちいさい カードと、おおきい カードが 1まいずつ あるね。`,
            'もんだいに かいて ある じゅんばんの まんなかを えらばないよ。'], 2));
      }
      if (left !== right && end >= 15 && left+right >= 5) {
        const nearest = left < right ? start : end;
        add(task('twentyNearest', [start,pivot,end],
          `${pivot}から、カードの ${start}と ${end}の どちらが ちかいですか？ちかい カードの かずを こたえましょう。`, nearest,
          ['はじめの かずから、どちらまで なんかい うごくか くらべよう。', 'かずの ならびで、うごく かいすうが すくない ほうが ちかいよ。',
            `${pivot}から ${start}まで と、${pivot}から ${end}までを それぞれ かぞえよう。`],
          ['はじめの かずに ちかい カードを えらぶよ。', 'となりへ うごく かいすうを くらべるよ。',
            `${pivot}−${start}＝${left}かい。 ${end}−${pivot}＝${right}かい。 ${Math.min(left,right)}かいで つくのは ${nearest}。`,
            `もう いっぽうは ${Math.max(left,right)}かい かかるね。`, 'カードの かずの おおきさではなく、はなれた かいすうを くらべよう。'], 3));
      }
      if (start >= 10 && pivot-start >= 2 && end-pivot >= 2) {
        add(task('twentyTwoMoves', [start,pivot,end],
          `はじめに ${start}に います。${end}まで すすみ、それから ${pivot}に もどります。すすんだ かいすうと もどった かいすうを あわせると、なんかい うごきましたか？`, span+right,
          ['すすむ うごきと もどる うごきが あるね。', 'さいしょに すすむ うごきと、あとで もどる うごきを わけるよ。',
            `${start}から ${end}に ついたら、そこから ${pivot}までを かぞえよう。`],
          ['すすんだ ぶんと もどった ぶんを あわせるよ。', 'どちらに うごいても、となりへ うごくと 1かいだよ。',
            `${end}−${start}＝${span}かい。 ${end}−${pivot}＝${right}かい。 ${span}＋${right}＝${span+right}かい。`, `${span+right}−${right}＝${span}。もどった ぶんを ひくと、すすんだ かいすうに なるね。`,
            'さいしょの ばしょと さいごの ばしょの ちがいを こたえるのでは ないよ。'], 3));
      }
    }
  }
  return pools;
}

export const countToTwentyStages = [
  ['e1.n21', { twentyBundle: 9, twentyOnes: 9, twentyPosition: 32, twentyInner: 25, twentyMiddle: 25 }],
  ['e1.n22', { twentyPosition: 28, twentyInner: 25, twentyMiddle: 8, twentyNearest: 19, twentyOrder: 20 }],
  ['e1.n23', { twentyPosition: 18, twentyInner: 18, twentyNearest: 29, twentyTwoMoves: 15, twentyOrder: 20 }],
  ['e1.n24', { twentyPosition: 5, twentyInner: 16, twentyNearest: 29, twentyTwoMoves: 25, twentyOrder: 25 }],
  ['e1.n25', { twentyPosition: 2, twentyInner: 1, twentyNearest: 32, twentyTwoMoves: 37, twentyOrder: 28 }],
];
