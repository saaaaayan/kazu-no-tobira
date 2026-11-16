const api='https://jxitjcfgavemddlbygzx.supabase.co/auth/v1';

export function createSupabaseOwnerAuth(publishableKey,isAdministrator) {
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey ?? '')) {
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
    return response.json();
  }
  return {
    async login({email,password}) {
      if (typeof email!=='string' || email.length>254 || typeof password!=='string' || password.length>1024) return null;
      const result=await request('/token?grant_type=password',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password}),
      });
      const expires=result?.expires_at*1000;
      if (!Number.isFinite(expires) || expires<=Date.now() || !result?.access_token || !result?.user?.id ||
          !await isAdministrator(result.user.id)) return null;
      return {subject:result.user.id,role:'question_admin',providerToken:result.access_token,expires};
    },
    async validate(session) {
      const user=await request('/user',{headers:{Authorization:'Bearer '+session.providerToken}});
      return user?.id===session.subject && await isAdministrator(session.subject);
    },
  };
}
