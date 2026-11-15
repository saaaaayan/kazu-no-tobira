import assert from 'node:assert/strict';

function solve(question, values) {
  const [a, b, c, d] = values;
  switch (question.format) {
    case 'takeAway':
      assert.equal(values.length, 2);
      assert.deepEqual(question.diagram, { kind: 'takeAway', total: a, used: b });
      return a-b;
    case 'takeTwice': assert.equal(values.length, 3); return a-(b+c);
    case 'startAmount': assert.equal(values.length, 3); return a+b+c;
    case 'unknownLast': assert.equal(values.length, 3); return a-(b+c);
    case 'compareAfter':
      assert.equal(values.length, 4);
      assert.ok(a > c && b > d && c !== d);
      return a+d-c-b;
    case 'moveAway':
      assert.equal(values.length, 3);
      assert.ok(a+b <= 9);
      return a-b-2*c;
    case 'equalize':
      assert.equal(values.length, 3);
      assert.ok(a > b && a !== c);
      return c+b-a;
    case 'comparedStart':
      assert.equal(values.length, 3);
      assert.ok(a > c && b !== c);
      return a+b-c;
    default: throw new Error('Unrecognized subtraction format: ' + question.format);
  }
}

export function validateEarlySubtractionBatch(banks) {
  const signatures = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100, bank.stageId);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= 4, bank.stageId);
    for (const question of bank.questions) {
      const numbers = text => [...text.matchAll(/\d+/g)].map(match => Number(match[0]));
      const values = numbers(question.question);
      assert.ok(values.every(value => value >= 1 && value <= 9), question.id);
      const result = solve(question, values);
      assert.ok(result > 0 && result <= 9, question.id);
      assert.equal(Number(question.answer), result, question.id);
      const hint = question.hints[2];
      assert.equal(new Set(question.hints).size, 3, question.id);
      assert.ok(values.every(value => numbers(hint).includes(value)), question.id);
      assert.doesNotMatch(hint, /＝\d+/, question.id);
      const equations = question.steps.flatMap(step => [...step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)]);
      assert.ok(equations.length >= 2, question.id);
      for (const [, left, op, right, answer] of equations) {
        assert.equal(op === '＋' ? Number(left)+Number(right) : Number(left)-Number(right), Number(answer), question.id);
        assert.ok(Number(answer) >= 0 && Number(answer) <= 9, question.id);
      }
      const signature = JSON.stringify([question.format, values]);
      assert.ok(!signatures.has(signature), question.id + ': repeated exercise');
      signatures.add(signature);
    }
  }
}
