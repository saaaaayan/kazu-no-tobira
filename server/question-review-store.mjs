import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allWorldStagesById, worldIslands } from '../src/domain/worldCatalog.ts';
import { rejectReasons, reviewStatusLabels } from '../src/domain/reviewAdmin.ts';
import { inspectQuestion, questionKeys } from '../scripts/question-audit-rules.mjs';

const revision = value => createHash('sha256').update(value).digest('hex');
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase();
const islands = new Map(worldIslands.map(island => [island.id, island]));
const badRequest = message => Object.assign(new Error(message), { status: 400 });
const conflict = message => Object.assign(new Error(message), { status: 409 });

export function openQuestionReviewStore(path, bankDirectory) {
  const directory = bankDirectory instanceof URL ? fileURLToPath(bankDirectory) : bankDirectory;
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys=ON;
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY, stage_id TEXT NOT NULL, island TEXT NOT NULL, unit TEXT NOT NULL,
      kind TEXT NOT NULL, skill TEXT NOT NULL, difficulty TEXT NOT NULL, format TEXT NOT NULL,
      has_figure INTEGER NOT NULL, search TEXT NOT NULL, stem TEXT NOT NULL, exact TEXT NOT NULL,
      equivalent TEXT, shape TEXT, fingerprint TEXT NOT NULL, payload TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'unreviewed',
      note TEXT NOT NULL DEFAULT '', reason TEXT, version INTEGER NOT NULL DEFAULT 0
    ) STRICT;
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questions(id),
      created TEXT NOT NULL, actor TEXT NOT NULL, event TEXT NOT NULL,
      previous_status TEXT, status TEXT NOT NULL, note TEXT NOT NULL, reason TEXT, fingerprint TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS revisions (
      fingerprint TEXT PRIMARY KEY, payload TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS questions_stage ON questions(active, stage_id, status, id);
    CREATE INDEX IF NOT EXISTS questions_island ON questions(active, island, unit, id);
    CREATE INDEX IF NOT EXISTS questions_exact ON questions(active, exact);
    CREATE INDEX IF NOT EXISTS questions_equivalent ON questions(active, equivalent);
    CREATE INDEX IF NOT EXISTS questions_shape ON questions(active, shape);
    CREATE INDEX IF NOT EXISTS history_question ON history(question_id, id DESC);
  `);
  const current = db.prepare('SELECT * FROM questions WHERE id = ?');
  const appendHistory = db.prepare(`
    INSERT INTO history(question_id, created, actor, event, previous_status, status, note, reason, fingerprint)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  function transaction(run) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = run();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function importBanks() {
    const files = readdirSync(directory).filter(file => /\.v\d+\.json$/.test(file)).sort();
    if (!files.length) throw new Error('専用問題バンクが見つかりません。');
    const banks = new Map();
    for (const file of files) {
      const bank = JSON.parse(readFileSync(join(directory, file), 'utf8'));
      const stage = allWorldStagesById.get(bank.stageId);
      if (!stage || stage.gradeId !== bank.gradeId || bank.islandId !== stage.gradeId ||
          !Number.isSafeInteger(bank.version) || bank.version < 1 ||
          file !== bank.stageId + '.v' + bank.version + '.json' ||
          !Array.isArray(bank.questions) || bank.questions.length > 100) {
        throw new Error('Invalid bank: ' + file);
      }
      if (!banks.has(bank.stageId) || banks.get(bank.stageId).version < bank.version) banks.set(bank.stageId, bank);
    }
    const upsert = db.prepare(`
      INSERT INTO questions(id,stage_id,island,unit,kind,skill,difficulty,format,has_figure,search,stem,exact,equivalent,shape,fingerprint,payload)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET stage_id=excluded.stage_id,island=excluded.island,unit=excluded.unit,
        kind=excluded.kind,skill=excluded.skill,difficulty=excluded.difficulty,format=excluded.format,has_figure=excluded.has_figure,
        search=excluded.search,stem=excluded.stem,exact=excluded.exact,equivalent=excluded.equivalent,shape=excluded.shape,
        payload=excluded.payload,fingerprint=excluded.fingerprint,active=1
    `);
    const saveRevision = db.prepare('INSERT OR IGNORE INTO revisions VALUES (?, ?)');
    const reset = db.prepare("UPDATE questions SET status='unreviewed', version=version+1, reason=NULL WHERE id=?");
    return transaction(() => {
      const ids = new Set();
      const previouslyActive = db.prepare('SELECT id FROM questions WHERE active=1').all();
      for (const bank of banks.values()) {
        const stage = allWorldStagesById.get(bank.stageId);
        const island = islands.get(stage.gradeId);
        const unit = island.units[stage.unitIndex];
        for (const question of bank.questions) {
          if (!question.id?.startsWith(stage.id + ':') || ids.has(question.id) ||
              typeof question.question !== 'string' || typeof question.answer !== 'string') {
            throw new Error('Invalid or duplicated question ID: ' + question.id);
          }
          ids.add(question.id);
          const payload = JSON.stringify(question);
          const fingerprint = revision(payload);
          const before = current.get(question.id);
          if (before?.fingerprint === fingerprint && before.active) continue;
          const keys = questionKeys(question);
          const inspection = inspectQuestion(question);
          const searchText = [question.id, island.title, island.island, stage.title, unit.title, unit.code, payload].map(normalize).join(' ');
          upsert.run(question.id,stage.id,stage.gradeId,unit.code,stage.kind,stage.family,String(question.difficulty),
            question.format ?? question.type, Number(inspection.illustrated),searchText,question.question,
            keys.exact,keys.equivalent ?? null,keys.shape ?? null,fingerprint,payload);
          saveRevision.run(fingerprint,payload);
          if (before) {
            reset.run(question.id);
            appendHistory.run(question.id,new Date().toISOString(),'bank-import','revision',before.status,'unreviewed',
              before.note,null,fingerprint);
          } else {
            appendHistory.run(question.id,new Date().toISOString(),'bank-import','registered',null,'unreviewed','',null,fingerprint);
          }
        }
      }
      const retire = db.prepare("UPDATE questions SET active=0, status='unreviewed', version=version+1, reason=NULL WHERE id=?");
      for (const row of previouslyActive) {
        if (ids.has(row.id)) continue;
        const before = current.get(row.id);
        retire.run(row.id);
        appendHistory.run(row.id,new Date().toISOString(),'bank-import','retired',before.status,'unreviewed',
          before.note,null,before.fingerprint);
      }
      return ids.size;
    });
  }

  const similar = `(EXISTS (SELECT 1 FROM questions d WHERE d.active=1 AND d.id<>q.id AND d.exact=q.exact)
    OR EXISTS (SELECT 1 FROM questions d WHERE d.active=1 AND d.id<>q.id AND d.equivalent=q.equivalent)
    OR EXISTS (SELECT 1 FROM questions d WHERE d.active=1 AND d.id<>q.id AND d.shape=q.shape))`;

  function filter(params) {
    const terms = ['q.active=1'];
    const values = [];
    for (const column of ['island','unit','stage_id','kind','skill','difficulty','format','status','has_figure']) {
      const value = params.get(column);
      if (!value) continue;
      terms.push('q.' + column + '=?');
      values.push(value);
    }
    const query = normalize(params.get('q')).trim().slice(0,200);
    if (query) { terms.push('instr(q.search, ?) > 0'); values.push(query); }
    if (params.get('duplicates') === '1') terms.push(similar);
    return { source: 'FROM questions q WHERE ' + terms.join(' AND '), values };
  }

  function list(params) {
    const { source, values } = filter(params);
    const page = Math.max(0, Math.min(10400, Number.parseInt(params.get('page'),10) || 0));
    const total = db.prepare('SELECT count(*) AS n ' + source).get(...values).n;
    const rows = db.prepare(`SELECT id, stage_id, island, unit, kind, skill, difficulty, format, has_figure,
      stem,status,version ${source} ORDER BY stage_id,id LIMIT 20 OFFSET ?`).all(...values,page*20);
    const counts = db.prepare('SELECT status,count(*) AS n FROM questions WHERE active=1 GROUP BY status').all();
    return { rows,total,page,counts:Object.fromEntries(counts.map(row => [row.status,row.n])) };
  }

  function detail(id) {
    const row = current.get(id);
    if (!row?.active) return null;
    const history = db.prepare(`SELECT id,created,actor,event,previous_status,status,note,reason,fingerprint
      FROM history WHERE question_id=? ORDER BY id DESC LIMIT 100`).all(id);
    const duplicates = db.prepare(`
      SELECT id,stage_id,stem,CASE WHEN exact=? THEN 'exact' WHEN equivalent=? THEN 'equivalent' ELSE 'structural' END AS kind
      FROM questions WHERE active=1 AND id<>? AND (exact=? OR equivalent=? OR shape=?) ORDER BY kind,id LIMIT 50
    `).all(row.exact,row.equivalent,id,row.exact,row.equivalent,row.shape);
    return { id,stageId:row.stage_id,status:row.status,version:row.version,note:row.note,reason:row.reason,
      question:JSON.parse(row.payload),history,duplicates };
  }

  function review({ items, status, reason, note }, actor) {
    if (!Object.hasOwn(reviewStatusLabels,status) || !Array.isArray(items) || !items.length || items.length>100 ||
        !items.every(item => typeof item?.id === 'string' && Number.isSafeInteger(item.version)) ||
        new Set(items.map(item => item.id)).size !== items.length ||
        typeof note !== 'string' || note.length>10000 ||
        (status==='rejected' && !rejectReasons.includes(reason))) throw badRequest('審査内容を確認してください。');
    const update = db.prepare('UPDATE questions SET status=?,note=?,reason=?,version=version+1 WHERE id=?');
    return transaction(() => {
      for (const item of items) {
        const before = current.get(item.id);
        if (!before?.active || before.version!==item.version) throw conflict('他の更新が保存されました。更新してからやり直してください。');
        if (status==='ready' && (before.status!=='verified' || inspectQuestion(JSON.parse(before.payload)).issues.length)) {
          throw conflict('確認済みへの変更と自動検査の解決が必要です。');
        }
        const rejectReason = status==='rejected' ? reason : null;
        update.run(status,note,rejectReason,item.id);
        appendHistory.run(item.id,new Date().toISOString(),actor,'review',before.status,status,note,rejectReason,before.fingerprint);
      }
      return { updated:items.length };
    });
  }

  function* exportRows(params) {
    const { source, values } = filter(params);
    yield* db.prepare(`SELECT id,stage_id,island,unit,difficulty,format,stem,status,note,reason,payload
      ${source} ORDER BY stage_id,id`).iterate(...values);
  }

  function historicalRevision(id, fingerprint) {
    const row = db.prepare(`
      SELECT revisions.payload FROM revisions
      WHERE fingerprint=?
      AND (EXISTS(SELECT 1 FROM questions WHERE id=? AND fingerprint=revisions.fingerprint)
        OR EXISTS(SELECT 1 FROM history WHERE question_id=? AND fingerprint=revisions.fingerprint))
    `).get(fingerprint,id,id);
    return row ? JSON.parse(row.payload) : null;
  }

  function stageTotals() {
    const rows = db.prepare('SELECT stage_id,status,count(*) AS n FROM questions WHERE active=1 GROUP BY stage_id,status').all();
    const counts = new Map();
    for (const row of rows) {
      if (!counts.has(row.stage_id)) counts.set(row.stage_id,{});
      counts.get(row.stage_id)[row.status] = row.n;
    }
    return [...allWorldStagesById.values()].map(stage => {
      const states = counts.get(stage.id) ?? {};
      const registered = Object.values(states).reduce((total,n) => total+n,0);
      return { id:stage.id,island:stage.gradeId,target:100,registered,states };
    });
  }

  // Select only currently reviewed material. The caller must establish access on the server.
  const eligible = db.prepare("SELECT payload FROM questions WHERE stage_id=? AND active=1 AND status='ready' ORDER BY id");
  return {
    db, importBanks, list, detail, review, exportRows, stageTotals, historicalRevision,
    readyQuestions: stageId => eligible.all(stageId).map(row => JSON.parse(row.payload)),
  };
}
