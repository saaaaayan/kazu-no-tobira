import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {allWorldStages,worldIslands} from '../src/domain/worldCatalog.ts';
import {islandCurriculum,stageCategoryName} from '../src/domain/islandCurriculumView.ts';
import {stageDisplayTitle} from '../src/domain/stageStructure.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('16 island curricula cover all 65 distinct stages with exact subject labels and 10 checkpoints',()=>{
  assert.equal(worldIslands.length,16);
  assert.equal(allWorldStages.length,1040);
  let total=0;
  for(const grade of worldIslands){
    const catalog=islandCurriculum(grade);
    assert.equal(catalog.units.length,10,grade.id);
    assert.equal(catalog.trials.length,10,grade.id);
    assert.equal(catalog.legends.length,5,grade.id);
    assert.equal(catalog.checkpoints.length,10,grade.id);
    const mapped=catalog.units.flatMap(item=>item.stages);
    assert.equal(mapped.length,50,grade.id);
    assert.equal(new Set(mapped.map(s=>s.id)).size,50,grade.id);
    assert.deepEqual([...mapped.map(s=>s.id)].sort(),
      grade.stages.filter(s=>s.kind==='normal').map(s=>s.id).sort(),grade.id);
    const extraByUnit=catalog.units.flatMap(item=>item.trial?[item.trial]:[]);
    assert.equal(extraByUnit.length,10,grade.id);
    for(const [index,item] of catalog.units.entries()){
      assert.equal(item.unit.title,grade.units[index].title);
      assert.equal(item.trial?.unitIndex,index);
      for(const stage of item.stages){
        assert.equal(stage.unitIndex,index,stage.id);
        assert.equal(stage.gradeId,grade.id,stage.id);
        assert.equal(stageCategoryName(grade,stage),stage.subtitle,stage.id);
      }
      assert.equal(stageCategoryName(grade,item.trial),
        grade.id==='sage'?item.trial.title.replace(/^EX・/,''):item.unit.title,item.trial.id);
    }
    for(const stage of catalog.legends){
      assert.equal(stageCategoryName(grade,stage),stage.title.replace(/^ひみつ・/,''),stage.id);
    }
    for(const checkpoint of catalog.checkpoints){
      assert.equal(checkpoint.sourceStageIds.length,5,checkpoint.id);
      assert.equal(checkpoint.after.kind,'normal',checkpoint.id);
      assert.equal(checkpoint.after.order+1,checkpoint.number*5,checkpoint.id);
    }
    total+=mapped.length+catalog.trials.length+catalog.legends.length;
  }
  assert.equal(total,1040);
});

test('first-grade relocated legacy problems retain their true subject instead of a misleading 5-stage row label',()=>{
  const grade=worldIslands.find(item=>item.id==='e1');
  const expected={
    'e1.forest':'9までの たしざん',
    'e1.bridge':'10を つくる たしざん',
    'e1.tower':'10を こえる たしざん',
    'e1.n04':'10までの かず',
    'e1.n05':'10までの かず',
  };
  for(const [id,category] of Object.entries(expected)){
    const stage=grade.stages.find(stage=>stage.id===id);
    assert.ok(stage,id);
    assert.equal(stageCategoryName(grade,stage),category,id);
  }
  const counts=islandCurriculum(grade).units.map(item=>item.stages.length);
  assert.notDeepEqual(counts,Array(10).fill(5),'must not silently pretend reordered first-grade units are 5×10');
  assert.equal(counts.reduce((sum,n)=>sum+n,0),50);
});

test('map pins, 65-stage curriculum navigation and game questions render category names',()=>{
  const map=read('src/components/WorldScenes780.tsx');
  const panel=read('src/components/IslandCurriculumPanel.tsx');
  const round=read('src/FullAdventure.tsx');
  assert.match(map,/style={\[styles\.pinCategoryBox/);
  assert.match(map,/stageCategoryName\(grade,stage\)/);
  assert.match(map,/accessibilityLabel={stageDisplayTitle\(stage\)\+'、単元 '/);
  assert.match(map,/<IslandCurriculumPanel grade={grade} onStart={onStart}/);
  assert.match(panel,/この島のカリキュラム/);
  assert.match(panel,/data\.units\.map/);
  assert.match(panel,/data\.trials\.map/);
  assert.match(panel,/data\.legends\.map/);
  assert.match(panel,/data\.checkpoints\.map/);
  assert.match(panel,/category|カテゴリ|単元・カテゴリ/);
  assert.match(panel,/disabled={!state\.enabled}/);
  assert.match(round,/単元・カテゴリ：'\+stageCategoryName/);
  assert.match(round,/学習範囲：直前の冒険5ステージ/);
  assert.equal(worldIslands.length,16);
  assert.ok(worldIslands.every(grade=>grade.stages.every(stage=>stageDisplayTitle(stage).length>0)));
});
