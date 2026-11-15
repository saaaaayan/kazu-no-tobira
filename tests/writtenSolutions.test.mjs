import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSageIntroBanks } from '../scripts/sage-intro-unit.mjs';
import { worldGrades } from '../src/domain/worldCatalog.ts';
import { generateWorldQuestions, checkMathAnswer } from '../src/domain/worldQuestions.ts';
import { renderMathSvg } from '../src/domain/mathSvg.ts';

const equations = q => q.steps.flatMap(step => step.equations ?? []);

test('high-school model solutions cover normal, EX and secret questions, and render as MathJax SVG', t => {
  const stages = worldGrades.slice(9).flatMap(grade => grade.stages);
  assert.equal(stages.length,195);
  const shapes = new Map();
  let count=0;
  for (const stage of stages) for (const seed of [0,1]) for (const q of generateWorldQuestions(stage,seed)) {
    assert.ok(q.steps.length>=3,q.id);
    assert.ok(q.steps.every(step=>step.title.trim() && step.body.trim()),q.id);
    assert.ok(q.steps.some(step=>step.title==='結論'),q.id);
    assert.ok(equations(q).length,q.id);
    assert.equal(checkMathAnswer(q,q.answer),true,q.id);
    for (const tex of equations(q)) shapes.set(tex.replace(/\d+/g,'#'),tex);
    count++;
  }
  for (const tex of shapes.values()) assert.match(renderMathSvg(tex).xml,/<path /,tex);
  assert.equal(count,3900);
  const merged = [...shapes.values()].join('\n');
  for (const symbol of [String.raw`\mathrm P`, String.raw`P(A)`, String.raw`\sum`, String.raw`\lim`,
    String.raw`\int`, String.raw`f'(`, String.raw`\vec`, String.raw`\iff`]) assert.ok(merged.includes(symbol),symbol);
  t.diagnostic(count + ' questions; ' + shapes.size + ' equation forms rendered');
});

test('Sage models explain every bank item and show 12 choose 2 times 9 choose 1 as 594', () => {
  const problems = buildSageIntroBanks().flatMap(bank=>bank.questions);
  assert.equal(problems.length,300);
  for (const q of problems) {
    assert.ok(q.steps.some(step=>step.title.startsWith('結論')),q.id);
    assert.ok(q.steps.at(-1).body,q.id);
    assert.ok(equations(q).some(tex=>tex.includes('\\boxed{'+q.answer+'}')),q.id);
    for (const tex of equations(q)) assert.match(renderMathSvg(tex).xml,/<path /,q.id+': '+tex);
  }
  const example = problems.find(q=>q.question.startsWith('赤玉が12個、青玉が9個'));
  assert.equal(example.answer,'594');
  const lines = equations(example);
  assert.ok(lines.includes(String.raw`{}_{12}\mathrm C_2=\frac{12!}{2!\,10!}=\frac{12\cdot11}2=66`));
  assert.ok(lines.includes(String.raw`{}_{9}\mathrm C_1=9`));
  assert.ok(lines.includes(String.raw`=66\cdot9=\boxed{594}`));
  assert.match(example.steps.at(-1).body,/順列 P/);
});
