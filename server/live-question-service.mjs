import { randomBytes } from 'node:crypto';
import { checkpointsFor } from '../src/domain/stageStructure.ts';
import { worldIslands } from '../src/domain/worldCatalog.ts';
import { checkMathAnswer, isValidMathAnswer } from '../src/domain/worldQuestions.ts';

const study = new Set(['daily','review','remediation','diagnosis']);
const unavailable = () => fail(404,'条件に合う公開済みの問題を準備中です。');
const fail = (status,message) => Object.assign(new Error(message),{status});
const stagePattern=/^[a-z0-9]+\.[a-z0-9-]+$/;
const skillPattern=/^[a-z0-9]+\.[a-z0-9.-]+$/;
const lifetime=30*60*1000;
const checkpoints=new Map(worldIslands.flatMap(checkpointsFor).map(item=>[item.id,item]));

function presentation({id,stageId,payload:q}) {
  return {id,stageId,skillId:q.skillId,type:q.type,prompt:q.prompt,question:q.question,
    choices:q.choices,diagram:q.diagram,figure:q.figure,
    clock:q.clock && {start:q.clock.start,read:q.clock.read},difficulty:q.difficulty};
}

export function liveQuestionService({findCandidates,findCurrent,entitlement=async()=>false,now=Date.now}) {
  const rounds=new Map();
  function prune(time) {
    for (const [id,round] of rounds) if (round.expires<=time) rounds.delete(id);
  }
  return {
    async start(request,credential) {
      const {mode,stageId,skills,excludeIds}=request;
      const checkpoint=mode==='checkpoint' ? checkpoints.get(stageId) : undefined;
      if (!['stage','test','checkpoint',...study].includes(mode) ||
          (study.has(mode) ? !Array.isArray(skills) || skills.length<1 || skills.length>3 ||
            !skills.every(skill=>typeof skill==='string' && skillPattern.test(skill) && skill.length<=80)
            : typeof stageId!=='string' || !stagePattern.test(stageId) || (mode==='checkpoint' && !checkpoint)) ||
          (excludeIds!==undefined && (!Array.isArray(excludeIds) || excludeIds.length>100 ||
            !excludeIds.every(id=>typeof id==='string' && id.length<=250)))) {
        throw fail(400,'出題範囲を確認してください。');
      }
      const time=now();
      prune(time);
      if (rounds.size>=1024) throw fail(429,'ただいま混み合っています。少し待ってからお試しください。');
      const premium=await entitlement(credential);
      if (study.has(mode) && !premium) throw fail(403,'この学習機能には有効な利用権が必要です。');
      const limit=mode==='daily'?15:study.has(mode)?5:10;
      const rows=await findCandidates({mode,stageId,skills,sourceStageIds:checkpoint?.sourceStageIds,excludeIds:excludeIds??[],premium,limit});
      if (rows.length!==limit) throw unavailable();
      if (rounds.size>=1024) throw fail(429,'ただいま混み合っています。少し待ってからお試しください。');
      const token=randomBytes(32).toString('base64url');
      rounds.set(token,{mode,questions:rows.map(({id,fingerprint})=>({id,fingerprint})),
        expires:time+lifetime,credential,answers:[],busy:false});
      return {token,questions:rows.map(presentation)};
    },
    async hint({token,id,level},credential) {
      if (typeof token!=='string' || typeof id!=='string' ||
          !Number.isInteger(level) || level<0 || level>2) throw fail(400,'ヒントの指定を確認してください。');
      prune(now());
      const round=rounds.get(token);
      if (!round || round.credential!==credential) throw fail(410,'出題の有効期限が切れました。');
      const question=round.questions[round.answers.length];
      if (question?.id!==id) throw fail(409,'現在の問題を確認してください。');
      const premium=await entitlement(credential);
      if (study.has(round.mode) && !premium) throw fail(403,'この学習機能には有効な利用権が必要です。');
      const row=await findCurrent({id,fingerprint:question.fingerprint,premium,readyOnly:round.mode==='checkpoint'});
      if (!row) throw unavailable();
      const hints=row.payload.hints??row.payload.guidedHints??[row.payload.hint].filter(Boolean);
      return {hint:hints[level]??null,more:hints.length>level+1};
    },
    async grade({token,id,answer},credential) {
      if (typeof token!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(token) ||
          typeof id!=='string' || typeof answer!=='string' || answer.length>250) throw fail(400,'答えを確認してください。');
      prune(now());
      const round=rounds.get(token);
      if (!round || round.credential!==credential) throw fail(410,'出題の有効期限が切れました。もう一度始めてください。');
      if (round.busy) throw fail(409,'採点中です。もう一度お試しください。');
      const previous=round.answers.find(item=>item.id===id);
      if ((previous && previous.answer!==answer) ||
          (!previous && round.questions[round.answers.length]?.id!==id)) throw fail(409,'現在の問題に答えてください。');
      round.busy=true;
      try {
        const premium=await entitlement(credential);
        if (study.has(round.mode) && !premium) throw fail(403,'この学習機能には有効な利用権が必要です。');
        const question=round.questions.find(item=>item.id===id);
        const row=await findCurrent({id,fingerprint:question.fingerprint,premium,readyOnly:round.mode==='checkpoint'});
        if (!row) throw unavailable();
        const q=row.payload;
        if (!isValidMathAnswer(q,answer)) throw fail(400,'答えの形式を確認してください。');
        const result={correct:checkMathAnswer(q,answer),answer:q.answer,explanation:q.explanation,
          clock:q.clock, ...(premium?{steps:q.steps,mistakes:q.mistakes}: {})};
        if (!previous) round.answers.push({id,answer});
        return result;
      } finally { round.busy=false; }
    },
  };
}

const from=`from question_catalog.questions q
  join question_catalog.stages s on s.id=q.stage_id
  join question_catalog.versions v on v.fingerprint=q.fingerprint`;

export function liveQuestionRepository(pool,{preview=false}={}) {
  const eligibility=`q.active and v.payload->>'type' in ('number','choice') and (q.status='ready' or ($1::boolean and q.status in ('unreviewed','verified')))
    and (s.access='free' or (s.access='premium' and $2::boolean))`;
  const select=`select q.id,q.stage_id as "stageId",q.fingerprint,v.payload ${from}`;
  return {
    async findCandidates({mode,stageId,skills,sourceStageIds,excludeIds,premium,limit}) {
      const studyMode=study.has(mode);
      const condition=studyMode ? "v.payload->>'skillId'=any($3::text[])" : sourceStageIds ? 'q.stage_id=any($3::text[])' : 'q.stage_id=$3';
      const {rows}=await pool.query(`${select} where ${eligibility} and ${condition}
        order by q.id=any($4::text[]), random() limit $5`,[preview && !sourceStageIds,premium,studyMode?skills:sourceStageIds??stageId,sourceStageIds?[]:excludeIds,limit]);
      return rows;
    },
    async findCurrent({id,fingerprint,premium,readyOnly}) {
      const {rows}=await pool.query(`${select} where ${eligibility} and q.id=$3 and q.fingerprint=$4`,[preview && !readyOnly,premium,id,fingerprint]);
      return rows[0];
    },
  };
}
