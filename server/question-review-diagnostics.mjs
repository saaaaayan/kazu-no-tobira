import { allWorldStages, worldIslands } from '../src/domain/worldCatalog.ts';
import preschoolPlan from '../docs/curriculum/preschool-adventure-50.draft.json' with {type:'json'};

const stages=new Map(allWorldStages.map(stage=>[stage.id,stage]));
const islands=new Map(worldIslands.map(island=>[island.id,island]));
const draft=new Map(preschoolPlan.stages.map(stage=>[stage.stageId,stage]));
// MEXT's elementary grade allocation. It does not specify when in the year a character is introduced.
const kanji=[
  '',
  '一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六',
  '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話',
  '悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和',
];
const words=[
  ['該当','がいとう'],['算出','さんしゅつ'],['適切','てきせつ'],['推測','すいそく'],
  ['適宜','てきぎ'],['参照','さんしょう'],['同様','どうよう'],['任意','にんい'],
  ['各々','おのおの'],
];
const readingLevels={preschool:0,e1:1,e2:2,e3:3};
const limits=[28,42,56,68];
const cleaned=value=>typeof value==='string'?value.trim():'';
const array=value=>Array.isArray(value)?value:[];

function hintTexts(q) {
  return q.hints ?? q.guidedHints ?? (q.hint?[q.hint]:[]);
}

function displayedText(q) {
  return [
    ['問題文',q.question],['操作案内',q.prompt],['正答',q.answer],
    ...array(q.choices).map((value,index)=>['選択肢 '+(index+1),value]),
    ...array(hintTexts(q)).map((value,index)=>['ヒント '+(index+1),value]),
    ['基本解説',q.explanation],
    ...array(q.steps).flatMap((s,index)=>[s?.title,s?.body,...array(s?.equations)].map(value=>['詳しい解説 '+(index+1),value])),
    ...array(q.mistakes).flatMap((m,index)=>[m?.answer,m?.explanation].map(value=>['誤答の説明 '+(index+1),value])),
    ['図の説明',q.figure?.description],
    ...[...array(q.figure?.labels).map(item=>item?.text),...array(q.diagram?.rows).map(item=>item?.label)].map(value=>['図のラベル',value]),
  ].filter(([,value])=>cleaned(value));
}

export function diagnoseQuestion(stageId,q) {
  const stage=stages.get(stageId);
  if (!stage || !q || typeof q!=='object') return {mismatches:['ステージまたは教材データを確認できません。'],language:[],needsHuman:true};
  const island=islands.get(stage.gradeId);
  const unit=island.units[stage.unitIndex];
  const proposal=draft.get(stage.id);
  const mismatches=[];
  const skill=cleaned(q.skillId);
  if ((q.stageId && q.stageId!==stage.id) || (q.id && !cleaned(q.id).startsWith(stage.id+':'))) mismatches.push('教材のIDと登録ステージが一致しません。');
  if (q.skillId && !skill.startsWith(stage.gradeId+'.')) mismatches.push('教材の技能タグと対象学年が一致しません。');
  const otherSkill=island.units.some(candidate=>candidate.family!==stage.family && skill===stage.gradeId+'.'+candidate.family);
  if ((q.unitCode && q.unitCode!==unit.code) || (q.family && q.family!==stage.family) || otherSkill) {
    mismatches.push('教材タグとステージの単元・技能が一致しません。');
  }
  if (stage.gradeId==='preschool' && /[0-9]\s*[+×*−÷]\s*[0-9]|[0-9]\s*-\s*[0-9]\s*=|たし[ざ算]|ひき[ざ算]|わり[ざ算]|かけ[ざ算]/.test(cleaned(q.question).normalize('NFKC'))) {
    mismatches.push('幼児向けの問題文に計算式または四則計算の語があるため、単元との一致を確認してください。');
  }
  const draftNotes=[];
  if (proposal && stage.id==='preschool.n01') {
    const rows=q.diagram?.rows;
    const tokens=array(rows?.[0]?.tokens);
    if (q.diagram?.kind!=='countingBoard' || rows?.length!==1 || ![1,2,3].includes(tokens.length) ||
        tokens.some(token=>token!==tokens[0] || !['dot','square','triangle'].includes(token)) || q.type!=='choice') {
      draftNotes.push('第1稿の参考条件「1〜3個を横一列で数え、数字を選ぶ」と差があります。');
    }
  }
  const language=[];
  const grade=readingLevels[stage.gradeId];
  if (grade!==undefined) {
    const allowed=new Set(kanji.slice(0,grade+1).join(''));
    for (const [field,raw] of displayedText(q)) {
      const text=raw.normalize('NFKC');
      const chars=[...new Set(text.match(/\p{Script=Han}/gu)??[])];
      const unfamiliar=chars.filter(char=>!allowed.has(char));
      if (unfamiliar.length) language.push({field,message:'配当外の漢字：'+unfamiliar.join('、')+'。ひらがな・読みの補助を確認してください。'});
      if (grade===1) {
        const timing=chars.filter(char=>allowed.has(char));
        if (timing.length) language.push({field,message:'小1の年度初めに使う場合は習得時期を確認：'+timing.join('、')+'。'});
      }
      const difficult=words.filter(group=>group.some(word=>text.includes(word))).map(group=>group[0]);
      if (difficult.length) language.push({field,message:'言い換え候補：'+difficult.join('、')+'。'});
      if (text.split(/[。！？!?\n]/u).some(sentence=>[...sentence.replace(/\s/gu,'')].length>limits[grade])) language.push({field,message:'長い文があります。短く分けて指示を一つずつ確認してください。'});
    }
  }
  if (!cleaned(q.prompt) || /^(?:よく考え(?:て|ましょう)|考えよう|がんばろう)[。！!]?$/.test(cleaned(q.prompt))) {
    language.push({field:'操作案内',message:'何を見て、どのように答えるのかを示してください。'});
  }
  if (array(hintTexts(q)).filter(cleaned).length!==3 || new Set(array(hintTexts(q)).map(cleaned).filter(Boolean)).size!==3) {
    language.push({field:'ヒント',message:'内容の異なる3段階で、子どもが次にできることを示してください。'});
  }
  const explanation=cleaned(q.explanation);
  if (!explanation || [cleaned(q.answer),cleaned(q.answer)+'。'].includes(explanation) ||
      (!/[。!?！？=＝→\n]/u.test(explanation) && explanation.length<10)) {
    language.push({field:'基本解説',message:'答えが出るまでの考え方や、誤答からやり直す手がかりが十分か確認してください。'});
  }
  if (!array(q.steps).some(step=>cleaned(step?.body))) language.push({field:'詳しい解説',message:'考え方の途中を説明する段階が未登録です。'});
  return {mismatches,language,needsHuman:true,draftNotes,
    ...(proposal ? {proposal:{goal:proposal.goal,interaction:proposal.interaction,guard:proposal.guard,difficulty:proposal.difficulty}} : {})};
}

export function diagnosticSummary({mismatches,language,draftNotes=[]}) {
  return {mismatches:mismatches.length,language:language.length,draftNotes:draftNotes.length};
}
