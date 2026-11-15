import type { WorldStage } from './worldCatalog.ts';
import type { SkillId } from './curriculum.ts';

export type MathQuestion = {
  id: string;
  type: 'number' | 'choice';
  prompt: string;
  question: string;
  answer: string;
  choices?: readonly string[];
  explanation: string;
  hint: string;
  skillId: SkillId;
};

type Random = { next: () => number; int: (min: number, max: number) => number; pick: <T>(values: readonly T[]) => T };
function seeded(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return {
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: values => values[Math.floor(next() * values.length)],
  };
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : Math.abs(a);
const fraction = (n: number, d: number) => {
  const g = gcd(n, d) || 1;
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};
const answerString = (n: number) => String(Math.round(n * 10000) / 10000);
const levels: Record<string, number> = { e1: 1, e2: 2, e3: 3, e4: 4, e5: 5, e6: 6, j1: 7, j2: 8, j3: 9, h1: 10, h2: 11, h3: 12 };

export function checkMathAnswer(problem: MathQuestion, typed: string): boolean {
  const normalized = typed.normalize('NFKC').trim().replaceAll('−', '-');
  if (problem.type === 'choice') return typed.trim() === problem.answer || normalized === problem.answer.normalize('NFKC');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return false;
  const actual = Number(normalized);
  const expected = Number(problem.answer);
  return Number.isFinite(actual) && Math.abs(actual - expected) < 0.000001;
}

export function isValidMathAnswer(problem: MathQuestion, typed: string): boolean {
  const normalized = typed.normalize('NFKC').trim().replaceAll('−', '-');
  if (problem.type === 'choice') return problem.choices?.includes(typed.trim()) ?? false;
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) && Number.isFinite(Number(normalized));
}

// Format a monomial without a redundant coefficient of 1 or exponent of 1.
function monomial(coefficient: number, exponent: number): string {
  return `${coefficient === 1 ? '' : coefficient}x${exponent === 1 ? '' : '^' + exponent}`;
}

function numeric(question: string, answer: number, explanation: string, hint = 'どこから計算できるかな？'): Omit<MathQuestion, 'id' | 'skillId'> {
  return { type: 'number', prompt: 'こたえを 数字で いれてね', question, answer: answerString(answer), explanation, hint };
}
function choice(question: string, right: string, wrongs: readonly string[], explanation: string, r: Random, hint = 'よく見くらべてみよう'): Omit<MathQuestion, 'id' | 'skillId'> {
  const all = [...new Set([right, ...wrongs.map(String)])];
  // Fraction simplification can collapse different distractors to the same
  // value (e.g. 2/4 and 1/2). Always present four distinct answers.
  for (const candidate of ['0', '1', '2', '3', '−1', '1/2', '2/3', '3/4', '4/5', '5/6', 'π']) {
    if (all.length >= 4) break;
    if (!all.includes(candidate)) all.push(candidate);
  }
  if (all.length < 4) throw new Error('Choice lacks four distinct options: ' + question + '/' + all.join(','));
  const selected = [right, ...all.filter(item => item !== right).slice(0, 3)];
  for (let i = selected.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return { type: 'choice', prompt: '正しい こたえを えらぼう', question, answer: right, choices: selected, explanation, hint };
}

function concept(question: string, correct: string, other: readonly string[], r: Random): Omit<MathQuestion, 'id' | 'skillId'> {
  return choice(question, correct, other, '正しいものは「' + correct + '」だよ。', r, 'ことばの いみを おもいだそう。');
}

function generateCore(stage: WorldStage, index: number, r: Random): Omit<MathQuestion, 'id' | 'skillId'> {
  const diff = stage.kind !== 'normal' ? 2 : index < 3 ? 0 : index < 8 ? 1 : 2;
  const grade = levels[stage.gradeId];
  const unit = stage.family;
  const code = stage.subtitle;
  const n = (a: number, b: number) => r.int(a, b);
  if (stage.kind === 'secret') return discovery(stage, index, r);
  if (stage.id === 'e1.forest') {
    const a = n(0, 6), b = n(0, 9 - a);
    return numeric(`${a} ＋ ${b} ＝ ？`, a + b, `${a}と${b}を あわせると${a + b}。`);
  }
  if (stage.id === 'e1.bridge') {
    const a = n(0, 10), b = 10 - a;
    return numeric(`${a} ＋ ${b} ＝ ？`, 10, `${a}に${b}を たすと 10だよ。`);
  }
  if (stage.id === 'e1.tower') {
    const a = n(6, 9), b = n(11 - a, 9);
    return numeric(`${a} ＋ ${b} ＝ ？`, a + b, `${a}に${10 - a}を たして 10。のこりの${b - (10 - a)}を たそう。`);
  }

  switch (unit) {
    case 'count': {
      const max = grade <= 1 ? (stage.unitIndex === 4 ? 20 : 10) : 100;
      const value = n(2, max - 2);
      const before = index % 2 === 0;
      return numeric(`${value}の ${before ? 'ひとつまえ' : 'ひとつあと'}の かずは？`, value + (before ? -1 : 1),
        `${value}の ${before ? 'ひとつまえ' : 'ひとつあと'}は ${value + (before ? -1 : 1)}。`);
    }
    case 'place': {
      const base = grade <= 2 ? 100 : grade === 3 ? 1000 : 10000;
      const tens = n(1, 9), ones = n(0, 9), hundreds = n(1, 9);
      const number = grade <= 2 ? tens * 10 + ones : hundreds * 100 + tens * 10 + ones;
      return numeric(`${number} の 十の位の 数字は？`, tens,
        `${number}の 十の位は ${tens} だよ。`);
    }
    case 'addition': {
      const big = grade <= 1 ? 9 : grade === 2 ? 90 : 900;
      const a = n(1, big), b = n(1, grade <= 1 ? 9 : grade === 2 ? 90 : 900);
      return numeric(`${a} ＋ ${b} ＝ ？`, a + b, `${a}と${b}を たすと ${a + b}。`);
    }
    case 'subtraction': {
      const max = grade <= 1 ? (stage.unitIndex === 6 ? 20 : 9) : grade === 2 ? 99 : 999;
      const a = n(Math.max(5, Math.ceil(max / 3)), max), b = n(0, a);
      return numeric(`${a} − ${b} ＝ ？`, a - b, `${a}から${b}を ひくと ${a - b}。`);
    }
    case 'multiplication': {
      const a = n(2, grade <= 2 ? 9 : 25 + 8 * diff), b = n(2, grade <= 2 ? 9 : 9);
      return numeric(`${a} × ${b} ＝ ？`, a * b, `${a}を${b}回 あわせると ${a * b}。`);
    }
    case 'division': {
      const b = n(2, 9), a = n(2, grade === 3 ? 9 : 25), remainder = index % 3 === 0 ? n(1, b - 1) : 0;
      const value = a * b + remainder;
      return numeric(`${value} ÷ ${b} の 商は？（あまりは かかない）`, a,
        `${value} ＝ ${b} × ${a} ＋ ${remainder}。商は ${a}。`);
    }
    case 'decimal': {
      const mult = grade === 3 || grade === 4 ? 10 : 100;
      const a = n(10, 100 + diff * 20) / mult, b = n(5, 80) / mult;
      if (grade >= 5) {
        const integer = n(2, 9);
        return numeric(`${a} × ${integer} ＝ ？`, a * integer, `${a}を${integer}倍すると ${answerString(a * integer)}。`);
      }
      return numeric(`${a} ＋ ${b} ＝ ？`, a + b, `小数点を そろえて たすと ${answerString(a + b)}。`);
    }
    case 'fraction': {
      const d1 = n(2, grade >= 5 ? 8 : 12), a = n(1, d1 - 1);
      if (grade <= 3) {
        if (index % 2 === 0) return choice(`1/${d1} を ${d1}こ集めると？`, '1',
          ['0', `1/${d1}`, String(d1), '1/2', '2'],
          '同じ大きさの分数を分母の数だけ集めると、全体の1になるよ。', r);
        const pieces = n(1, d1);
        const ans = fraction(pieces, d1);
        return choice(`1/${d1} を ${pieces}こ集めると？`, ans,
          [fraction(pieces + 1, d1), fraction(Math.max(1, pieces - 1), d1),
            fraction(pieces, d1 + 1), String(pieces), '0'],
          `分子が${pieces}、分母が${d1}なので、${ans}だよ。`, r);
      }
      if (grade === 4) {
        const b = n(1, d1);
        const ans = fraction(a + b, d1);
        return choice(`${a}/${d1} ＋ ${b}/${d1} ＝？`, ans,
          [fraction(a + b, d1 + d1), fraction(a * b, d1), fraction(a + b + 1, d1), fraction(a + b, d1 + 1), String(a + b)],
          '分母が 同じなら 分子を たすよ。こたえは ' + ans, r);
      }
      if (grade === 5) {
        const b = n(1, 3);
        const ans = fraction(a * 2 + b * d1, d1 * 2);
        return choice(`${a}/${d1} ＋ ${b}/2 ＝？`, ans,
          [fraction(a + b, d1 + 2), fraction(a + b, d1 * 2), fraction(a * 2 + b * d1 + 1, d1 * 2), fraction(a * b, d1 * 2), String(a + b + 1)],
          '通分して 分子をたすと ' + ans, r);
      }
      const b = n(1, 4), c = n(2, 7), ans = fraction(a * b, d1 * c);
      return choice(`${a}/${d1} × ${b}/${c} ＝？`, ans,
        [fraction(a + b, d1 + c), fraction(a * c, d1 * b), fraction(a * b + 1, d1 * c), fraction(a * b, d1 + c), String(a + b)],
        '分子どうし、分母どうしを かけると ' + ans, r);
    }
    case 'time': {
      const h = n(1, 10), minute = n(0, 5) * 10, after = n(1, 5) * 10;
      const result = (h * 60 + minute + after) % (12 * 60);
      return choice(`${h}時${minute}分の ${after}分後は？`,
        `${Math.floor(result / 60) || 12}時${result % 60}分`,
        [`${h}時${minute}分`, `${h}時${(minute + 10) % 60}分`, `${h + 1}時${minute}分`, `${h}時${(minute + 20) % 60}分`, '12時0分'],
        '時間を 分に 直して たすと 計算しやすいよ。', r);
    }
    case 'unit': {
      const choiceType = index % 3;
      const amount = n(2, diff ? 15 : 9);
      const units = [
        [`${amount} m は何 cm？`, amount * 100, '1m = 100cm'],
        [`${amount} kg は何 g？`, amount * 1000, '1kg = 1000g'],
        [`${amount} L は何 dL？`, amount * 10, '1L = 10dL'],
      ] as const;
      const [question, ans, explanation] = units[choiceType];
      return numeric(question, ans, `${explanation}。だから ${ans}。`);
    }
    case 'shape': {
      const topics = ['三角形', '四角形', '正方形', '長方形', 'ひし形'];
      const edges = [3, 4, 4, 4, 4];
      const at = n(0, topics.length - 1);
      const count = edges[at];
      const format = n(0, 2);
      if (format === 0) return numeric(`${topics[at]}の まっすぐな辺は何本？`, count,
        `${topics[at]}の 辺は${count}本だよ。`);
      if (format === 1) return numeric(`${topics[at]}の かどは何こ？`, count,
        `${topics[at]}には${count}この かどがあるよ。`);
      return numeric(`${topics[at]}を2つ べつべつに おくと、辺は あわせて何本？`,
        count * 2, `${count}＋${count}＝${count * 2}本だよ。`);
    }
    case 'geometry': {
      if (stage.subtitle.includes('円と')) {
        const radius = n(1, 12);
        return numeric(`半径が ${radius} cm の円の 直径は何 cm？`, radius * 2, `直径は 半径の2倍で ${radius * 2}cm。`);
      }
      if (stage.subtitle.includes('相似') || stage.subtitle.includes('拡大')) {
        const a = n(2, 8), scale = n(2, 4);
        return numeric(`対応する長さが ${a} cm の図形を ${scale} 倍すると何 cm？`, a * scale,
          `${a}×${scale}＝${a * scale}cm。`);
      }
      if (stage.subtitle.includes('合同')) {
        const length = n(2, 36), mode = index % 3;
        if (mode === 0) return numeric(
          `合同な三角形ABCとDEFで AB＝${length}cm。対応するDEの長さは？（cm）`,
          length, '合同な図形では対応する辺の長さが等しいよ。');
        if (mode === 1) return numeric(
          `合同な2つの図形の一方の周りは${length}cm。もう一方の周りは？（cm）`,
          length, '合同なら周りの長さも等しいよ。');
        return numeric(
          `合同な三角形の対応する角Aが${length}°。角Dは何度？`,
          length, '合同な図形の対応する角は等しいよ。');
      }
      if (stage.subtitle.includes('対称')) {
        const distance = n(2, 35);
        return numeric(`線対称な図形で 点Aは対称の軸から${distance}cm。対応する点Bは軸から何cm？`,
          distance, '線対称の対応する点は軸から同じ距離にあるよ。');
      }
      if (stage.subtitle.includes('立方体')) {
        const shapeQuestions: readonly [string, number, string][] = [
          ['立方体の 頂点はいくつ？', 8, '頂点は8こだよ。'],
          ['直方体の 頂点はいくつ？', 8, '頂点は8こだよ。'],
          ['立方体の 面はいくつ？', 6, '面は6つだよ。'],
          ['直方体の 面はいくつ？', 6, '面は6つだよ。'],
          ['立方体の 辺は何本？', 12, '辺は12本だよ。'],
          ['直方体の 辺は何本？', 12, '辺は12本だよ。'],
          ['立方体の 1つの頂点に集まる辺は何本？', 3, '3本の辺が集まるよ。'],
          ['直方体の 1つの頂点に集まる辺は何本？', 3, '3本の辺が集まるよ。'],
          ['立方体の 隣り合う辺の角度は何度？', 90, '直角の90°だよ。'],
          ['直方体の 隣り合う辺の角度は何度？', 90, '直角の90°だよ。'],
          ['立方体の 3つの面が集まる頂点は何こ？', 8, '8この頂点があるよ。'],
          ['直方体の 3つの面が集まる頂点は何こ？', 8, '8この頂点があるよ。'],
          ['立方体には 向かい合う面の組が何組ある？', 3, '面は6つで3組になるよ。'],
          ['直方体には 向かい合う面の組が何組ある？', 3, '面は6つで3組になるよ。'],
        ];
        const [question, answer, explanation] = r.pick(shapeQuestions);
        return numeric(question, answer, explanation);
      }
      const a = n(2, 10), b = n(2, 10);
      return numeric(`たて ${a}cm、よこ ${b}cm の長方形の周りの長さは？（cm）`, 2 * (a + b),
        `(${a}+${b})×2 = ${2 * (a + b)}cm。`);
    }
    case 'operation': {
      const a = n(3, 15), b = n(2, 9), c = n(2, 7);
      return numeric(`${a} ＋ ${b} × ${c} ＝ ？`, a + b * c, `かけ算を先に計算するよ。${b}×${c}=${b*c}。`);
    }
    case 'area': {
      const a = n(3, 15), b = n(2, 12);
      const triangle = grade >= 5 || index % 2 === 1;
      return numeric(`底辺${a}cm、高さ${b}cmの${triangle ? '三角形' : '平行四辺形'}の面積は？（cm²）`,
        triangle ? a * b / 2 : a * b,
        triangle ? '三角形の面積は 底辺×高さ÷2だよ。' : '平行四辺形の面積は 底辺×高さだよ。');
    }
    case 'angle': {
      const angle = n(30, 100);
      if (stage.subtitle.includes('円周角')) return numeric(`中心角${angle * 2}° に対する 円周角は何度？`, angle,
        '同じ弧の円周角は中心角の半分だよ。');
      if (stage.subtitle.includes('多角形')) {
        const sides = n(3, 18);
        return numeric(`${sides}角形の 内角の和は何度？`, (sides - 2) * 180,
          `(${sides}-2)×180=${(sides - 2) * 180}°。`);
      }
      const other = n(10, Math.min(70, 175 - angle));
      return numeric(`三角形の2つの角が ${angle}° と ${other}°。残りは？（角度）`, 180 - angle - other,
        '三角形の角の和は180°。' + angle + '＋' + other + 'を引くと' + (180 - angle - other) + '°。');
    }
    case 'pattern': {
      const first = n(2, 15), step = n(2, 6), term = n(4, 8);
      return numeric(`${first}, ${first + step}, ${first + 2*step}, … の ${term}番目は？`,
        first + (term - 1) * step, `初項${first}、公差${step}。(${term}-1)回たすよ。`);
    }
    case 'divisor': {
      const a = n(2, 9), b = n(2, 9);
      const g = gcd(a, b);
      return numeric(`${a * 2} と ${b * 2} の最大公約数は？`, 2 * g, '共通の約数のうち 最大のものを探そう。');
    }
    case 'percent': {
      const base = n(2, 20) * 20, pct = r.pick([10,20,25,50,75]);
      return numeric(`${base}円の ${pct}% は何円？`, base * pct/100,
        `百分率は 100分のいくつかをあらわすよ。${base}×${pct}/100。`);
    }
    case 'ratio': {
      const a = n(1, 5), b = n(2, 7), base = n(2, 12);
      return numeric(`A:B = ${a}:${b}。Aが${a * base}なら Bは？`, b * base, `1あたりが${base}、Bは${b}×${base}。`);
    }
    case 'average': {
      const mid = n(5, 18), spread = n(1, 4);
      const a = mid - spread, b = mid, c = mid + spread;
      return numeric(`${a}, ${b}, ${c} の平均は？`, mid, '3つをたして3で割るよ。');
    }
    case 'volume': {
      const a = n(2, 8), b = n(2, 8), c = n(2, 8);
      return numeric(`縦${a}cm、横${b}cm、高さ${c}cmの直方体の体積は？（cm³）`,
        a*b*c, '縦×横×高さで体積を計算するよ。');
    }
    case 'circle': {
      const rads = n(1, 24);
      const area = stage.subtitle.includes('面積');
      return numeric(`半径${rads}cmの円の${area?'面積（cm²）':'円周（cm）'}は？（πは3.14）`,
        area ? 3.14*rads*rads : 2*3.14*rads,
        area ? '円の面積は半径×半径×3.14。' : '円周は直径×3.14。');
    }
    case 'data': {
      const mid = n(6, 18), spread = n(1, 5);
      const a = mid - spread, b = mid, c = mid + spread;
      if (grade >= 8 && index % 2) return numeric(`${a}, ${b}, ${c} の中央値は？`, b,
        '小さい順にならべて、真ん中の値をとるよ。');
      return numeric(`${a}, ${b}, ${c} の平均は？`, mid,
        '合計をデータの個数で割るよ。');
    }
    case 'speed': {
      const speed = n(3, 18), time = n(2, 7);
      return numeric(`毎時${speed}kmで${time}時間すすむと何km？`, speed*time,
        '道のり＝速さ×時間だよ。');
    }
    case 'signed': {
      const a = n(-12, 12), b = n(-12, 12);
      return numeric(`(${a}) ＋ (${b}) ＝ ？`, a+b, '符号を考えてたそう。こたえは' + (a+b) + '。');
    }
    case 'expression': {
      const a = n(1, 7), b = n(1, 7);
      if (index % 2 === 0) return choice(`${a}x ＋ ${b}x を整理すると？`, `${a+b}x`,
        [`${a*b}x`, `${a+b}x²`, `${a-b}x`, `${a}x＋${b}`, `${a+b+1}x`],
        '同じ文字の項は係数をたすよ。', r);
      const x = n(-5,5);
      return numeric(`x=${x} のとき ${a}x＋${b} の値は？`, a*x+b,
        `xに${x}を代入して計算するよ。`);
    }
    case 'equation': {
      const x = n(-8, 12), a = n(2, 7), b = n(1, 15);
      return numeric(`${a}x＋${b}=${a*x+b}。xは？`, x,
        `両辺から${b}を引いて${a}で割るとx=${x}。`);
    }
    case 'system': {
      const x = n(-4, 9), y = n(-4, 9);
      return numeric(`x＋y=${x+y}、x−y=${x-y}。xは？`, x,
        '2式を足すと2x=' + 2*x + '。');
    }
    case 'function': {
      const a = n(-5, 5) || 2, b = n(-6, 6), x = n(-4, 6);
      if (stage.subtitle.includes('反比例')) {
        const v = n(2, 8);
        return numeric(`y=${a*v}/x のとき x=${v} で yは？`, a, 'xを代入して計算するよ。');
      }
      return numeric(`y=${a}x＋(${b})。x=${x}のとき yは？`, a*x+b,
        `x=${x}を代入するよ。答えは${a*x+b}。`);
    }
    case 'proof': {
      const facts: readonly [string, string, readonly string[]][] = [
        ['3組の辺がそれぞれ等しい三角形の関係は？', '合同である',
          ['相似だが合同とは限らない', '必ず直角三角形である', '必ず正三角形である']],
        ['2組の辺とその間の角がそれぞれ等しい三角形は？', '合同である',
          ['必ず二等辺三角形', '形が定まらない', '必ず正三角形']],
        ['1組の辺とその両端の角がそれぞれ等しい三角形は？', '合同である',
          ['面積だけ等しい', '周りだけ等しい', '必ず直角三角形']],
        ['合同な2つの三角形の対応する辺の長さは？', '等しい',
          ['2倍になる', '半分になる', '必ず異なる']],
        ['合同な2つの三角形の対応する角の大きさは？', '等しい',
          ['2倍になる', '半分になる', '必ず異なる']],
        ['二等辺三角形の底角の関係は？', '2つの底角が等しい',
          ['2つの底角の和が90°', '2つの底角が直角', '底角は必ず30°']],
        ['平行な2直線に1本の直線が交わるときの錯角は？', '等しい',
          ['和が90°', '必ず直角', '必ず異なる']],
        ['平行な2直線に1本の直線が交わるときの同位角は？', '等しい',
          ['必ず直角', '和が90°', '必ず異なる']],
        ['平行四辺形の向かい合う2組の辺は？', 'それぞれ等しい',
          ['必ず2倍', '必ず直角', '必ず異なる']],
        ['平行四辺形の向かい合う角は？', '等しい',
          ['必ず45°', '必ず直角', '必ず異なる']],
        ['平行四辺形の対角線は互いにどうなる？', '中点で交わる',
          ['必ず垂直に交わる', '長さが必ず等しい', '交わらない']],
        ['三角形の1つの外角はどんな角の和に等しい？', '隣り合わない2つの内角',
          ['3つの内角すべて', '隣り合う内角1つ', 'どの2つの外角でもよい']],
        ['三角形の内角の和は何度？', '180°',
          ['90°', '270°', '360°']],
        ['二等辺三角形の同じ長さの2辺に向かい合う角は？', '等しい',
          ['1つが必ず直角', '和が必ず90°', '必ず異なる']],
        ['長方形の対角線の長さはどうなる？', '2本とも等しい',
          ['一方が必ず2倍', '必ず異なる', '片方は0']],
        ['ひし形の4辺の長さは？', 'すべて等しい',
          ['向かい合う2辺だけ等しい', '隣り合う辺は必ず異なる', '必ず直角を作る長さ']],
      ];
      const [question, answer, alternatives] = r.pick(facts);
      return concept(question, answer, alternatives, r);
    }
    case 'probability': {
      const total = n(4,16), count = n(1,total-1);
      return choice(`袋に赤玉${count}個、青玉${total-count}個。1個取り出して赤玉の確率は？`,
        fraction(count,total), [fraction(total-count,total), fraction(count,total+1),
          fraction(count,total-1), '1', '0', fraction(count+1,total)],
        '赤玉の数÷玉の総数で求めるよ。', r);
    }
    case 'radical': {
      const a = n(2, 13);
      return numeric(`√${a*a} ＝ ？（正の平方根）`, a, `${a}×${a}=${a*a}。`);
    }
    case 'factor': {
      const a = n(1, 9), b = n(1, 9);
      return choice(`(x＋${a})(x＋${b}) を展開すると？`,
        `x²＋${a+b}x＋${a*b}`,
        [`x²＋${a*b}x＋${a+b}`, `x²＋${a+b}x＋${a+b}`, `x²＋${a*b}x＋${a*b}`, `x²＋${a+b+1}x＋${a*b}`, `x²＋${a+b}x＋${a*b+1}`],
        `x²＋(${a}＋${b})x＋${a}×${b}。`, r);
    }
    case 'quadratic': {
      const x = n(2, 8), y = n(1, x-1);
      return numeric(`x²−${x+y}x＋${x*y}＝0 の大きい方の解は？`, x,
        `(x−${x})(x−${y})＝0 だから ${x}と${y}。`);
    }
    case 'quadraticFunction': {
      const a = n(1, 5), b = n(-6, 6), c = n(-5, 8);
      return numeric(`y=${a}(x−(${b}))²＋(${c}) の頂点のx座標は？`, b,
        `頂点は (${b},${c}) だよ。`);
    }
    case 'pythagoras': {
      const triple = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]] as const);
      const scale = n(1, 7);
      const a = triple[0] * scale, b = triple[1] * scale, c = triple[2] * scale;
      return numeric(`直角三角形の直角をはさむ2辺が ${a}cm と ${b}cm。斜辺は？（cm）`,
        c, `三平方の定理で √(${a}²＋${b}²)＝${c}。`);
    }
    case 'logic': {
      const logicFacts: readonly [string, string, readonly string[]][] = [
        ['「偶数なら2で割り切れる」の逆の命題は？', '2で割り切れるなら偶数',
          ['偶数でないなら2で割り切れない', '奇数なら2で割り切れる', '2で割り切れないなら偶数']],
        ['「3の倍数なら3で割り切れる」の逆は？', '3で割り切れるなら3の倍数',
          ['3の倍数でなければ3で割り切れない', '3の倍数なら偶数', '3で割り切れないなら3の倍数']],
        ['「x>2ならx>1」の逆は？', 'x>1ならx>2',
          ['x≤2ならx≤1', 'x≤1ならx≤2', 'x>2ならx≤1']],
        ['「x>2ならx>1」の対偶は？', 'x≤1ならx≤2',
          ['x>1ならx>2', 'x≤2ならx≤1', 'x≤1ならx>2']],
        ['命題「pならばq」の逆は？', 'qならばp',
          ['pでなければqでない', 'qでなければpでない', 'pならばqでない']],
        ['命題「pならばq」の対偶は？', 'qでなければpでない',
          ['qならばp', 'pでなければqでない', 'pでなければq']],
        ['「5の倍数なら末尾は0か5」の逆は？', '末尾が0か5なら5の倍数',
          ['末尾が0か5でなければ5の倍数', '5の倍数でなければ末尾は0', '末尾が0なら必ず10の倍数']],
        ['「aが偶数ならa²も偶数」の対偶は？', 'a²が偶数でないならaは偶数でない',
          ['a²が偶数ならaは偶数', 'aが偶数でないならa²は偶数でない', 'a²が偶数でないならaは偶数']],
        ['集合A∩Bが表すものは？', 'AとBの共通部分',
          ['AまたはBのすべて', 'AとB以外', 'Aだけの補集合']],
        ['集合A∪Bが表すものは？', 'AまたはBに入る部分',
          ['AとBの共通部分だけ', 'AにもBにも入らない部分', 'Aの補集合だけ']],
        ['空集合の要素の数はいくつ？', '0',
          ['1', '無限個', '2']],
        ['すべての要素を含む全体集合の補集合は？', '空集合',
          ['全体集合そのもの', '1要素の集合', 'A∩B']],
        ['必要条件と十分条件が両方成り立つ関係は？', '必要十分条件',
          ['矛盾', '否定', '排反']],
        ['「x=3ならx²=9」の逆は？', 'x²=9ならx=3',
          ['x≠3ならx²≠9', 'x²≠9ならx≠3', 'x²=9ならx≠3']],
        ['「x=3ならx²=9」の対偶は？', 'x²≠9ならx≠3',
          ['x²=9ならx=3', 'x≠3ならx²≠9', 'x²≠9ならx=3']],
      ];
      const [question, answer, alternatives] = r.pick(logicFacts);
      return concept(question, answer, alternatives, r);
    }
    case 'inequality': {
      const a = n(1, 24);
      return choice(`x²−${a*a}<0 の解は？`, `−${a}<x<${a}`,
        [`x<−${a} または x>${a}`, `x>${a}`, `x<−${a}`, `−${a}≤x≤${a}`],
        `x²<${a*a} は −${a}<x<${a} を表す。`, r);
    }
    case 'trig': {
      const identities: readonly [string, string][] = [
        ['sin 0°','0'], ['sin 30°','1/2'], ['sin 45°','√2/2'],
        ['sin 60°','√3/2'], ['sin 90°','1'],
        ['cos 0°','1'], ['cos 30°','√3/2'], ['cos 45°','√2/2'],
        ['cos 60°','1/2'], ['cos 90°','0'],
        ['tan 0°','0'], ['tan 30°','√3/3'], ['tan 45°','1'], ['tan 60°','√3'],
      ];
      const [expression, ans] = r.pick(identities);
      return choice(`${expression} の値は？`, ans,
        ['0', '1/2', '√2/2', '√3/2', '√3/3', '1', '√3', '2'].filter(x=>x!==ans),
        '基本的な角度の三角比を確認しよう。', r);
    }
    case 'combinatorics': {
      const a = n(4,11), b = n(2,4);
      let result = 1;
      for(let k = 0; k<b; k++) result *= a-k;
      return numeric(`${a}人から順番に${b}人選ぶ並べ方は何通り？`, result,
        `順番を考えるから${Array.from({length:b},(_,i)=>a-i).join('×')}。`);
    }
    case 'complex': {
      const pow = n(1,12), ans = ['1','i','−1','−i'][pow%4];
      return choice(`虚数単位 i の ${pow}乗、i^${pow} は？`,ans,
        ['1','i','−1','−i'].filter(x=>x!==ans),
        'i²=−1で、4乗ごとに同じ値へ戻るよ。',r);
    }
    case 'coordinateGeometry': {
      const a = n(-5,5), b = n(-5,5), scale = n(1, 4);
      return numeric(`点(${a},${b}) と(${a+3*scale},${b+4*scale})の距離は？`,5*scale,
        `2点間の距離は √(${3*scale}²＋${4*scale}²)＝${5*scale}。`);
    }
    case 'exponential': {
      const a = n(2,5), p = n(2,5);
      if(index%2) return numeric(`log_${a}(${a**p})＝？`,p,
        `${a}の${p}乗が${a**p}だから答えは${p}。`);
      return numeric(`${a}^${p}＝？`,a**p,`${a}を${p}回かけると${a**p}。`);
    }
    case 'calculus': {
      const a = n(1,7), power=n(2,5), x=n(1,4);
      return numeric(`f(x)=${monomial(a, power)} のとき、f'(${x}) の値は？`,
        a*power*x**(power-1),
        `導関数は f'(x)=${monomial(a * power, power - 1)}。x=${x}を代入しよう。`);
    }
    case 'integral': {
      const p = n(1,3), to=n(2,4), a=(p+1)*n(1,4);
      return numeric(`∫[0,${to}] ${monomial(a, p)} dx は？`,
        a/(p+1)*to**(p+1),
        `不定積分は ∫ ${monomial(a, p)} dx = ${monomial(a / (p + 1), p + 1)}+C。原始関数の上端と下端での値の差を求めよう。`,
        `まず x^${p} の原始関数を考えよう。`);
    }
    case 'sequence': {
      const a = n(1,7), d=n(2,7), k=n(4,9);
      return numeric(`初項${a}、公差${d}の等差数列の第${k}項は？`,a+(k-1)*d,
        `一般項は a_n=${a}+(n-1)×${d}。n=${k}を代入しよう。`);
    }
    case 'vector': {
      const a=n(-5,5),b=n(-5,5),c=n(-5,5),d=n(-5,5);
      return numeric(`vec(a)=(${a},${b}), vec(b)=(${c},${d}) の内積 vec(a)・vec(b) は？`,
        a*c+b*d,'対応する成分どうしをかけてたそう。');
    }
    case 'limit': {
      const a=n(1,12), b=n(1,15);
      if (index % 3 === 0) return choice(`lim[n→∞] ${a}/(n＋${b}) の値は？`, '0',
        ['1', '∞', String(a), '1/2', '−1'],
        '分子は一定で、分母は無限に大きくなるから0に近づくよ。', r);
      return numeric(`lim[x→${a}] (x²＋${b}) は？`, a*a+b,
        `連続な多項式だからx=${a}を代入して${a*a+b}。`);
    }
    case 'mixed': {
      const families = grade<=9?['quadratic','pythagoras','probability','function']:['calculus','integral','sequence','vector'];
      return generateCore({...stage,kind:'normal',family:families[index%families.length]},index,r);
    }
    default:
      throw new Error(`Unsupported question family: ${unit} in ${stage.id}`);
  }
}

function discovery(stage: WorldStage, index: number, r: Random): Omit<MathQuestion, 'id' | 'skillId'> {
  const grade = levels[stage.gradeId];
  const slot = (stage.order - 60 + index) % 10;
  if (slot >= 5) return discoveryExtension(grade, slot - 5, r);
  const mode = slot;
  if (grade <= 3) {
    if(mode===0) {
      const first=r.int(2,9), step=r.int(2,5);
      return numeric(`${first}, ${first+step}, ${first+2*step}, ？`,first+3*step,
        '同じ数ずつ足す規則を見つけたね。');
    }
    if(mode===1) return numeric('三角形を3つ集めたら、角はいくつ？',9,'三角形の角は3個。3×3=9個だね。');
    if(mode===2) return concept('一番小さい素数は？','2',['0','1','4','9'],r);
    if(mode===3) return numeric('1＋2＋3＋4＋5 ＝ ？',15,'1から5まで足すと15。階段の形にすると見えるよ。');
    return choice('0を何回足しても答えは？','0',['1','10','∞','5'], '0を足しても数は変わらないよ。',r);
  }
  if (grade <= 6) {
    if(mode===0) {
      const n=r.int(4,9);
      return numeric(`1＋2＋…＋${n}＝？`, n*(n+1)/2, '端と端を組にすると同じ和になるよ。');
    }
    if(mode===1) return concept('素数が無限にあることを示したのは誰？','ユークリッド',['ニュートン','ガリレオ','ピタゴラス'],r);
    if(mode===2) return choice('正六角形の中には正三角形が何枚並ぶ？','6',['3','4','5','8'], '中心から頂点に線を引くと正三角形が6つできるよ。',r);
    if(mode===3) return numeric('1＋3＋5＋7＋9＝？',25,'最初の5個の奇数の和は5²=25だよ。');
    return choice('円周率πを小数第2位まで表すと？','3.14',['3.41','3.04','3.1416','2.14'],'円周と直径の比がπ。約3.14だよ。',r);
  }
  if (grade <= 9) {
    if(mode===0) return numeric('フィボナッチ数列 1,1,2,3,5,8,？',13,'前の2つを足して次の数を作るよ。');
    if(mode===1) return numeric('パスカルの三角形の 1, 4, 6, 4, 1 の和は？',16,'各行の和は2のべき乗。2⁴=16。');
    if(mode===2) return choice('0.999…（9が永遠に続く）はいくつ？','1',['0.9','0.999','1より小さい','∞'],
      '0.999…と1は同じ実数を表すよ。',r);
    if(mode===3) return numeric('1辺の長さが2倍になると正方形の面積は何倍？',4,'面積は2×2=4倍。');
    return choice('平方根√2はどんな数？','無理数',['自然数','整数','有理数','虚数'],'整数の分数で表せない無理数だよ。',r);
  }
  if(mode===0) return choice('1＋1/2＋1/4＋1/8＋… の無限和は？','2',['1','∞','1/2','4'],
    '公比1/2の無限等比級数の和は2。',r);
  if(mode===1) return choice('e^(iπ) ＋ 1 の値は？','0',['1','−1','i','π'],
    'オイラーの等式は5つの重要な定数を結びつけるよ。',r);
  if(mode===2) return numeric('1から10までの整数の和は？',55,'Σ[k=1,10] k=10×11÷2=55。初項と末項を組にして考えよう。');
  if(mode===3) return choice('lim[n→∞] (1＋1/n)^n は？','e',['1','π','0','∞'],
    '自然対数の底eを定義する有名な極限だよ。',r);
  return choice('無限に続く素数は存在する？','無限にある',['有限個しかない','2だけ','奇数だけ','1000個'],
    'どんな有限個の素数を並べても、別の素数があることを示せるよ。',r);
}

function discoveryExtension(grade: number, slot: number, r: Random): Omit<MathQuestion, 'id' | 'skillId'> {
  const n = r.int(3, grade <= 3 ? 8 : 14);
  if (grade <= 3) {
    switch (slot) {
      case 0: return numeric(`2, 4, 6, 8, ？ とつづきます。つぎの かずは？`, 10, 'まえの かずに 2を たすよ。8＋2＝10。');
      case 1: return numeric(`1つの はこに たまが 2こ。はこが ${n}こ あると、たまは なんこ？`, 2 * n, `2こずつ ${n}かい あわせると ${2 * n}こ。`);
      case 2: return numeric('はじめに 1こ、つぎに 2こ、さいごに 3こ もらったよ。ぜんぶで なんこ？', 6, '1＋2＝3。そこに 3こ たすと 6こ。');
      case 3: return numeric(`あかと あおを 1こずつ くみに します。あかが ${n}こ、あおが ${n + 2}こ あります。あおは なんこ あまる？`, 2, `つかう あおは ${n}こ。あまりは ${n + 2}−${n}＝2こ。`);
      default: return numeric('1から9までの かずから、1と9、2と8、3と7、4と6を くみに します。のこる かずは？', 5, 'どの くみも たすと 10。5だけが くみを つくらないよ。');
    }
  }
  if (grade <= 6) {
    switch (slot) {
      case 0: return numeric(`1辺に ${n}こずつ石を置いた正方形の外わく。四つの角を二重に数えないと、石は何こ？`, 4 * n - 4, `4辺で ${4 * n}こ。各角が1回ずつ多いから ${4 * n}−4＝${4 * n - 4}こ。`);
      case 1: return numeric('1、4、9、16と正方形を作る数が続く。次の数は？', 25, '一辺が5になるので 5×5＝25。');
      case 2: return numeric(`1から ${2 * n}までの数を、最小と最大から順に組にする。どの組の和もいくつ？`, 2 * n + 1, `小さい方が1増えると、大きい方が1減る。どの和も 1＋${2 * n}＝${2 * n + 1}。`);
      case 3: return numeric('3、6、12、24と前の数を倍にする。6番目の数は？', 96, '5番目は 24×2＝48。6番目は 48×2＝96。');
      default: return numeric('三角形を5枚つないで列にした。隣の三角形どうしは辺を1本共有する。外まわりの辺は何本？', 7, '別々なら 3×5＝15本。共有する4か所では2本ずつ外まわりから消えるから 15−8＝7本。');
    }
  }
  if (grade <= 9) {
    switch (slot) {
      case 0: return numeric(`連続する3整数の平均が ${n}。最も大きい数は？`, n + 1, `真ん中が平均の ${n}。最大はその次の ${n + 1}。`);
      case 1: return numeric('1から20までで、2でも3でも割り切れる整数はいくつ？', 3, '2と3の最小公倍数6の倍数を探す。6、12、18の3個。');
      case 2: return numeric('正方形の一辺を3倍、厚さも3倍にした正方形の柱。体積は何倍？', 27, '底面積が3×3＝9倍、高さは3倍。合わせて 9×3＝27倍。');
      case 3: return numeric('連続する5個の奇数の和が55。中央の数は？', 11, '中央からの差は両側で打ち消し合う。中央は平均 55÷5＝11。');
      default: return numeric('折り目で紙の点を重ねると、折り目から両方の点までの距離は等しい。片方が7 cmなら、もう一方は何 cm？', 7, '折り目は対称の軸なので、対応する点は軸から同じ距離にある。');
    }
  }
  switch (slot) {
    case 0: return numeric(`Σ[k=1,${n}] (2k−1) の値は？`, n ** 2, `第1項は1、末項は ${2 * n - 1}。両端の平均は ${n}。項数も ${n}なので和は ${n}²＝${n ** 2}。`);
    case 1: return numeric('i^4 の値は？', 1, 'i²＝−1なので i⁴＝(−1)²＝1。');
    case 2: return numeric('初項3、公比2の等比数列で、第5項は？', 48, '初項から第5項までに4回倍にする。3×2^4＝48。');
    case 3: return numeric('∫[0,2] 2x dx の値は？', 4, '2xの原始関数は x²+C。上端と下端での差は 2²−0²＝4。');
    default: return numeric('sin 30° と cos 60° の和は？', 1, 'sin 30°＝1/2、cos 60°＝1/2。和は1。');
  }
}

export function generateWorldQuestions(stage: WorldStage, attemptSeed = 0): MathQuestion[] {
  if(!Number.isSafeInteger(attemptSeed) || attemptSeed < 0) throw new RangeError('Invalid attempt seed');
  const r = seeded(hash(stage.id + ':' + attemptSeed));
  const seen = new Set<string>();
  const questions: MathQuestion[] = [];
  for (let index = 0; index < stage.questions; index++) {
    let unique: Omit<MathQuestion, 'id' | 'skillId'> | undefined;
    // Retrying uses the same seed stream, so the round remains reproducible.
    // The check is on the visible problem, not on its always-unique database ID.
    for (let tries = 0; tries < 600; tries++) {
      const candidate = generateCore(stage, index, r);
      const key = candidate.question.normalize('NFKC').replace(/\s+/g, ' ').trim();
      if (seen.has(key)) continue;
      seen.add(key);
      unique = candidate;
      break;
    }
    if (!unique) throw new Error('Not enough unique problems for ' + stage.id);
    questions.push({
      ...unique,
      id: stage.id + ':' + attemptSeed + ':' + (index + 1),
      skillId: (stage.gradeId + '.' + stage.family) as SkillId,
    });
  }
  return questions;
}
