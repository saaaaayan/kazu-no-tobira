import assert from 'node:assert/strict';

const digits = text => [...text.matchAll(/\d+/g)].map(match => Number(match[0]));

function requireBorrow(total, used) {
  assert.ok(total >= 11 && total <= 18 && used <= 9 && used > total-10);
}

function solve(question, values) {
  const [a,b,c,d] = values;
  if (question.format === 'borrowCompare') {
    assert.equal(values.length, 4);
    requireBorrow(a,c);
    requireBorrow(b,d);
    assert.ok(a !== b && c !== d && a-c > b-d);
    return { answer: (a-b)-(c-d), bases: [[a,c], [b,d]] };
  }
  requireBorrow(a,b);
  const remainder = a-b;
  const bases = [[a,b]];
  switch (question.format) {
    case 'borrowDirect':
      assert.equal(values.length, 2);
      assert.deepEqual(question.diagram, { kind: 'borrowTen', total: a, used: b });
      return { answer: remainder, bases };
    case 'borrowThenUse':
      assert.equal(values.length, 3);
      assert.ok(c < remainder);
      return { answer: remainder-c, bases };
    case 'borrowFindLater':
      assert.equal(values.length, 3);
      assert.ok(c < remainder);
      return { answer: a-(b+c), bases };
    case 'borrowNeedMore':
      assert.equal(values.length, 3);
      assert.ok(c > remainder);
      return { answer: c+b-a, bases };
    default: throw Error('Unknown borrow format: ' + question.format);
  }
}

export function validateBorrowSubtractionBatch(banks) {
  const seen = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100, bank.stageId);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= 4, bank.stageId);
    for (const question of bank.questions) {
      const values = digits(question.question);
      assert.ok(values.every(value => value > 0 && value <= 18), question.id);
      const { answer, bases } = solve(question, values);
      assert.ok(answer > 0 && answer <= 9, question.id);
      assert.equal(Number(question.answer), answer, question.id);
      assert.equal(new Set(question.hints).size, 3, question.id);
      assert.doesNotMatch(question.hints[2], /＝\d+/, question.id);
      assert.ok(values.every(value => digits(question.hints[2]).includes(value)), question.id);

      const solution = question.steps[2].body;
      for (const [total, used] of bases) {
        assert.ok(solution.includes(`10−${used}＝${10-used}`), question.id);
        assert.ok(solution.includes(`${10-used}＋${total-10}＝${total-used}`), question.id);
      }
      const equations = question.steps.flatMap(step => [...step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)]);
      assert.ok(equations.some(match => Number(match[4]) === answer), question.id);
      for (const [,left,op,right,result] of equations) {
        assert.equal(op === '＋' ? +left + +right : +left - +right, +result, question.id);
        assert.ok(+result >= 0 && +result <= 18, question.id);
      }

      const signature = JSON.stringify([question.format, values]);
      assert.ok(!seen.has(signature), question.id);
      seen.add(signature);
    }
  }
}
