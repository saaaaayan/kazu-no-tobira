import assert from 'node:assert/strict';
import test from 'node:test';
import { assessmentIslands } from '../src/domain/assessmentPlan.ts';
import { dealAssessmentCycle } from '../src/domain/balancedAssessment.ts';
import { drawStageRound, decodeStageDeck } from '../src/domain/stageDeck.ts';

test('13島の845ステージに、規定どおりの試験位置と出題範囲を割り当てる', () => {
  assert.equal(assessmentIslands.length, 13);
  assert.equal(assessmentIslands.at(-1).name, '賢者の島');
  const all = assessmentIslands.flatMap(island => island.stages);
  assert.equal(new Set(all.map(stage => stage.id)).size, 845);
  assert.equal(all.filter(stage => stage.assessment?.kind === 'checkpoint').length, 117);
  assert.equal(all.filter(stage => stage.assessment?.kind === 'final').length, 13);
  for (const island of assessmentIslands) {
    assert.equal(island.stages.length, 65);
    const ids = island.stages.map(stage => stage.id);
    assert.deepEqual(
      island.stages.filter(stage => stage.assessment?.kind === 'checkpoint').map(stage => stage.number),
      [5,10,15,20,25,30,35,40,45],
    );
    for (const stage of island.stages) {
      assert.equal(stage.bankSize, 100);
      assert.equal(stage.roundSize, 10);
      if (stage.assessment?.kind === 'checkpoint') {
        assert.deepEqual(stage.assessment.sourceStageIds, ids.slice(stage.number - 5, stage.number - 1));
      }
    }
    assert.deepEqual(island.stages[49].assessment, {
      kind: 'final',
      sourceStageIds: ids.slice(0,50).filter((_,index) => index%5 !== 4),
    });
    assert.equal(island.stages.filter(stage => stage.track === 'extra').length, 10);
    assert.equal(island.stages.filter(stage => stage.track === 'secret').length, 5);
  }
});

test('分野別に10回へ均等に配分し、保存・復元しても一巡と次周の非重複を維持する', () => {
  const counters = [23,27,12,18,20];
  const questions = counters.flatMap((count,topic) => Array.from({length:count}, (_,i) => ({
    id: topic + ':' + i, topic: String(topic),
  })));
  const ids = questions.map(q => q.id);
  let state = 13;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2**32);
  const seen = new Set();
  let deck = dealAssessmentCycle(questions, undefined, 1, random);
  for (let round=0; round<10; round++) {
    assert.equal(deck.lastRound.length,10);
    for (const [topic,count] of counters.entries()) {
      const drawn = deck.lastRound.filter(id => id.startsWith(topic + ':')).length;
      assert.ok(drawn >= Math.floor(count/10) && drawn <= Math.ceil(count/10));
    }
    for (const id of deck.lastRound) {
      assert.ok(!seen.has(id));
      seen.add(id);
    }
    const saved = decodeStageDeck(JSON.stringify(deck), ids, 1);
    if (round < 9) deck = drawStageRound(ids, 10, 1, saved, random);
  }
  assert.equal(seen.size,100);
  assert.equal(deck.remaining.length,0);
  const next = dealAssessmentCycle(questions, deck, 1, random);
  assert.equal(next.cycle,2);
  assert.ok(next.lastRound.every(id => !deck.lastRound.includes(id)));
});
