import { stageProductionLabels, productionStatusMinimum } from '../src/domain/stageProductionStatus.ts';

const invalid=message=>Object.assign(new Error(message),{status:400});
const conflict=message=>Object.assign(new Error(message),{status:409});

export function createStageProductionService(pool) {
  async function stageProduction() {
    const sql=[
      'select p.id,p.island_id,p.is_checkpoint,p.status,p.authored_count,p.reviewed_count,',
      'p.child_test_count,p.version,p.note,p.updated_at,p.updated_by,',
      "coalesce(s.title,case when p.is_checkpoint then '確認テスト '||substring(p.id from 'checkpoint([0-9]+)$') else p.id end) as stage_title,",
      'coalesce(q.registered,0)::int as registered_count',
      'from question_catalog.stage_production p',
      'left join question_catalog.stages s on s.id=p.id',
      'left join (select stage_id,count(*)::int as registered from question_catalog.questions where active group by stage_id) q on q.stage_id=p.id',
      'order by p.island_id,p.id',
    ].join(' ');
    return (await pool.query(sql)).rows;
  }
  async function stageQuestions(stageId) {
    if (typeof stageId!=='string' || stageId.length>90 ||
        !/^[a-z0-9]+\.(?:n[0-9]{2}|x[0-9]{2}|s[0-9]{2}|forest|bridge|tower)$/.test(stageId)) {
      throw invalid('ステージIDを確認してください。');
    }
    const existing=await pool.query('select id from question_catalog.stages where id=$1',[stageId]);
    if (!existing.rows.length) throw invalid('指定されたステージがありません。');
    const {rows}=await pool.query([
      'select q.id,v.payload as question from question_catalog.questions q',
      'join question_catalog.versions v on v.fingerprint=q.fingerprint',
      'where q.stage_id=$1 and q.active order by q.id limit 101',
    ].join(' '),[stageId]);
    if (rows.length>100) throw conflict('登録問題数が100問を超えています。');
    return {stageId,questions:rows.map(row=>row.question)};
  }
  async function updateStageProduction(request,actor) {
    const {id,status,version,authored_count,reviewed_count,child_test_count,note}=request??{};
    if(typeof id!=='string'||id.length>90||!Object.hasOwn(stageProductionLabels,status)||
       !Number.isSafeInteger(version)||version<0||
       !Number.isSafeInteger(authored_count)||authored_count<0||authored_count>10000||
       !Number.isSafeInteger(reviewed_count)||reviewed_count<0||reviewed_count>authored_count||
       !Number.isSafeInteger(child_test_count)||child_test_count<0||child_test_count>10000||
       typeof note!=='string'||note.length>2000||
       authored_count<productionStatusMinimum(status)||
       (status==='creator_reviewed'&&reviewed_count<10)||
       (['final_creator_reviewed','child_tested'].includes(status)&&reviewed_count<100)||
       (status==='child_tested'&&child_test_count<1)) {
      throw invalid('制作件数・確認件数・評価状態を確認してください。');
    }
    const session=await pool.connect();
    try {
      await session.query('begin');
      const {rows:[before]}=await session.query(
        'select * from question_catalog.stage_production where id=$1 for update',[id]);
      if(!before) throw invalid('指定されたステージがありません。');
      if(before.version!==version) throw conflict('別の更新があります。再読み込みしてください。');
      if(before.status===status&&before.authored_count===authored_count&&
         before.reviewed_count===reviewed_count&&before.child_test_count===child_test_count&&before.note===note) {
        await session.query('commit');
        return {...before,changed:false};
      }
      const {rows:[updated]}=await session.query([
        'update question_catalog.stage_production set',
        'status=$2,authored_count=$3,reviewed_count=$4,child_test_count=$5,note=$6,',
        'updated_by=$7,updated_at=transaction_timestamp(),version=version+1',
        'where id=$1 returning *',
      ].join(' '),[id,status,authored_count,reviewed_count,child_test_count,note,actor]);
      await session.query([
        'insert into question_catalog.stage_production_history',
        '(stage_id,actor,previous_status,status,previous_count,authored_count,note)',
        'values ($1,$2,$3,$4,$5,$6,$7)',
      ].join(' '),[id,actor,before.status,status,before.authored_count,authored_count,note]);
      await session.query('commit');
      return {...updated,changed:true};
    } catch(error) {
      await session.query('rollback').catch(()=>{});
      throw error;
    } finally { session.release(); }
  }
  return {stageProduction,stageQuestions,updateStageProduction};
}
