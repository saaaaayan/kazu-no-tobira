import type { BankQuestion } from './questionBank';

export type RemoteDeck = {
  version: number;
  selection: 'random'|'balanced';
  cards: { id:string; topic:string }[];
};

export function previewApiOrigin(location: Pick<Location,'protocol'|'hostname'|'origin'|'pathname'>|undefined,
  development:boolean, nativePort?:string) {
  if (!development) return undefined;
  if (location) return location.protocol==='http:' && location.hostname==='127.0.0.1' && location.pathname==='/game-preview'
    ? location.origin : undefined;
  if (nativePort && /^[1-9]\d{3,4}$/.test(nativePort) && Number(nativePort)<=65535) return 'http://127.0.0.1:'+nativePort;
  return undefined;
}

class PreviewRequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status=status; }
}

async function previewRequest<T>(origin: string, action: 'deck'|'round', body: object): Promise<T> {
  for (let attempt=0; ;attempt++) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(origin+'/game-preview/'+action,{
        method:'POST',headers:{'Content-Type':'application/json',...(typeof document==='undefined'?{Origin:origin}:{})},cache:'no-store',
        body:JSON.stringify(body),signal:controller.signal,
      });
      if (!response.ok) {
        const payload: { error?:string } = await response.json();
        throw new PreviewRequestError(response.status,payload.error ?? 'DBから問題を取得できませんでした。');
      }
      return await response.json() as T;
    } catch (error) {
      if (attempt===1 || (error instanceof PreviewRequestError && error.status<500)) throw error;
    } finally { clearTimeout(timer); }
  }
}

export function fetchPreviewDeck(origin:string,stageId:string) {
  return previewRequest<RemoteDeck>(origin,'deck',{stageId});
}

export function fetchPreviewRound(origin:string,stageId:string,ids:readonly string[]) {
  return previewRequest<BankQuestion[]>(origin,'round',{stageId,ids});
}

export function previewDeckChanged(error:unknown) {
  return error instanceof PreviewRequestError && error.status===409;
}
