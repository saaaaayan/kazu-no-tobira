import assert from 'node:assert/strict';

const digits = text => [...text.matchAll(/\d+/g)].map(match => Number(match[0]));

function verifyAnswer(question) {
  const numbers = digits(question.question);
  const [a,b,c] = numbers;
  switch (question.format) {
    case 'tenCompareGaps':
      assert.deepEqual(numbers.slice(2), [10]);
      assert.ok(b > a);
      return b-a;
    case 'tenAfterRemoval':
      assert.deepEqual(numbers.slice(2), [10]);
      assert.ok(a > b);
      assert.deepEqual(question.diagram, { kind: 'takeAway', total: a, used: b });
      return 10+b-a;
    case 'tenSecondSource':
      assert.deepEqual(numbers.slice(3), [10]);
      assert.ok(a+b < 10 && a+b+c > 10 && a <= b);
      return a+b+c-10;
    case 'tenTrimAfterTwo':
      assert.deepEqual(numbers.slice(3), [10,10]);
      assert.ok(a+b < 10 && a+b+c > 10 && b <= c);
      return a+b+c-10;
    case 'tenEqualShare':
      assert.deepEqual(numbers.slice(3), [10]);
      assert.ok(a < b && b+c < 10);
      return 20-a-b-2*c;
    case 'tenShift':
      assert.deepEqual(numbers.slice(3), [10]);
      assert.ok(a+b <= 9 && c < b && a+c > b-c);
      return a-b+2*c;
    case 'tenReserved':
      assert.deepEqual(numbers.slice(3), [10]);
      assert.ok(c < b && a+b >= 10 && a+b-c < 10);
      return 10-a-b+c;
    default: throw Error('Unknown make-ten format: ' + question.format);
  }
}

export function validateMakeTenBatch(banks) {
  const signatures = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100, bank.stageId);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= 4, bank.stageId);
    for (const question of bank.questions) {
      const expected = verifyAnswer(question);
      assert.ok(expected > 0 && expected <= 20, question.id);
      assert.equal(expected, Number(question.answer), question.id);
      const signature = JSON.stringify([question.format, digits(question.question)]);
      assert.ok(!signatures.has(signature), question.id);
      signatures.add(signature);
      assert.equal(new Set(question.hints).size, 3, question.id);
      const hint = question.hints[2];
      assert.doesNotMatch(hint, /＝\d+/, question.id);
      const values = digits(question.question).filter(n => n !== 10);
      assert.ok(values.every(value => digits(hint).includes(value)), question.id);
      const equations = question.steps.flatMap(step => [...step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)]);
      assert.ok(equations.length >= 2);
      for (const [, left, op, right, answer] of equations) {
        assert.equal(op === '＋' ? Number(left)+Number(right) : Number(left)-Number(right), Number(answer), question.id);
      }
      assert.ok(equations.some(match => Number(match[4]) === expected), question.id);
    }
  }
}
