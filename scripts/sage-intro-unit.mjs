import { sageWrittenSolution } from './sage-written-solutions.mjs';

function problem(topic, key, question, answer, hints) {
  return { topic, key, question, answer: String(answer), hints };
}

function algebra(a,b) {
  const s = a+b, p = a*b;
  return problem('algebra', [s,p], `実数 a,b が a＋b＝${s}、ab＝${p} を満たす。a²＋b² の値を求めよ。`, a*a+b*b,
    ['a,b を個別に求めず、対称な式に注目する。','和の平方には 2ab が含まれる。',`${s}² から 2×${p} を引く。`]);
}

function calculus(r,k) {
  const b = r+k;
  const coefficient = 3*k*r*r;
  const minimum = -2*k*r**3;
  return problem('calculus', [r,k], `f(x)＝${k}x³−${coefficient}x とする。区間 0≤x≤${b} での最小値を求めよ。`, minimum,
    ['閉区間の最小値なので、端点と極値の候補を調べる。','導関数の符号で増減を判断する。',`f'(x)＝${3*k}x²−${coefficient} が0となる点を 0≤x≤${b} で探す。`]);
}

function probability(r,b) {
  return problem('probability', [r,b], `赤玉が${r}個、青玉が${b}個ある。戻さず3個を取り出す。赤玉がちょうど2個の取り出し方は何通りか。玉はすべて区別し、順番は数えない。`, r*(r-1)*b/2,
    ['取り出す3個を色ごとに分ける。','赤2個の組と青1個をそれぞれ選ぶ。',`赤${r}個から2個選ぶ場合を数え、青${b}個の選び方をかける。`]);
}

function numberTheory(d,m) {
  const n = d*m+d-1;
  return problem('numberTheory', [d,n], `1以上${n}以下の整数のうち、${d}で割ると余りが1になるものはいくつあるか。`, m+1,
    ['余りが1になる数の並びを考える。','対象は1から始まる公差一定の数列。',`dk＋1 の d を ${d} とし、${d}k＋1≤${n} を満たす k≥0 を数える。`]);
}

function vectors(x,y) {
  const norm = x*x+y*y;
  return problem('vectors', [x,y], `原点 O、点 A(${x},${y}) と B(${-y},${x}) がある。三角形 OAB の面積を2倍した値を求めよ。`, norm,
    ['2本の位置ベクトルの関係を調べる。','内積が0なら直交し、直角をはさむ2辺から面積を求められる。',`${x}×(${-y})＋${y}×${x} と、2本の長さを計算する。`]);
}

const stageIds = ['sage.n01','sage.n02','sage.n03'];
export function buildSageIntroBanks() {
  const inputs = [];
  for (let a=3;a<=13;a++) for (let b=2;b<a;b++) inputs.push([a,b]);
  return stageIds.map((stageId, stageIndex) => {
    const questions = inputs.slice(stageIndex*20,stageIndex*20+20).flatMap(([a,b]) => [
      algebra(a,b), calculus(a,b), probability(a,b), numberTheory(a,b), vectors(a,b),
    ].map(q => ({ ...q, steps: sageWrittenSolution(q.topic,a,b) }))).map(q => ({
      id: stageId + ':bank1:' + q.topic + ':' + q.key.join('-'),
      skillId: 'sage.' + q.topic, topic: q.topic, type: 'number', format: 'calculation',
      difficulty: 2, prompt: '答えを数値で入力してください', question: q.question,
      answer: q.answer, hints: q.hints, hint: q.hints[0], steps: q.steps,
      explanation: q.steps[2].body, mistakes: [{explanation:q.steps[4].body}],
    }));
    return { version: 1, selection: 'balanced', stageId, gradeId:'sage', islandId:'sage',
      unit: '分野横断演習', objective: '問題に応じて代数・微分・場合の数・整数・ベクトルの考え方を選ぶ。', questions };
  });
}
