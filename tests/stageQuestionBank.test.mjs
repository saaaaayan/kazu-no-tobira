import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { bankStageIds, mistakenReason } from '../src/domain/questionBank.ts';
import { decodeStageDeck, drawStageRound, stageDeckKey } from '../src/domain/stageDeck.ts';
import { checkMathAnswer } from '../src/domain/worldQuestions.ts';
import { formatMathText } from '../src/domain/mathNotation.ts';
import { renderMathSvg } from '../src/domain/mathSvg.ts';
import { finishWorldStage } from '../src/domain/worldProgress.ts';
import { emptyProgress } from '../src/domain/progress.ts';
import { worldStageById } from '../src/domain/worldCatalog.ts';

const banks = await Promise.all(bankStageIds.map(async id => JSON.parse(await readFile(
  new URL('../public/question-banks/' + id + '.v1.json', import.meta.url), 'utf8'))));

function solveFromStem(problem) {
  const values = [...problem.question.matchAll(/\d+/g)].map(token => Number(token[0]));
  switch (problem.format) {
    case 'calculation': return values[0] + values[1];
    case 'missingPart': return values[1] - values[0];
    case 'decomposition': return values[0] - (values[1] + values[2]);
    case 'comparison': return values.length === 4 ? values[3] - (values[1] + values[2])
      : (values[0] + values[2]) - (values[1] + values[2]);
    case 'story': return problem.question.startsWith('はこに')
      ? values[0] + values[1] - values[2]
      : values[0] + values[1];
    default: throw new Error('Unknown form: ' + problem.format);
  }
}

test('保存済み300問の問題文から独立して再計算し、途中式・ヒント・図を検証する', () => {
  const allIds = new Set();
  const equations = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100);
    assert.equal(new Set(bank.questions.map(q => q.question)).size, 100);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= 4);
    const mathematicalTasks = new Set();
    for (const question of bank.questions) {
      assert.ok(question.id.startsWith(bank.stageId + ':bank' + bank.version + ':'));
      assert.ok(!allIds.has(question.id), question.id);
      allIds.add(question.id);
      const terms = [...question.question.matchAll(/\d+/g)].map(value => Number(value[0]));
      const [a, b, c] = terms;
      const task = question.format === 'decomposition' ? [a, Math.min(b, c), Math.max(b, c)] : terms;
      const signature = JSON.stringify([question.format, task]);
      assert.ok(!mathematicalTasks.has(signature), question.id);
      mathematicalTasks.add(signature);
      assert.ok(checkMathAnswer(question, String(solveFromStem(question))), question.id);
      assert.equal(question.hints.length, 3);
      assert.equal(new Set(question.hints).size, 3);
      assert.ok(question.hints.every(text => text.trim()));
      assert.equal(question.steps.length, 5);
      if (question.diagram) {
        assert.equal(question.diagram.first, question.format === 'decomposition' ? b : a);
        if (question.diagram.second !== undefined) {
          assert.equal(question.diagram.second, question.format === 'decomposition' ? c : b);
        }
      }
      for (const reason of question.mistakes) {
        assert.ok(reason.explanation);
        if (reason.answer !== undefined) {
          assert.equal(checkMathAnswer(question, reason.answer), false);
          assert.equal(mistakenReason(question, reason.answer), reason.explanation);
        }
      }
      for (const step of question.steps) {
        assert.ok(step.body.trim());
        for (const match of step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)) {
          const [, left, operator, right, result] = match;
          assert.equal(operator === '＋' ? +left + +right : +left - +right, +result, step.body);
          equations.add(match[0]);
        }
      }
      for (const line of [question.question, ...question.hints, ...question.steps.map(step => step.body)]) {
        for (const part of formatMathText(line)) if (part.kind === 'math') renderMathSvg(part.latex);
      }
    }
  }
  assert.equal(allIds.size, 300);
  assert.ok(equations.size > 100);
});

test('各バンクは保存からの復元をはさんで10回で一巡し、11回目は直前と重複しない', () => {
  for (const bank of banks) {
    const ids = bank.questions.map(q => q.id);
    let stored = null;
    const seen = new Set();
    let last = [];
    let counter = 21;
    const random = () => ((counter = (Math.imul(counter, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 11; i++) {
      const deck = drawStageRound(ids, 10, bank.version, decodeStageDeck(stored, ids, bank.version), random);
      assert.equal(deck.cycle, i < 10 ? 1 : 2);
      assert.equal(new Set(deck.lastRound).size, 10);
      if (i < 10) {
        assert.ok(deck.lastRound.every(id => !seen.has(id)));
        deck.lastRound.forEach(id => seen.add(id));
      } else {
        assert.ok(deck.lastRound.every(id => !last.includes(id)));
      }
      stored = JSON.stringify(deck);
      last = deck.lastRound;
    }
    assert.equal(seen.size, 100);
    assert.notEqual(stageDeckKey('normal', bank.stageId), stageDeckKey('test', bank.stageId));
  }
});

test('問題バンクの新バージョンだけを再抽選し、旧EX・隠しステージの記録を保つ', () => {
  assert.equal(decodeStageDeck(JSON.stringify({ version: 1 }), ['a'], 2), undefined);
  assert.throws(() => decodeStageDeck(JSON.stringify({ version: 1, cycle: 1, remaining: ['x'], lastRound: ['a'] }), ['a', 'b'], 1));
  for (const [id, total] of [['e1.x01', 8], ['e1.s01', 4]]) {
    const stage = worldStageById.get(id);
    const previous = { clearedAt: '2026-01-01', perfectAt: '2026-01-01', bestCorrect: total, bestTotal: total, plays: 1 };
    const progress = { ...emptyProgress, stages: { [id]: previous } };
    const next = finishWorldStage(progress, stage, 8, false, '2026-02-01');
    assert.deepEqual(next.stages[id], { ...previous, plays: 2 });
    assert.deepEqual(progress.stages[id], previous);
  }
});
