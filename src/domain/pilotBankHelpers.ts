import type { BankQuestion } from './questionBank';

/** Author-edited lesson seeds, never machine-numbered filler. */
export type PilotSeed = readonly [
  question:string,
  answer:string,
  hint1:string,
  hint2:string,
  hint3:string,
  explanation:string,
  choices?:readonly [string,string,string,string],
];
export function pilotBank(id:string,category:string,seeds:readonly PilotSeed[]):BankQuestion[] {
  if(!/^(?:e[2-6]|j[1-3]|h[1-3]|champion|cosmos)\.n01$/.test(id)||
     seeds.length!==10) throw new Error('First-stage lesson bank must contain exactly ten questions: '+id);
  const grade=id.split('.')[0] as 'e2'|'e3'|'e4'|'e5'|'e6'|'j1'|'j2'|'j3'|'h1'|'h2'|'h3'|'champion'|'cosmos';
  const normalized=new Set<string>();
  return seeds.map(([question,answer,h1,h2,h3,explanation,choices],i)=>{
    const signature=question.normalize('NFKC').replace(/\s/g,'');
    if(!question||!answer||!h1||!h2||!h3||!explanation||normalized.has(signature))
      throw new Error('Invalid or duplicate pilot lesson: '+id+'-'+(i+1));
    normalized.add(signature);
    if(choices && (new Set(choices).size!==4||!choices.includes(answer)))
      throw new Error('Invalid four choices for '+id+'-'+(i+1));
    if(!choices&&(!Number.isFinite(Number(answer)) || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(answer)))
      throw new Error('Non-numeric open answer: '+id+'-'+(i+1));
    return {
      id:'ui-preview-'+id+'-lesson-'+String(i+1).padStart(2,'0'),
      skillId:`${grade}.intro.${category}`,
      type:choices?'choice':'number',
      format:'calculation',
      difficulty:i<3?1:i<7?2:3,
      question,answer,prompt:choices?'正しいこたえを えらぼう':'こたえを 入力しよう',
      ...(choices?{choices}:{}),
      hint:h1,hints:[h1,h2,h3],
      explanation,
      steps:[{title:'考え方',body:h2},{title:'確かめ方',body:explanation}],
      mistakes:choices?choices.filter(x=>x!==answer).map(x=>({answer:x,explanation:'途中の考え方をもう一度確かめよう。'})):[],
    } satisfies BankQuestion;
  });
}
