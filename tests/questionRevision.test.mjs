import assert from 'node:assert/strict';
import test from 'node:test';
import { reviseQuestion,validateRevisionRequest } from '../server/question-revision.mjs';

const question={id:'e1.forest:qa',type:'number',skillId:'e1.addition',diagram:{kind:'tenFrame',first:1,second:1}};
const edit={id:question.id,version:0,note:'考え方を説明する',
  content:{question:'1+1=?',prompt:'あわせて いくつ？',answer:'2',
    hints:['はじめは いくつ？','ひとつ ふやそう。','つぎの かずを えらぼう。'],explanation:'1 から ひとつ すすむと 2。',
    steps:[{title:'じゅんに かぞえる',body:'まるを ひとつずつ かぞえる。',equations:['1+1=2']}]}};

test('edits preserve problem identity, grading type and drawings, and ignore requested approval',()=>{
  const validated=validateRevisionRequest({...edit,content:{...edit.content,id:'other',status:'ready',diagram:null}});
  const revised=reviseQuestion(question,validated.content);
  assert.equal(revised.id,question.id);
  assert.equal(revised.type,question.type);
  assert.deepEqual(revised.diagram,question.diagram);
  assert.ok(!('status' in revised));
  assert.equal(revised.hint,revised.hints[0]);
});

test('rejects incorrect arithmetic, a missing diagram, or identical hint steps',()=>{
  for (const change of [{answer:'3'},{question:'図を見て答えましょう。'}]) {
    const validated=validateRevisionRequest({...edit,content:{...edit.content,...change}});
    assert.throws(()=>reviseQuestion({...question,diagram:undefined},validated.content),{status:400});
  }
  assert.throws(()=>validateRevisionRequest({...edit,content:{...edit.content,hints:['おなじ','おなじ','おなじ']}}),{status:400});
});
