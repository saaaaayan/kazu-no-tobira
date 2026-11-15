import { carryAdditionStages } from '../scripts/carry-addition-unit.mjs';
import { validateCarryAdditionBatch } from '../scripts/validate-carry-addition.mjs';
import { countToTwentyStages } from '../scripts/count-to-twenty-unit.mjs';
import { validateCountToTwentyBatch } from '../scripts/validate-count-to-twenty.mjs';
import { makeTenStages } from '../scripts/make-ten-unit.mjs';
import { validateMakeTenBatch } from '../scripts/validate-make-ten.mjs';
import { validateEarlySubtractionBatch } from '../scripts/validate-early-subtraction.mjs';
import { earlySubtractionStages } from '../scripts/early-subtraction-unit.mjs';
import { validateEarlyAdditionBatch } from '../scripts/validate-early-addition.mjs';
import { earlyAdditionStages } from '../scripts/early-addition-unit.mjs';
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
    case 'position': return problem.question.includes('もどる') ? values[0] - values[1] : values[0] + values[1];
    case 'interval': return values[1] - values[0] + (problem.question.includes('りょうはしも') ? 1 : -1);
    case 'sequence': return (values[0] + values[1]) / 2 - Number(problem.question.includes('ひとつ まえ'));
    case 'line': return values[1] - values[0] - (values[2] ?? 0);
    case 'reverseTransfer': return values[1] + values[2] - values[0];
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

const unitBatch = banks.filter(bank => earlyAdditionStages.some(([id]) => id === bank.stageId));

test('足し算バッチを解法別に検証し、ステージ間の重複を除外する', () => {
  assert.equal(unitBatch.length, 5);
  validateEarlyAdditionBatch(unitBatch);
});

const subtractionBatch = banks.filter(bank => earlySubtractionStages.some(([id]) => id === bank.stageId));
test('引き算バッチの数学とステージ間の重複を検証する', () => {
  assert.equal(subtractionBatch.length, 5);
  validateEarlySubtractionBatch(subtractionBatch);
});

const makeTenBatch = banks.filter(bank => makeTenStages.some(([id]) => id === bank.stageId));
test('10をつくる単元の正答、条件、図、ヒント、途中式、重複を検証する', () => {
  assert.equal(makeTenBatch.length, 5);
  validateMakeTenBatch(makeTenBatch);
});

const countToTwentyBatch = banks.filter(bank => countToTwentyStages.some(([id]) => id === bank.stageId));
test('20までの数の単元を問題文から独立に検証する', () => {
  assert.equal(countToTwentyBatch.length, 5);
  validateCountToTwentyBatch(countToTwentyBatch);
});

const carryAdditionBatch = banks.filter(bank => carryAdditionStages.some(([id]) => id === bank.stageId));
test('くりあがりの足し算で10のまとまり、正答、図、解説を検証する', () => {
  assert.equal(carryAdditionBatch.length, 5);
  validateCarryAdditionBatch(carryAdditionBatch);
});

test('保存済み3,000問の問題文から独立して再計算し、途中式・ヒント・図を検証する', () => {
  const allIds = new Set();
  const equations = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100);
    assert.equal(new Set(bank.questions.map(q => q.question)).size, 100);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= (unitBatch.includes(bank) || carryAdditionBatch.includes(bank) ? 3 : 4));
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
      if (!unitBatch.includes(bank) && !subtractionBatch.includes(bank) && !makeTenBatch.includes(bank) && !countToTwentyBatch.includes(bank) && !carryAdditionBatch.includes(bank)) {
        assert.ok(checkMathAnswer(question, String(solveFromStem(question))), question.id);
      }
      assert.equal(question.hints.length, 3);
      assert.equal(new Set(question.hints).size, 3);
      assert.ok(question.hints.every(text => text.trim()));
      assert.equal(question.steps.length, 5);
      if (question.diagram?.kind === 'transferToTen') {
        const moved = c - a;
        const remaining = b - moved;
        assert.equal(c, 10);
        assert.ok(a > 0 && a < c && moved > 0 && remaining > 0, question.question);
        assert.equal(question.diagram.inside, a);
        assert.equal(question.diagram.outside, b);
        assert.equal(c + remaining, a + b);
        assert.equal(Number(question.answer), remaining);
      }
      if (question.diagram?.kind === 'tenFrame') {
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
  assert.equal(allIds.size, 3000);
  assert.ok(equations.size > 100);
});

test('既存の6つの出題枠では、すでに満杯の箱を使う問題を出さない', () => {
  const bridge = banks.find(bank => bank.stageId === 'e1.bridge');
  const replaced = bridge.questions.filter(q => q.id.includes(':spare-10-'));
  assert.equal(replaced.length, 6);
  for (const problem of replaced) {
    assert.equal(problem.format, 'reverseTransfer');
    assert.match(problem.question, /なかに たまが [3-8]こ/);
  }
  for (const problem of bridge.questions.filter(q => q.format === 'story')) {
    assert.equal(problem.diagram?.kind, 'transferToTen', problem.id);
    assert.ok(problem.diagram.inside < 10, problem.id);
  }
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
