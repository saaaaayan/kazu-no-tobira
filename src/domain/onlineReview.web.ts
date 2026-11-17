const backend = 'https://jxitjcfgavemddlbygzx.supabase.co';
const publicKey = 'sb_publishable_RS7TMRvjDnDhUpxlKBJ3sA_-hmDryOT';

export const onlineReview = process.env.EXPO_PUBLIC_KAZU_ONLINE_REVIEW === '1';
let token: string | undefined;

export function clearOnlineSession() {
  token = undefined;
}

function reviewFetch(path: string, accessToken: string, body?: unknown, signal?: AbortSignal) {
  const headers: Record<string, string> = { apikey: publicKey, Authorization: 'Bearer ' + accessToken };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(backend + '/functions/v1/question-admin/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(30000),
    credentials: 'omit', cache: 'no-store', redirect: 'error',
  });
}

export function onlineReviewFetch(path: string, body?: unknown, signal?: AbortSignal) {
  if (!token) return Promise.resolve(new Response('{}', { status: 401 }));
  return reviewFetch(path, token, body, signal);
}

export async function onlineReviewLogin(credentials: { email: string; password: string }) {
  const response = await fetch(backend + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: publicKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'omit', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (response.status === 429) throw new Error('少し時間をおいてから、もう一度お試しください。');
  if (!response.ok) throw new Error('メールアドレスとパスワードを確認してください。');
  const result: { access_token?: string } = await response.json();
  if (!result.access_token) throw new Error('認証情報を確認できませんでした。');
  const session = await reviewFetch('session', result.access_token);
  if (session.status === 403) throw new Error('このアカウントには管理者権限がありません。');
  if (!session.ok) throw new Error('管理者の権限確認に失敗しました。');
  const verified: { role?: string } = await session.json();
  if (verified.role !== 'question_admin') throw new Error('このアカウントには管理者権限がありません。');
  token = result.access_token;
}
