import { createHash } from 'node:crypto';
import { allWorldStagesById,worldIslands } from '../src/domain/worldCatalog.ts';
import { inspectQuestion,questionKeys } from '../scripts/question-audit-rules.mjs';
import { playableBetaPayload } from './beta-readiness.mjs';

const schema='question_catalog';
const isObject=value=>value && typeof value==='object' && !Array.isArray(value);
const nonblank=value=>typeof value==='string' && value.trim().length>0;
const count=(value,max)=>Number.isSafeInteger(value) && value>=0 && value<=max;
const point=value=>Array.isArray(value) && value.length===2 && value.every(Number.isFinite);
const figureKinds=new Set(['countingBoard','tenFrame','transferToTen','takeAway','borrowTen','bundlesAndOnes']);
const tokens=new Set(['dot','triangle','square','empty','marked']);

function validDrawings(question) {
  const {diagram,figure,clock}=question;
  if (clock!==undefined && (!isObject(clock) || !count(clock.start,1439) || !count(clock.end,1439) ||
    typeof clock.read!=='boolean')) return false;
  if (figure!==undefined && (!isObject(figure) || !nonblank(figure.description) ||
    !Array.isArray(figure.outline) || !figure.outline.every(polygon=>Array.isArray(polygon) && polygon.length>=3 && polygon.every(point)) ||
    !Array.isArray(figure.lines) || !figure.lines.every(line=>isObject(line) && point(line.from) && point(line.to)) ||
    !Array.isArray(figure.labels) || !figure.labels.every(label=>isObject(label) && point(label.at) && nonblank(label.text)) ||
    (figure.circle!==undefined && (!isObject(figure.circle) || !point(figure.circle.center) ||
      !Number.isFinite(figure.circle.radius) || figure.circle.radius<=0)))) return false;
  if (diagram===undefined) return true;
  if (!isObject(diagram) || !figureKinds.has(diagram.kind)) return false;
  switch (diagram.kind) {
    case 'countingBoard':
      return Array.isArray(diagram.rows) && diagram.rows.length>=1 && diagram.rows.length<=10 &&
        diagram.rows.every(row=>isObject(row) && Array.isArray(row.tokens) && row.tokens.length<=30 &&
          row.tokens.every(token=>tokens.has(token)) && (row.label===undefined || typeof row.label==='string'));
    case 'tenFrame':
      return count(diagram.first,20) && count(diagram.second??0,20) && count(diagram.third??0,20) &&
        diagram.first+(diagram.second??0)+(diagram.third??0)<=20;
    case 'transferToTen':
      return count(diagram.inside,10) && count(diagram.outside,20) && diagram.inside+diagram.outside>=10;
    case 'bundlesAndOnes':
      return count(diagram.tens,10) && count(diagram.ones,9);
    case 'borrowTen':
      return count(diagram.total,19) && diagram.total>=10 && count(diagram.used,10);
    default:
      return count(diagram.total,20) && count(diagram.used,diagram.total);
  }
}

export function validateDraftBank(bank) {
  const stage=allWorldStagesById.get(bank?.stageId);
  if (!stage || bank.gradeId!==stage.gradeId || bank.islandId!==stage.gradeId ||
    !Number.isSafeInteger(bank.version) || bank.version<1 ||
    !['random','balanced',undefined].includes(bank.selection) ||
    !Array.isArray(bank.questions) || bank.questions.length<1 || bank.questions.length>100) {
    throw new Error('原稿のステージ・版・問題数を確認してください。');
  }
  const island=worldIslands.find(item=>item.id===stage.gradeId);
  const unit=island.units[stage.unitIndex];
  const ids=new Set();
  const rows=bank.questions.map((question,index)=>{
    const label='原稿の '+(index+1)+' 問目';
    if (!isObject(question) || typeof question.id!=='string' || !question.id.startsWith(stage.id+':') ||
      !/^[A-Za-z0-9._:-]{1,250}$/.test(question.id) || ids.has(question.id) ||
      ![1,2,3].includes(question.difficulty) || !nonblank(question.prompt) || !nonblank(question.hint) ||
      (question.format!==undefined && !nonblank(question.format)) ||
      typeof question.skillId!=='string' || !question.skillId.startsWith(stage.gradeId+'.') ||
      !playableBetaPayload(question) || !validDrawings(question)) {
      throw new Error(label+' のID・採点形式・ヒント・解説・図の構造を確認してください。');
    }
    ids.add(question.id);
    const audit=inspectQuestion(question);
    if (audit.issues.length) throw new Error(label+' の検査結果: '+audit.issues.join(', '));
    const payload=JSON.stringify(question);
    const keys=questionKeys(question);
    return {id:question.id,stem:question.question,format:question.format??question.type,difficulty:question.difficulty,
      has_figure:audit.illustrated,search:[question.id,island.title,island.island,stage.title,unit.title,unit.code,payload].join(' ').normalize('NFKC').toLowerCase(),
      exact:keys.exact,equivalent:keys.equivalent??null,shape:keys.shape,independent:audit.independent,
      fingerprint:createHash('sha256').update(payload).digest('hex'),payload_text:payload};
  });
  return {stageId:stage.id,version:bank.version,selection:bank.selection??'random',rows};
}

export async function intakeDraftBank(pool,bank,{write=false}={}) {
  const {stageId,version,selection,rows}=validateDraftBank(bank);
  const db=await pool.connect();
  try {
    await db.query(write?'begin':'begin isolation level repeatable read read only');
    if (write) await db.query('select pg_advisory_xact_lock(57159861)');
    const known=await db.query(`select id,kind,island_id from ${schema}.stages where id=$1`,[stageId]);
    if (known.rowCount!==1 || known.rows[0].island_id!==bank.islandId ||
      known.rows[0].kind!==allWorldStagesById.get(stageId).kind) throw new Error('原稿に対応するDBステージを確認できません。');
    const collisions=await db.query(`select id,stage_id,fingerprint,active from ${schema}.questions where id=any($1)`,[rows.map(row=>row.id)]);
    const existing=new Map(collisions.rows.map(row=>[row.id,row]));
    const newRows=rows.filter(row=>{
      const old=existing.get(row.id);
      if (!old) return true;
      if (old.fingerprint!==row.fingerprint || old.stage_id!==stageId || !old.active) throw new Error('既存IDとの競合: '+row.id);
      return false;
    });
    const shapes=[];
    for (const [index,row] of newRows.entries()) {
      const duplicate=newRows.slice(0,index).find(other=>row.exact===other.exact || (row.equivalent && row.equivalent===other.equivalent));
      const saved=await db.query(`select id from ${schema}.questions
        where active and (md5(exact)=md5($1) and exact=$1 or md5(equivalent)=md5($2) and equivalent=$2)
        order by id limit 1`,[row.exact,row.equivalent]);
      if (duplicate || saved.rowCount) throw new Error('重複候補を確認してください: '+row.id+' / '+(duplicate?.id??saved.rows[0].id));
      const sameShape=await db.query(`select id from ${schema}.questions
        where active and md5(shape)=md5($1) and shape=$1 order by id limit 5`,[row.shape]);
      const candidates=[...newRows.slice(0,index).filter(other=>other.shape===row.shape).map(other=>other.id),
        ...sameShape.rows.map(other=>other.id)];
      if (candidates.length) shapes.push({id:row.id,candidates:candidates.slice(0,5)});
    }
    if (write && newRows.length) {
      await db.query(`insert into ${schema}.banks (stage_id,version,selection,source)
        values ($1,$2,$3,'draft') on conflict do nothing`,[stageId,version,selection]);
      for (const row of newRows) {
        await db.query(`insert into ${schema}.versions (fingerprint,payload_text) values ($1,$2) on conflict do nothing`,[row.fingerprint,row.payload_text]);
        await db.query(`insert into ${schema}.questions
          (id,stage_id,stem,format,difficulty,has_figure,search,exact,equivalent,shape,active,status,fingerprint,created_at,updated_at)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,'unreviewed',$11,transaction_timestamp(),transaction_timestamp())`,
        [row.id,stageId,row.stem,row.format,row.difficulty,row.has_figure,row.search,row.exact,row.equivalent,row.shape,row.fingerprint]);
        await db.query(`insert into ${schema}.history (question_id,created,actor,event,status,note,fingerprint)
          values ($1,transaction_timestamp(),'draft-intake','registered','unreviewed','',$2)`,[row.id,row.fingerprint]);
      }
    }
    await db.query('commit');
    return {stageId,checked:rows.length,independentlyChecked:rows.filter(row=>row.independent).length,
      unchanged:rows.length-newRows.length,newCandidates:newRows.length,inserted:write?newRows.length:0,structuralCandidates:shapes};
  } catch (error) {
    await db.query('rollback').catch(()=>{});
    throw error;
  } finally { db.release(); }
}
