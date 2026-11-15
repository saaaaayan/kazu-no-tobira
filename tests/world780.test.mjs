import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeIds } from '../src/domain/curriculum.ts';
import { worldGrades, worldStages, worldStageById, stageClearThreshold } from '../src/domain/worldCatalog.ts';
import { generateWorldQuestions, checkMathAnswer, isValidMathAnswer } from '../src/domain/worldQuestions.ts';
import { emptyProgress } from '../src/domain/progress.ts';
import { adventureTitles } from '../src/domain/titles.ts';
import { finishWorldStage, gradeProgress, isWorldStageUnlocked } from '../src/domain/worldProgress.ts';

test('全12学年・各65ステージ（50通常＋10EX＋5隠し）＝780を定義', () => {
  assert.equal(worldGrades.length, 12);
  assert.deepEqual(worldGrades.map(g=>g.id), gradeIds);
  assert.equal(worldStages.length, 780);
  assert.equal(worldStageById.size, 780);
  assert.equal(new Set(worldStages.map(s=>s.id)).size, 780);
  for (const grade of worldGrades) {
    assert.equal(grade.units.length,10,grade.id);
    assert.equal(grade.stages.length,65,grade.id);
    assert.equal(grade.stages.filter(s=>s.kind==='normal').length,50,grade.id);
    assert.equal(grade.stages.filter(s=>s.kind==='extra').length,10,grade.id);
    assert.equal(grade.stages.filter(s=>s.kind==='secret').length,5,grade.id);
    assert.equal(grade.stages.filter(s=>s.questions===10).length,50,grade.id);
    assert.equal(grade.stages.filter(s=>s.questions===8).length,10,grade.id);
    assert.equal(grade.stages.filter(s=>s.questions===4).length,5,grade.id);
    assert.ok(grade.stages.every((s,i)=>s.order===i && s.gradeId===grade.id));
  }
  assert.deepEqual(worldGrades[0].stages.slice(0,3).map(s=>s.id),['e1.forest','e1.bridge','e1.tower']);
});

test('すべての780ステージに実際に解ける問題・答え・解説がある', () => {
  let questions = 0, numeric = 0, choice = 0;
  for(const stage of worldStages) {
    for (const seed of [0,1217]) {
      const problems = generateWorldQuestions(stage,seed);
      assert.equal(problems.length,stage.questions,stage.id);
      assert.equal(new Set(problems.map(p=>p.id)).size,stage.questions,stage.id);
      for(const p of problems) {
        assert.ok(p.question.trim().length>0,stage.id);
        assert.ok(p.explanation.trim().length>0,stage.id);
        assert.ok(p.hint.trim().length>0,stage.id);
        assert.ok(p.skillId.startsWith(stage.gradeId+'.'),stage.id);
        assert.equal(isValidMathAnswer(p,p.answer),true,stage.id+' '+p.question+' '+p.answer);
        assert.equal(checkMathAnswer(p,p.answer),true,stage.id+' '+p.question+' '+p.answer);
        if(p.type==='choice') {
          choice++;
          assert.equal(p.choices?.length,4,stage.id+' '+p.question);
          assert.equal(new Set(p.choices).size,4,stage.id+' '+p.question);
          assert.ok(p.choices?.includes(p.answer));
          assert.ok(p.choices?.some(a=>a!==p.answer && !checkMathAnswer(p,a)));
        } else {
          numeric++;
          assert.ok(Number.isFinite(Number(p.answer)),stage.id+' '+p.answer);
          assert.equal(checkMathAnswer(p,String(Number(p.answer)+10000)),false,stage.id);
        }
        questions++;
      }
    }
  }
  assert.ok(questions>=13000);
  assert.ok(choice>100);
  assert.ok(numeric>100);
});

test('全学年の隠しは通常とEXすべてのパーフェクトでのみ解放', () => {
  for(const grade of worldGrades) {
    const all = grade.stages.slice(0,60);
    const stages = Object.fromEntries(all.map(s=>[s.id,{clearedAt:'2026-11-15',perfectAt:'2026-11-15'}]));
    const priorGrades=worldGrades.slice(0,worldGrades.findIndex(g=>g.id===grade.id));
    for(const g of priorGrades)for(const s of g.stages.slice(0,60)) stages[s.id]={clearedAt:'2026-11-15',perfectAt:'2026-11-15'};
    const done = {...emptyProgress,stages};
    assert.equal(gradeProgress(done,grade.id).mainPerfect,true,grade.id);
    assert.equal(isWorldStageUnlocked(done,grade.stages[60]),true,grade.id);
    const without = {...done, stages: {...done.stages}};
    delete without.stages[all[59].id];
    assert.equal(isWorldStageUnlocked(without,grade.stages[60]),false,grade.id);
  }
});

test('80%以上で通常クリア、全問正解・ヒントなしでパーフェクト',()=>{
  const stage=worldGrades[0].stages[4];
  assert.equal(stageClearThreshold(stage),8);
  const fail=finishWorldStage(emptyProgress,stage,7,false,'2026');
  assert.equal(Boolean(fail.stages[stage.id]),false);
  const clear=finishWorldStage(emptyProgress,stage,8,false,'2026');
  assert.equal(Boolean(clear.stages[stage.id]?.clearedAt),true);
  assert.equal(Boolean(clear.stages[stage.id]?.perfectAt),false);
  const assisted=finishWorldStage(emptyProgress,stage,10,true,'2026');
  assert.equal(Boolean(assisted.stages[stage.id]?.perfectAt),false);
  const perfect=finishWorldStage(clear,stage,10,false,'2027');
  assert.equal(Boolean(perfect.stages[stage.id]?.perfectAt),true);
  assert.equal(perfect.stages[stage.id]?.clearedAt,'2026');
});

test('称号は100種類以上存在し、初回クリアで獲得できる',()=>{
  const titles=adventureTitles(emptyProgress);
  assert.ok(titles.length>=100);
  assert.equal(new Set(titles.map(t=>t.id)).size,titles.length);
  assert.equal(new Set(titles.map(t=>t.name)).size,titles.length);
  const stage=worldGrades[0].stages[0];
  const won=finishWorldStage(emptyProgress,stage,10,false,'2026-11-15');
  assert.ok(adventureTitles(won).filter(t=>t.unlocked).length>=2);
});

test('数字の問題は全角、符号と小数点を採点できる',()=>{
  const stage=worldGrades[0].stages[0];
  const q=generateWorldQuestions(stage)[0];
  assert.ok(isValidMathAnswer(q,q.answer));
  assert.ok(checkMathAnswer(q,q.answer));
  assert.ok(checkMathAnswer(q,q.answer.replace(/\d/g,c=>String.fromCharCode(c.charCodeAt(0)+0xFEE0))));
});
