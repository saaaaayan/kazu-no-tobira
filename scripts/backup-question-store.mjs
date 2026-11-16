import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, sep } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';

const destination = process.argv[2];
if (!destination) throw new Error('Specify a new private backup directory.');
const output = resolve(destination);
const safe = relative(resolve('.question-backups'),output);
if (!safe || isAbsolute(safe) || safe==='..' || safe.startsWith('..'+sep)) {
  throw new Error('Keep backup under the ignored .question-backups directory.');
}
const [published, drafts, original] = ['public/question-banks','question-drafts','.expo/question-review-private/questions.sqlite'];
const hash = data => createHash('sha256').update(data).digest('hex');
await mkdir(resolve('.question-backups'),{recursive:true});
await mkdir(output,{mode:0o700});
await cp(published,join(output,'question-banks'),{recursive:true,errorOnExist:true,force:false});
await cp(drafts,join(output,'question-drafts'),{recursive:true,errorOnExist:true,force:false});
const sqlite = join(output,'questions.sqlite');
const db = new DatabaseSync(original,{readOnly:true});
try { await backup(db,sqlite); } finally { db.close(); }

const restored = new DatabaseSync(sqlite,{readOnly:true});
try {
  assert.equal(restored.prepare('PRAGMA quick_check').get().quick_check,'ok');
  assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
  const rows = restored.prepare('select id, stage_id, fingerprint, payload, active, status from questions').all();
  const byId = new Map(rows.map(item=>[item.id,item]));
  const sourceIds = new Set();
  const sources = [];
  for (const directory of ['question-banks','question-drafts']) {
    const files = (await readdir(join(output,directory))).filter(file=>/\.v\d+\.json$/.test(file)).sort();
    assert.ok(files.length,'Missing '+directory);
    let questions = 0;
    const filesWithHashes = [];
    for (const file of files) {
      const data = await readFile(join(output,directory,file));
      const originalData = await readFile(join(directory==='question-banks'?published:drafts,file));
      assert.equal(hash(data),hash(originalData),'File copy mismatch: '+file);
      filesWithHashes.push({ filename:file,sha256:hash(data) });
      const bank = JSON.parse(data);
      for (const q of bank.questions) {
        assert.ok(!sourceIds.has(q.id),'Duplicate question ID: '+q.id);
        sourceIds.add(q.id);
        const row=byId.get(q.id);
        assert.equal(row?.stage_id,bank.stageId,q.id);
        assert.equal(row.active,1,q.id);
        assert.equal(hash(JSON.stringify(q)),row.fingerprint,q.id);
        assert.equal(hash(row.payload),row.fingerprint,q.id);
        questions++;
      }
    }
    sources.push({ directory, files:filesWithHashes, questions });
  }
  assert.equal(rows.filter(row=>row.active).length,sourceIds.size);
  for (const row of restored.prepare('select fingerprint,payload from revisions').iterate()) {
    assert.equal(hash(row.payload),row.fingerprint,'Revision checksum mismatch');
  }
  const history = restored.prepare('select count(*) n from history').get().n;
  const versions = restored.prepare('select count(*) n from revisions').get().n;
  const statuses = restored.prepare('select status,count(*) n from questions where active=1 group by status order by status').all();
  await writeFile(join(output,'manifest.json'),JSON.stringify({
    sources, sqlite:hash(await readFile(sqlite)), history, versions, statuses,
    questionIds:rows.map(row=>({ id:row.id,stageId:row.stage_id,fingerprint:row.fingerprint,active:Boolean(row.active) }))
      .sort((a,b)=>a.id.localeCompare(b.id,'en')),
  },null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({ directory:output, sources:sources.map(s=>({ directory:s.directory, files:s.files.length, questions:s.questions })),
    sqliteQuestions:rows.length,history,versions,statuses }));
} finally { restored.close(); }
