import assert from 'node:assert/strict';
import test from 'node:test';
import { generateAdditionRound } from '../src/domain/addition.ts';
import { additionSkills, curriculum } from '../src/domain/curriculum.ts';
import { gradeInteger } from '../src/domain/grading.ts';
import { emptyProgress, recordAttempt } from '../src/domain/progress.ts';

const ranges = [[0, 9], [10, 10], [11, 18]];

for (const [index, { id, title }] of additionSkills.entries()) {
  const [minimum, maximum] = ranges[index];
  const expectedPairs = [];
  for (let left = 0; left < 10; left++) {
    for (let right = 0; right < 10; right++) {
      if (left + right >= minimum && left + right <= maximum) expectedPairs.push([left, right]);
    }
  }

  function verify(problem) {
    const { left, right, answer, explanation } = problem;
    assert.equal(problem.skillId, id);
    assert.equal(answer, left + right);
    assert.ok(answer >= minimum && answer <= maximum);
    assert.ok(Number.isInteger(left) && left >= 0 && left <= 9);
    assert.ok(Number.isInteger(right) && right >= 0 && right <= 9);
    assert.deepEqual(gradeInteger(answer, String(left + right)), { status: 'correct', submitted: answer });
    assert.deepEqual(gradeInteger(answer, String(answer + 1)), { status: 'incorrect', submitted: answer + 1 });
    if (left === 0 || right === 0) {
      assert.match(explanation, /かずは かわらない/);
      assert.ok(explanation.endsWith(`こたえは ${answer}。`));
    } else if (answer > 10) {
      const split = explanation.match(/^(\d+)を (\d+)と (\d+)に わけよう。まず (\d+) ＋ (\d+) ＝ 10。のこりの (\d+)を たして、10 ＋ (\d+) ＝ (\d+)。$/);
      assert.ok(split);
      const [part, fill, rest, start, added, remaining, tail, total] = split.slice(1).map(Number);
      assert.equal(part, right);
      assert.equal(fill + rest, right);
      assert.equal(start, left);
      assert.equal(added, fill);
      assert.equal(left + fill, 10);
      assert.ok(rest > 0);
      assert.equal(remaining, rest);
      assert.equal(tail, rest);
      assert.equal(10 + rest, total);
      assert.equal(total, answer);
    } else if (answer === 10) {
      assert.ok(explanation.includes(`${left}から 10まで、あと ${10 - left}`));
      assert.ok(explanation.endsWith(`${left} ＋ ${right} ＝ 10。`));
    } else {
      assert.ok(explanation.startsWith(`${left}から ${right}つ`));
      assert.ok(explanation.endsWith(`かずは ${answer}。`));
    }
  }

  test(`${title} の全 ${expectedPairs.length} 通り`, () => {
    const round = generateAdditionRound(id, expectedPairs.length, () => 0);
    assert.deepEqual(round.map(({ left, right }) => [left, right]), expectedPairs);
    assert.equal(new Set(round.map(problem => problem.id)).size, expectedPairs.length);
    round.forEach(verify);
  });

  test(`${title} の 10,000 問を乱数で検証`, () => {
    let seed = 20261115;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const seen = new Set();
    for (let trial = 0; trial < 2000; trial++) {
      const round = generateAdditionRound(id, 5, random);
      assert.equal(round.length, 5);
      assert.equal(new Set(round.map(problem => problem.id)).size, 5);
      round.forEach(problem => {
        verify(problem);
        seen.add(problem.id);
      });
    }
    assert.equal(seen.size, expectedPairs.length);
  });
}

test('生成時の件数と乱数の境界', () => {
  const { id } = additionSkills[1];
  for (const count of [0, -1, 1.2, 10, NaN, Infinity]) {
    assert.throws(() => generateAdditionRound(id, count), RangeError);
  }
  for (const sample of [-0.1, 1, NaN, Infinity]) {
    assert.throws(() => generateAdditionRound(id, 1, () => sample), RangeError);
  }
  assert.equal(generateAdditionRound(id, 1, () => 1 - Number.EPSILON)[0].left, 9);
});

test('採点は全角数字と前後の空白を受け付ける', () => {
  for (const input of ['10', '１０', '１0', ' 10 ', '０１０']) {
    assert.deepEqual(gradeInteger(10, input), { status: 'correct', submitted: 10 });
  }
  for (const input of ['', '　', '10.0', '1e1', '0xA', '-10', '+10', '1 0', '10匹', '9007199254740992']) {
    assert.deepEqual(gradeInteger(10, input), { status: 'invalid' });
  }
  assert.equal(gradeInteger(0, '０').status, 'correct');
});

test('ステージのクリアと技能の成績は独立して更新される', () => {
  const attempt = {
    problemId: 'e1.add.within-9:2+3', skillId: 'e1.add.within-9', stageId: 'e1.forest',
    submitted: 5, correct: true, answeredAt: '2026-11-15T00:00:00Z',
  };
  const first = recordAttempt(emptyProgress, attempt, false);
  assert.deepEqual(first.stages, {});
  const cleared = recordAttempt(first, attempt, true);
  const retried = recordAttempt(cleared, { ...attempt, submitted: 6, correct: false }, false);
  assert.deepEqual(retried.skills[attempt.skillId], { answered: 3, correct: 2 });
  assert.deepEqual(retried.stages['e1.forest'], { clearedAt: attempt.answeredAt });
  assert.equal(retried.attempts.length, 3);
  assert.equal(emptyProgress.attempts.length, 0);
});

test('12学年に一意なIDがあり、ステージが既存の技能を参照する', () => {
  assert.equal(curriculum.length, 12);
  assert.equal(new Set(curriculum.map(grade => grade.id)).size, 12);
  assert.equal(curriculum[0].stages.length, 3);
  for (const grade of curriculum) {
    assert.equal(new Set(grade.stages.map(stage => stage.id)).size, grade.stages.length);
    for (const stage of grade.stages) assert.ok(grade.skills.some(skill => skill.id === stage.skillId));
  }
});
