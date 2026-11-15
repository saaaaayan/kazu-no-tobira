import { freeAccess, type Entitlement } from './accessPlan.ts';

export async function readServerEntitlement(endpoint: string | undefined, signal: AbortSignal, authorization?: string): Promise<Entitlement> {
  if (!endpoint || !endpoint.startsWith('https://')) return freeAccess;
  try {
    const response = await fetch(endpoint, {
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal,
      headers: authorization ? { Authorization: authorization } : undefined,
    });
    if (!response.ok) return freeAccess;
    const entitlement: unknown = await response.json();
    if (typeof entitlement !== 'object' || entitlement === null ||
        !('premium' in entitlement) || entitlement.premium !== true ||
        !('expiresAt' in entitlement) || typeof entitlement.expiresAt !== 'string') return freeAccess;
    const verifiedUntil = Math.min(Date.parse(entitlement.expiresAt), Date.now() + 5 * 60_000);
    return verifiedUntil > Date.now() ? { plan: 'premium', verifiedUntil } : freeAccess;
  } catch {
    return freeAccess;
  }
}
