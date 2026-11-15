export type SolutionStep = { title: string; body: string; equations?: readonly string[] };

export function writtenSolution(
  focus: string, reasoning: string, equations: readonly string[], conclusion: string, caution?: string,
): readonly SolutionStep[] {
  return [
    { title: '方針', body: focus },
    { title: '立式と計算', body: reasoning, equations },
    { title: '結論', body: conclusion },
    ...(caution ? [{ title: '注意点', body: caution }] : []),
  ];
}

const t = String.raw;
const result = (n: number, unit = '') => '求める値は ' + n + (unit ? ' ' + unit : '') + ' である。';
const parenthesize = (n: number) => n < 0 ? '(' + n + ')' : String(n);

export const highSchoolSolutions = {
  expand(a: number, b: number) {
    return writtenSolution('分配法則を使い、同類項をまとめる。', '左の括弧の各項に、右の括弧の各項を掛ける。',
      [t`(x+${a})(x+${b})=x^2+${b}x+${a}x+${a}\cdot${b}`, t`=x^2+(${a}+${b})x+${a*b}`, t`=\boxed{x^2+${a+b}x+${a*b}}`],
      'これが求める展開式である。', '一次の項は左右の一次項を足し合わせ、定数項では掛け合わせる。');
  },
  vertex(a: number, b: number, c: number) {
    return writtenSolution('平方の項が最小になるときの座標を調べる。', '平方は負にならず、係数は正である。式から下限と等号成立条件を得る。',
      [t`y-${parenthesize(c)}=${a}(x-${parenthesize(b)})^2\ge 0`, t`y=${c}\iff x-${parenthesize(b)}=0\iff x=${b}`],
      '頂点は (' + b + ', ' + c + ') だから、求める x 座標は ' + b + ' である。');
  },
  inequality(a: number) {
    return writtenSolution('平方の比較を絶対値の比較に直す。', '両辺が非負の範囲で平方根を取っても大小関係は変わらない。',
      [t`x^2-${a*a}<0\iff x^2<${a}^2`, t`\iff |x|<${a}\iff -${a}<x<${a}`],
      '解は −' + a + '＜x＜' + a + ' である。', '等号を含まないので、両端は解に入らない。');
  },
  data(a: number, b: number, c: number, median: boolean) {
    return median
      ? writtenSolution('値を昇順に並べる。', 'データは3個なので、中央値は小さい方から2番目の値である。', [t`${a}<\boxed{${b}}<${c}`], result(b))
      : writtenSolution('データの合計を個数で割る。', '平均を x̄ とおく。データは3個である。', [t`\bar{x}=\frac{${a}+${b}+${c}}{3}=\frac{${a+b+c}}{3}=${b}`], result(b));
  },
  perimeter(a: number, b: number) {
    return writtenSolution('長方形では向かい合う2辺の長さが等しい。', '縦と横を1本ずつ足し、2倍する。',
      [t`L=2(${a}+${b})=2\cdot${a+b}=${2*(a+b)}`], result(2*(a+b), 'cm'), '面積を求める式と区別する。');
  },
  divisor(a: number, b: number) {
    const equations = [t`\gcd(${a},${b})`];
    let x = Math.max(a,b), y = Math.min(a,b);
    while (y > 0) {
      const rest = x % y;
      equations.push(t`${x}=${y}\cdot${Math.floor(x/y)}+${rest}`);
      [x,y] = [y,rest];
    }
    return writtenSolution('ユークリッドの互除法を使う。', '割られる数と割る数の公約数は、割る数と余りの公約数に等しい。余りが0になるまで繰り返す。', equations,
      '余りが0になったときの割る数 ' + x + ' が最大公約数である。');
  },
  likeTerms(a: number, b: number) {
    return writtenSolution('同じ文字部分の項をまとめる。', '分配法則を逆に使い、共通因数 x をくくる。', [t`${a}x+${b}x=(${a}+${b})x=\boxed{${a+b}x}`], 'これが整理した式である。');
  },
  substitute(a: number, b: number, x: number) {
    return writtenSolution('与えられた値を代入する。', '掛け算を先に計算し、定数項を足す。',
      [t`${a}x+${b}=${a}\cdot${parenthesize(x)}+${b}=${a*x+b}`], result(a*x+b));
  },
  sampling(total: number, count: number, answer: string) {
    const [num, den] = answer.split('/');
    return writtenSolution('赤玉を引く事象を A とおく。', '1個ずつ区別すると、各玉が選ばれる可能性は等しい。全事象の結果は玉の総数個、A に属する結果は赤玉の個数分である。',
      [t`P(A)=\frac{${count}}{${count}+${total-count}}=\frac{${count}}{${total}}`, ...(Number(den)===total ? [] : [t`P(A)=\frac{${num}}{${den}}`])],
      'これが赤玉を引く確率である。', '分母は青玉だけの個数ではなく赤玉も含めた総数である。');
  },
  permutation(a: number, b: number, value: number) {
    return writtenSolution('選ぶ順序を区別するので、順列を使う。', '同じ人を再び選ぶことはできない。各位置の選択肢は1つずつ減る。',
      [t`{}_{${a}}\mathrm P_{${b}}=\frac{${a}!}{${(a-b)}!}`,
       t`=${Array.from({length:b},(_,i)=>a-i).join('\\cdot ')}=\boxed{${value}}`],
      'よって ' + value + ' 通りである。', '順番を入れ替えた並べ方は別なので、組合せでは数えない。');
  },
  complex(power: number, answer: string) {
    const r = power % 4, q = Math.floor(power/4);
    return writtenSolution('虚数単位の4乗を基準に指数を整理する。', '虚数単位の定義により i²＝−1 である。',
      [t`i^4=(i^2)^2=(-1)^2=1`, t`${power}=4\cdot${q}+${r}`,
       t`i^{${power}}=(i^4)^{${q}}i^{${r}}=1^{${q}}\cdot i^{${r}}=${answer.replace('−','-')}`],
      '最後の値が求める i の ' + power + ' 乗である。');
  },
  distance(a: number, b: number, k: number) {
    const dx=3*k, dy=4*k;
    return writtenSolution('座標の差を直角三角形の2辺として距離を求める。', 'x 座標の差、y 座標の差を計算する。距離 d は非負である。',
      [t`\Delta x=${a+dx}-${parenthesize(a)}=${dx}`, t`\Delta y=${b+dy}-${parenthesize(b)}=${dy}`,
       t`d=\sqrt{(\Delta x)^2+(\Delta y)^2}`, t`=\sqrt{${dx}^2+${dy}^2}=\sqrt{${25*k*k}}=${5*k}`], result(5*k));
  },
  exponential(a: number, p: number, log: boolean) {
    const value=a**p;
    return log ? writtenSolution('対数を指数の問題に置き換える。', '底は正で1と異なり、真数も正である。したがって次の同値変形ができる。',
      [t`\log_{${a}}{${value}}=x\iff ${a}^x=${value}=${a}^{${p}}`, t`x=${p}`], '底が1より大きい指数関数は単調増加なので、答えは一意に ' + p + ' である。')
      : writtenSolution('正の整数乗を同じ数の積として計算する。', '底を指数の回数だけ因数として並べる。',
        [t`${a}^{${p}}=${Array.from({length:p},()=>a).join('\\cdot ')}=${value}`], result(value));
  },
  derivative(a: number, p: number, x: number) {
    const n=a*p*x**(p-1);
    return writtenSolution('先に導関数を求め、その式に指定の値を代入する。', 'べき関数の微分公式を使う。定数倍はそのまま残る。',
      [t`\frac{\mathrm d}{\mathrm dx}x^n=nx^{n-1}`, t`f'(x)=${a}\cdot${p}x^{${p-1}}=${a*p}x^{${p-1}}`,
       t`f'(${x})=${a*p}\cdot${x}^{${p-1}}=${n}`], result(n), '求めるのは関数 f の値ではなく、導関数の値である。');
  },
  integral(a: number, p: number, upper: number) {
    const c=a/(p+1), value=c*upper**(p+1);
    return writtenSolution('原始関数を求め、上端と下端での値の差を取る。', '被積分関数は区間全体で連続する多項式である。積分定数は定積分の差で相殺される。',
      [t`\int ${a}x^{${p}}\,\mathrm dx=\frac{${a}}{${p}+1}x^{${p+1}}+C`, t`=${c}x^{${p+1}}+C`,
       t`\int_{0}^{${upper}}${a}x^{${p}}\,\mathrm dx=\left[${c}x^{${p+1}}\right]_{0}^{${upper}}`,
       t`=${c}\bigl(${upper}^{${p+1}}-0^{${p+1}}\bigr)=\boxed{${value}}`], result(value), '上端の値から下端の値を引く。');
  },
  sequence(a: number, d: number, k: number) {
    return writtenSolution('漸化式から等差数列の一般項を求める。', '第 n 項までには、公差を n−1 回加える。',
      [t`a_1=${a},\qquad a_{n+1}=a_n+${d}`, t`a_n=${a}+(n-1)\cdot${d}`, t`a_{${k}}=${a}+(${k}-1)\cdot${d}=${a+(k-1)*d}`],
      '以上が求める第 ' + k + ' 項である。');
  },
  vector(a: number,b: number,c: number,d: number) {
    return writtenSolution('同じ座標軸に対応する成分の積を足す。', '内積の成分表示に座標を代入する。',
      [t`\vec a\cdot\vec b=a_xb_x+a_yb_y`,
       t`=${parenthesize(a)}\cdot${parenthesize(c)}+${parenthesize(b)}\cdot${parenthesize(d)}`,
       t`=${a*c}+${parenthesize(b*d)}=\boxed{${a*c+b*d}}`], result(a*c+b*d), '異なる座標軸の成分同士は掛けない。');
  },
  limit(a: number, b: number, sequence: boolean) {
    return sequence ? writtenSolution('分母が大きくなるとき、分数を上から抑える。', '分子は正の定数で、n と b は正なので次の評価が成り立つ。',
      [t`0<\frac{${a}}{n+${b}}\le\frac{${a}}{n}`, t`\lim_{n\to\infty}\frac{${a}}{n}=0`,
       t`\lim_{n\to\infty}\frac{${a}}{n+${b}}=0`], 'はさみうちの原理より、求める極限は 0 である。')
      : writtenSolution('多項式の連続性を利用する。', '多項式は実数全体で連続なので、この点での極限はその点での関数値に等しい。',
        [t`\lim_{x\to ${a}}(x^2+${b})=${a}^2+${b}`, t`=${a*a}+${b}=\boxed{${a*a+b}}`], result(a*a+b));
  },
  trig(expression: string, answer: string) {
    const [functionName, raw] = expression.split(' ');
    const angle=Number(raw.replace('°',''));
    const coordinates: Record<number, [string,string]> = {0:['1','0'],30:[t`\frac{\sqrt 3}{2}`,t`\frac12`],
      45:[t`\frac{\sqrt 2}{2}`,t`\frac{\sqrt 2}{2}`],60:[t`\frac12`,t`\frac{\sqrt 3}{2}`],90:['0','1']};
    const [x,y]=coordinates[angle];
    const value=answer.includes('/') ? t`\frac{${answer.split('/')[0].replace('√',t`\sqrt `)}}{${answer.split('/')[1]}}` : answer.replace('√',t`\sqrt `);
    return writtenSolution('単位円上の対応する点の座標を使う。',
      (angle%90===0 ? '座標軸との交点で座標が分かる。' : angle===45 ?
      '直角二等辺三角形の辺の比 1：1：√2 から座標を求める。' :
      '30°・60°・90°の直角三角形の辺の比 1：√3：2 から座標を求める。') +
      (functionName==='tan' ? ' 正接は y 座標を 0 でない x 座標で割る。' : functionName==='cos' ? ' 余弦は x 座標である。' : ' 正弦は y 座標である。'),
      [t`(\cos ${angle}^\circ,\sin ${angle}^\circ)=\left(${x},${y}\right)`,
       functionName==='tan' ? t`\tan ${angle}^\circ=\frac{${y}}{${x}}=${value}` : t`\${functionName} ${angle}^\circ=${value}`],
      '以上が求める三角比の値である。');
  },
};

const logicEquations = [
  [t`E(n)\Rightarrow 2\mid n`,t`2\mid n\Rightarrow E(n)`],
  [t`M_3(n)\Rightarrow 3\mid n`,t`3\mid n\Rightarrow M_3(n)`],
  [t`x>2\Rightarrow x>1`,t`x>1\Rightarrow x>2`],
  [t`\neg(x>1)\iff x\le1`,t`\neg(x>2)\iff x\le2`,t`x\le1\Rightarrow x\le2`],
  [t`p\Rightarrow q\quad\longmapsto\quad q\Rightarrow p`],
  [t`p\Rightarrow q\iff\neg q\Rightarrow\neg p`],
  [t`n=10k+r,\quad r\in\{0,5\}`,t`5\mid 10k,\quad 5\mid r\quad\Rightarrow\quad 5\mid n`],
  [t`E(a)\Rightarrow E(a^2)`,t`\neg E(a^2)\Rightarrow\neg E(a)`],
  [t`x\in A\cap B\iff (x\in A)\land(x\in B)`],
  [t`x\in A\cup B\iff (x\in A)\lor(x\in B)`],
  [t`|\varnothing|=0`],
  [t`U^{\mathrm c}=U\setminus U=\varnothing`],
  [t`(p\Rightarrow q)\land(q\Rightarrow p)\iff(p\Leftrightarrow q)`],
  [t`x=3\Rightarrow x^2=9`,t`x^2=9\Rightarrow x=3`],
  [t`\neg(x^2=9)\iff x^2\ne9`,t`\neg(x=3)\iff x\ne3`,t`x^2\ne9\Rightarrow x\ne3`],
];
const logicReasoning = [
  'E(n) を「整数 n が偶数である」とする。逆では仮定と結論を入れ替える。',
  'M₃(n) を「整数 n が3の倍数である」とする。逆では「3で割り切れる」が仮定になる。',
  '不等号はそのままで、仮定と結論だけを入れ替える。',
  '結論の否定を新しい仮定に、仮定の否定を新しい結論にする。',
  '仮定と結論の順序だけを入れ替え、それぞれの中身は否定しない。',
  '結論を否定した命題を仮定に、仮定を否定した命題を結論にする。元の命題と対偶は真偽が一致する。',
  '整数 n を10で割った商を k、余りを r とおく。仮定と結論を入れ替え、末尾が0か5であることを新たな仮定にする。',
  'E(t) は「整数 t は偶数である」を表す。結論と仮定を交換し、それぞれを否定する。',
  '共通部分に属するには、2つの所属条件をどちらも満たす必要がある。',
  '和集合に属するには、2つの所属条件のうち少なくとも一方を満たせばよい。両方に属する点も含む。',
  '空集合は要素を1つも持たない集合である。',
  '補集合は、全体集合 U のうち対象の集合に入らない要素からなる。U 自身に入らない要素は U の中にない。',
  'p が q の十分条件なら p ⇒ q、必要条件なら q ⇒ p である。',
  '逆を作るには、等式を否定せず仮定と結論だけを入れ替える。',
  '元の結論と仮定を入れ替えて両方を否定する。不等号ではなく等式なので、否定には「等しくない」を使う。',
];
export function logicSolution(index: number, answer: string) {
  const note = index===2 ? '逆は元の命題と真偽が一致するとは限らない。例えば x＝1.5 は逆の反例になる。'
    : index===13 ? '逆の命題自体は偽である。x＝−3 でも平方は9になる。'
    : index===10 ? '空集合と、0を要素として1個含む集合を区別する。' : undefined;
  return writtenSolution(index>=8 && index<=12 ? '記号と定義を対応させる。' : '仮定と結論の関係を整理する。',
    logicReasoning[index], logicEquations[index], 'したがって「' + answer + '」である。', note);
}

export function discoverySolution(mode: number, answer: number) {
  switch(mode) {
    case 0:
      return writtenSolution('部分和を先に求めて極限を取る。', '初項1、公比1/2の等比数列である。部分和を Sₙ とし、等比数列の和の公式を使う。',
        [t`S_n=\sum_{k=0}^{n-1}\left(\frac12\right)^k`, t`S_n=\frac{1-(1/2)^n}{1-1/2}=2(1-2^{-n})`, t`\lim_{n\to\infty}S_n=2`],
        '公比の絶対値が1未満で 2⁻ⁿ は0に近づく。求める無限和は2である。');
    case 1:
      return writtenSolution('オイラーの公式で指数を三角関数に直す。', '実数 θ に対する公式に θ＝π を代入する。',
        [t`e^{i\theta}=\cos\theta+i\sin\theta`,t`e^{i\pi}+1=\cos\pi+i\sin\pi+1`,t`=-1+i\cdot0+1=0`], result(0));
    case 2:
      return writtenSolution('初項と末項から順に組を作る。', '1と10、2と9のように組にすると、どの組の和も11である。10個の数から5組できる。',
        [t`\sum_{k=1}^{10}k=\frac{10}{2}(1+10)=5\cdot11=55`], result(55));
    case 3:
      return writtenSolution('自然対数を取って極限を調べる。', '0≤u≤t では 1/(1+t)≤1/(1+u)≤1。t＞0 について u で積分すると、対数を次のように評価できる。',
        [t`\frac{t}{1+t}\le\log(1+t)\le t`,t`\frac{1}{1+1/n}\le n\log(1+1/n)\le1`,t`\lim_{n\to\infty}n\log(1+1/n)=1`,t`\lim_{n\to\infty}(1+1/n)^n=e^1=e`],
        't＝1/n としてはさみうちの原理を使い、指数関数の連続性で元に戻す。求める極限は e である。');
    case 4:
      return writtenSolution('素数が有限個しかないと仮定して矛盾を導く。', 'すべての素数を p₁,…,pₙ とする。積に1を加えた整数 N を作ると、どの pⱼ で割っても余りは1になる。',
        [t`N=p_1p_2\cdots p_n+1>1`,t`N\equiv 1\pmod{p_j}\quad(1\le j\le n)`],
        '1より大きい整数 N は素因数を持つが、その素因数は列挙したどの素数でもない。仮定と矛盾するので素数は無限にある。',
        'N 自体が素数であることを示す必要はない。');
    case 5: {
      const n = Math.sqrt(answer);
      return writtenSolution('奇数の列を等差数列と見る。', '初項は1、末項は ' + (2*n-1) + '、項数は ' + n + ' である。和は両端の平均に項数を掛けた値になる。',
        [t`\sum_{k=1}^{${n}}(2k-1)=\frac{${n}(1+${2*n-1})}{2}`,t`=${n}^2=\boxed{${answer}}`], result(answer));
    }
    case 6: return highSchoolSolutions.complex(4,'1');
    case 7:
      return writtenSolution('等比数列の一般項を使う。','初項から第5項までには4回、公比を掛ける。',
        [t`a_n=a_1r^{n-1}`,t`a_5=3\cdot2^{5-1}=3\cdot16=48`],result(48));
    case 8: return highSchoolSolutions.integral(2,1,2);
    default:
      return writtenSolution('2つの三角比をそれぞれ求める。','余角の関係から cos 60°＝sin 30° である。30°の向かいの辺は斜辺の半分なので、値はともに 1/2 である。',
        [t`\sin30^\circ+\cos60^\circ=\frac12+\frac12=1`],result(1));
  }
}
