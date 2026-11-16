/** Presentation only: answer/choice identity and grading never depend on TeX. */
export type MathPart = { kind: 'text'; text: string } | { kind: 'math'; text: string; latex: string };

const superscript: Record<string, string> = {'²':'2','³':'3','⁴':'4'};
const symbols: Record<string, string> = {
  '＋':'+', '−':'-', '＝':'=', '×':'\\times ', '÷':'\\div ',
  '≤':'\\le ', '≥':'\\ge ', '≠':'\\ne ', '∩':'\\cap ', '∪':'\\cup ',
  '∞':'\\infty ', '→':'\\to ', 'π':'\\pi ', '…':'\\ldots ', '・':'\\cdot ',
  '？':'?', '□':'\\square ', '%':'\\%', '°':'^{\\circ}',
};

function toLatex(source: string): string {
  const limit = /^lim\[([^\]]+)\]\s*(.+)$/.exec(source);
  if (limit) return '\\lim_{' + toLatex(limit[1]) + '} ' + toLatex(limit[2]);
  const integral = /^∫\[([^,]+),([^\]]+)\]\s*(.+?)\s*dx$/.exec(source);
  if (integral) return '\\int_{' + toLatex(integral[1]) + '}^{' + toLatex(integral[2]) + '} ' + toLatex(integral[3]) + '\\,\\mathrm{d}x';
  const sum = /^Σ\[([^,]+),([^\]]+)\]\s*(.+)$/.exec(source);
  if (sum) return '\\sum_{' + toLatex(sum[1]) + '}^{' + toLatex(sum[2]) + '} ' + toLatex(sum[3]);
  const indefinite = /^∫\s*(.+?)\s*dx\s*=\s*(.+)$/.exec(source);
  if (indefinite) return '\\int ' + toLatex(indefinite[1]) + '\\,\\mathrm{d}x = ' + toLatex(indefinite[2]);
  // Match complete single-level operands before replacing individual symbols.
  const operand = /(?:√\([^()]+\)|√\d+|\([^()]+\)|\d+(?:\.\d+)?|[a-z])(?:\^(?:\([^()]+\)|\d+|[a-z])|[²³⁴])?/.source;
  const terms = new RegExp('(' + operand + ')/([−-]?' + operand + ')|√(?:\\(([^()]+)\\)|(\\d+))|\\^\\(([^()]+)\\)|\\^(\\d+|[a-z])|_(\\d+|[a-z])|(?:sin|cos|tan|log)(?![a-z])|cm[²³]|km|kg|dL|cm|(?<=[0-9])[mgL]\\b|vec\\(([ab])\\)|[²³⁴＋−＝×÷≤≥≠∩∪∞→π…・？%°□]', 'g');
  const ungroup = (x: string) => x.startsWith('(') && x.endsWith(')') ? x.slice(1, -1) : x;
  return source.replace(terms, (token, num, den, radGroup, radNum, expGroup, exp, sub, vec) => {
    if (num !== undefined) return '\\frac{' + toLatex(ungroup(num)) + '}{' + toLatex(ungroup(den)) + '}';
    if (radGroup !== undefined || radNum !== undefined) return '\\sqrt{' + toLatex(radGroup ?? radNum) + '}';
    if (expGroup !== undefined || exp !== undefined) return '^{' + toLatex(expGroup ?? exp) + '}';
    if (sub !== undefined) return '_{' + sub + '}';
    if (vec !== undefined) return '\\vec{' + vec + '}';
    if (superscript[token]) return '^{' + superscript[token] + '}';
    if (/^(sin|cos|tan|log)$/.test(token)) return '\\' + token + ' ';
    if (/^(cm[²³]?|km|kg|dL|[mgL])$/.test(token)) {
      return '\\mathrm{' + token.replace(/[²³]$/, '') + '}' + (superscript[token.at(-1)!] ? '^{' + superscript[token.at(-1)!] + '}' : '');
    }
    return symbols[token] ?? token;
  });
}

// Legacy curriculum templates use ASCII/Unicode notation next to Japanese prose.
// Tokenize only those authored strings, preserving punctuation and prose verbatim.
const mathRun = /[A-Za-z0-9()[\].,'+−＋=＝×÷\-*/^_<>≤≥≠∩∪∞→π…・？□%°²³⁴√∫Σ:]+(?:[ \t]+[A-Za-z0-9()[\].,'+−＋=＝×÷\-*/^_<>≤≥≠∩∪∞→π…・？□%°²³⁴√∫Σ:]+)*/g;
const notation = /[A-Za-z√∫Σ∞π□_²³⁴×÷＋−=＝<>≤≥≠∩∪^%°]|\d…|[0-9][+\-*/:,]|[+\-*/:][0-9]/;

function formatLegacyMathText(source: string): MathPart[] {
  const parts: MathPart[] = [];
  let end = 0;
  for (const match of source.matchAll(mathRun)) {
    const raw = match[0];
    // Japanese question marks should remain prose unless part of an equation/list.
    const formula = /[=＝,]\s*？$/.test(raw) ? raw : raw.replace(/？+$/, '');
    if (!/[A-Za-z0-9∞π]/.test(formula) || !notation.test(formula)) continue;
    if (match.index > end) parts.push({ kind:'text', text:source.slice(end, match.index) });
    parts.push({ kind:'math', text:formula, latex:toLatex(formula) });
    end = match.index + formula.length;
  }
  if (end < source.length) parts.push({ kind:'text', text:source.slice(end) });
  return parts;
}

export function formatMathText(source: string): MathPart[] {
  // Authored TeX takes precedence over the legacy template notation.
  const parts: MathPart[] = [];
  let end = 0;
  for (const match of source.matchAll(/(?<!\\)\$([^$\r\n]+)(?<!\\)\$|\\\(([^\r\n]+?)\\\)/g)) {
    if (match.index > end) parts.push(...formatLegacyMathText(source.slice(end, match.index)));
    parts.push({ kind:'math', text:match[0], latex:match[1] ?? match[2] });
    end = match.index + match[0].length;
  }
  if (end < source.length) parts.push(...formatLegacyMathText(source.slice(end)));
  return parts;
}
