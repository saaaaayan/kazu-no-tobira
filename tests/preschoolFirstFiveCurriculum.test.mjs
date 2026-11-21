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
  assert.match(plan,/2026-11-21に冒険01〜05のカリキュラム構成のみ正式承認/u);
  assert.match(plan,/クマだけではない/u);
  assert.match(detailed,/カリキュラムのみ/u);
  assert.match(detailed,/前後の並べ替え・数量保存の比較は行わない/u);
  assert.equal(proposal.stages.length,50);
});
