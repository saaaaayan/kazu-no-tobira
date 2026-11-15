function task(kind, values, stem, answer, hints, solution, proof, caution, difficulty, diagram) {
  return { kind, values, stem, answer, hints, difficulty, diagram,
    steps: [hints[0], hints[1], solution, proof, caution] };
}

export function countToHundredPools() {
  const pools = new Map();
  function add(q) {
    if (!pools.has(q.kind)) pools.set(q.kind, []);
    pools.get(q.kind).push(q);
  }

  for (let tens = 2; tens <= 10; tens++) for (let ones = 0; ones <= 9 && 10*tens+ones <= 100; ones++) {
    const base = 10*tens;
    const total = base+ones;
    add(task('hundredBundle', [tens,ones],
      `10この まとまりが ${tens}こ、ばらの たまが ${ones}こ あります。ぜんぶで なんこですか？`, total,
      ['10の まとまりと ばらを わけて みよう。', 'まとまりを 10ずつ かぞえ、さいごに ばらを たすよ。',
        `まとまり ${tens}こを 10ずつ かぞえて、ばらの ${ones}こを たそう。`],
      `まとまりは ${base}こ。 ${base}＋${ones}＝${total}。`,
      `${total}−${ones}＝${base}。ばらを のぞくと まとまりだけに なるね。`,
      'まとまりを 1こと かぞえないよ。', 1, { kind: 'bundlesAndOnes', tens, ones }));

    for (let jumps = 1; jumps <= 6 && total+10*jumps <= 100; jumps++) {
      const end = total+10*jumps;
      add(task('hundredTensForward', [total,jumps],
        `${total}から 10ずつ ${jumps}かい すすむと、どの かずですか？`, end,
        ['はじめの かずの ばらを みつけよう。', '10ずつ すすむと、まとまりの かずが ふえるよ。',
          `${total}から ${jumps}かい、10を くりかえし たそう。`],
        `じゅんに ${Array.from({ length: jumps }, (_, i) => total+10*(i+1)).join('、')}。あわせて ${10*jumps}ふえるから ${total}＋${10*jumps}＝${end}。`,
        `${end}−${10*jumps}＝${total}。もどると はじめの かずだね。`,
        '1ずつではなく、10ずつ すすむよ。', 2));
    }

    for (let first = tens+1; first <= 9; first++) for (let otherOnes = 1; otherOnes < ones; otherOnes++) {
      const other = 10*first+otherOnes;
      // The larger number has fewer ones, so the tens determine the answer.
      const show = (first+ones+otherOnes) % 2 ? [total,other] : [other,total];
      add(task('hundredComparePlaces', show,
        `${show[0]}と ${show[1]}では、どちらが おおきいですか？おおきい かずを こたえましょう。`, other,
        ['10の まとまりから くらべよう。', '10の まとまりの かずが ちがう ときは、おおい ほうが おおきいよ。',
          `${show[0]}と ${show[1]}を、それぞれ 10の まとまりと ばらに わけよう。`],
        `${total}は ${base}＋${ones}、${other}は ${10*first}＋${otherOnes}。10の まとまりが ${first}つ ある ${other}の ほうが おおきいよ。`,
        `${other}−${total}＝${other-total}。 ${other}の ほうが ${other-total}おおきいね。`,
        'ばらの かずだけで きめないよ。', 2));
    }

    for (let added = 10-ones; added <= 9 && total+added <= 100; added++) {
      const end = total+added;
      const toNext = 10-ones;
      add(task('hundredNextBundle', [total,added],
        `${total}こ ある たまに ${added}こ たします。ばらを 10こずつ ひとまとめに すると、ばらは なんこ のこりますか？`, added-toNext,
        ['はじめの ばらを みつけよう。', 'ばらが 10こに なったら、あたらしい まとまりに するよ。',
          `${total}の ばらに ${added}こを たし、まとまりに する 10こを のぞこう。`],
        `はじめの ばらは ${ones}こ。 ${ones}＋${added}＝${ones+added}。10こを まとめると ${ones+added}−10＝${added-toNext}。`,
        `${base+10}＋${added-toNext}＝${end}、${total}＋${added}＝${end}で、おなじ かずになるよ。`,
        'あたらしい まとまりに した 10こは、ばらに かぞえないよ。', 3));
    }

    for (let above = tens+1; above <= 10; above++) {
      const goal = 10*above;
      add(task('hundredStepsToTarget', [total,goal],
        `${total}から ${goal}まで 1ずつ すすみます。あと なんかい すすみますか？`, goal-total,
        ['はじめの かずと つく かずを みつけよう。', 'すぐ つぎの 10の まとまりまで すすみ、そこから 10ずつ くぎって かぞえるよ。',
          `${total}から つぎの 10の まとまりまで かぞえ、そこから ${goal}までの かいすうも たそう。`],
        `まず ${base+10}まで ${10-ones}かい。そこから ${goal}までは ${goal-base-10}かい。 ${10-ones}＋${goal-base-10}＝${goal-total}かい。`,
        `${total}＋${goal-total}＝${goal}。つく かずに なるね。`,
        'はじめに いる ばしょは まだ すすんで いないよ。', 3));
    }
  }
  // Distribute values across the full range before the stage quotas are applied.
  for (const pool of pools.values()) {
    let seed = 101;
    for (let index = pool.length - 1; index > 0; index--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const swap = seed % (index + 1);
      [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }
  }
  const bundles = pools.get('hundredBundle');
  const hundred = bundles.findIndex(q => q.answer === 100);
  bundles.unshift(...bundles.splice(hundred, 1));
  return pools;
}

export const countToHundredStages = [
  ['e1.n36', { hundredBundle: 50, hundredTensForward: 30, hundredComparePlaces: 20 }],
  ['e1.n37', { hundredBundle: 22, hundredTensForward: 30, hundredComparePlaces: 28, hundredNextBundle: 20 }],
  ['e1.n38', { hundredTensForward: 30, hundredComparePlaces: 25, hundredNextBundle: 25, hundredStepsToTarget: 20 }],
  ['e1.n39', { hundredTensForward: 15, hundredComparePlaces: 25, hundredNextBundle: 25, hundredStepsToTarget: 35 }],
  ['e1.n40', { hundredComparePlaces: 25, hundredNextBundle: 25, hundredStepsToTarget: 50 }],
];
