import { Buffer } from 'node:buffer';

const api='https://jxitjcfgavemddlbygzx.supabase.co/auth/v1';

export function createSupabaseOwnerAuth(publishableKey,isAdministratorSession) {
  if (!/^(?:sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(publishableKey ?? '')) {
    throw new Error('A publishable key for the dedicated Kazu project is required.');
  }
  async function request(path,options) {
    const response=await fetch(api+path,{
      ...options,
      headers:{apikey:publishableKey,...options.headers},
      signal:AbortSignal.timeout(8000),
      redirect:'error',
    });
    if (response.status===401 || response.status===403 || response.status===400 || response.status===422) return null;
    if (!response.ok) throw new Error('Supabase Auth could not complete the request.');
    return response.status===204 ? {} : response.json();
  }
  return {
    async login({email,password}) {
      if (typeof email!=='string' || email.length>254 || typeof password!=='string' || password.length>1024) return null;
      const result=await request('/token?grant_type=password',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password}),
      });
      const expires=result?.expires_at*1000;
      const sessionId=readSessionId(result?.access_token);
      if (!Number.isFinite(expires) || expires<=Date.now() || !result?.access_token || !result?.user?.id ||
          !sessionId || !await isAdministratorSession(result.user.id,sessionId)) return null;
      return {subject:result.user.id,role:'question_admin',providerToken:result.access_token,sessionId,expires};
    },
    async authenticate(providerToken) {
      const sessionId = readSessionId(providerToken);
      if (!sessionId) return null;
      const user = await request('/user',{headers:{Authorization:'Bearer '+providerToken}});
      if (!user?.id) return null;
      const isAdministrator = await isAdministratorSession(user.id, sessionId);
      return { subject:user.id, isAdministrator };
    },
    async validate(session) {
      const user=await request('/user',{headers:{Authorization:'Bearer '+session.providerToken}});
      return user?.id===session.subject && await isAdministratorSession(session.subject,session.sessionId);
    },
    async logout(session) {
      await request('/logout?scope=local',{method:'POST',headers:{Authorization:'Bearer '+session.providerToken}});
    },
  };
}

function readSessionId(token) {
  try {
    const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
    return typeof claims.session_id==='string' && /^[a-f0-9-]{36}$/i.test(claims.session_id) ? claims.session_id : null;
  } catch { return null; }
}
