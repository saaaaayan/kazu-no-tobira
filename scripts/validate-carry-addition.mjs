import assert from 'node:assert/strict';

const digits = text => [...text.matchAll(/\d+/g)].map(match => Number(match[0]));

function solve(question, numbers) {
  const [a,b,c,d] = numbers;
  switch (question.format) {
    case 'carryThenUse':
      assert.equal(numbers.length, 3);
      assert.ok(a <= b && a+b-c > 10);
      return a+b-c;
    case 'carryFindFirstGain':
      assert.equal(numbers.length, 3);
      assert.ok(c-b > 10 && c-b-a <= 9 && a <= 9);
      return c-(a+b);
    case 'carryCompare':
      assert.equal(numbers.length, 4);
      assert.ok(a <= b && c <= d && a+b > c+d && c+d > 10);
      return (a-c)+(b-d);
    case 'carryThreeGroups':
      assert.equal(numbers.length, 3);
      assert.ok(a <= b && a+b < 10 && a+b+c > 10);
      assert.deepEqual(question.diagram, { kind: 'tenFrame', first: a, second: b, third: c });
      return numbers.reduce((sum, value) => sum+value, 0);
    case 'carryPackTarget':
      assert.equal(numbers.length, 4);
      assert.ok(a <= b && a+b < 10 && a+b+c > d && d > 10);
      return a+b+c-d;
    default: throw Error('Unknown carry format: ' + question.format);
  }
}

export function validateCarryAdditionBatch(banks) {
  const seen = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100, bank.stageId);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= 3, bank.stageId);
    for (const question of bank.questions) {
      const values = digits(question.question);
      assert.ok(values.every(value => value > 0 && value <= 19), question.id);
      const expected = solve(question, values);
      assert.ok(expected > 0 && expected <= 19, question.id);
      assert.equal(Number(question.answer), expected, question.id);
      assert.equal(new Set(question.hints).size, 3, question.id);
      assert.doesNotMatch(question.hints[2], /＝\d+/, question.id);
      assert.ok(values.every(value => digits(question.hints[2]).includes(value)), question.id);
      const equations = question.steps.flatMap(step => [...step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)]);
      assert.ok(equations.some(([,a,op,b,result]) => op === '＋' && +a > 0 && +b > 0 && +result === 10), question.id);
      assert.ok(equations.some(match => +match[4] === expected), question.id);
      for (const [,a,op,b,result] of equations) {
        assert.equal(op === '＋' ? +a + +b : +a - +b, +result, question.id);
        assert.ok(+result >= 0 && +result <= 19, question.id);
      }
      const signature = JSON.stringify([question.format, values]);
      assert.ok(!seen.has(signature), question.id);
      seen.add(signature);
    }
  }
}
