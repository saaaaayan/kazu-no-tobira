import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { worldStageById, worldStages } from '../src/domain/worldCatalog.ts';
import { decodeProgress, emptyProgress } from '../src/domain/progress.ts';
import { canPlayWorldStage, progressAfterWorldAnswer, worldStageAction } from '../src/domain/playMode.ts';
import { featureAccess, stageAccessPlan } from '../src/domain/accessPlan.ts';
import { countToTen, answerLessonCheck, advanceLesson, lessonCheckStart, lessonEnd, lessonForStage,
  newLessonProgress, expectedLessonAnswer, lessonStatus, elementaryLessonPlan } from '../src/domain/unitLessons.ts';

const date = '2026-11-16T07:00:00.000Z';
const states = record => ({ ...emptyProgress, lessons: { [countToTen.id]: record } });

test('数える・0・順番・大小の確認で、全問に正解するまで完了しない', () => {
  const lesson = countToTen;
  const first = lessonCheckStart(lesson);
  assert.equal(lessonStatus(), 'not-started');
  assert.equal(lessonStatus(newLessonProgress()), 'in-progress');
  assert.deepEqual(lesson.checks.map(expectedLessonAnswer), [7,0,9,8]);
  const [count, zero, order, compare] = lesson.checks.map(q=>q.diagram);
  assert.equal(count.count, 7);
  assert.equal(zero.count, 0);
  assert.deepEqual([order.first,order.hidden,order.last],[7,9,10]);
  assert.ok(compare.left < compare.right);
  for (const q of lesson.checks) {
    assert.equal(new Set(q.choices).size, q.choices.length);
    assert.ok(q.choices.includes(expectedLessonAnswer(q)));
    assert.ok(q.retryHint && q.explanation);
  }
  let progress = newLessonProgress();
  assert.equal(answerLessonCheck(lesson,progress,7,date),progress);
  for (let i=0;i<first;i++) progress=advanceLesson(lesson,progress);
  assert.equal(advanceLesson(lesson,progress),progress);
  progress=answerLessonCheck(lesson,progress,6,date);
  assert.deepEqual(progress.checks.count,{ attempts:1, lastAnswer:6, correct:false });
  assert.equal(advanceLesson(lesson,progress),progress);
  assert.equal(progress.completedAt,undefined);
  for (const [i,q] of lesson.checks.entries()) {
    progress=answerLessonCheck(lesson,progress,expectedLessonAnswer(q),date);
    assert.equal(progress.completedAt,i===3 ? date : undefined);
    assert.equal(answerLessonCheck(lesson,progress,expectedLessonAnswer(q),date),progress);
    progress=advanceLesson(lesson,progress);
  }
  assert.equal(progress.checks.count.attempts,2);
  assert.equal(progress.page,lessonEnd(lesson));
  assert.equal(lessonStatus(progress),'completed');
});

test('学習とステージの前提を両方適用し、既存クリアとテストを優先する', () => {
  const [first, second] = countToTen.linkedStageIds.map(id=>worldStageById.get(id));
  const add = worldStageById.get('e1.forest');
  assert.deepEqual([first.order,second.order,add.order],[0,1,2]);
  assert.equal(worldStageAction('normal',emptyProgress,first),'learn');
  assert.equal(canPlayWorldStage('normal',emptyProgress,first),false);
  assert.equal(worldStageAction('normal',emptyProgress,second),'locked');
  assert.equal(worldStageAction('test',emptyProgress,first),'play');
  assert.equal(worldStageAction('test',emptyProgress,second),'play');
  const complete = states({ ...newLessonProgress(), completedAt:date });
  assert.equal(canPlayWorldStage('normal',complete,first),true);
  assert.equal(canPlayWorldStage('normal',complete,second),false);
  const preExisting = { ...emptyProgress, stages:{ [first.id]:{clearedAt:date}, [add.id]:{clearedAt:date},
    'e1.bridge':{clearedAt:date}, 'e1.tower':{clearedAt:date} } };
  assert.equal(canPlayWorldStage('normal',preExisting,first),true);
  assert.equal(canPlayWorldStage('normal',preExisting,add),true);
  assert.equal(worldStageAction('normal',preExisting,second),'learn');
  assert.equal(worldStageAction('normal',preExisting,worldStageById.get('e1.n06')),'locked');
  assert.equal(worldStageAction('normal',preExisting,worldStageById.get('e1.n16')),'locked');
  assert.equal(worldStageAction('normal',preExisting,worldStageById.get('e1.n26')),'locked');
  assert.equal(worldStageAction('normal',{ ...complete, stages:preExisting.stages },second),'play');
});

test('10までのかずは足し算と区別し、既存の数の順序バンクへ進む', () => {
  assert.equal(elementaryLessonPlan.find(item=>item.id==='e1.add-small').prerequisiteIds.includes('e1.number-parts'),true);
  assert.equal(featureAccess.unitLessons,'free');
  assert.equal(featureAccess.workedSolutions,'premium');
  assert.equal(worldStages.filter(stage=>stageAccessPlan(stage)==='free').length,600);
  assert.equal(stageAccessPlan({ kind:'normal',gradeId:'sage' }),'premium');
  for (const id of countToTen.linkedStageIds) {
    const stage = worldStageById.get(id);
    const bank = JSON.parse(readFileSync(new URL('../public/question-banks/'+id+'.v1.json',import.meta.url),'utf8'));
    assert.equal(stageAccessPlan(stage),'free');
    assert.equal(stage.family,'count');
    assert.equal(lessonForStage(stage.id)?.id,countToTen.id);
    assert.equal(bank.stageId,id);
    assert.equal(bank.questions.length,100);
    assert.ok(bank.questions.every(q=>q.skillId==='e1.count'));
    assert.ok(bank.questions.every(q=>Number(q.answer)>=1 && Number(q.answer)<=10));
  }
  for (const id of ['e1.forest','e1.bridge','e1.tower']) {
    assert.equal(worldStageById.get(id).family,'addition');
    assert.equal(lessonForStage(id),undefined);
  }
});

test('旧セーブを維持し、学習途中・誤答・完了をステージ記録とは別に復元する', () => {
  const attempt = {problemId:'e1.forest:bank1:sum-3-5',skillId:'e1.addition',stageId:'e1.forest',submitted:8,correct:true,answeredAt:date};
  const legacy = {...emptyProgress,attempts:[attempt],stages:{'e1.forest':{clearedAt:date}},skills:{'e1.addition':{answered:1,correct:1}}};
  assert.deepEqual(decodeProgress(JSON.stringify(legacy)),legacy);
  const checkStart=lessonCheckStart(countToTen);
  let lesson=answerLessonCheck(countToTen,{page:checkStart,checks:{}},6,date);
  let progress={...legacy,lessons:{[countToTen.id]:lesson}};
  assert.deepEqual(decodeProgress(JSON.stringify(progress)),progress);
  for(const q of countToTen.checks){
    lesson=answerLessonCheck(countToTen,lesson,expectedLessonAnswer(q),date);
    lesson=advanceLesson(countToTen,lesson);
  }
  progress=decodeProgress(JSON.stringify({...legacy,lessons:{[countToTen.id]:lesson}}));
  assert.deepEqual(progress.lessons[countToTen.id],lesson);
  assert.deepEqual(progress.stages,legacy.stages);
  assert.deepEqual(progress.attempts,legacy.attempts);
  assert.equal(progressAfterWorldAnswer('test',progress,attempt),undefined);
  assert.deepEqual(progressAfterWorldAnswer('normal',progress,attempt).lessons,progress.lessons);
  const bad = {...progress,lessons:{[countToTen.id]:{ ...lesson, checks:{} }}};
  assert.equal(decodeProgress(JSON.stringify(bad)).lessons[countToTen.id].completedAt,undefined);
  assert.deepEqual(decodeProgress(JSON.stringify(bad)).stages,legacy.stages);
});
