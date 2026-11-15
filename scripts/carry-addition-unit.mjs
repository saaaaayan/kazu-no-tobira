function make(kind, values, stem, answer, hints, solution, proof, caution, difficulty, diagram) {
  return { kind, values, stem, answer, hints, difficulty, diagram,
    steps: [hints[0], hints[1], solution, proof, caution] };
}

function carrySteps(a, b) {
  const missing = 10-a;
  return `${b}を ${missing}と ${b-missing}に わける。 ${a}＋${missing}＝10。10＋${b-missing}＝${a+b}。`;
}

export function carryAdditionPools() {
  const pools = new Map();
  function add(question) {
    if (!pools.has(question.kind)) pools.set(question.kind, []);
    pools.get(question.kind).push(question);
  }
  for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) {
    const total = a+b;
    if (total <= 10) continue;
    const missing = 10-a;
    for (let c = 1; c < total-10; c++) {
      if (a > b) continue;
      add(make('carryThenUse', [a,b,c],
        `ルミは きのみを ${a}こ もち、${b}こ ひろいました。そのあと ${c}こ つかうと、いくつ のこりますか？`, total-c,
        ['ひろった あとの かずを まず もとめよう。', 'たす ときは 10の まとまりを つくるよ。そのあと、つかった ぶんを ひこう。',
          `${a}を 10に するために ${b}から ${missing}を つかい、のこりも たす。そのあと ${c}を ひこう。`],
        carrySteps(a,b) + ` ${total}−${c}＝${total-c}。`,
        `つかった ぶんを もどすと ${total-c}＋${c}＝${total}。`,
        'つかった かずは、ひろう まえの かずではなく、ひろった あとの かずから ひこう。', 2));
    }
    for (let extra = 1; total+extra <= 19; extra++) {
      const finish = total+extra;
      add(make('carryFindFirstGain', [a,extra,finish],
        `シールが はじめに ${a}まい ありました。あさに もらい、ひるにも ${extra}まい もらうと、ぜんぶで ${finish}まいに なりました。あさに なんまい もらいましたか？`, b,
        ['ひるに もらう まえの まいすうを みつけよう。', 'ひるの ぶんを ひくと、あさの あとに もどるよ。そこから はじめの かずを ひこう。',
          `${finish}−${extra}で あさの あとの かず。その かずから ${a}を ひこう。`],
        `${finish}−${extra}＝${total}。 ${total}−${a}＝${b}。`,
        carrySteps(a,b) + ` ひるの ぶんも たすと ${total}＋${extra}＝${finish}。`,
        'ぜんぶから はじめの かずだけを ひくと、ひるの ぶんも のこるよ。', 3));
    }
    for (let c = 2; c <= 9 && a <= b; c++) for (let d = c; d <= 9; d++) {
      const other = c+d;
      if (other <= 10 || other >= total) continue;
      add(make('carryCompare', [a,b,c,d],
        `あかの はこには おおきい たまが ${a}こ、ちいさい たまが ${b}こ あります。あおの はこには おおきい たまが ${c}こ、ちいさい たまが ${d}こ あります。あかは あおより なんこ おおいですか？`, total-other,
        ['はこごとの たまを あわせてから くらべよう。', 'どちらも 10の まとまりと、10を こえた ぶんに わけられるよ。',
          `あかは ${a}＋${b}、あおは ${c}＋${d}。10を こえた ぶんを くらべよう。`],
        carrySteps(a,b) + ' あおは ' + carrySteps(c,d) + ` ${total-10}−${other-10}＝${total-other}。`,
        `あおに ${total-other}こ たすと ${other}＋${total-other}＝${total}。`,
        'おおきい たまの かずだけを くらべないよ。', 3));
    }
  }
  for (let a = 1; a <= 8; a++) for (let b = a; a+b < 10; b++) {
    const before = a+b;
    for (let c = 11-before; c <= 9; c++) {
      const total = before+c;
      add(make('carryThreeGroups', [a,b,c],
        `あかの たまが ${a}こ、あおが ${b}こ あります。あとで きいろの たまを ${c}こ いれました。ぜんぶで いくつですか？`, total,
        ['はじめの 2つの まとまりを みつけよう。', 'はじめの かずを もとめ、きいろで 10の まとまりを つくろう。',
          `${a}＋${b}を もとめよう。その かずに ${c}の いちぶを たして 10を つくろう。`],
        `${a}＋${b}＝${before}。 ` + carrySteps(before,c),
        `${total}−${c}＝${before}。はじめの かずに もどるね。`,
        'きいろの たまは、10に つかった ぶんと のこりの りょうほうを たすよ。', 2,
        { kind: 'tenFrame', first: a, second: b, third: c }));
      for (let goal = 11; goal < total; goal++) {
        add(make('carryPackTarget', [a,b,c,goal],
          `ふくろに あかの たまが ${a}こ、あおが ${b}こ あります。そこへ きいろを ${c}こ いれました。${goal}こを はこへ うつすと、ふくろに いくつ のこりますか？`, total-goal,
          ['ふくろに ぜんぶで なんこ あるかを さきに しらべよう。', '10を つくって ぜんぶを かぞえ、そのあと はこへ うつす ぶんを ひこう。',
            `${a}＋${b}＋${c}で ぜんぶを もとめ、${goal}を ひこう。`],
          `${a}＋${b}＝${before}。 ` + carrySteps(before,c) + ` ${total}−${goal}＝${total-goal}。`,
          `${goal}＋${total-goal}＝${total}。はこと ふくろを あわせると もとの かずだね。`,
          'はこへ うつした ぶんは、ふくろの のこりに ふくめないよ。', 3));
      }
    }
  }
  return pools;
}

export const carryAdditionStages = [
  ['e1.n26', { carryThreeGroups: 45, carryThenUse: 35, carryPackTarget: 20 }],
  ['e1.n27', { carryThreeGroups: 32, carryThenUse: 15, carryPackTarget: 25, carryFindFirstGain: 28 }],
  ['e1.n28', { carryThreeGroups: 20, carryPackTarget: 25, carryFindFirstGain: 30, carryCompare: 25 }],
  ['e1.n29', { carryThreeGroups: 12, carryPackTarget: 25, carryFindFirstGain: 38, carryCompare: 25 }],
  ['e1.n30', { carryPackTarget: 25, carryFindFirstGain: 45, carryCompare: 30 }],
];
