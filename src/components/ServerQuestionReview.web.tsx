import { useEffect, useState, type FormEvent } from 'react';
import type { BankQuestion } from '../domain/questionBank';
import { worldIslands } from '../domain/worldCatalog';
import { rejectReasons, reviewStatusLabels, type ReviewReason, type ReviewStatus } from '../domain/reviewAdmin';
import { MathText } from './MathText';
import { QuestionDiagram } from './QuestionSupport';
import { StudyFigureView } from './StudyFigureView';

type Row = { id: string; stage_id: string; stem: string; format: string; status: ReviewStatus; version: number };
type Listing = { rows: Row[]; total: number; counts: Partial<Record<ReviewStatus, number>> };
type Details = {
  id: string; stageId: string; question: BankQuestion; status: ReviewStatus; version: number;
  reason: ReviewReason | null; note: string;
  history: { id: number; created: string; actor: string; event: string; previous_status: ReviewStatus | null;
    status: ReviewStatus; note: string; reason: string | null; fingerprint: string }[];
  duplicates: { id: string; stage_id: string; stem: string; kind: 'exact' | 'equivalent' | 'structural' }[];
};
type StageTotals = { id: string; island: string; registered: number; target: number; states: Partial<Record<ReviewStatus, number>> };
const statuses = Object.entries(reviewStatusLabels) as [ReviewStatus, string][];
const filters = [
  ['q','問題文・解答・解説・ID'],['unit','単元コード'],['stage_id','ステージID'],
  ['format','出題形式のコード'],['skill','技能コード'],
] as const;
const duplicateLabels = { exact:'問題文一致', equivalent:'数学的同値', structural:'構造類似' };
const panel = { border:'1px solid #cbd5e1', borderRadius:12, margin:'16px 0', padding:16, background:'#fff' };
const pageStyle = { maxWidth:1120, margin:'0 auto', padding:24, minHeight:'100vh', color:'#172846',
  background:'#f2f5fa', fontFamily:'system-ui, sans-serif', overflowWrap:'anywhere' as const };
const line = { display:'flex', flexWrap:'wrap' as const, alignItems:'end', gap:12 };
const labelStyle = { display:'grid', gap:4 };
const button = { padding:'8px 14px', minHeight:42, borderRadius:6, border:'1px solid #8495b3', background:'#f4f7fc', color:'#172846' };
const badgeColors: Record<ReviewStatus,string> = {
  unreviewed:'#e2e8f0', needs_work:'#fff0bc', verified:'#dbeafe', ready:'#d1fae5', rejected:'#fee2e2',
};
function Badge({ status }: { status: ReviewStatus }) {
  return <span style={{ background:badgeColors[status], borderRadius:6, padding:'3px 7px' }}>{reviewStatusLabels[status]}</span>;
}

async function api<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/review-api/'+path, body === undefined ? { signal, cache:'no-store' } : {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 401 && path !== 'login') window.dispatchEvent(new Event('review-session-expired'));
    const payload: { error?: string } = await response.json();
    throw new Error(payload.error ?? '読み込みに失敗しました。');
  }
  return response.json() as Promise<T>;
}

function ReviewDashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const [listing, setListing] = useState<Listing>();
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<Details>();
  const [nextStatus, setNextStatus] = useState<ReviewStatus>('needs_work');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState<ReviewReason>('問題不成立');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [params, setParams] = useState('');
  const [page, setPage] = useState(0);
  const [epoch, refresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [totals, setTotals] = useState<StageTotals[]>();
  const [totalsIsland, setTotalsIsland] = useState(worldIslands[0].id);
  const [focusId, setFocusId] = useState<string>();
  const [previousRevision, setPreviousRevision] = useState<BankQuestion>();
  const total = Object.values(listing?.counts ?? {}).reduce((sum,count) => sum+count,0);

  useEffect(() => {
    const controller = new AbortController();
    void api<Listing>('questions?'+params+'&page='+page,undefined,controller.signal).then(setListing)
      .catch(problem => { if (!controller.signal.aborted) setNotice(problem.message); });
    return () => controller.abort();
  },[params,page,epoch]);

  useEffect(() => {
    if (!focusId) return;
    const controller = new AbortController();
    void api<Details>('questions/'+encodeURIComponent(focusId),undefined,controller.signal).then(value => {
      setDetail(value);
      setNote(value.note);
      setReason(value.reason ?? '問題不成立');
    }).catch(problem => { if (!controller.signal.aborted) setNotice(problem.message); });
    return () => controller.abort();
  },[focusId,epoch]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setSelection({});
    setListing(undefined);
    const next = new URLSearchParams();
    for (const [name,value] of Object.entries(fieldValues)) {
      if (value.trim()) next.set(name,value.trim());
    }
    setParams(next.toString());
    setPage(0);
    refresh(value => value+1);
  }

  function updateFilter(name: string, value: string) {
    setFieldValues(values => ({ ...values, [name]:value }));
  }

  function open(id: string) {
    setDetail(undefined);
    setPreviousRevision(undefined);
    setFocusId(id);
    refresh(value => value+1);
  }

  async function save(items: { id: string; version: number }[]) {
    setNotice('');
    setSaving(true);
    try {
      const result = await api<{ updated: number }>('reviews',{ items,status:nextStatus,note,reason });
      setSelection({});
      setTotals(undefined);
      setNotice(result.updated+'問の審査を保存しました。');
    } catch (problem) { setNotice(String(problem instanceof Error ? problem.message : problem)); }
    finally { setSaving(false); refresh(value => value+1); }
  }

  function goTo(next: number) {
    setListing(undefined);
    setSelection({});
    setPage(next);
  }

  const checked = Object.entries(selection).map(([id,version]) => ({ id,version }));
  return <main style={pageStyle}>
    <header style={{ ...line, justifyContent:'space-between' }}>
      <h1>数のトビラ 問題審査</h1>
      <button type="button" style={button} onClick={() => void onLogout().catch(problem => setNotice(problem.message))}>ログアウト</button>
    </header>
    <p>専用データベースの登録問題を審査します。一般向けの配信は別途公開判定を通ります。</p>
    <section aria-label="審査集計" style={{ ...panel, ...line }}>
      <strong>実登録 {total.toLocaleString('ja-JP')} / 104,000問</strong>
      {statuses.map(([key]) => <span key={key}><Badge status={key}/> {listing?.counts[key] ?? 0}問</span>)}
      <button type="button" style={button} onClick={() => void api<StageTotals[]>('stages').then(setTotals).catch(problem => setNotice(problem.message))}>ステージ別集計</button>
    </section>
    {totals && <section style={panel} aria-label="ステージ別の制作状況">
      <label style={labelStyle}>集計する島
        <select value={totalsIsland} onChange={event => setTotalsIsland(event.target.value as typeof totalsIsland)}>
          {worldIslands.map(island => <option value={island.id} key={island.id}>{island.island}</option>)}
        </select>
      </label>
      <div style={{ maxHeight:300, overflow:'auto' }}>
        <ul>{totals.filter(stage => stage.island===totalsIsland).map(stage =>
          <li key={stage.id}>{stage.id}　登録 {stage.registered} / {stage.target}　公開準備完了 {stage.states.ready ?? 0}　不足 {Math.max(0,stage.target-stage.registered)}</li>)}</ul>
      </div>
    </section>}
    <form style={{ ...panel, ...line }} aria-label="問題の検索" onSubmit={search}>
      {filters.map(([name,label]) => <label key={name} style={labelStyle}>{label}
        <input name={name} maxLength={200} value={fieldValues[name] ?? ''} onChange={event => updateFilter(name,event.target.value)}/>
      </label>)}
      <label style={labelStyle}>学年・島
        <select value={fieldValues.island ?? ''} onChange={event => updateFilter('island',event.target.value)}>
          <option value="">すべて</option>
          {worldIslands.map(island => <option value={island.id} key={island.id}>{island.title} ／ {island.island}</option>)}
        </select>
      </label>
      {[
        ['kind','ステージ種別',[['normal','通常'],['extra','EX'],['secret','隠し']]],
        ['difficulty','難易度',[['1','1'],['2','2'],['3','3']]],
        ['status','審査状態',statuses],
        ['has_figure','図',[['1','あり'],['0','なし']]],
        ['duplicates','重複候補',[['1','あり']]],
      ].map(([name,label,options]) => {
        const field = String(name);
        return <label key={field} style={labelStyle}>{String(label)}
          <select value={fieldValues[field] ?? ''} onChange={event => updateFilter(field,event.target.value)}>
            <option value="">すべて</option>
            {(options as [string,string][]).map(([value,text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </label>;
      })}
      <button style={button} type="submit">検索</button>
      <a href={'/review-api/export.csv?'+params}>CSV</a>
      <a href={'/review-api/export.json?'+params}>JSON</a>
    </form>
    <p role="status">{notice}</p>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 360px),1fr))', gap:16, alignItems:'start' }}>
      <section style={panel} aria-label="検索結果">
        <h2>問題一覧</h2>
        <p>{listing ? listing.total.toLocaleString('ja-JP')+'件の検索結果' : '読み込み中…'}</p>
        <div style={line}>
          <button type="button" style={button} disabled={page===0} onClick={() => goTo(page-1)}>前のページ</button>
          <span>{page+1} ページ</span>
          <button type="button" style={button} disabled={!listing || (page+1)*20>=listing.total} onClick={() => goTo(page+1)}>次のページ</button>
        </div>
        {listing?.rows.map(row => <article key={row.id} style={{ borderTop:'1px solid #dbe3ef', padding:'10px 0' }}>
          <label><input type="checkbox" checked={Object.hasOwn(selection,row.id)} aria-label={row.id+'を一括審査に選択'}
            onChange={event => {
              const updated = {...selection};
              if (event.target.checked) updated[row.id] = row.version;
              else delete updated[row.id];
              setSelection(updated);
            }}/> <Badge status={row.status}/> {row.stage_id} ／ {row.format}</label>
          <div><button type="button" style={{...button,marginTop:6,textAlign:'left'}} onClick={() => open(row.id)}>{row.stem}</button></div>
        </article>)}
      </section>
      <div>
        {(detail || checked.length > 0) && <section style={panel} aria-label="審査の保存">
          <h2>審査を保存</h2>
          <label style={labelStyle}>変更後の状態
            <select value={nextStatus} onChange={event => setNextStatus(event.target.value as ReviewStatus)}>
              {statuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {nextStatus==='rejected' && <label style={labelStyle}>ボツ理由
            <select value={reason} onChange={event => setReason(event.target.value as ReviewReason)}>
              {rejectReasons.map(value => <option key={value}>{value}</option>)}
            </select>
          </label>}
          <label style={{...labelStyle,margin:'8px 0'}}>審査メモ・修正指示
            <textarea rows={4} maxLength={10000} value={note} onChange={event => setNote(event.target.value)}/>
          </label>
          <div style={line}>
            {detail && <button type="button" style={button} disabled={saving} onClick={() => void save([{ id:detail.id,version:detail.version }])}>この問題に保存</button>}
            {checked.length > 0 && <button type="button" style={button} disabled={saving} onClick={() => void save(checked)}>選択中の{checked.length}問に一括保存</button>}
          </div>
        </section>}
        {detail && <section style={panel} aria-label="問題のプレビュー">
          <h2>問題のプレビュー</h2>
          <p>{detail.id}　<Badge status={detail.status}/></p>
          <MathText value={detail.question.question} style={{ fontSize:22, fontWeight:'700' }}/>
          {detail.question.diagram && <QuestionDiagram diagram={detail.question.diagram} phase="question"/>}
          {detail.question.figure && <StudyFigureView figure={detail.question.figure}/>}
          <h3>解答・採点</h3>
          {detail.question.choices?.map((choice,index) => <MathText key={index} value={choice}/>)}
          <MathText value={detail.question.answer}/>
          <p>入力方式　{detail.question.type==='choice' ? '単一選択' : '数値入力'}</p>
          <h3>ヒント</h3>
          {detail.question.hints.map((hint,index) => <MathText key={index} prefix={String(index+1)+'：'} value={hint}/>)}
          <h3>基本解説</h3><MathText value={detail.question.explanation}/>
          <h3>詳しい解説</h3>
          {detail.question.steps.map((step,index) => <div key={index}><h4>{step.title}</h4><MathText value={step.body}/></div>)}
          {detail.question.diagram && <QuestionDiagram diagram={detail.question.diagram} phase="solution"/>}
          {detail.question.mistakes.length > 0 && <><h3>誤答</h3>{detail.question.mistakes.map((item,index) =>
            <MathText key={index} prefix={item.answer ? item.answer+'：' : undefined} value={item.explanation}/>)}</>}
          <h3>重複候補</h3>
          {detail.duplicates.length ? <ul>{detail.duplicates.map(item => <li key={item.id}>
            {duplicateLabels[item.kind]}　<button type="button" onClick={() => open(item.id)}>{item.stage_id} {item.stem}</button>
          </li>)}</ul> : <p>候補なし</p>}
          <h3>審査・改訂の履歴</h3>
          {detail.history.length ? <ol>{detail.history.map(item => <li key={item.id}>
            {new Date(item.created).toLocaleString('ja-JP')}　{item.actor}　{item.previous_status ? reviewStatusLabels[item.previous_status]+' → ' : ''}
            {reviewStatusLabels[item.status]}　{item.reason}　{item.note}　<button type="button" onClick={() => {
              void api<BankQuestion>('questions/'+encodeURIComponent(detail.id)+'?revision='+item.fingerprint)
                .then(setPreviousRevision).catch(problem => setNotice(problem.message));
            }}>{item.event} {item.fingerprint.slice(0,12)}</button>
          </li>)}</ol> : <p>まだ審査はありません。</p>}
          {previousRevision && <section aria-label="履歴の出題プレビュー">
            <h4>履歴に記録された版</h4><MathText value={previousRevision.question}/>
            {previousRevision.diagram && <QuestionDiagram diagram={previousRevision.diagram} phase="question"/>}
            {previousRevision.figure && <StudyFigureView figure={previousRevision.figure}/>}
            <MathText value={previousRevision.answer}/><MathText value={previousRevision.explanation}/>
          </section>}
        </section>}
      </div>
    </div>
  </main>;
}

export default function ServerQuestionReview() {
  const [signedIn, setSignedIn] = useState(false);
  const [key, setKey] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'local'|'supabase'>();
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const expired = () => setSignedIn(false);
    window.addEventListener('review-session-expired',expired);
    void api<{mode:'local'|'supabase'}>('login-mode',undefined,controller.signal).then(result=>setMode(result.mode)).catch(()=>{});
    void api('session',undefined,controller.signal).then(() => setSignedIn(true)).catch(() => {});
    return () => { window.removeEventListener('review-session-expired',expired); controller.abort(); };
  },[]);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try { await api('login',mode==='supabase' ? {email,password:key} : {key}); setSignedIn(true); }
    catch (problem) { setError(String(problem instanceof Error ? problem.message : problem)); }
    finally { setKey(''); }
  }
  if (signedIn) return <ReviewDashboard onLogout={async () => { await api('logout',{}); setSignedIn(false); }}/>;
  return <main style={pageStyle}>
    <h1>数のトビラ 問題審査</h1>
    <form style={{...panel,maxWidth:420}} onSubmit={event => void login(event)}>
      <h2>管理者ログイン</h2>
      {mode==='supabase' && <label style={labelStyle}>メールアドレス
        <input type="email" autoComplete="username" value={email} required onChange={event=>setEmail(event.target.value)}/>
      </label>}
      <label style={labelStyle}>{mode==='supabase' ? 'パスワード' : '管理者キー'}
        <input type="password" autoComplete="current-password" maxLength={mode==='supabase' ? 1024 : 128} required value={key}
          onChange={event => setKey(event.target.value)}/>
      </label>
      <button type="submit" disabled={!mode} style={{...button,marginTop:12}}>ログイン</button>
      <p role="status">{error}</p>
    </form>
  </main>;
}
