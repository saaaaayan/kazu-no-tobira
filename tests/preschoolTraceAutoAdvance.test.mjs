import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank} from '../src/domain/uiPreviewRound.ts';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const game=read('src/FullAdventure.tsx');
const pad=read('src/components/PreschoolTracePad.tsx');

test('tracing success submits the recognised result directly, without a second press',()=>{
 assert.match(game,/const autoTraceEnabled=Boolean\(uiPreview && !review && bankQuestion\?\.preschoolTrace\)/);
 assert.match(game,/autoTraceSubmitted = useRef<string \| undefined>\(undefined\)/);
 assert.match(game,/autoTraceSubmitted\.current=undefined;/);
 assert.match(game,/value==='できた' && autoTraceEnabled/);
 assert.match(game,/autoTraceSubmitted\.current!==question\.id/);
 assert.match(game,/autoTraceSubmitted\.current=question\.id;/);
 assert.match(game,/void submit\('できた'\);/);
 assert.match(game,/autoGrade=\{autoTraceEnabled\}/);
 assert.match(game,/\{!autoTraceEnabled && !autoGradePreschoolChoice && <GameButton/);
 assert.match(game,/!bankQuestion\?\.preschoolTrace &&/);
});
test('correct recognition shows feedback and waits for an explicit next-question tap',()=>{
 const submit=game.slice(game.indexOf('  async function submit('),game.indexOf('  function advance()'));
 assert.match(submit,/setRound\(\{ \.\.\.round, problems, correct: newCorrect, results: \[\.\.\.round\.results, result\], feedback: result \}\)/);
 assert.match(game,/<GameButton gold label=\{round\.index\+1===round\.problems\.length\?'けっかを みる':'つぎの もんだいへ'\} onPress=\{advance\}\/>/);
 assert.match(game,/if \(round\.index === round\.problems\.length - 1\) \{/);
 assert.match(game,/setRound\(\{ \.\.\.round, complete: true, hintLevel: 0 \}\)/);
 assert.doesNotMatch(game,/setTimeout\(\(\)=>advance\(\)/);
 assert.doesNotMatch(game,/useEffect\(\(\) => \{\s*const current=round\?\.problems\[round\.index\]/);
});
test('a blank or wrong trace does not trigger automatic success and manual review stays manual',()=>{
 assert.match(game,/if\(value==='できた' && autoTraceEnabled &&/);
 assert.match(game,/!round\?\.feedback && autoTraceSubmitted\.current!==question\.id/);
 assert.match(pad,/onChangeRef\.current\(matches\.length===digits\.length&&matches\.every\(Boolean\)\?'できた':''\)/);
 assert.match(pad,/autoGrade=false/);
 assert.match(pad,/autoGrade\?'じょうずに かけたね！「つぎの もんだいへ」を おしてね。'/);
 assert.match(pad,/:'じょうずに かけたね！「こたえあわせ」を おしてね。'/);
});
test('all preschool tracing steps use existing 10-question answer flow',()=>{
 const island=worldIslands.find(g=>g.id==='preschool');
 for(let index=10;index<15;index++){
   const questions=uiPreviewBank(island.stages[index]);
   assert.equal(questions.length,10);
   assert.ok(questions.every(q=>q.preschoolTrace&&q.answer==='できた'));
 }
});
