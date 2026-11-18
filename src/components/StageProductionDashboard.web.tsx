import {useEffect,useMemo,useState} from 'react';
import type {BankQuestion} from '../domain/questionBank';
import {allWorldStages,worldIslands} from '../domain/worldCatalog';
import {uiPreviewBank,uiPreviewPreschoolCheckpointOne} from '../domain/uiPreviewRound';
import {stageProductionLabels,stageProductionOptions,type StageProductionEntry,
  type StageProductionStatus} from '../domain/stageProductionStatus';

export type ProductionStage = StageProductionEntry & {registered_count:number};
export type PreviewMode = 'single'|'sequential'|'random';
type AdminApi = <T>(path:string,body?:unknown,signal?:AbortSignal)=>Promise<T>;
type Props = {
  api:AdminApi;
  onPreview:(id:string,items:BankQuestion[],mode:PreviewMode)=>void;
  onInspectQuestion:(id:string)=>void;
};
const section={border:'1px solid #cdd7e6',borderRadius:14,padding:16,background:'#fff',margin:'12px 0'};
const control={padding:'9px 12px',border:'1px solid #a8b5ca',borderRadius:9,minHeight:42,
  background:'#f4f7ff',color:'#172846',fontSize:14};
function shuffle<T>(items:readonly T[]):T[] {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
function previewBank(id:string):BankQuestion[] {
  if(id==='preschool.checkpoint1') return uiPreviewPreschoolCheckpointOne();
  const stage=allWorldStages.find(item=>item.id===id);
  if(!stage || stage.gradeId!=='preschool') return [];
  return uiPreviewBank(stage);
}

export default function StageProductionDashboard({api,onPreview,onInspectQuestion}:Props) {
  const [rows,setRows]=useState<ProductionStage[]>([]);
  const [fetching,setFetching]=useState(true);
  const [island,setIsland]=useState('all');
  const [statusFilter,setStatusFilter]=useState('all');
  const [term,setTerm]=useState('');
  const [selectedId,setSelectedId]=useState('');
  const [questions,setQuestions]=useState<BankQuestion[]>([]);
  const [questionSource,setQuestionSource]=useState<'database'|'prototype'|'none'>('none');
  const [questionLoading,setQuestionLoading]=useState(false);
  const [randomCount,setRandomCount]=useState(10);
  const [edit,setEdit]=useState<ProductionStage>();
  const [saveBusy,setSaveBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [reload,setReload]=useState(0);
  const [page,setPage]=useState(0);
  const pageSize=65;

  useEffect(()=>{
    const controller=new AbortController();
    setFetching(true);
    void api<ProductionStage[]>('stage-production',undefined,controller.signal)
      .then(data=>{if(!controller.signal.aborted)setRows(data);})
      .catch(e=>{if(!controller.signal.aborted)setNotice('進捗を読み込めませんでした: '+String(e.message??e));})
      .finally(()=>{if(!controller.signal.aborted)setFetching(false);});
    return ()=>controller.abort();
  },[api,reload]);

  const selected=rows.find(s=>s.id===selectedId);
  useEffect(()=>{
    const controller=new AbortController();
    if(!selectedId){setQuestions([]);setQuestionSource('none');return;}
    setQuestions([]);
    setQuestionLoading(true);
    setQuestionSource('none');
    void api<{stageId:string;questions:BankQuestion[]}>('stage-questions?id='+encodeURIComponent(selectedId),
      undefined,controller.signal)
      .then(result=>{
        if(controller.signal.aborted)return;
        const fromDb=result.questions??[];
        const fallback=fromDb.length?[]:previewBank(selectedId);
        setQuestions(fromDb.length?fromDb:fallback);
        setQuestionSource(fromDb.length?'database':fallback.length?'prototype':'none');
      }).catch(e=>{
        if(controller.signal.aborted)return;
        // Checkpoint 1 has no stored questions: its sample round is composed from stages 01–05.
        const fallback=previewBank(selectedId);
        if(selectedId==='preschool.checkpoint1'&&fallback.length){
          setQuestions(fallback);setQuestionSource('prototype');return;
        }
        setNotice('問題一覧を読み込めませんでした: '+String(e.message??e));
      }).finally(()=>{if(!controller.signal.aborted)setQuestionLoading(false);});
    return ()=>controller.abort();
  },[selectedId,api,reload]);

  const totals=useMemo(()=>{
    const counts=Object.fromEntries(stageProductionOptions.map(key=>[key,0])) as Record<StageProductionStatus,number>;
    let authored=0,registered=0,reviewed=0,childTests=0;
    for(const stage of rows){
      counts[stage.status]++;
      authored+=stage.authored_count;
      registered+=stage.registered_count;
      reviewed+=stage.reviewed_count;
      childTests+=stage.child_test_count;
    }
    return {counts,authored,registered,reviewed,childTests};
  },[rows]);
  const filtered=useMemo(()=>rows.filter(stage=>
    (island==='all'||stage.island_id===island)&&
    (statusFilter==='all'||stage.status===statusFilter)&&
    (!term.trim()||(stage.id+' '+stage.stage_title).toLowerCase().includes(term.toLowerCase().trim()))
  ),[rows,island,statusFilter,term]);
  const shown=filtered.slice(page*pageSize,(page+1)*pageSize);
  const maxPage=Math.max(0,Math.ceil(filtered.length/pageSize)-1);
  const setFilter=(fn:()=>void)=>{fn();setPage(0);};

  function select(row:ProductionStage) {
    setSelectedId(row.id);
    setEdit({...row});
    setNotice('');
    setRandomCount(10);
  }
  async function save(){
    if(!edit||saveBusy)return;
    setSaveBusy(true);setNotice('');
    try{
      const updated=await api<ProductionStage>('stage-production',{
        id:edit.id,status:edit.status,version:edit.version,
        authored_count:edit.authored_count,reviewed_count:edit.reviewed_count,
        child_test_count:edit.child_test_count,note:edit.note
      });
      setEdit({...edit,...updated});
      setNotice('保存しました。進捗ステータスは問題ごとの公開承認には影響しません。');
      setReload(n=>n+1);
    }catch(e){setNotice('保存できませんでした: '+String(e instanceof Error?e.message:e));}
    finally{setSaveBusy(false);}
  }
  function exportCsv(){
    const lines=[['島','ステージID','ステージ名','ステータス','制作済み','DB登録','確認済み','子供テスト回数','メモ'],
      ...filtered.map(row=>[row.island_id,row.id,row.stage_title??'',stageProductionLabels[row.status],
        row.authored_count,row.registered_count,row.reviewed_count,row.child_test_count,row.note])];
    const csv='\uFEFF'+lines.map(cells=>cells.map(cell=>{
      let x=String(cell??'');
      if(/^[\s\uFEFF]*[=+@-]/.test(x))x="'"+x;
      return '"'+x.replaceAll('"','""')+'"';
    }).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='kazu-stage-production.csv';a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const selectedStageLabel=selected?.stage_title??selectedId;
  return <>
    <section style={section} aria-label="制作状況ダッシュボード">
      <h2 style={{marginTop:0}}>制作状況ダッシュボード</h2>
      <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
        {[
          ['作成済み（原稿・試作含む）',totals.authored],
          ['DB登録済み',totals.registered],
          ['制作者が確認した問題',totals.reviewed],
          ['管理対象ステージ・テスト',rows.length],
        ].map(([label,n])=><div key={String(label)} style={{background:'#edf2ff',borderRadius:12,padding:13,minWidth:175}}>
          <div style={{fontSize:12}}>{label}</div>
          <strong style={{fontSize:25}}>{Number(n).toLocaleString('ja-JP')}</strong>
        </div>)}
      </div>
      <p style={{fontSize:13}}>制作済み数には非公開の下書きと試作問題も含みます。DB登録数とは異なります。
        ステージの制作・評価状況は、問題ごとの審査・公開可否と別管理です。</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {stageProductionOptions.map(key=><span key={key} style={{background:'#f3f4f6',borderRadius:8,padding:'8px 10px'}}>
          {stageProductionLabels[key]} <strong>{totals.counts[key]}</strong>
        </span>)}
      </div>
    </section>
    <section style={section} aria-label="ステージ検索と一覧">
      <h2 style={{marginTop:0}}>ステージ・確認テスト一覧</h2>
      <div style={{display:'flex',flexWrap:'wrap',gap:9}}>
        <label>島
          <select style={{...control,display:'block'}} value={island}
            onChange={e=>setFilter(()=>setIsland(e.target.value))}>
            <option value="all">すべて</option>
            {worldIslands.map(item=><option value={item.id} key={item.id}>{item.title}／{item.island}</option>)}
          </select>
        </label>
        <label>評価ステータス
          <select style={{...control,display:'block'}} value={statusFilter}
            onChange={e=>setFilter(()=>setStatusFilter(e.target.value))}>
            <option value="all">すべて</option>
            {stageProductionOptions.map(key=><option key={key} value={key}>{stageProductionLabels[key]}</option>)}
          </select>
        </label>
        <label>ステージID・名前
          <input style={{...control,display:'block',minWidth:220}} value={term}
            onChange={e=>setFilter(()=>setTerm(e.target.value))} placeholder="例: preschool.n05"/>
        </label>
        <button type="button" style={control} onClick={exportCsv}>一覧をCSVで保存</button>
        <button type="button" style={control} onClick={()=>setReload(n=>n+1)}>再読み込み</button>
      </div>
      <p>{fetching?'読み込み中…':filtered.length+'件'}　{page+1}/{maxPage+1}ページ</p>
      <div style={{maxHeight:410,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr><th align="left">ステージ</th><th align="left">進捗ステータス</th><th align="right">制作済み</th><th align="right">DB登録</th><th align="right">確認済み</th><th>開く</th></tr></thead>
          <tbody>{shown.map(row=><tr key={row.id} style={{borderTop:'1px solid #e5e7eb',background:selectedId===row.id?'#eef4ff':'transparent'}}>
            <td style={{padding:7}}><strong>{row.id}</strong><div>{row.stage_title}</div></td>
            <td>{stageProductionLabels[row.status]}</td>
            <td align="right">{row.authored_count}</td><td align="right">{row.registered_count}</td>
            <td align="right">{row.reviewed_count}</td>
            <td align="center"><button type="button" style={control} onClick={()=>select(row)}>選択</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:'flex',gap:12,marginTop:8,alignItems:'center'}}>
        <button type="button" style={control} disabled={page===0} onClick={()=>setPage(n=>n-1)}>前へ</button>
        <button type="button" style={control} disabled={page>=maxPage} onClick={()=>setPage(n=>n+1)}>次へ</button>
      </div>
    </section>
    {selected&&edit&&<section style={section} aria-label="選択ステージの検証">
      <h2 style={{marginTop:0}}>{selectedStageLabel} <small style={{fontSize:13,color:'#526382'}}>{selected.id}</small></h2>
      <p>制作 {selected.authored_count}問　／　データベース登録 {selected.registered_count}問　／　確認 {selected.reviewed_count}問
        {selected.is_checkpoint?' ／ 確認テスト':''}</p>
      <h3>ステージの制作・評価ステータス</h3>
      <div style={{display:'flex',flexWrap:'wrap',gap:9}}>
        <label>現在の段階
          <select value={edit.status} style={{...control,display:'block'}} onChange={e=>setEdit({...edit,status:e.target.value as StageProductionStatus})}>
            {stageProductionOptions.map(key=><option key={key} value={key}>
              {selected.is_checkpoint&&key==='hundred_created'?'全問作成済み（確認テスト）':stageProductionLabels[key]}
            </option>)}
          </select>
        </label>
        {([
          ['authored_count','制作済みの問題数'],
          ['reviewed_count','制作者確認済み問題数'],
          ['child_test_count','子供のテスト回数'],
        ] as const).map(([key,label])=><label key={key}>{label}
          <input style={{...control,display:'block',width:130}} type="number" min={0} max={10000}
            value={edit[key]} onChange={e=>setEdit({...edit,[key]:Number(e.target.value)})}/>
        </label>)}
      </div>
      <label style={{display:'block',marginTop:8}}>評価メモ
        <textarea rows={3} maxLength={2000} style={{...control,display:'block',width:'100%',boxSizing:'border-box'}}
          value={edit.note} onChange={e=>setEdit({...edit,note:e.target.value})}/>
      </label>
      <button type="button" style={{...control,marginTop:9,background:'#dce9ff'}} disabled={saveBusy} onClick={()=>void save()}>
        {saveBusy?'保存中…':'ステータスを保存'}
      </button>
      <p style={{fontSize:12}}>最終確認済みは通常100問、確認テストは10問の確認が必要です。「子供によるテスト済み」にはテスト回数1回以上も必要です。</p>
      <h3>登録問題を実際のゲーム画面で確認</h3>
      <p>{questionLoading?'問題を読み込み中…':questions.length+'問読み込み済み'}
        {questionSource==='prototype'?'（公開試作版のサンプル。DBには未登録）':
          questionSource==='database'?'（Supabase登録問題）':''}。ゲームの学習記録や公開承認は変更されません。</p>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <button type="button" style={control} disabled={!questions.length||questionLoading}
          onClick={()=>onPreview(selected.id,questions,'sequential')}>ステージの問題を順番に解く（{questions.length}問）</button>
        <label>ランダム出題数
          <select style={{...control,marginLeft:5}} value={randomCount} onChange={e=>setRandomCount(Number(e.target.value))}>
            {[10,20,50,100].map(n=><option key={n} value={n}>{n}問</option>)}
          </select>
        </label>
        <button type="button" style={control} disabled={!questions.length||questionLoading}
          onClick={()=>onPreview(selected.id,shuffle(questions).slice(0,randomCount),'random')}>
          ランダム出題で解く
        </button>
      </div>
      <h3>問題一覧（各問題から1問だけ確認）</h3>
      {!questions.length&&!questionLoading&&<p>登録問題がありません。まだ制作されていないステージは試せません。</p>}
      <div style={{maxHeight:440,overflow:'auto'}}>
        {questions.map((question,index)=><div key={question.id} style={{padding:'10px 0',borderBottom:'1px solid #e3e8f0'}}>
          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,alignItems:'center'}}>
            <span><strong>{index+1}. </strong>{question.question}</span>
            <span style={{display:'flex',gap:5}}>
              <button type="button" style={control} onClick={()=>onPreview(selected.id,[question],'single')}>この1問をゲーム画面で解く</button>
              {questionSource==='database'&&<button type="button" style={control} onClick={()=>onInspectQuestion(question.id)}>問題の詳細・審査</button>}
            </span>
          </div>
        </div>)}
      </div>
    </section>}
    <p role="status" aria-live="polite">{notice}</p>
  </>;
}
