const origin = 'https://saaaaayan.github.io';
const base = '/question-admin/';
const bodyLimit = 64 * 1024;
const fail = (status, message) => Object.assign(new Error(message), { status });

async function readJson(request) {
  if (request.headers.get('content-type') !== 'application/json') throw fail(415, 'JSON が必要です。');
  if (Number(request.headers.get('content-length')) > bodyLimit) throw fail(413, 'データが大きすぎます。');
  const reader = request.body?.getReader();
  if (!reader) throw fail(400, '入力を確認してください。');
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > bodyLimit) {
      await reader.cancel();
      throw fail(413, 'データが大きすぎます。');
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    const body = JSON.parse(text + decoder.decode());
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw fail(400, '入力を確認してください。');
  }
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

function exportQuestions(store, params, format, headers) {
  const csv = format === 'csv';
  const columns = ['id','stage_id','island','unit','difficulty','format','stem','status','note','reason','payload'];
  const rows = store.exportRows(params);
  const encoder = new TextEncoder();
  let first = true;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(csv ? '\uFEFF' + columns.join(',') + '\r\n' : '['));
    },
    async pull(controller) {
      const { done, value } = await rows.next();
      if (done) {
        if (!csv) controller.enqueue(encoder.encode(']\n'));
        controller.close();
        return;
      }
      const { payload, ...row } = value;
      const line = csv ? [...columns.slice(0, -1).map(key => csvCell(row[key])), csvCell(payload)].join(',') + '\r\n'
        : (first ? '' : ',') + JSON.stringify({ ...row, question: JSON.parse(payload) });
      first = false;
      controller.enqueue(encoder.encode(line));
    },
    async cancel() { await rows.return?.(); },
  });
  headers.set('Content-Type', csv ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8');
  headers.set('Content-Disposition', 'attachment; filename="kazu-question-review.' + format + '"');
  return new Response(stream, { headers });
}

export function onlineQuestionReview({ store, auth }) {
  return async request => {
    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Type': 'application/json; charset=utf-8',
      Vary: 'Origin',
    });
    const json = (status, data) => new Response(JSON.stringify(data), { status, headers });
    const requestOrigin = request.headers.get('origin');
    if (requestOrigin && requestOrigin !== origin) return json(403, { error: '送信元を確認できません。' });
    if (requestOrigin === origin) headers.set('Access-Control-Allow-Origin', origin);
    if (request.method === 'OPTIONS') {
      if (requestOrigin !== origin) return json(403, { error: '送信元を確認できません。' });
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type');
      return new Response(null, { status: 204, headers });
    }
    if (!['GET', 'POST'].includes(request.method)) return json(405, { error: '対応していない操作です。' });
    try {
      const token = request.headers.get('authorization')?.match(/^Bearer ([\w.-]{1,8192})$/i)?.[1];
      if (!token) throw fail(401, '管理者ログインが必要です。');
      const identity = await auth.authenticate(token);
      if (!identity) throw fail(401, '管理者ログインが必要です。');
      if (!identity.isAdministrator) throw fail(403, '有効な管理者権限が必要です。');

      const url = new URL(request.url);
      const path = url.pathname.split(base)[1];
      const params = url.searchParams;
      if (request.method === 'GET') {
        if (path === 'session') return json(200, { role: 'question_admin' });
        if (path === 'questions') return json(200, await store.list(params));
        if (path === 'stages') return json(200, await store.stageTotals());
        if (path === 'preschool-model') return json(200, await store.preschoolModelPreview());
        if (path === 'export.csv' || path === 'export.json') {
          return exportQuestions(store, params, path.slice(7), headers);
        }
        if (path?.startsWith('questions/')) {
          const id = decodeURIComponent(path.slice(10));
          const revision = params.get('revision');
          const value = await (revision ? store.historicalRevision(id, revision) : store.detail(id));
          if (value) return json(200, value);
        }
      } else {
        if (path === 'logout') {
          await auth.logout({ providerToken: token });
          return json(200, { signedOut: true });
        }
        if (path === 'reviews') return json(200, await store.review(await readJson(request), identity.subject));
        if (path === 'revisions') return json(200, await store.editQuestion(await readJson(request), identity.subject));
      }
      throw fail(404, 'ページが見つかりません。');
    } catch (problem) {
      if (!problem.status) console.error('Online question review request failed:', problem.code ?? problem.name);
      return json(problem.status ?? 500, { error: problem.status ? problem.message : '審査サーバーの処理に失敗しました。' });
    }
  };
}
