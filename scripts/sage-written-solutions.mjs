const t = String.raw;

export function sageWrittenSolution(topic, a, b) {
  switch (topic) {
    case 'algebra': {
      const sum=a+b, product=a*b, answer=a*a+b*b;
      return [
        {title:'方針',body:'2つの実数を個別に求める必要はない。和と積を使って平方の和を表す。'},
        {title:'条件と使う恒等式',body:'和の平方には交差項が2つ現れる。これを左辺に移す。',equations:[
          t`a+b=${sum},\qquad ab=${product}`,t`(a+b)^2=a^2+2ab+b^2`]},
        {title:'立式と計算',body:'恒等式を平方の和について解き、与えられた和と積を代入する。',equations:[
          t`a^2+b^2=(a+b)^2-2ab`,t`=${sum}^2-2\cdot${product}`,t`=${sum*sum}-${2*product}=\boxed{${answer}}`]},
        {title:'結論と検算',body:'平方の和は ' + answer + ' である。例えば条件を満たす次の組でも、同じ結果を確認できる。',equations:[
          t`(a,b)=(${a},${b})`,t`${a}^2+${b}^2=${a*a}+${b*b}=${answer}`]},
        {title:'注意点',body:'和の平方と平方の和は異なる。交差項の係数2を落とさない。'},
      ];
    }
    case 'calculus': {
      const upper=a+b, coefficient=3*b*a*a, minimum=-2*b*a**3;
      return [
        {title:'方針',body:'閉区間で微分の符号を調べ、両端を含めて最小となる点を特定する。'},
        {title:'導関数と増減',body:'区間内で x は非負だから、因数 x＋' + a + ' は正である。したがって導関数が負・0・正になる境目は x＝' + a + ' のみである。',equations:[
          t`f'(x)=${3*b}x^2-${coefficient}`,t`=${3*b}(x-${a})(x+${a})`,
          t`f'(x)<0\quad(0\le x<${a})`,t`f'(x)>0\quad(${a}<x\le ${upper})`]},
        {title:'最小値の計算',body:'関数は閉区間で連続であり、x＝' + a + ' まで狭義単調に減少し、その後は狭義単調に増加する。この点を代入する。',equations:[
          t`f(${a})=${b}\cdot${a}^{3}-${coefficient}\cdot${a}`,t`=${b*a**3}-${coefficient*a}=\boxed{${minimum}}`]},
        {title:'結論と別解',body:'最小値は ' + minimum + '、その値を取る点は x＝' + a + ' だけである。微分を使わなくても差を因数分解すれば、区間内で非負であり、同じ点でのみ0となることを確認できる。',equations:[
          t`f(x)-f(${a})=${b}(x-${a})^2(x+${2*a})\ge0`]},
        {title:'注意点',body:'最小値と、その値を取る x の値を区別する。導関数が0であることだけでは最小値とは判断できない。'},
      ];
    }
    case 'probability': {
      const pairs=a*(a-1)/2, answer=pairs*b;
      return [
        {title:'方針',body:'赤玉を2個、青玉を1個選ぶ。順序を区別しないので、各色は組合せで数える。'},
        {title:'条件の整理',body:'どの取り出し方も、赤玉の組と青玉1個を一意に決める。逆に、その2つの選択を合わせると条件を満たす取り出し方がちょうど1つ決まる。'},
        {title:'立式と計算',body:'各赤玉の組に対して青玉の選び方は同じ数だけある。よって積の法則を用いる。',equations:[
          t`{}_{${a}}\mathrm C_2=\frac{${a}!}{2!\,${a-2}!}=\frac{${a}\cdot${a-1}}2=${pairs}`,
          t`{}_{${b}}\mathrm C_1=${b}`,
          t`{}_{${a}}\mathrm C_2\cdot{}_{${b}}\mathrm C_1`,t`=${pairs}\cdot${b}=\boxed{${answer}}`]},
        {title:'結論',body:'よって求める取り出し方は ' + answer + ' 通りである。'},
        {title:'注意点',body:'玉は区別するが、取り出す順序は区別しない。順列 P で数えると同じ組を重複して数える。'},
      ];
    }
    case 'numberTheory': {
      const max=a*b+a-1;
      return [
        {title:'方針',body:'余りの条件を満たす整数を、割り算の商 k を使って表す。'},
        {title:'条件の整理',body:'正の整数 n を ' + a + ' で割った余りが1であることと、非負整数 k を用いて次の形で表せることは同値である。',equations:[
          t`n\equiv1\pmod{${a}}\iff n=${a}k+1`,t`k\in\mathbb Z,\qquad k\ge0`]},
        {title:'立式と計算',body:'上限を代入して、取りうる商 k の範囲を求める。',equations:[
          t`${a}k+1\le${max}\iff k\le\frac{${max-1}}{${a}}`,
          t`\left\lfloor\frac{${max-1}}{${a}}\right\rfloor=${b}`,t`k=0,1,\ldots,${b}`,t`${b}-0+1=\boxed{${b+1}}`]},
        {title:'結論と検算',body:'各商から異なる整数が1つずつ得られるので ' + (b+1) + ' 個である。最大の候補までは上限に収まり、次の候補は上限を超える。',equations:[
          t`${a*b+1}\le${max}<${a*(b+1)+1}`]},
        {title:'注意点',body:'商が0のときに得られる1も範囲に含まれる。'},
      ];
    }
    case 'vectors': {
      const norm=a*a+b*b;
      return [
        {title:'方針',body:'2本の位置ベクトルの内積を求め、三角形が直角かどうかを調べる。'},
        {title:'条件と直交の確認',body:'どちらも零ベクトルではない。成分ごとの積の和が0なので、2本は原点で直交する。',equations:[
          t`\overrightarrow{OA}=(${a},${b})`,t`\overrightarrow{OB}=(-${b},${a})`,
          t`\overrightarrow{OA}\cdot\overrightarrow{OB}`,t`=${a}(-${b})+${b}\cdot${a}=0`]},
        {title:'立式と計算',body:'直角をはさむ2辺を底辺と高さにできる。2辺の長さはともに正で、長さの二乗は同じである。',equations:[
          t`|OA|^2=|OB|^2=${a}^2+${b}^2=${norm}`,t`2S=|OA|\cdot|OB|=\sqrt{${norm}}\cdot\sqrt{${norm}}`,t`=\boxed{${norm}}`]},
        {title:'結論と別解',body:'面積の2倍は ' + norm + ' である。行列式の絶対値を使っても求められる。',equations:[
          t`2S=\left|${a}\cdot${a}-${b}\cdot(-${b})\right|=${norm}`]},
        {title:'注意点',body:'問われているのは面積そのものではなく、その2倍である。'},
      ];
    }
    default: throw new Error('Unknown Sage solution topic: ' + topic);
  }
}
