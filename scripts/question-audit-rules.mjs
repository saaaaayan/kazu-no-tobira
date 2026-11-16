const superscripts = { '⁰':'0', '¹':'1', '²':'2', '³':'3', '⁴':'4', '⁵':'5', '⁶':'6', '⁷':'7', '⁸':'8', '⁹':'9', '⁻':'-' };

export function normalizeQuestion(value) {
  return value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, powers => '^(' + [...powers].map(p=>superscripts[p]).join('') + ')')
    .normalize('NFKC').replace(/[−‐]/g,'-').replace(/[×✕]/g,'*').replace(/÷/g,'/')
    .replace(/\^\((\d+)\)/g,'^$1').replace(/[\s\u200b]+/g,'').replace(/[。．]$/,'');
}

function gcd(a,b) {
  while (b) [a,b]=[b,a%b];
  return a<0n ? -a : a;
}

function ratio(n,d) {
  if (!d) return undefined;
  const factor=gcd(n,d)*(d<0n?-1n:1n);
  return [n/factor,d/factor];
}

function decimal(value) {
  const match=value.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) return undefined;
  const [,sign,integer,fraction='']=match;
  return ratio(BigInt((sign==='-'?'-':'')+integer+fraction),10n**BigInt(fraction.length));
}

export function rationalValue(value) {
  const parts=normalizeQuestion(value).split('/');
  if (parts.length===1) return decimal(parts[0]);
  if (parts.length!==2) return undefined;
  const a=decimal(parts[0]), b=decimal(parts[1]);
  return a && b ? ratio(a[0]*b[1],a[1]*b[0]) : undefined;
}

export function optionKey(value) {
  const exact=rationalValue(value);
  return exact ? 'q:' + exact.join('/') : 't:' + normalizeQuestion(value);
}

export function arithmeticTask(stem) {
  const text = normalizeQuestion(stem);
  const match=text.match(/^(\d+(?:\.\d+)?)([+*/-])(\d+(?:\.\d+)?)=\?$/);
  if (!match) return undefined;
  const [n,d]=decimal(match[1]), [m,e]=decimal(match[3]), op=match[2];
  const operands=[[n,d].join('/'),[m,e].join('/')];
  if (op==='+' || op==='*') operands.sort();
  const result = op==='+' ? ratio(n*e+m*d,d*e) : op==='-' ? ratio(n*e-m*d,d*e)
    : op==='*' ? ratio(n*m,d*e) : ratio(n*e,d*m);
  return { key:'arithmetic:' + op + ':' + operands.join(':'), result };
}

function figureContext(q, maskNumbers) {
  // Only the question-facing figure disambiguates a stem that asks the reader to use a figure.
  if (q.clock?.read) return maskNumbers ? 'clock' : 'clock:' + q.clock.start%720;
  if (q.diagram?.kind==='countingBoard') {
    return JSON.stringify(q.diagram.rows.map(row => [row.label ?? '',maskNumbers ? [...new Set(row.tokens)].sort() : row.tokens]));
  }
  if (q.figure && /この図|図を見|図の|図で/.test(normalizeQuestion(q.question))) {
    const figure = q.figure;
    return maskNumbers ? JSON.stringify([figure.outline.map(points => points.length), Boolean(figure.circle)]) : JSON.stringify(figure);
  }
  if (q.diagram && /この図|図を見|図の|グラフ|表を見/.test(normalizeQuestion(q.question))) {
    const values=Object.entries(q.diagram).sort(([a],[b])=>a.localeCompare(b,'en'));
    return JSON.stringify(maskNumbers ? values.map(([k,v])=>[k,typeof v==='number'?'#':v]) : values);
  }
  return '';
}

function expansionKey(text) {
  const match=text.match(/^\(x([+-]\d+)\)\(x([+-]\d+)\)を展開すると\?$/);
  if (!match) return undefined;
  const constants=match.slice(1).map(value=>BigInt(value).toString()).sort();
  return 'expansion:' + constants.join(':');
}

export function questionKeys(q) {
  const text=normalizeQuestion(q.question);
  return {
    exact:text+'|'+figureContext(q,false),
    equivalent:arithmeticTask(q.question)?.key ?? expansionKey(text),
    shape:text.replace(/\d+(?:\.\d+)?/g,'#')+'|'+figureContext(q,true),
  };
}

export function inspectQuestion(q) {
  const issues=[];
  if (!q.id || !q.question?.trim() || !q.answer?.trim() || !q.explanation?.trim()) issues.push('missing-field');
  if (q.type==='choice') {
    const options=q.choices?.map(optionKey) ?? [];
    const correct=optionKey(q.answer);
    if (options.filter(value=>value===correct).length!==1) issues.push('choice-answer-count');
    if (new Set(options).size!==options.length) issues.push('equivalent-choices');
  }
  const task=arithmeticTask(q.question);
  const computed=task?.result?.join('/');
  if (task && (!computed || computed!==rationalValue(q.answer)?.join('/'))) issues.push('arithmetic-answer');
  const visualPrompt=/この時計|このとけい|この図|図を見|図の|このグラフ|グラフを見|この表|表を見/.test(normalizeQuestion(q.question));
  const illustrated=Boolean(q.diagram || q.clock || q.figure);
  if (visualPrompt && !illustrated) issues.push('figure-referenced-but-missing');
  return {issues, independent: Boolean(computed && !issues.includes('arithmetic-answer')), visualPrompt, illustrated};
}
