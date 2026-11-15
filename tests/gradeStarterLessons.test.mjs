import assert from 'node:assert/strict';
import test from 'node:test';
import { worldGrades, worldStageById } from '../src/domain/worldCatalog.ts';
import { canPlayWorldStage, worldStageAction } from '../src/domain/playMode.ts';
import { emptyProgress } from '../src/domain/progress.ts';
import { unitLessons, expectedLessonAnswer, advanceLesson, answerLessonCheck, lessonCheckStart, newLessonProgress } from '../src/domain/unitLessons.ts';

const independentAnswers = {
  e1:[7,0,9,8], e2:[Math.floor(347/10)%10,Math.floor(508/100)], e3:[Math.floor(7309/10)%10,10*100],
  e4:[30000*10,Math.floor(5600000/10)%10], e5:[(36*4)/100,(12*5)/10], e6:[2*3,9*8/(4*3)],
  j1:[-7+4,-4-6], j2:[2-9,3*(-2)+4], j3:[2+6,3*7], h1:[2*4,6*(-6)], h2:[7-4,4*(-3)+7], h3:[0,2**2+3],
};
test('12学年の導入教材は順序、例題、正確な確認問題、無料の対応ステージを備える', () => {
  assert.deepEqual(unitLessons.map(item => item.grade),worldGrades.map(item => item.id));
  const knownIds = new Set(unitLessons.map(item => item.id));
  const assigned = new Set();
  const now = '2026-11-16T00:00:00.000Z';
  for (const lesson of unitLessons) {
    assert.ok(lesson.steps.length && lesson.workedExamples.some(q=>q.reveal.length>1),lesson.id);
    assert.ok(lesson.prerequisiteIds.every(id=>knownIds.has(id) && id!==lesson.id),lesson.id);
    assert.deepEqual(lesson.checks.map(expectedLessonAnswer), independentAnswers[lesson.grade]);
    for (const id of lesson.linkedStageIds) {
      assert.ok(!assigned.has(id),id); assigned.add(id);
      const stage=worldStageById.get(id);
      assert.equal(stage.kind,'normal',id);
      assert.equal(stage.gradeId,lesson.grade,id);
      assert.equal(stage.unitIndex,0,id);
    }
    const islandIndex=worldGrades.findIndex(grade=>grade.id===lesson.grade);
    const earlier=islandIndex===0?[]:worldGrades[islandIndex-1].stages.slice(0,50);
    const progress={...emptyProgress,stages:Object.fromEntries(earlier.map(stage=>[stage.id,{clearedAt:now}]))};
    const stage=worldStageById.get(lesson.linkedStageIds[0]);
    assert.equal(worldStageAction('normal',progress,stage),'learn',stage.id);
    let record=newLessonProgress();
    for(let i=0;i<lessonCheckStart(lesson);i++) record=advanceLesson(lesson,record);
    for (const [i,check] of lesson.checks.entries()) {
      assert.equal(new Set(check.choices).size,3,check.id);
      assert.ok(check.choices.includes(independentAnswers[lesson.grade][i]),check.id);
      record=answerLessonCheck(lesson,record,independentAnswers[lesson.grade][i],now);
      record=advanceLesson(lesson,record);
    }
    assert.equal(record.completedAt,now);
    assert.equal(canPlayWorldStage('normal',{...progress,lessons:{[lesson.id]:record}},stage),true,stage.id);
  }
});
