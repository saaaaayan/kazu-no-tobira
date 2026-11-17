import { inspectQuestion } from '../scripts/question-audit-rules.mjs';
import { diagnoseQuestion, diagnosticSummary } from './question-review-diagnostics.mjs';
import { rejectReasons, reviewStatusLabels } from '../src/domain/reviewAdmin.ts';

const ns='question_catalog';
const from=`from ${ns}.questions q join ${ns}.stages s on s.id=q.stage_id`;
const invalid=message=>Object.assign(new Error(message),{status:400});
const conflict=message=>Object.assign(new Error(message),{status:409});
const duplicates=`exists (select 1 from ${ns}.questions d where d.active and d.id<>q.id and (
  (md5(d.exact)=md5(q.exact) and d.exact=q.exact)
  or (md5(d.equivalent)=md5(q.equivalent) and d.equivalent=q.equivalent and d.exact<>q.exact)
  or (md5(d.shape)=md5(q.shape) and d.shape=q.shape and d.exact<>q.exact)
))`;

function filter(params) {
  const terms=['q.active'], values=[];
  for (const [name,attribute] of Object.entries({
    island:'s.island_id',unit:'s.unit',stage_id:'q.stage_id',kind:'s.kind',skill:'s.skill',
    difficulty:'q.difficulty',format:'q.format',status:'q.status',has_figure:'q.has_figure',
  })) {
    const value=params.get(name);
    if (!value) continue;
    if (name==='status' && !Object.hasOwn(reviewStatusLabels,value)) throw invalid('審査状態を確認してください。');
    if (name==='difficulty' && !/^[1-3]$/.test(value)) throw invalid('難易度を確認してください。');
    if (name==='has_figure' && !/^[01]$/.test(value)) throw invalid('図の指定を確認してください。');
    values.push(name==='has_figure' ? value==='1' : value);
    terms.push(attribute+'=$'+values.length);
  }
  const query=params.get('q')?.normalize('NFKC').toLowerCase().trim().slice(0,200);
  if (query) {
    values.push('%'+query.replace(/[\\_%]/g,'\\$&')+'%');
    terms.push('q.search like $'+values.length);
  }
  if (params.get('duplicates')==='1') terms.push(duplicates);
  return {where:'where '+terms.join(' and '), values};
}

export function createSupabaseQuestionReview(pool) {
  async function list(params) {
    const {where,values}=filter(params);
    const page=Math.max(0,Math.min(10400,Number.parseInt(params.get('page'),10)||0));
    const result=await pool.query(`
      select page.*,v.payload from (
        select q.id,q.stage_id,s.island_id as island,s.unit,s.kind,s.skill,q.difficulty,q.format,q.has_figure,
          q.stem,q.status,q.version,q.fingerprint,count(*) over()::int as matched
        ${from} ${where} order by q.stage_id,q.id limit 20 offset $${values.length+1}
      ) page join ${ns}.versions v on v.fingerprint=page.fingerprint order by page.stage_id,page.id
    `,[...values,page*20]);
    const total=result.rows[0]?.matched ?? (page ? (await pool.query(`select count(*)::int as n ${from} ${where}`,values)).rows[0].n : 0);
    const {rows:counts}=await pool.query(`select status,count(*)::int as n from ${ns}.questions where active group by status`);
    return {rows:result.rows.map(({matched,payload,fingerprint,...row})=>({
      ...row,diagnostics:diagnosticSummary(diagnoseQuestion(row.stage_id,payload)),
    })),total,page,counts:Object.fromEntries(counts.map(row=>[row.status,row.n]))};
  }

  async function detail(id) {
    const {rows:[row]}=await pool.query(`select q.*,v.payload as question from ${ns}.questions q
      join ${ns}.versions v on q.fingerprint=v.fingerprint where q.active and q.id=$1`,[id]);
    if (!row) return null;
    const history=await pool.query(`select id,created,actor,event,previous_status,status,note,reason,fingerprint
        from ${ns}.history where question_id=$1 order by id desc limit 100`,[id]);
    const candidates=await pool.query(`select id,stage_id,stem,
        case when exact=$2 then 'exact' when equivalent=$3 then 'equivalent' else 'structural' end as kind
        from ${ns}.questions where active and id<>$1 and (
          (md5(exact)=md5($2) and exact=$2)
          or (md5(equivalent)=md5($3) and equivalent=$3)
          or (md5(shape)=md5($4) and shape=$4)) order by kind,id limit 50`,[id,row.exact,row.equivalent,row.shape]);
    return {id,stageId:row.stage_id,status:row.status,version:row.version,note:row.note,reason:row.reason,
      question:row.question,history:history.rows,duplicates:candidates.rows,diagnostics:diagnoseQuestion(row.stage_id,row.question)};
  }

  async function historicalRevision(id,fingerprint) {
    return (await pool.query(`select payload from ${ns}.versions v where fingerprint=$2 and (
      exists(select 1 from ${ns}.questions q where q.id=$1 and q.fingerprint=v.fingerprint)
      or exists(select 1 from ${ns}.history h where h.question_id=$1 and h.fingerprint=v.fingerprint))`,[id,fingerprint])).rows[0]?.payload ?? null;
  }

  async function review({items,status,reason,note},actor) {
    if (!Object.hasOwn(reviewStatusLabels,status) || !Array.isArray(items) || !items.length || items.length>100 ||
        !items.every(item=>typeof item?.id==='string' && Number.isSafeInteger(item.version)) ||
        new Set(items.map(item=>item.id)).size!==items.length ||
        typeof note!=='string' || note.length>10000 ||
        (status==='rejected' && !rejectReasons.includes(reason))) throw invalid('審査内容を確認してください。');
    const session=await pool.connect();
    try {
      await session.query('begin');
      const byId=new Map(items.map(item=>[item.id,item.version]));
      const {rows}=await session.query(`select q.id,q.status,q.version,q.fingerprint,v.payload
        from ${ns}.questions q join ${ns}.versions v on v.fingerprint=q.fingerprint
        where q.active and q.id=any($1::text[]) order by q.id for update of q`,[[...byId.keys()]]);
      if (rows.length!==items.length || rows.some(row=>row.version!==byId.get(row.id))) {
        throw conflict('他の更新が保存されました。読み込み直してからやり直してください。');
      }
      for (const row of rows) {
        if (status==='ready' && (row.status!=='verified' || inspectQuestion(row.payload).issues.length)) {
          throw conflict('確認済みへの変更と自動検査の解決が必要です。');
        }
        const rejection=status==='rejected'?reason:null;
        await session.query(`update ${ns}.questions set status=$2, reason=$3, note=$4, version=version+1,
          updated_at=transaction_timestamp() where id=$1`,[row.id,status,rejection,note]);
        await session.query(`insert into ${ns}.history (question_id,created,actor,event,previous_status,status,note,reason,fingerprint)
          values ($1,transaction_timestamp(),$2,'review',$3,$4,$5,$6,$7)`,[row.id,actor,row.status,status,note,rejection,row.fingerprint]);
      }
      await session.query('commit');
      return {updated:items.length};
    } catch (error) {
      await session.query('rollback').catch(()=>{});
      throw error;
    } finally { session.release(); }
  }

  async function* exportRows(params) {
    const {where,values}=filter(params);
    let last='';
    for (;;) {
      const {rows}=await pool.query(`select q.id,q.stage_id,s.island_id as island,s.unit,q.difficulty,
        q.format,q.stem,q.status,q.note,q.reason,v.payload_text as payload
        ${from} join ${ns}.versions v on v.fingerprint=q.fingerprint
        ${where} and q.id>$${values.length+1} order by q.id limit 500`,[...values,last]);
      if (!rows.length) break;
      yield* rows;
      last=rows.at(-1).id;
    }
  }

  async function stageTotals() {
    const {rows}=await pool.query(`select s.id,s.island_id as island,q.status,count(q.id)::int as n
      from ${ns}.stages s left join ${ns}.questions q on q.stage_id=s.id and q.active
      group by s.id,s.island_id,s.position,q.status order by s.island_id,s.position`);
    const report=new Map();
    for (const row of rows) {
      if (!report.has(row.id)) report.set(row.id,{id:row.id,island:row.island,target:100,registered:0,states:{}});
      const stage=report.get(row.id);
      if (row.status) stage.states[row.status]=row.n;
      stage.registered+=row.n;
    }
    return [...report.values()];
  }

  return {list,detail,historicalRevision,review,exportRows,stageTotals,
    async isAdministratorSession(id,sessionId) {
      return (await pool.query(`select ${ns}.active_owner_session($1,$2) as allowed`,[id,sessionId])).rows[0].allowed;
    },
  };
}
