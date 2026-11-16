import type {BankDiagram} from './questionBank';
import type {MathQuestion} from './worldQuestions';
import type {StageId,SkillId} from './curriculum';

export type LiveMode='stage'|'test'|'checkpoint'|'daily'|'review'|'remediation'|'diagnosis';
type Card=Omit<MathQuestion,'answer'|'hint'|'explanation'|'clock'> & {
  stageId:StageId;
  diagram?:BankDiagram;
  difficulty?:number;
  clock?:{start:number;read:boolean};
};
export type LiveRound={token:string;questions:Card[]};
export type LiveGrade={correct:boolean;answer:string;explanation:string;steps?:MathQuestion['steps'];clock?:MathQuestion['clock']};

export function liveOrigin():string|undefined {
  const location=typeof window==='undefined' ? undefined : window.location;
  if (__DEV__ && location?.origin==='http://127.0.0.1:8128' && location.pathname==='/play-db') return location.origin;
  const configured=process.env.EXPO_PUBLIC_KAZU_GAME_ORIGIN;
  if (configured && /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured)) return configured;
}

async function call<T>(origin:string,path:string,body:object):Promise<T> {
  for (let attempt=0;;attempt++) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(origin+'/play-api/'+path,{method:'POST',
        headers:{'Content-Type':'application/json',...(typeof document==='undefined'?{Origin:origin}:{})},
        body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
      if (response.ok) return await response.json() as T;
      if (response.status<500 || attempt) {
        const payload=await response.json();
        return Promise.reject(new Error(payload.error ?? '問題サーバーに接続できませんでした。'));
      }
    } catch (error) {
      if (attempt) throw error;
    } finally { clearTimeout(timer); }
  }
}

export const requestLiveRound=(origin:string,body:{mode:LiveMode;stageId?:string;skills?:SkillId[];excludeIds?:string[]})=>
  call<LiveRound>(origin,'round',body);
export const requestLiveHint=(origin:string,token:string,id:string,level:number)=>
  call<{hint:string|null;more:boolean}>(origin,'hint',{token,id,level});
export const requestLiveGrade=(origin:string,token:string,id:string,answer:string)=>
  call<LiveGrade>(origin,'answer',{token,id,answer});
