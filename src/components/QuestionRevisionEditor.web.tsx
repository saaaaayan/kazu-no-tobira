import { useState, type FormEvent } from 'react';
import type { BankQuestion } from '../domain/questionBank';
import { MathText } from './MathText';

type EditStep = { title: string; body: string; equations: string[] };
export type QuestionRevisionContent = {
  question: string; prompt: string; answer: string; hints: string[]; explanation: string; steps: EditStep[];
};
const area = { width:'100%', boxSizing:'border-box' as const, padding:8, font:'inherit' };
const blankStep = (): EditStep => ({title:'',body:'',equations:[]});

function fields(question: BankQuestion): QuestionRevisionContent {
  const hints=question.hints ?? question.guidedHints ?? (question.hint?[question.hint]:[]);
  return {question:question.question,prompt:question.prompt,answer:question.answer,explanation:question.explanation,
    hints:[0,1,2].map(index=>hints[index]??''),
    steps:(question.steps??[]).map(step=>({title:step.title,body:step.body,equations:[...(step.equations??[])]}))};
}

function diffFields(content: QuestionRevisionContent) {
  return [
    ['問題文',content.question],['操作案内',content.prompt],['正答',content.answer],
    ...content.hints.map((hint,index)=>['ヒント '+(index+1),hint]),
    ['基本解説',content.explanation],
    ['詳しい解説',content.steps.map(step=>[step.title,step.body,...step.equations].join('\n')).join('\n\n')],
  ];
}

export function QuestionRevisionDiff({ before, after }: { before: BankQuestion; after: QuestionRevisionContent | BankQuestion }) {
  const old=diffFields(fields(before));
  const next=diffFields('type' in after?fields(after):after);
  const differences=next.map(([name,value],index)=>({name,value,previous:old[index][1]})).filter(item=>item.previous!==item.value);
  return <div aria-label="修正前後の差分">
    {differences.length===0 ? <p>表示対象の項目に変更はありません。</p> : differences.map(item=><article key={item.name} style={{marginBlock:12}}>
      <h4>{item.name}</h4>
      <MathText value={item.previous || '未登録'} prefix="修正前："/>
      <MathText value={item.value || '未登録'} prefix="修正後："/>
    </article>)}
  </div>;
}

export function QuestionRevisionEditor({ question, busy, onSave, onCancel }: {
  question: BankQuestion; busy: boolean; onSave: (content: QuestionRevisionContent, note: string) => void; onCancel: () => void;
}) {
  const [content,setContent]=useState(()=>fields(question));
  const [note,setNote]=useState('');
  const [compare,setCompare]=useState(false);
  function updateField(name:'question'|'prompt'|'answer'|'explanation',value:string) {
    setContent(previous=>({...previous,[name]:value}));
  }
  function updateStep(index:number,step:EditStep) {
    setContent(previous=>({...previous,steps:previous.steps.map((item,i)=>i===index?step:item)}));
  }
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(content,note);
  }
  return <form aria-label="教材の編集" onSubmit={submit}>
    <fieldset disabled={busy} style={{border:0,padding:0}}>
      <legend>教材の編集</legend>
      <p>保存すると新しい版を記録し、審査状態を「未確認」に戻します。</p>
      {([['question','問題文',3000],['prompt','操作案内',500],['answer','正答',250]] as const).map(([name,label,max])=>
        <label key={name} style={{display:'block',marginBlock:8}}>{label}
          <textarea rows={name==='question'?4:2} style={area} value={content[name]} maxLength={max} required
            onChange={event=>updateField(name,event.target.value)}/>
        </label>)}
      {content.hints.map((hint,index)=><label key={index} style={{display:'block',marginBlock:8}}>ヒント {index+1}
        <textarea rows={2} style={area} value={hint} maxLength={1500} required
          onChange={event=>setContent({...content,hints:content.hints.map((old,i)=>i===index?event.target.value:old)})}/>
      </label>)}
      <label style={{display:'block',marginBlock:8}}>基本解説
        <textarea rows={4} style={area} value={content.explanation} maxLength={6000} required
          onChange={event=>updateField('explanation',event.target.value)}/>
      </label>
      <h4>詳しい解説</h4>
      {content.steps.map((step,index)=><fieldset key={index}>
        <legend>説明 {index+1}</legend>
        <label>見出し<input style={area} value={step.title} maxLength={150} required onChange={event=>updateStep(index,{...step,title:event.target.value})}/></label>
        <label>本文<textarea style={area} rows={3} value={step.body} maxLength={2500} required onChange={event=>updateStep(index,{...step,body:event.target.value})}/></label>
        <label>式（1行に1つ）<textarea style={area} rows={2} value={step.equations.join('\n')} maxLength={4000}
          onChange={event=>updateStep(index,{...step,equations:event.target.value?event.target.value.split('\n'):[]})}/></label>
        <button type="button" onClick={()=>setContent({...content,steps:content.steps.filter((_,i)=>i!==index)})}>この段階を削除</button>
      </fieldset>)}
      <button type="button" disabled={content.steps.length>=12} onClick={()=>setContent({...content,steps:[...content.steps,blankStep()]})}>説明を追加</button>
      <label style={{display:'block',marginBlock:8}}>修正理由
        <textarea rows={2} style={area} value={note} maxLength={1000} required onChange={event=>setNote(event.target.value)}/>
      </label>
      <button type="button" onClick={()=>setCompare(value=>!value)}>{compare?'差分を閉じる':'変更前後を確認する'}</button>
      {compare && <QuestionRevisionDiff before={question} after={content}/>}
      <div style={{display:'flex',gap:10,marginBlock:12}}>
        <button type="button" onClick={onCancel}>編集を閉じる</button>
        <button type="submit">新しい版を保存</button>
      </div>
    </fieldset>
  </form>;
}
