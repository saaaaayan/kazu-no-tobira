import assert from 'node:assert/strict';
import test from 'node:test';
import { worldGrades } from '../src/domain/worldCatalog.ts';
import { generateWorldQuestions, checkMathAnswer } from '../src/domain/worldQuestions.ts';
import { formatMathText } from '../src/domain/mathNotation.ts';
import { renderMathSvg } from '../src/domain/mathSvg.ts';

const formulas = source => formatMathText(source).filter(part => part.kind === 'math').map(part => part.latex);
test('converts curriculum notation to TeX without changing the prose or answer values', () => {
  const examples = [
    ['x^12＋a_n', 'x^{12}+a_{n}'],
    ['√(3²＋4²)＝5', '\\sqrt{3^{2}+4^{2}}=5'],
    ['√3/2', '\\frac{\\sqrt{3}}{2}'],
    ["f'(3) の値は？", "f'(3)"],
    ['∫[0,2] 3x^2 dx', '\\int_{0}^{2} 3x^{2}\\,\\mathrm{d}x'],
    ['∫ 3x^2 dx = x^3+C', '\\int 3x^{2}\\,\\mathrm{d}x = x^{3}+C'],
    ['lim[n→∞] 2/(n＋1)', '\\lim_{n\\to \\infty } \\frac{2}{n+1}'],
    ['Σ[k=1,10] k', '\\sum_{k=1}^{10} k'],
    ['log_2(8)', '\\log _{2}(8)'],
    ['sin 30°', '\\sin  30^{\\circ}'],
    ['vec(a)・vec(b)', '\\vec{a}\\cdot \\vec{b}'],
    ['e^(iπ) ＋ 1', 'e^{i\\pi } + 1'],
    ['−2≤x≤2', '-2\\le x\\le 2'],
    ['面積（cm²）', '\\mathrm{cm}^{2}'],
  ];
  for (const [source, latex] of examples) {
    assert.deepEqual(formulas(source), [latex], source);
    assert.equal(formatMathText(source).map(part => part.text).join(''), source);
  }
  assert.deepEqual(formulas('1から3までの かずは？'), []);
});

test('checks mathematical notation across every stage and renders varied examples with MathJax', t => {
  const stages = worldGrades.flatMap(grade => grade.stages);
  assert.equal(stages.length, 780);
  let questionCount = 0;
  const shapes = new Map();
  for (const stage of stages) {
    for (const seed of [0, 1]) {
      for (const q of generateWorldQuestions(stage, seed)) {
        questionCount++;
        for (const value of [q.question, q.prompt, q.hint, q.explanation, q.answer, ...(q.choices ?? [])]) {
          const parts = formatMathText(value);
          assert.equal(parts.map(part => part.text).join(''), value);
          for (const part of parts) {
            if (part.kind === 'text') {
              assert.doesNotMatch(part.text, /[√∫Σ^_²³⁴]/, stage.id + ': ' + value);
            } else {
              assert.doesNotMatch(part.latex, /[√∫Σ²³⁴]|lim\[/, stage.id + ': ' + value);
              const shape = part.latex.replace(/\d+/g, '0');
              shapes.set(shape, part.latex);
            }
          }
        }
        assert.equal(checkMathAnswer(q, q.answer), true);
      }
    }
  }
  for (const latex of shapes.values()) {
    const svg = renderMathSvg(latex);
    assert.match(svg.xml, /<path /, latex);
    assert.ok(svg.width > 0 && svg.height > 0, latex);
  }
  assert.equal(questionCount, 14400);
  t.diagnostic(questionCount + ' questions; ' + shapes.size + ' expression shapes rendered');
});
