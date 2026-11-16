import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { openSupabasePool } from '../server/supabase-postgres.mjs';
import { worldIslands } from '../src/domain/worldCatalog.ts';
import { stageAccessPlan } from '../src/domain/accessPlan.ts';

const ns='question_catalog';
const sortRows = rows => rows.slice().sort((a,b)=>String(a[Object.keys(a)[0]]).localeCompare(String(b[Object.keys(b)[0]]),'en'));
const hash = value => createHash('sha256').update(value).digest('hex');
const iso = value => new Date(value).toISOString();
function confirmHash(buffer, checksum, label) { assert.equal(hash(buffer),checksum,label); }

async function readSnapshot(directory) {
  const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
  const sqlite=join(directory,'questions.sqlite');
  confirmHash(await readFile(sqlite),manifest.sqlite,'Backup database file checksum');
  const db=new DatabaseSync(sqlite,{readOnly:true});
  try {
    const banks=[];
    for (const [source,dir] of [['existing','question-banks'],['draft','question-drafts']]) {
      for (const file of manifest.sources.find(item=>item.directory===dir).files) {
        const bytes=await readFile(join(directory,dir,file.filename));
        confirmHash(bytes,file.sha256,file.filename);
        const bank=JSON.parse(bytes);
        banks.push({stage_id:bank.stageId,version:bank.version,selection:bank.selection??'random',source});
      }
    }
    const islands=worldIslands.map((item,position)=>({id:item.id,title:item.title,name:item.island,position}));
    const stages=worldIslands.flatMap(island=>island.stages.map(stage=>({
      id:stage.id,island_id:island.id,title:stage.title,position:stage.order,
      unit:island.units[stage.unitIndex].code,skill:stage.family,kind:stage.kind,
      access:stageAccessPlan(stage),difficulty:stage.kind==='normal'?1:stage.kind==='extra'?2:3,
    })));
    const versions=db.prepare('select fingerprint,payload as payload_text from revisions').all();
    const questions=db.prepare(`
      select q.id,q.stage_id,q.stem,q.format,q.difficulty,q.has_figure,q.search,q.exact,q.equivalent,q.shape,
        q.active,q.status,q.reason,q.note,q.version,q.fingerprint,t.created_at,t.updated_at
      from questions q join (
        select question_id,min(created) as created_at,max(created) as updated_at from history group by question_id
      ) t on t.question_id=q.id
    `).all().map(row=>({
      ...row,difficulty:Number(row.difficulty),has_figure:Boolean(row.has_figure),active:Boolean(row.active),
      created_at:iso(row.created_at),updated_at:iso(row.updated_at),
    }));
    const history=db.prepare('select id,question_id,created,actor,event,previous_status,status,note,reason,fingerprint from history').all()
      .map(row=>({...row,created:iso(row.created)}));
    assert.equal(questions.length,manifest.questionIds.length,'Rows without history');
    assert.equal(history.length,manifest.history);
    assert.equal(versions.length,manifest.versions);
    return {islands,stages,banks,versions,questions,history};
  } finally { db.close(); }
}

export async function reconcileSnapshot(pool,snapshot,{write}) {
  const session=await pool.connect();
  try {
    await session.query(write ? 'begin isolation level repeatable read' : 'begin isolation level repeatable read read only');
    const output={};
    for (const [table,records] of Object.entries(snapshot)) {
      const columns=Object.keys(records[0]);
      const list=columns.join(',');
      let inserted=0;
      if (write) {
        for (let offset=0;offset<records.length;offset+=100) {
          const query=`insert into ${ns}.${table} (${list}) select ${list}
            from jsonb_populate_recordset(null::${ns}.${table},$1::jsonb) on conflict do nothing`;
          inserted+=(await session.query(query,[JSON.stringify(records.slice(offset,offset+100))])).rowCount;
        }
      }
      const {rows}=await session.query(`select ${list} from ${ns}.${table}`);
      const normalized=rows.map(row=>Object.fromEntries(columns.map(key=>[
        key,row[key] instanceof Date ? iso(row[key]) : key==='id' && table==='history' ? Number(row[key]) : row[key],
      ])));
      const expected=sortRows(records);
      const actual=sortRows(normalized);
      assert.equal(actual.length,expected.length,table+' row count');
      for (let i=0;i<expected.length;i++) {
        assert.ok(JSON.stringify(actual[i])===JSON.stringify(expected[i]),table+' differs at '+expected[i][columns[0]]);
      }
      output[table]={ rows:actual.length,inserted,sha256:hash(JSON.stringify(actual)) };
    }
    await session.query('commit');
    return output;
  } catch (error) {
    await session.query('rollback').catch(()=>{});
    throw error;
  } finally { session.release(); }
}

const directory=process.argv[2];
const operation=process.argv[3];
if (!directory || !['--import','--verify'].includes(operation)) {
  throw new Error('Specify a private backup directory and --import or --verify.');
}
const location=resolve(directory);
const pool=openSupabasePool(operation==='--import'?'svc_kazu_import':'svc_kazu_review');
try {
  const snapshot=await readSnapshot(location);
  const report=await reconcileSnapshot(pool,snapshot,{write:operation==='--import'});
  await writeFile(join(location,operation==='--import'?'supabase-import.json':'supabase-verify.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
} finally { await pool.end(); }
