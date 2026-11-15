import assert from 'node:assert/strict';
const digits = text => [...text.matchAll(/\d+/g)].map(match => Number(match[0]));

function solve(q, values) {
  const [a,b,c] = values;
  switch (q.format) {
    case 'hundredBundle':
      assert.equal(a, 10);
      assert.ok(b >= 2 && b <= 10 && c >= 0 && c <= 9 && (b < 10 || c === 0));
      assert.deepEqual(q.diagram, { kind: 'bundlesAndOnes', tens: b, ones: c });
      return [10*b+c, [b,c]];
    case 'hundredTensForward':
      assert.equal(b, 10);
      return [a + Array.from({length:c}, () => b).reduce((sum,n) => sum+n,0), [a,c]];
    case 'hundredComparePlaces': {
      const [small, large] = [...values].sort((x,y) => x-y);
      assert.ok(Math.floor(large/10) > Math.floor(small/10));
      assert.ok(large%10 < small%10);
      return [large,[small,large]];
    }
    case 'hundredNextBundle': {
      assert.equal(c,10);
      assert.ok(Math.floor((a+b)/10) > Math.floor(a/10) && a+b <= 100);
      return [(a+b)%10, [a,b]];
    }
    case 'hundredStepsToTarget':
      assert.equal(c,1);
      assert.ok(b%10===0 && a<b);
      return [b-a,[a,b]];
    default: throw Error('Unknown place value format: ' + q.format);
  }
}

export function validateCountToHundredBatch(banks) {
  const seen = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100, bank.stageId);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= 3, bank.stageId);
    for (const q of bank.questions) {
      const values = digits(q.question);
      assert.ok(values.every(value => value >= 0 && value <= 100), q.id);
      const [answer,key] = solve(q, values);
      assert.equal(Number(q.answer),answer,q.id);
      assert.ok(answer >= 0 && answer <= 100,q.id);
      assert.equal(new Set(q.hints).size,3,q.id);
      assert.doesNotMatch(q.hints[2], /＝\d+/,q.id);
      assert.ok(key.every(value => digits(q.hints[2]).includes(value)),q.id);

      const equations = q.steps.flatMap(step => [...step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)]);
      assert.ok(equations.length >= 1,q.id);
      assert.ok(equations.some(match => +match[4] === answer) || q.format === 'hundredComparePlaces',q.id);
      for (const [,a,op,b,result] of equations) {
        assert.equal(op === '＋' ? +a + +b : +a - +b,+result,q.id);
        assert.ok(+result >= 0 && +result <= 100,q.id);
      }

      const signature = JSON.stringify([q.format,key]);
      assert.ok(!seen.has(signature),q.id);
      seen.add(signature);
    }
  }
}
