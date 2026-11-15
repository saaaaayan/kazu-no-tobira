import assert from 'node:assert/strict';

const digits = text => [...text.matchAll(/\d+/g)].map(match => Number(match[0]));

function solve(question, values) {
  const [a, b, c, d] = values;
  switch (question.format) {
    case 'twentyBundle':
      assert.equal(values.length, 2);
      assert.equal(a, 10);
      assert.deepEqual(question.diagram, { kind: 'tenFrame', first: a, second: b });
      return a + b;
    case 'twentyOnes':
      assert.equal(values.length, 2);
      assert.equal(b, 10);
      return a - b;
    case 'twentyPosition':
      assert.equal(values.length, 2);
      assert.ok(a + b > 10 && a + b <= 20 && b > 1);
      return a + b;
    case 'twentyInner':
      assert.equal(values.length, 2);
      assert.ok(b > 10 && a + 1 < b);
      return b - a - 1;
    case 'twentyMiddle':
      assert.equal(values.length, 2);
      assert.ok((b - a) % 2 === 0 && a < b);
      return (a + b) / 2;
    case 'twentyNearest':
      assert.equal(values.length, 3);
      assert.ok(b < a && a < c && a - b !== c - a);
      return a - b < c - a ? b : c;
    case 'twentyTwoMoves':
      assert.equal(values.length, 3);
      assert.ok(a < c && c < b && d === undefined);
      return 2 * b - a - c;
    case 'twentyOrder': {
      assert.equal(values.length, 3);
      const ordered = [...values].sort((x, y) => x - y);
      assert.ok(ordered[0] < 10 && ordered[1] > 10 && ordered[1] < ordered[2]);
      assert.ok(question.steps[2].body.includes(ordered.join('<')));
      return ordered[1];
    }
    default: throw Error('Unknown count-to-twenty format: ' + question.format);
  }
}

export function validateCountToTwentyBatch(banks) {
  const signatures = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100, bank.stageId);
    assert.ok(new Set(bank.questions.map(question => question.format)).size >= 4, bank.stageId);
    for (const question of bank.questions) {
      const values = digits(question.question);
      assert.ok(values.every(value => value >= 1 && value <= 20), question.id);
      const answer = solve(question, values);
      assert.ok(answer > 0 && answer <= 20, question.id);
      assert.equal(Number(question.answer), answer, question.id);
      assert.equal(new Set(question.hints).size, 3, question.id);
      assert.ok(values.every(value => digits(question.hints[2]).includes(value)), question.id);
      assert.doesNotMatch(question.hints[2], /＝\d+/, question.id);
      const keyValues = question.format === 'twentyOrder' ? [...values].sort((a, b) => a - b) : values;
      const signature = JSON.stringify([question.format, keyValues]);
      assert.ok(!signatures.has(signature), question.id);
      signatures.add(signature);
      for (const step of question.steps) {
        for (const [, left, operator, right, result] of step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)) {
          assert.equal(operator === '＋' ? Number(left) + Number(right) : Number(left) - Number(right), Number(result), question.id);
          assert.ok(Number(result) >= 0 && Number(result) <= 20, question.id);
        }
      }
    }
  }
}
