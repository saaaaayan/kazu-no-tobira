import { worldGrades } from './worldCatalog.ts';
import type { UnitLesson, LessonCheck } from './unitLessons.ts';
import type { GradeId } from './curriculum.ts';

type Starter = {
  grade: GradeId;
  title: string;
  prerequisiteIds?: UnitLesson['prerequisiteIds'];
  principle: string;
  diagram: readonly (readonly string[])[];
  example: string;
  reveal: readonly string[];
  checks: readonly [prompt: string, answer: number, distractors: readonly [number, number], hint: string, explanation: string][];
};

const starters: readonly Starter[] = [
  { grade:'e2', title:'百の位・十の位・一の位', prerequisiteIds:['e1.number-order'],
    principle:'百の位は100のまとまり、十の位は10のまとまり、一の位はばらの数。ある位のまとまりがないときは、その位に0を書く。',
    diagram:[['百の位','十の位','一の位'],['2','0','5'],['100が2こ','10が0こ','ばらが5こ']],
    example:'205の十の位の数字は何ですか？', reveal:['右から 一の位、十の位、百の位。','十のまとまりはないので、十の位は0。'],
    checks:[['347の十の位の数字は？',4,[3,7],'右から2番目を見よう。','347は100が3こ、10が4こ、ばらが7こ。十の位は4。'],
      ['508の百の位の数字は？',5,[0,8],'100のまとまりはいくつ？','508は500と8。100が5こ。']] },
  { grade:'e3', title:'千までの位取り', prerequisiteIds:['e2.numbers1000'],
    principle:'10こ集めるたびに左となりの位の1こになります。たとえば、100を10こ集めると1000です。',
    diagram:[['千の位','百の位','十の位','一の位'],['4','0','6','2']],
    example:'4062は、どんなまとまりでできていますか？', reveal:['左の4は1000が4こ、0は100が0こ。','6は10が6こ、2は一が2こ。4000＋60＋2＝4062。'],
    checks:[['7309の十の位の数字は？',0,[3,9],'右から2番目は何？','百のまとまり3こと一のまとまり9この間には、十のまとまりがない。'],
      ['100が10こ集まるといくつ？',1000,[10,100],'百が10こだから100×10。','100×10＝1000。千のまとまりが1こ。']] },
  { grade:'e4', title:'整数の位取りと大きな単位', prerequisiteIds:['e3.numbers10000'],
    principle:'日本語では4桁ごとに万・億・兆を使います。各桁の10倍は左へ1桁、1万倍は左へ4桁です。',
    diagram:[['億のまとまり','万のまとまり','一のまとまり'],['2','0036','0420']],
    example:'2億36万420の十の位を求めよう。', reveal:['桁をそろえると 2｜0036｜0420。','一のまとまりの右から2番目が十の位。答えは2。'],
    checks:[['3万を10倍するといくつ？',300000,[30000,3000000],'3が立つ位を1つ左へ移そう。','3万×10＝30万＝300000。'],
      ['560万の十の位の数字は？',0,[5,6],'560｜0000 に分けて見よう。','十の位は一のまとまりの右から2番目。0。']] },
  { grade:'e5', title:'小数×整数', prerequisiteIds:['e4.large4'],
    principle:'小数を0.1や0.01のまとまりで数え、そのまとまりの個数を整数倍すると積を求められます。',
    diagram:[['長さ','0.01 m の個数'],['0.24 m','24こ'],['0.24 m が3本','72こ']],
    example:'0.24 mのひもを3本つなぐと何m？', reveal:['0.24 mは、0.01 mが24こ。','24×3＝72だから、0.01 mが72こ。0.72 m。'],
    checks:[['0.36×4はいくつ？',1.44,[0.144,14.4],'0.01が36こあると考えよう。','36×4＝144。0.01が144こで1.44。'],
      ['1.2×5はいくつ？',6,[0.6,60],'0.1が12こあると考えよう。','12×5＝60。0.1が60こで6。']] },
  { grade:'e6', title:'分数どうしをかける', principle:'分数をかけるときは分子どうしと分母どうしをかけます。積の分子と分母に共通の約数があれば約分できます。',
    diagram:[['わくの分け方','横に4等分、縦に3等分'],['ぜんぶ','4×3＝12マス'],['重なる部分','3×2＝6マス']],
    example:'3/4の2/3を求めましょう。', reveal:['横4等分の3列と縦3等分の2行が重なる6マスを考えます。','3/4×2/3＝6/12＝1/2。'],
    checks:[['2/5×3/7の分子はいくつ？ 約分できない分数で答えましょう。',6,[5,35],'分子2と3をかけよう。','2×3＝6、5×7＝35。6/35は約分できない。'],
      ['4/9×3/8を約分したとき、分母はいくつ？',6,[18,72],'12/72の上下を12で割ろう。','12/72＝1/6。分母は6。']] },
  { grade:'j1', title:'正の数と負の数の加法', principle:'正の数を加えると数直線で右へ、負の数を加えると左へ移動します。同符号は絶対値を足し、異符号は絶対値の差を取ります。',
    diagram:[['−3','−2','−1','0','1','2','3'],['← 負の向き','','','','','','正の向き →']],
    example:'(−3)＋5 を数直線で考えましょう。', reveal:['−3を起点に、正の向きへ5目盛り移動します。','−2、−1、0、1、2と進むので答えは2。'],
    checks:[['(−7)＋4 はいくつ？',-3,[3,-11],'−7を起点に右へ4進みます。','絶対値は7の方が大きく、7−4＝3。符号は負。'],
      ['(−4)＋(−6) はいくつ？',-10,[-2,10],'負の向きにさらに6進みます。','4＋6＝10、どちらも負なので−10。']] },
  { grade:'j2', title:'同類項をまとめる', prerequisiteIds:['j1.signed1'], principle:'文字と指数が同じ項を同類項と呼びます。同類項は係数だけを足し引きし、文字の部分はそのままです。',
    diagram:[['項','係数','文字'],['3x','3','x'],['−5x','−5','x'],['−2x','−2','x']],
    example:'3x−5x＋2 を整理しましょう。', reveal:['3xと−5xをまとめる。 (3−5)x＝−2x。','定数2はxの項ではないので −2x＋2。'],
    checks:[['2x−9xをまとめると、xの係数はいくつ？',-7,[7,-11],'2と−9を足そう。','2−9＝−7。文字はxのまま。'],
      ['x=−2のとき 3x＋4 はいくつ？',-2,[10,-10],'xに−2を代入したあと掛け算を先に。','3×(−2)＋4＝−6＋4＝−2。']] },
  { grade:'j3', title:'二つのかっこの展開', prerequisiteIds:['j2.polynomial2'], principle:'一方のかっこの各項を、もう一方のかっこの各項に掛ける。最後に同類項をまとめます。',
    diagram:[['×','x','4'],['x','x²','4x'],['3','3x','12']],
    example:'(x＋3)(x＋4) を展開しましょう。', reveal:['積の表にある4項をすべて足します。x²＋4x＋3x＋12。','一次の項をまとめて x²＋7x＋12。'],
    checks:[['(x＋2)(x＋6)を展開したとき、xの係数はいくつ？',8,[12,4],'xに2と6をそれぞれ掛けた項を足そう。','2x＋6x＝8x。'],
      ['(x＋3)(x＋7)を展開したとき、定数項はいくつ？',21,[10,7],'文字のない項の積を取ります。','3×7＝21。']] },
  { grade:'h1', title:'展開公式の使い分け', prerequisiteIds:['j3.factor3'], principle:'積を展開するときは分配法則が出発点です。平方では混合項が2つ現れ、和と差の積では混合項が打ち消し合います。',
    diagram:[['積','混合項'],['(x＋a)²','ax＋ax＝2ax'],['(x＋a)(x−a)','ax−ax＝0']],
    example:'(x＋5)² を展開しましょう。', reveal:['x²＋5x＋5x＋25。','混合項をまとめ、x²＋10x＋25。'],
    checks:[['(x＋4)²を展開したとき、xの係数はいくつ？',8,[4,16],'4xが2つあります。','4x＋4x＝8x。'],
      ['(x＋6)(x−6)の定数項はいくつ？',-36,[36,0],'定数どうしは符号ごと掛けます。','6×(−6)＝−36。混合項が消え、x²−36。']] },
  { grade:'h2', title:'多項式の整理と恒等式の準備', prerequisiteIds:['h1.algebra1'], principle:'文字と指数が同じ項を整理することで、どんな代入でも成立する式の変形か確かめられます。特定の値だけで一致しても恒等式とは限りません。',
    diagram:[['左辺','右辺','関係'],['2x＋3x','5x','すべてのxで等しい'],['2x＋1','5','x＝2のときだけ等しい']],
    example:'2x＋3x＝5x はなぜ恒等式ですか？', reveal:['分配法則により左辺＝(2＋3)x。','係数を足すと5x。特定のxを仮定していない。'],
    checks:[['7x−4xを整理した後のxの係数は？',3,[11,-3],'同類項の係数を引きます。','7−4＝3。したがって3x。'],
      ['x＝−3 のとき、4x＋7の値はいくつ？',-5,[5,19],'4×(−3)を先に計算します。','−12＋7＝−5。']] },
  { grade:'h3', title:'数列の極限と連続な関数の極限', principle:'nを大きくすると定数を増え続ける正の量で割った値は0に近づきます。多項式の有限点での極限は、連続性によりその点の値になります。',
    diagram:[['n','1','10','100','1000'],['2/(n＋1)','1','2/11','2/101','2/1001']],
    example:'lim[n→∞] 2/(n＋1) を求めましょう。', reveal:['n≥1では0＜2/(n＋1)≤2/n。','2/nの極限が0なので、はさみうちの原理より極限は0。'],
    checks:[['lim[n→∞] 5/(n＋3) の値は？',0,[1,5],'分子は一定で、分母は限りなく大きくなります。','0＜5/(n＋3)≤5/nで、上限は0に近づく。'],
      ['lim[x→2] (x²＋3) の値は？',7,[5,9],'多項式なのでx＝2を代入できます。','2²＋3＝7。']] },
];

export const gradeStarterLessons: readonly UnitLesson[] = starters.map(starter => {
  const { grade } = starter;
  const island = worldGrades.find(item => item.id === grade)!;
  const unit = island.units[0];
  const diagram = { kind:'table' as const, cells:starter.diagram };
  const checks: LessonCheck[] = starter.checks.map(([prompt,answer,[first,second],retryHint,explanation],i) => ({
    id:'check-' + (i+1), prompt, answer, choices:i % 2 ? [answer,first,second] : [first,answer,second], retryHint, explanation,
  }));
  return {
    id: grade + '.' + unit.code as UnitLesson['id'], grade, title:starter.title,
    goals:[starter.principle], prerequisiteIds:starter.prerequisiteIds ?? [],
    readiness:'表と例題で考え方を確かめましょう。', summary:starter.principle,
    completionMessage:'理解確認をクリアしたね。ステージで練習しよう！',
    steps:[{title:'表で考え方を整理する',text:starter.principle,diagram}],
    workedExamples:[{title:'例題',text:starter.example,diagram,reveal:starter.reveal}],
    checks, linkedStageIds:island.stages.filter(stage=>stage.kind==='normal' && stage.unitIndex===0).map(stage=>stage.id),
  };
});
