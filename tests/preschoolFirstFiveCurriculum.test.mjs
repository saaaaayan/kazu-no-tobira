import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preschoolStageMapInfo} from '../src/domain/preschoolStageMapInfo.ts';

const source=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const proposal=JSON.parse(source('docs/curriculum/preschool-adventure-50.draft.json'));
const stage=(n)=>proposal.stages.find(s=>s.stageId==='preschool.n'+String(n).padStart(2,'0'));

test('approved preschool first five stages share titles between curriculum data and map',()=>{
  const titles=[
    '1〜3こを かぞえよう','4こと 5こ','10こまで かぞえよう',
    'きまった ものを かぞえよう','あちこちの ぬいぐるみ'
  ];
  for(let i=0;i<5;i++){
    const item=stage(i+1);
    assert.ok(item);
    assert.equal(item.title,titles[i]);
    assert.equal(preschoolStageMapInfo({id:item.stageId,title:item.title}).title,titles[i]);
    assert.equal(item.reviewStatus,'draft','curriculum approval must not approve a question');
  }
});

test('stage 04 selects only target objects, while stage 05 counts varied scattered plushies',()=>{
  const fourth=stage(4),fifth=stage(5);
  assert.match(fourth.goal,/指定された対象だけ/u);
  assert.match(fourth.interaction,/指定された絵/u);
  assert.match(fifth.goal,/くま・うさぎ・ねこ・いぬ/u);
  assert.match(fifth.goal,/最初から画面のさまざまな位置/u);
  assert.match(fifth.goal,/全部数える/u);
  assert.match(fifth.guard,/クマだけに限定せず/u);
  assert.match(fifth.guard,/並べ替え前後の比較を行わない/u);
  assert.doesNotMatch(fifth.interaction,/並べ替え|前後比較/u);
  assert.match(preschoolStageMapInfo({id:fifth.stageId,title:fifth.title}).goal,/くま・うさぎ・ねこ・いぬ/u);
});

test('approved objectives are documented without marking drafted questions ready',()=>{
  const plan=source('docs/curriculum/PRESCHOOL_10_FIRST_65_STAGE_PLAN.md');
  const detailed=source('docs/curriculum/PRESCHOOL_ADVENTURE_50_DRAFT.md');
  assert.match(plan,/2026-11-21に冒険01〜15のカリキュラム構成のみ正式承認/u);
  assert.match(plan,/クマだけではない/u);
  assert.match(detailed,/カリキュラムのみ/u);
  assert.match(detailed,/前後の並べ替え・数量保存の比較は行わない/u);
  assert.equal(proposal.stages.length,50);
});

test('preschool 06–10 numeral learning objectives are approved, while the exercise review state stays draft',()=>{
  for(const n of [6,7,8,9,10]){
    const item=stage(n);
    assert.ok(item);
    assert.equal(item.unitCode,'matching');
    assert.equal(item.reviewStatus,'draft');
    assert.equal(preschoolStageMapInfo({id:item.stageId,title:item.title}).title,item.title);
  }
  assert.match(stage(6).goal,/数字1・2・3/u);
  assert.match(stage(7).goal,/数字4・5/u);
  assert.match(stage(8).goal,/数字6〜10/u);
  assert.match(stage(9).goal,/何もない場面を数字0/u);
  assert.match(stage(10).goal,/0〜10の数量・数字・読み/u);
  assert.match(stage(10).guard,/試作コードの1〜5限定/u);
  assert.match(preschoolStageMapInfo({id:stage(10).stageId,title:stage(10).title}).goal,/0から 10まで/u);
  const plan=source('docs/curriculum/PRESCHOOL_10_FIRST_65_STAGE_PLAN.md');
  assert.match(plan,/06〜10の承認内容/u);
  const detailed=source('docs/curriculum/PRESCHOOL_ADVENTURE_50_DRAFT.md');
  assert.match(detailed,/16〜50のテーマ\/到達目標は引き続き提案/u);
});

test('preschool 11–15 tracing objectives and 10-task digit distributions are approved, but questions remain drafts',()=>{
  const expected=[
    {'1':4,'2':3,'3':3}, {'4':5,'5':5}, {'6':5,'7':5},
    {'8':5,'9':5}, {'0':5,'10':5}
  ];
  for(let n=11;n<=15;n++){
    const item=stage(n);
    assert.ok(item,'stage '+n);
    assert.equal(item.unitCode,'tracing');
    assert.equal(item.reviewStatus,'draft');
    assert.deepEqual(item.betaTenQuestionTargets,expected[n-11]);
    assert.equal(Object.values(item.betaTenQuestionTargets).reduce((a,b)=>a+b,0),10);
    assert.equal(preschoolStageMapInfo({id:item.stageId,title:item.title}).title,item.title);
    assert.match(item.guard,/なぞ|入力|揺れ|動き|抽象/u);
  }
  assert.match(stage(15).goal,/10は1と0の2文字/u);
  assert.match(stage(15).guard,/0×5／10×5/u);
  assert.match(preschoolStageMapInfo({id:stage(15).stageId,title:stage(15).title}).goal,/1と 0を ひとつずつ/u);
  const plan=source('docs/curriculum/PRESCHOOL_10_FIRST_65_STAGE_PLAN.md');
  const detailed=source('docs/curriculum/PRESCHOOL_ADVENTURE_50_DRAFT.md');
  assert.match(plan,/冒険11〜15の承認内容/u);
  assert.match(detailed,/ステージ11〜15の確定事項/u);
  assert.match(detailed,/認識失敗を数学的な不正解として扱わない/u);
  assert.match(detailed,/16〜50は引き続き第1稿・未承認/u);
});
