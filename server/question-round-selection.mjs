const error=(status,message)=>Object.assign(new Error(message),{status});

const source=`from question_catalog.questions q
  join question_catalog.stages s on s.id=q.stage_id
  join question_catalog.banks b on b.stage_id=q.stage_id
  join question_catalog.versions v on v.fingerprint=q.fingerprint
  where q.stage_id=$1 and q.active
  and (s.access='free' or ($3::boolean and s.access='premium'))
  and (q.status='ready' or ($2::boolean and b.source='existing' and q.status in ('unreviewed','verified')))`;

export async function questionDeck(pool,stageId,{preview=false,premium=false}={}) {
  if (typeof stageId!=='string' || !/^[a-z0-9]+\.[a-z0-9]+$/.test(stageId)) throw error(400,'ステージの指定を確認してください。');
  const {rows}=await pool.query(`select b.version,b.selection,q.id,v.payload->>'topic' as topic
    ${source} order by q.id limit 100`,[stageId,preview,premium]);
  // A round is always 10 questions. If a review removes cards, retire the partial last round.
  const count=rows.length-rows.length%10;
  if (!count) throw error(404,'このステージの出題問題は準備中です。');
  return {version:rows[0].version,selection:rows[0].selection,complete:count===100,
    cards:rows.slice(0,count).map(({id,topic})=>({id,topic:topic ?? ''}))};
}

export async function questionRound(pool,stageId,ids,{preview=false,premium=false}={}) {
  if (typeof stageId!=='string' || !/^[a-z0-9]+\.[a-z0-9]+$/.test(stageId) ||
      !Array.isArray(ids) || ids.length!==10 || new Set(ids).size!==ids.length ||
      !ids.every(id=>typeof id==='string' && id.startsWith(stageId+':') && id.length<250)) {
    throw error(400,'ステージと問題の指定を確認してください。');
  }
  const {rows}=await pool.query(`select v.payload ${source}
    and q.id=any($4::text[]) order by q.difficulty,array_position($4::text[],q.id)`,[stageId,preview,premium,ids]);
  if (rows.length!==10) throw error(409,'出題リストが更新されました。もう一度お試しください。');
  return rows.map(({payload})=>payload);
}
