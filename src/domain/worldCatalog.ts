import { gradeIds, type GradeId } from './curriculum.ts';

export type StageKind = 'normal' | 'extra' | 'secret';
export type StageId780 = `${GradeId}.${string}`;

export interface StudyUnit {
  code: string;
  title: string;
  family: string;
}

export interface WorldGrade {
  id: GradeId;
  title: string;
  island: string;
  theme: string;
  units: readonly StudyUnit[];
  stages: readonly WorldStage[];
}

export interface WorldStage {
  id: StageId780;
  gradeId: GradeId;
  kind: StageKind;
  order: number;
  unitIndex: number;
  part: number;
  title: string;
  subtitle: string;
  family: string;
  questions: number;
}

const makeUnits = (raw: string): StudyUnit[] => raw.trim().split('\n')
  .map(line => {
    const [code, title, family] = line.split('|');
    if (!code || !title || !family) throw new Error('Invalid curriculum unit: ' + line);
    return { code, title, family };
  });

export const gradeDefinitions: readonly { id: GradeId; title: string; island: string; theme: string; units: readonly StudyUnit[] }[] = [
  {
    id: 'e1', title: '小学1年生', island: 'はじまりの島', theme: 'かずと なかよし',
    units: makeUnits(`
number-order|かずの じゅんばん|count
add-small|9までの たしざん|addition
sub-small|9までの ひきざん|subtraction
make-ten|10を つくろう|addition
count-twenty|20までの かず|count
cross-ten|くりあがりの たしざん|addition
borrow-ten|くりさがりの ひきざん|subtraction
count-hundred|100までの かず|place
shapes1|かたちと おおきさ|shape
clock1|とけいと おはなし|time`),
  },
  {
    id: 'e2', title: '小学2年生', island: 'くくの森の島', theme: 'かけざんの まほう',
    units: makeUnits(`
numbers1000|1000までの かず|place
addition2|2けたの たしざん|addition
subtraction2|2けたの ひきざん|subtraction
multiplication2|かけざん 九九|multiplication
mult-story|かけざんの おはなし|multiplication
clock2|時こくと 時間|time
length2|長さを はかろう|unit
capacity2|かさを はかろう|unit
shapes2|三角形と 四角形|shape
fraction2|分数と ひょう・グラフ|fraction`),
  },
  {
    id: 'e3', title: '小学3年生', island: 'わり算の谷の島', theme: '数の ひみつを さがそう',
    units: makeUnits(`
numbers10000|一万までの 数|place
addition3|3けたの たし算|addition
subtraction3|3けたの ひき算|subtraction
multiplication3|2けたの かけ算|multiplication
division3|わり算と あまり|division
decimal3|小数の はじめ|decimal
fraction3|分数の はじめ|fraction
measure3|重さ・長さ・時間|unit
circle3|円と 球|geometry
data3|表と 棒グラフ|data`),
  },
  {
    id: 'e4', title: '小学4年生', island: '四角の城の島', theme: 'ひろがる 算数の せかい',
    units: makeUnits(`
large4|大きな数と しくみ|place
expressions4|計算の きまり|operation
division4|2けたで わる計算|division
decimal4|小数の たし算・ひき算|decimal
fraction4|同じ分母の 分数|fraction
area4|面積を もとめよう|area
angle4|角度と 分度器|angle
solid4|立方体と 直方体|geometry
chart4|折れ線グラフ|data
patterns4|変わり方を しらべよう|pattern`),
  },
  {
    id: 'e5', title: '小学5年生', island: '割合の海の島', theme: 'わりあいと 図形の 冒険',
    units: makeUnits(`
decimalmult5|小数の かけ算・わり算|decimal
fractionadd5|異なる分母の 分数|fraction
integers5|倍数・約数と 偶数奇数|divisor
percent5|割合と 百分率|percent
proportion5|比例の 考え|ratio
area5|三角形・平行四辺形の 面積|area
volume5|直方体と 体積|volume
average5|平均と 単位量|average
circle5|円周と 円周率|circle
congruence5|合同な図形と 多角形|geometry`),
  },
  {
    id: 'e6', title: '小学6年生', island: '比の天空の島', theme: '算数から 数学へ',
    units: makeUnits(`
fractionmult6|分数の かけ算・わり算|fraction
letters6|文字を 使った 式|equation
ratio6|比と 比の値|ratio
functions6|比例と 反比例|function
scale6|拡大図と 縮図|geometry
symmetry6|線対称と 点対称|shape
circlearea6|円の 面積|circle
prism6|角柱と 円柱の 体積|volume
data6|データと 度数分布|data
speed6|速さと まとめ|speed`),
  },
  {
    id: 'j1', title: '中学1年生', island: '方程式の大陸', theme: '負の数と 文字の 力',
    units: makeUnits(`
signed1|正の数・負の数|signed
expressions1|文字式の 計算|expression
equation1|一次方程式|equation
ratiofunction1|比例・反比例|function
coordinates1|座標と グラフ|function
plane1|平面図形と 作図|geometry
space1|空間図形と 体積|volume
dataj1|資料の 整理と 代表値|data
primej1|素数・約数・倍数|divisor
wordj1|方程式の 利用|equation`),
  },
  {
    id: 'j2', title: '中学2年生', island: '関数の草原', theme: '変化と 証明の 旅',
    units: makeUnits(`
polynomial2|式の 計算|expression
systems2|連立方程式|system
linearfunction2|一次関数|function
triangle2|三角形の 合同|proof
quadrilateral2|平行四辺形の 性質|geometry
probability2|確率|probability
boxplot2|箱ひげ図と 四分位数|data
angles2|多角形と 角|angle
proof2|図形の 証明|proof
wordj2|連立方程式の 利用|system`),
  },
  {
    id: 'j3', title: '中学3年生', island: '平方根の迷宮', theme: '二次の 世界へ',
    units: makeUnits(`
factor3|展開と 因数分解|factor
radical3|平方根|radical
quadratic3|二次方程式|quadratic
parabola3|二次関数|quadraticFunction
similar3|相似な図形|geometry
circleangle3|円周角の 定理|angle
pythagoras3|三平方の 定理|pythagoras
sampling3|標本調査|data
proof3|数と 図形の 論証|proof
reviewj3|中学数学の 総合|mixed`),
  },
  {
    id: 'h1', title: '高校1年生', island: '論理と確率の王国', theme: '数学I・数学A',
    units: makeUnits(`
algebra1|数と式・展開と因数分解|factor
logic1|集合と 命題|logic
quadraticfunction1|二次関数の グラフ|quadraticFunction
inequality1|二次不等式|inequality
trig1|三角比と 図形|trig
data1|データ分析|data
counting1|場合の数|combinatorics
probabilityh1|確率と 期待値|probability
integers1|整数の 性質|divisor
geometryh1|図形の 性質|geometry`),
  },
  {
    id: 'h2', title: '高校2年生', island: '関数と変化の宮殿', theme: '数学II・数学B・数学C',
    units: makeUnits(`
polynomialh2|式と 証明|expression
complexEq2|複素数と 方程式|complex
circleline2|図形と 方程式|coordinateGeometry
trigfunction2|三角関数|trig
expLog2|指数関数・対数関数|exponential
derivative2|微分法|calculus
integral2|積分法|integral
sequence2|数列と 漸化式|sequence
stats2|統計的な 推測|probability
vector2|平面ベクトル|vector`),
  },
  {
    id: 'h3', title: '高校3年生', island: '無限と発見の宇宙', theme: '数学III・数学C',
    units: makeUnits(`
limitseq3|数列の 極限|limit
limitfunction3|関数の 極限と 連続|limit
derivative3|いろいろな 微分|calculus
derivativeUse3|導関数と グラフ|calculus
integral3|いろいろな 積分|integral
integralUse3|面積・体積と 積分|integral
complexplane3|複素数平面|complex
curves3|平面上の 曲線|coordinateGeometry
spacevector3|空間ベクトル|vector
discovery3|発展問題と 数学の 探究|mixed`),
  },
] as const;

const trailNames = ['はじめの一歩', 'れんしゅうの道', 'ひらめきの門', 'チャレンジの丘', 'マスターの宝箱'];
const secretNames = [
  '数のひみつを発見', '不思議な規則の旅', '数学の魔法を解こう',
  'ひらめきの天文台', '無限のトビラ',
];

function createStages(def: typeof gradeDefinitions[number]): WorldStage[] {
  const stages: WorldStage[] = [];
  for (let unitIndex = 0; unitIndex < 10; unitIndex++) {
    const unit = def.units[unitIndex];
    for (let part = 0; part < 5; part++) {
      const order = unitIndex * 5 + part;
      const legacy = def.id === 'e1' && order < 3
        ? (['e1.forest', 'e1.bridge', 'e1.tower'] as const)[order]
        : undefined;
      const legacyInfo = def.id === 'e1' && order < 3
        ? [{ title: 'はじまりの森', family: 'addition', subtitle: '9までの たしざん' },
           { title: '月あかりの橋', family: 'addition', subtitle: '10を つくる たしざん' },
           { title: '星の塔', family: 'addition', subtitle: '10を こえる たしざん' }][order]
        : undefined;
      stages.push({
        id: legacy ?? `${def.id}.n${String(order + 1).padStart(2, '0')}`,
        gradeId: def.id, kind: 'normal', order, unitIndex, part,
        title: legacyInfo?.title ?? `${unit.title}・${trailNames[part]}`,
        subtitle: legacyInfo?.subtitle ?? unit.title,
        family: legacyInfo?.family ?? unit.family, questions: 10,
      });
    }
  }
  for (let i = 0; i < 10; i++) {
    const unit = def.units[i];
    stages.push({
      id: `${def.id}.x${String(i + 1).padStart(2, '0')}`, gradeId: def.id,
      kind: 'extra', order: 50 + i, unitIndex: i, part: 5,
      title: `EX・${unit.title}`, subtitle: 'おうよう もんだい',
      family: unit.family, questions: 8,
    });
  }
  for (let i = 0; i < 5; i++) {
    stages.push({
      id: `${def.id}.s${String(i + 1).padStart(2, '0')}`, gradeId: def.id,
      kind: 'secret', order: 60 + i, unitIndex: i, part: 6,
      title: `ひみつ・${secretNames[i]}`, subtitle: '数の ふしぎを たんけん',
      family: 'discovery', questions: 4,
    });
  }
  return stages;
}

export const worldGrades: readonly WorldGrade[] = gradeDefinitions.map(def => ({
  ...def,
  stages: createStages(def),
}));

export const worldStages: readonly WorldStage[] = worldGrades.flatMap(grade => grade.stages);
export const worldStageById: ReadonlyMap<string, WorldStage> = new Map(worldStages.map(stage => [stage.id, stage]));

export function stageClearThreshold(stage: WorldStage): number {
  return Math.ceil(stage.questions * 0.8);
}
