import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnoseQuestion,diagnosticSummary } from '../server/question-review-diagnostics.mjs';

const counting={ id:'preschool.n01:fixture',skillId:'preschool.objects',type:'choice',
  question:'まるは いくつ？',answer:'2',choices:['1','2','3'],prompt:'まるを さわろう。',
  hints:['ひだりから みよう。','ひとつずつ さわろう。','さいごに いった かずを えらぼう。'],
  explanation:'ひだりから かぞえると 2 こだよ。',steps:[{title:'かぞえかた',body:'ひとつずつ さわるよ。'}],
  diagram:{kind:'countingBoard',rows:[{tokens:['dot','dot']}]},
};

test('flags definite metadata conflicts and keeps preschool proposal warnings separate',()=>{
  const good=diagnoseQuestion('preschool.n01',counting);
  assert.deepEqual(diagnosticSummary(good),{mismatches:0,language:0,draftNotes:0});
  assert.equal(good.needsHuman,true);
  assert.match(good.proposal.goal,/横一列/);
  const different=diagnoseQuestion('preschool.n01',{...counting,skillId:'e1.addition',question:'1 ＋ 1 は いくつ？',
    diagram:{...counting.diagram,rows:[{tokens:['dot']},{tokens:['dot']}]},unitCode:'comparison'});
  assert.equal(different.mismatches.length,3);
  assert.equal(different.draftNotes.length,1);
  assert.equal(diagnoseQuestion('preschool.n01',{...counting,skillId:'preschool.comparison'}).mismatches.length,1);
});

test('flags reading level, vague operations and missing next-step explanations across fields',()=>{
  const base={question:'学校',prompt:'よく考えて',answer:'2',explanation:'2。',
    hints:['該当箇所をみよう。','該当箇所をみよう。'],
    choices:['積'],steps:[{title:'',body:''}],figure:{labels:[{text:'対象'}],description:'横'}};
  const first=diagnoseQuestion('e1.n04',base);
  assert.ok(first.language.some(w=>w.field==='問題文' && w.message.includes('年度初め')));
  assert.ok(first.language.some(w=>w.field==='選択肢 1' && w.message.includes('積')));
  assert.ok(first.language.some(w=>w.field==='図のラベル'));
  assert.ok(first.language.some(w=>w.field==='ヒント 1' && w.message.includes('言い換え')));
  assert.ok(first.language.some(w=>w.field==='操作案内'));
  assert.ok(first.language.some(w=>w.field==='基本解説'));
  assert.ok(first.language.some(w=>w.field==='詳しい解説'));
  assert.equal(diagnoseQuestion('e3.n01',{...base,question:'横'}).language.some(w=>w.field==='問題文'),false);
});
