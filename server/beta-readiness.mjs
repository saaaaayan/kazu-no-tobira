import { checkMathAnswer, isValidMathAnswer } from '../src/domain/worldQuestions.ts';
import { worldIslands } from '../src/domain/worldCatalog.ts';

export const betaQuestionsPerStage = 10;
export const productionQuestionsPerStage = 100;

const nonblank = value => typeof value === 'string' && value.trim().length > 0;

export function playableBetaPayload(question) {
  return ['number','choice'].includes(question?.type) && nonblank(question.question) &&
    nonblank(question.answer) && isValidMathAnswer(question,question.answer) &&
    checkMathAnswer(question,question.answer) &&
    (question.type !== 'choice' || (
      Array.isArray(question.choices) && new Set(question.choices).size === question.choices.length &&
      question.choices.length >= 2 && question.choices.every(nonblank) &&
      question.choices.filter(choice=>checkMathAnswer(question,choice)).length === 1
    )) &&
    nonblank(question.explanation) && Array.isArray(question.hints) &&
    question.hints.length === 3 && question.hints.every(nonblank) &&
    new Set(question.hints.map(hint=>hint.trim())).size === 3 &&
    Array.isArray(question.steps) && question.steps.length > 0 &&
    question.steps.every(step=>step && nonblank(step.title) && nonblank(step.body) &&
      (step.equations===undefined || (Array.isArray(step.equations) && step.equations.every(nonblank))));
}

export async function betaReadiness(pool,{production=false}={}) {
  const perStage=production ? productionQuestionsPerStage : betaQuestionsPerStage;
  // One statement gives a consistent inventory. Only ready payloads are read.
  const {rows}=await pool.query(`
    select s.id,s.kind,s.island_id as island,
      count(q.id)::int as registered,
      count(q.id) filter (where q.status='verified')::int as verified,
      count(q.id) filter (where q.status='ready')::int as ready,
      coalesce(jsonb_agg(v.payload) filter (where v.payload is not null),'[]') as payloads
    from question_catalog.stages s
    left join question_catalog.questions q on q.stage_id=s.id and q.active
    left join question_catalog.versions v on v.fingerprint=q.fingerprint and q.status='ready'
    group by s.id,s.kind,s.island_id`);
  const byId=new Map(rows.map(row=>[row.id,row]));
  const stages=worldIslands.flatMap(island=>island.stages.map(stage=>{
    const row=byId.get(stage.id);
    const present=row?.island===island.id && row?.kind===stage.kind;
    const playable=present ? row.payloads.filter(playableBetaPayload).length : 0;
    return {stageId:stage.id,islandId:island.id,kind:stage.kind,present,
      registered:row?.registered??0,verified:row?.verified??0,ready:row?.ready??0,
      playable,missing:Math.max(0,perStage-playable)};
  }));
  const target=stages.length*perStage;
  const totals=stages.reduce((sum,row)=>({
    registered:sum.registered+row.registered,verified:sum.verified+row.verified,ready:sum.ready+row.ready,
    playable:sum.playable+row.playable,missing:sum.missing+row.missing,
  }),{registered:0,verified:0,ready:0,playable:0,missing:0});
  const complete=stages.filter(row=>row.missing===0).length;
  return {target,stageCount:stages.length,complete,inventoryReady:complete===stages.length,...totals,stages};
}
