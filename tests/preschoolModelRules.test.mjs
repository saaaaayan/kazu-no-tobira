import assert from 'node:assert/strict';
import test from 'node:test';
import { checkPreschoolModelSet,validatePreschoolModelQuestion } from '../server/preschool-model-rules.mjs';

function fixture(token='dot',count=2,suffix='one') {
  const label={dot:'まる',triangle:'さんかく',square:'しかく',bear:'くま'}[token];
  const answer=String(count);
  return {id:'preschool.n01:fixture:'+suffix,skillId:'preschool.objects',type:'choice',format:'counting',difficulty:1,
    question:label+'は いくつ？',prompt:label+'に さわろう。',answer,choices:['1','2','3'],
    hints:['ひだりから みよう。','ひとつずつ さわろう。','さいごの かずを えらぼう。'],
    explanation:'さわって かぞえると '+answer+' こだよ。',
    steps:[{title:'はじめ',body:'ひだりから みよう。'},{title:'さいご',body:'さいごに いった かずを えらぼう。'}],
    diagram:{kind:'countingBoard',guide:true,rows:[{tokens:Array(count).fill(token)}]},
    mistakes:['1','2','3'].filter(item=>item!==answer).map(value=>({answer:value,explanation:'ひとつずつ さわろう。'}))};
}

test('model compares the figure, correct option and distractor explanations',()=>{
  const q=fixture();
  assert.equal(validatePreschoolModelQuestion(q).count,2);
  for (const variant of [
    {...q,answer:'3'}, {...q,choices:['1','2','2']},
    {...q,question:'まるは 1＋1？'}, {...q,hints:['1こだよ',...q.hints.slice(1)]},
    {...q,diagram:{...q.diagram,rows:[{tokens:['dot']},{tokens:['dot']}]}},
    {...q,diagram:{...q.diagram,rows:[{tokens:['dot','triangle']}]}},
    {...q,mistakes:q.mistakes.slice(1)},
  ]) assert.throws(()=>validatePreschoolModelQuestion(variant),{status:400});
});

test('ten distinct diagrams must cover all three quantities',()=>{
  const rows=[...['dot','triangle','square'].flatMap((token,i)=>[1,2,3].map(count=>fixture(token,count,i+':'+count))),fixture('bear',3,'bear')];
  assert.doesNotThrow(()=>checkPreschoolModelSet(rows));
  assert.throws(()=>checkPreschoolModelSet([...rows.slice(0,-1),fixture('dot',1,'duplicate')]),{status:400});
});
