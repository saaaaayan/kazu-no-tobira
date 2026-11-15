import assert from 'node:assert/strict';

function solve(q) {
  // Superscripts are Unicode and are not picked up by this extraction.
  const [a,b,c,d] = [...q.question.matchAll(/-?\d+/g)].map(match => Number(match[0]));
  switch (q.topic) {
    case 'algebra': {
      const roots = Array.from({length:a-1},(_,i)=>i+1).filter(x=>x*(a-x)===b);
      assert.ok(roots.length >= 1);
      return roots[0]**2 + (a-roots[0])**2;
    }
    case 'calculus': {
      const root = Math.sqrt(b/(3*a));
      assert.ok(Number.isInteger(root) && root>0 && root<d);
      return Math.min(...[0,root,d].map(x=>a*x**3-b*x));
    }
    case 'probability': {
      let matches = 0;
      for (let i=0;i<a+b;i++) for (let j=i+1;j<a+b;j++) for(let k=j+1;k<a+b;k++) {
        if ([i,j,k].filter(index=>index<a).length===2) matches++;
      }
      return matches;
    }
    case 'numberTheory': return Array.from({length:b},(_,i)=>i+1).filter(n=>n%c===d).length;
    case 'vectors': return Math.abs(a*d-b*c);
    default: throw Error('Unknown format: '+q.topic);
  }
}

export function validateSageIntroBanks(banks) {
  const all = new Set();
  for (const bank of banks) {
    assert.equal(bank.questions.length,100);
    const counts = new Map();
    for (const q of bank.questions) {
      assert.equal(Number(q.answer),solve(q),q.id);
      assert.equal(new Set(q.hints).size,3,q.id);
      assert.equal(q.steps.length,5,q.id);
      assert.ok(!all.has(q.question),q.id);
      all.add(q.question);
      counts.set(q.topic,(counts.get(q.topic) ?? 0)+1);
    }
    assert.deepEqual([...counts.values()],[20,20,20,20,20]);
  }
}
