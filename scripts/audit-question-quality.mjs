import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { bankStageIds } from '../src/domain/bankStageIds.ts';
import { worldIslands } from '../src/domain/worldCatalog.ts';
import { generateWorldQuestions } from '../src/domain/worldQuestions.ts';
import { lessonForStage } from '../src/domain/unitLessons.ts';
import { inspectQuestion, questionKeys } from './question-audit-rules.mjs';

const seeds=[0,1,2];
const targetPerStage=100;
const bankDir=new URL('../public/question-banks/',import.meta.url);
const reportDir=new URL('../docs/question-quality/',import.meta.url);
const visualFamilies=new Set(['shape','geometry','area','angle','circle','volume','coordinateGeometry','vector','data','function']);
const ledger=JSON.parse(await readFile(new URL('reviews.json',reportDir),'utf8'));
const stageInfos=new Map();
const exact=new Map(), equivalent=new Map(), shapes=new Map();
const findings=[];
const registeredIds=new Set(), matchedReviews=new Set(), approved=new Map();
const push=(map,key,entry)=>{
  if (!key) return;
  let values=map.get(key);
  if (!values) map.set(key,values=new Map());
  values.set(entry.stageId+'|'+entry.exact+(entry.source==='bank'?'|'+entry.id:''),entry);
};

// Read the shipped files as well as checking the runtime registry. Unregistered assets must not disappear from an audit.
const files=(await readdir(bankDir)).filter(file=>/\.v\d+\.json$/.test(file)).sort();
assert.deepEqual(files,[...bankStageIds].map(id=>id+'.v1.json').sort(),'Public problem banks and the runtime registry differ');
const banks=new Map(await Promise.all(files.map(async filename=>{
  const bank=JSON.parse(await readFile(new URL(filename,bankDir),'utf8'));
  assert.equal(filename,bank.stageId+'.v'+bank.version+'.json');
  return [bank.stageId,bank];
})));

for (const island of worldIslands) for (const stage of island.stages) {
  const bank=banks.get(stage.id);
  if (bank) assert.equal(bank.gradeId,island.id);
  const source=bank?'bank':island.id==='sage'?'unavailable':'fallback';
  const rounds=bank?[bank.questions]:source==='fallback'?seeds.map(seed=>generateWorldQuestions(stage,seed)):[];
  const info={stage,island,source,bank,registered:bank?.questions.length ?? 0,sampled:0,numeric:0,choice:0,
    figure:0,figureRequired:0,missingFigure:0,figureReview:0,independent:0,defects:0,exactGroups:0,equivalentGroups:0,shapeGroups:0,
    stepMin:null,stepMax:null,formats:new Set(),difficulty:new Map(),example:'',mathReviewed:0,pedagogyReviewed:0,
    explanationReviewed:0,diagramReviewed:0,approved:0,revision:0};
  stageInfos.set(stage.id,info);
  for (const round of rounds) {
    const seenThisRound=new Set();
    for (const q of round) {
      if (!info.example) info.example=q.question;
      if (source==='bank') {
        assert.ok(!registeredIds.has(q.id),'Duplicate registered ID: '+q.id);
        assert.ok(q.id.startsWith(stage.id+':bank'+bank.version+':'),'Invalid registered ID: '+q.id);
        registeredIds.add(q.id);
      } else info.sampled++;
      const result=inspectQuestion(q);
      info.independent+=Number(result.independent);
      info.numeric+=Number(q.type==='number');
      info.choice+=Number(q.type==='choice');
      info.figure+=Number(result.illustrated);
      info.figureRequired+=Number(result.visualPrompt);
      info.missingFigure+=Number(result.visualPrompt&&!result.illustrated);
      if (!result.illustrated && visualFamilies.has(stage.family)) info.figureReview++;
      info.formats.add(q.format ?? ('回答:'+q.type));
      const steps=q.steps?.length ?? 0;
      info.stepMin=info.stepMin===null?steps:Math.min(info.stepMin,steps);
      info.stepMax=info.stepMax===null?steps:Math.max(info.stepMax,steps);
      const level=q.difficulty ?? '未定義';
      info.difficulty.set(level,(info.difficulty.get(level)??0)+1);
      const keys=questionKeys(q);
      if (seenThisRound.has(keys.exact)) result.issues.push('repeated-within-round');
      seenThisRound.add(keys.exact);
      const entry={stageId:stage.id,gradeId:island.id,kind:stage.kind,source,id:q.id,stem:q.question,exact:keys.exact};

      const review=source==='bank' && Object.hasOwn(ledger,q.id) ? ledger[q.id] : undefined;
      let quality;
      if (review) {
        const fingerprint=createHash('sha256').update(JSON.stringify(q)).digest('hex');
        if (fingerprint!==review.fingerprint || !review.reviewer?.trim() || !review.evidence?.trim()) result.issues.push('review-stale-or-incomplete');
        else {
          matchedReviews.add(q.id);
          quality=review;
          info.mathReviewed+=Number(quality.mathematics==='accepted');
          info.pedagogyReviewed+=Number(quality.pedagogy==='accepted');
          info.explanationReviewed+=Number(quality.explanation==='accepted');
          info.diagramReviewed+=Number(quality.diagram==='accepted');
          info.revision+=Number(quality.status==='needs-revision');
          if (quality.status==='accepted' && ['mathematics','pedagogy','explanation','duplicates'].every(field=>quality[field]==='accepted') &&
              (result.illustrated || result.visualPrompt ? quality.diagram==='accepted' : ['accepted','not-required'].includes(quality.diagram)) &&
              quality.recurrence!=='intentional-review' && !result.issues.length) approved.set(q.id,entry);
        }
      }

      if (result.issues.length) {
        info.defects++;
        findings.push({category:'automated-finding',...entry,issues:result.issues});
      }
      push(exact,keys.exact,{...entry,recurrence:quality?.recurrence});
      push(equivalent,keys.equivalent,{...entry,recurrence:quality?.recurrence});
      push(shapes,keys.shape,{...entry,recurrence:quality?.recurrence});
    }
  }
}

function reportGroups(groups,category,counter,predicate) {
  let total=0;
  for (const [key,members] of groups) {
    const entries=[...members.values()];
    if (!predicate(entries)) continue;
    const stageIds=new Set(entries.map(entry=>entry.stageId));
    const grades=new Set(entries.map(entry=>entry.gradeId));
    const scope=stageIds.size===1?'within-stage':grades.size===1?'across-stages':'across-grades';
    const intentional=entries.some(entry=>entry.recurrence==='intentional-review') &&
      entries.filter(entry=>entry.recurrence!=='intentional-review').length<=1;
    findings.push({category:intentional?'documented-recurrence':category,key,scope,
      secret:entries.some(entry=>entry.kind==='secret'),entries});
    if (intentional) continue;
    for (const id of stageIds) stageInfos.get(id)[counter]++;
    if (category!=='structural-near-match') for (const entry of entries) approved.delete(entry.id);
    total++;
  }
  return total;
}

const exactGroups=reportGroups(exact,'normalized-match','exactGroups',entries=>entries.length>1);
const equivalentGroups=reportGroups(equivalent,'verified-math-equivalence','equivalentGroups',
  entries=>new Set(entries.map(entry=>entry.exact)).size>1);
const structuralGroups=reportGroups(shapes,'structural-near-match','shapeGroups',
  entries=>new Set(entries.map(entry=>entry.exact)).size>1);
for (const entry of approved.values()) stageInfos.get(entry.stageId).approved++;

const infos=[...stageInfos.values()];
const sum=key=>infos.reduce((n,info)=>n+info[key],0);
const bySource=source=>infos.filter(info=>info.source===source).length;
const bankFindings=source=>findings.filter(item=>item.entries?.filter(entry=>entry.source===source).length>=2);
const summary={
  stages:infos.length,target:infos.length*targetPerStage,registered:sum('registered'),
  source:{bank:bySource('bank'),fallback:bySource('fallback'),unavailable:bySource('unavailable')},
  fallback:{seeds,questions:sum('sampled')},
  checkedArithmetic:sum('independent'), automatedFindingRows:sum('defects'),
  byQuestionSource:Object.fromEntries(['bank','fallback'].map(source=>{
    const selected=infos.filter(info=>info.source===source);
    const tally=key=>selected.reduce((n,info)=>n+info[key],0);
    return [source,{checkedArithmetic:tally('independent'),figures:tally('figure'),automatedFindingRows:tally('defects')}];
  })),
  figures:{shown:sum('figure'),explicitlyRequired:sum('figureRequired'),missingForExplicitPrompt:sum('missingFigure'),
    textOnlyVisualFamilyNeedsReview:sum('figureReview')},
  duplicates:{normalizedGroups:exactGroups,verifiedMathematicsGroups:equivalentGroups,structuralCandidates:structuralGroups,
    registeredNormalizedGroups:bankFindings('bank').filter(item=>item.category==='normalized-match').length,
    registeredMathematicsGroups:bankFindings('bank').filter(item=>item.category==='verified-math-equivalence' && new Set(item.entries.filter(entry=>entry.source==='bank').map(entry=>entry.exact)).size>1).length,
    registeredStructuralCandidates:bankFindings('bank').filter(item=>item.category==='structural-near-match' && new Set(item.entries.filter(entry=>entry.source==='bank').map(entry=>entry.exact)).size>1).length,
    secretCrossGradeExact:findings.filter(item=>item.category==='normalized-match' && item.scope==='across-grades' && item.secret).length,
    e5e6SecretExact:findings.filter(item=>item.category==='normalized-match' &&
      ['e5','e6'].every(grade=>item.entries.some(entry=>entry.kind==='secret'&&entry.gradeId===grade))).length},
  reviews:{mathematics:sum('mathReviewed'),pedagogy:sum('pedagogyReviewed'),explanation:sum('explanationReviewed'),
    diagram:sum('diagramReviewed'),approvedIndependent:approved.size,revisionListed:sum('revision'),
    unlinkedLedgerIds:Object.keys(ledger).filter(id=>!matchedReviews.has(id)).sort()},
};
assert.equal(summary.stages,845);

const columns=['ステージID','学年・島','種別','単元','技能','目標（現行）','前提技能・教材','期待する表現（案）','思考・誤概念・難易度の設計',
  '出題元','登録数','サンプル数','数値回答','単一選択','形式','難易度別','図あり','図参照が明示された問い','参照図なし',
  '図形・グラフ系の図要否レビュー','解説ステップ数','独立計算（監査の対象式）','自動指摘数','一致グループ','数学同値グループ','構造類似候補',
  '数学レビュー','教育レビュー','解説レビュー','図レビュー','品質合格の独立問題','品質状況','代表問題'];
const cell=value=>String(value).replace(/[\t\r\n]+/g,' ');
const allRows=infos.map(i=>{
  const unit=i.island.units[i.stage.unitIndex];
  const unitTitle=i.stage.kind==='secret'?'ひみつの道':unit.title;
  const design=i.stage.kind==='secret'?'条件探索・規則性・説明':visualFamilies.has(i.stage.family)?'図表の判断・説明':'文章と式・条件整理';
  const lesson=lessonForStage(i.stage.id);
  const prerequisite=lesson?lesson.prerequisiteIds.join(', ')||'教材では指定なし':'要設計';
  const status=i.source==='unavailable'?'未出題':i.defects || i.revision ? '改訂候補あり'
    :i.source==='fallback'?'生成サンプルのみ':i.approved===targetPerStage?'品質確認済み':'登録済・品質レビュー待ち';
  return [i.stage.id,i.island.id,i.stage.kind,unitTitle,i.stage.family,i.bank?.objective ?? '要設計',prerequisite,design,'要レビュー',
    i.source,i.registered,i.sampled,i.numeric,i.choice,[...i.formats].sort().join(', '),[...i.difficulty].map(pair=>pair.join(':')).sort().join(', '),
    i.figure,i.figureRequired,i.missingFigure,i.figureReview,i.stepMin===null?'—':i.stepMin+'–'+i.stepMax,i.independent,i.defects,
    i.exactGroups,i.equivalentGroups,i.shapeGroups,i.mathReviewed,i.pedagogyReviewed,i.explanationReviewed,i.diagramReviewed,
    i.approved,status,i.example || '—'];
});
const outputs={
  'stages.tsv':[columns,...allRows].map(row=>row.map(cell).join('\t')).join('\n')+'\n',
  'summary.json':JSON.stringify(summary,null,2)+'\n',
};
const args=process.argv.slice(2);
if (args.includes('--update')) for (const [name,data] of Object.entries(outputs)) await writeFile(new URL(name,reportDir),data);
if (args.includes('--check')) for (const [name,data] of Object.entries(outputs))
  assert.equal((await readFile(new URL(name,reportDir),'utf8')).replaceAll('\r\n','\n'),data,'Stale audit: '+name);
const detailIndex=args.indexOf('--out');
if (detailIndex!==-1) {
  if (!args[detailIndex+1]) throw new Error('Specify an output directory after --out');
  const out=resolve(args[detailIndex+1]);
  await mkdir(out,{recursive:true});
  for (const [name,data] of Object.entries(outputs)) await writeFile(join(out,name),data);
  await writeFile(join(out,'findings.jsonl'),findings.map(entry=>JSON.stringify(entry)).join('\n')+'\n');
  await writeFile(join(out,'index.html'),await readFile(new URL('review.html',reportDir)));
}
console.log(JSON.stringify(summary,null,2));

if (args.includes('--require-reviewed') && (infos.some(i=>i.registered!==targetPerStage || i.approved!==targetPerStage) ||
    summary.automatedFindingRows || summary.reviews.unlinkedLedgerIds.length)) {
  console.error('Quality gate failed: each stage requires 100 independently reviewed, eligible questions and no unresolved automatic findings.');
  process.exitCode=2;
}
