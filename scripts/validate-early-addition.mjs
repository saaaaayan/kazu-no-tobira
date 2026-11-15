import assert from 'node:assert/strict';

function verifyQuestion(question) {
  const values = [...question.question.matchAll(/\d+/g)].map(match => Number(match[0]));
  const [a, b, c, d] = values;
  const plus = numbers => numbers.reduce((sum, n) => sum + n, 0);
  let expected;
  let requiredValues;
  switch (question.format) {
    case 'twoCollections':
      expected = plus(values);
      requiredValues = [a, b, c, d];
      break;
    case 'joinThree':
      expected = plus(values);
      requiredValues = [a, b, c];
      assert.deepEqual(question.diagram, { kind: 'tenFrame', first: a, second: b, third: c });
      break;
    case 'target':
      expected = d - plus([a, b, c]);
      requiredValues = [a, b, c, d];
      break;
    case 'splitTotal':
      expected = a - plus([b, c, d]);
      requiredValues = [a, b, c, d];
      break;
    case 'compareGroups':
      expected = plus([a, b]) - plus([c, d]);
      requiredValues = [a, b, c, d];
      break;
    case 'returnSome':
      expected = plus([a, b]) - c;
      requiredValues = [a, b, c];
      assert.notEqual(b, c, question.id);
      break;
    case 'refill':
      expected = c - (a - b);
      requiredValues = [a, b, c];
      assert.ok(a > b && c > a, question.id);
      break;
    default: throw new Error('Unhandled pattern ' + question.format);
  }
  assert.equal(values.length, requiredValues.length, question.id);
  assert.ok(values.every(value => value >= 1 && value <= 9), question.id);
  assert.ok(expected > 0 && expected <= 9, question.id);
  assert.equal(Number(question.answer), expected, question.id);

  const hintNumbers = [...question.hints[2].matchAll(/\d+/g)].map(match => Number(match[0]));
  assert.ok(requiredValues.every(value => hintNumbers.includes(value)), question.id);
  assert.doesNotMatch(question.hints[2], /＝\d+/, question.id);
  const equations = question.steps.flatMap(step => [...step.body.matchAll(/(\d+)([＋−])(\d+)＝(\d+)/g)]);
  assert.ok(equations.length >= 3, question.id);
  for (const [, x, sign, y, result] of equations) {
    assert.equal(sign === '＋' ? Number(x) + Number(y) : Number(x) - Number(y), Number(result), question.id);
    assert.ok(Number(result) >= 0 && Number(result) <= 9, question.id);
  }

  return JSON.stringify([question.format, values]);
}

export function validateEarlyAdditionBatch(banks) {
  const signatures = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length, 100, bank.stageId);
    assert.ok(new Set(bank.questions.map(q => q.format)).size >= 3, bank.stageId);
    for (const question of bank.questions) {
      assert.equal(question.hints.length, 3, question.id);
      assert.ok(question.hints.every(hint => hint.trim()), question.id);
      assert.equal(question.steps.length, 5, question.id);
      const signature = verifyQuestion(question);
      assert.ok(!signatures.has(signature), question.id + ': repeated exercise');
      signatures.add(signature);
    }
  }
}
