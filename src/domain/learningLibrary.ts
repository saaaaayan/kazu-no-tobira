import { worldIslands, type WorldStage, type WorldGrade } from './worldCatalog.ts';

export interface LearningGuide {
  id: string;
  title: string;
  gradeId: string;
  objective: string;
  introduction: string;
  keyPoint: string;
  exampleTip: string;
  linkedStageIds: string[];
}

const descriptions: Record<string, readonly [string, string]> = {
  count: ['ものを一つずつ数えて、数の順番や大きさをたしかめよう。', '数えるときは、ものを飛ばしたり二度数えたりしないようにしよう。'],
  addition: ['二つの数を合わせるときは、たし算を使います。', '数を一つずつ増やしたり、10のまとまりを作ったりして考えよう。'],
  subtraction: ['残りを求めたり、数の違いを比べたりするときは、ひき算を使います。', 'たし算とひき算は、答えを確かめ合うことができます。'],
  place: ['数は位ごとにまとまりを作って表します。', '一の位、十の位、百の位を区別しよう。'],
  shape: ['形の辺や角、特徴をよく見て比べましょう。', '形を向きを変えても、辺や角の数は変わりません。'],
  geometry: ['図形の形や性質を観察し、どこが同じでどこが違うか考えましょう。', '図を描いて条件を整理するとわかりやすくなります。'],
  time: ['時計の短い針は時、長い針は分を表します。', '時刻と、そこから何分たったかという時間は区別しましょう。'],
  multiplication: ['同じ数がいくつ分あるかを、かけ算で表します。', '「一つ分の数×いくつ分」を絵や表でも確かめましょう。'],
  division: ['同じ数ずつ分けるとき、わり算で考えます。', 'かけ算に戻して確かめると間違いを見つけやすくなります。'],
  fraction: ['分数は、一つのものを同じ大きさに分けた部分を表します。', '分母は何等分したか、分子はそのうちいくつ分かを表します。'],
  decimal: ['小数は1より小さい量も位を使って表します。', '計算するときは小数点や位をそろえることを意識しましょう。'],
  data: ['表やグラフは、多くの数を見比べやすくする道具です。', '何を数えているのか、単位と目盛りを確かめましょう。'],
  function: ['一方の量が変わるとき、もう一方の量がどう変わるか調べます。', '表、式、グラフを行き来すると関係が見えやすくなります。'],
  equation: ['わからない数を文字におき、等しい関係を式に表します。', '等式の両辺に同じ操作をしても等しさは保たれます。'],
  probability: ['起こり得る場合を整理し、起こりやすさを考えます。', '数え漏れや重複がないように、表や樹形図を使いましょう。'],
  ratio: ['二つの量の関係を、比や割合で表します。', '比べる量と基準にする量を区別しましょう。'],
  percent: ['割合は基準量に対する比較量の大きさです。', '百分率の100%は基準となる全体の大きさです。'],
  divisor: ['約数や倍数を調べると数の性質がわかります。', '小さい数から順番に確認すると見落としを防げます。'],
  expression: ['数や文字を使って数量の関係を表します。', '計算の順序や分配法則を使って式を整理しましょう。'],
  factor: ['式を展開したり因数に分けたりして構造を理解します。', '逆向きに計算して結果を確かめましょう。'],
  calculus: ['変化の速さを微分で表し、関数の変化を調べます。', '式だけでなくグラフ上での意味も考えましょう。'],
  integral: ['小さな部分を積み重ね、全体の量を求めるのが積分の考え方です。', '面積などの意味と計算式を対応させましょう。'],
  sequence: ['数の並びの規則性を調べ、一般の項を式で表します。', '隣り合う項の差や比を見ると規則が見つかることがあります。'],
  vector: ['大きさと向きをもつ量をベクトルで表します。', '成分表示と図形的な意味を対応させて考えましょう。'],
  limit: ['値がある数に近づくときの様子を調べます。', '有限の値を代入する場合と極限をとる場合を区別しましょう。'],
  proof: ['理由を順番に積み重ねて、結論が成り立つことを示します。', '仮定・根拠・結論をはっきり分けましょう。'],
  mixed: ['今まで学んだ考え方を組み合わせます。', 'どの単元の知識が使えるか最初に整理しましょう。'],
};

const early: Record<string, readonly [string, string, string, string]> = {
  'e1.forest': ['はじめての たしざん', 'ものを一つずつ数えて、合わせた数を考えよう。', 'たし算は「合わせるといくつ」を表すよ。まず数を正しく数えよう。', '数を指で数えてから式と見比べよう。'],
  'e1.bridge': ['10を つくる たしざん', '10になる数の組み合わせを見つけよう。', '10は1と9、2と8、3と7、4と6、5と5に分けられるよ。', '10まであといくつかを考えよう。'],
  'e1.tower': ['10を こえる たしざん', '10のまとまりを使って、10より大きい数をたそう。', 'まず10になる分を足し、残りを足すと考えやすいよ。', '足す数を二つに分けて10を作ってみよう。'],
};

export function guideForStage(stage: WorldStage): LearningGuide {
  const grade = worldIslands.find(item => item.id === stage.gradeId);
  if (!grade) throw new Error('Unknown grade: ' + stage.gradeId);
  const unit = grade.units[stage.unitIndex];
  if (!unit) throw new Error('Unknown unit: ' + stage.unitIndex);
  const legacy = early[stage.id];
  const [intro, point] = descriptions[stage.family] ?? descriptions[unit.family] ??
    ['学ぶ内容を身近な例と式を使って確かめます。', '図や具体的な数に置き換えて考えましょう。'];
  const id = legacy ? 'lesson.' + stage.id : 'lesson.' + grade.id + '.' + unit.code;
  return {
    id,
    title: legacy ? legacy[0] : unit.title,
    gradeId: grade.id,
    objective: legacy ? legacy[1] : grade.title + '「' + unit.title + '」の基本的な考えを理解する。',
    introduction: legacy ? legacy[2] : intro,
    keyPoint: legacy ? legacy[3] : point,
    exampleTip: '例題の解き方を見てから、確認問題は自分の力で考えてみましょう。',
    linkedStageIds: legacy ? [stage.id] : grade.stages.filter(s => s.unitIndex === stage.unitIndex && s.kind === 'normal' && !early[s.id]).map(s => s.id),
  };
}

export function guidesForGrade(grade: WorldGrade): LearningGuide[] {
  const guides = grade.stages.filter(stage => stage.kind === 'normal')
    .map(guideForStage);
  return [...new Map(guides.map(guide => [guide.id, guide])).values()];
}

export function isLessonComplete(progress: { lessons?: Record<string, { completedAt: string }> }, id: string): boolean {
  return Boolean(progress.lessons?.[id]?.completedAt);
}
