import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {bankStageIds} from '../src/domain/bankStageIds.ts';
import {worldIslands} from '../src/domain/worldCatalog.ts';
import {uiPreviewBank} from '../src/domain/uiPreviewRound.ts';
import {displayMathParts} from '../src/domain/mathDisplayParts.ts';
import {renderMathSvg} from '../src/domain/mathSvg.ts';

const textAt=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

/** Scan *every* nested textual value of each existing bank question, not just
 * a sample of stems. This includes all hint levels, explanations and steps.
 */
function forEachString(value,visit,path=''){
  if(typeof value==='string')return visit(value,path);
  if(Array.isArray(value))return value.forEach((v,i)=>forEachString(v,visit,path+'['+i+']'));
  if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))
    forEachString(v,visit,path?path+'.'+k:k);
}

function checkSquareDisplay(value,label){
  const parts=displayMathParts(value);
  assert.equal(parts.map(p=>p.text).join(''),value,label+': no loss of source text');
  const squareCount=(value.match(/□/g)??[]).length;
  assert.equal(parts.filter(part=>part.kind==='square').length,squareCount,
    label+': each authored □ must become a real square');
  if(!squareCount)return;
  assert.ok(parts.some(p=>p.kind==='square'),label);
  // Segmenting around the square must not corrupt math before or after it.
  for(const part of parts){
    if(part.kind==='math'){
      const rendered=renderMathSvg(part.latex);
      assert.ok(rendered.width>0&&rendered.height>0,label+': '+part.latex);
    }
  }
}

test('audit all 4,300 real public-bank questions for consistent visible square placeholders',()=>{
  assert.equal(bankStageIds.length,43);
  let checked=0,containingSquare=0,totalSquareGlyphs=0;
  const affectedStages=new Map();
  for(const id of bankStageIds){
    const bank=JSON.parse(textAt('public/question-banks/'+id+'.v1.json'));
    assert.equal(bank.questions.length,100,id);
    for(const q of bank.questions){
      let hasSquare=false;
      forEachString(q,(value,path)=>{
        checkSquareDisplay(value,q.id+'.'+path);
        if(value.includes('□')){
          hasSquare=true;
          totalSquareGlyphs+=(value.match(/□/g)??[]).length;
        }
      });
      if(hasSquare){
        containingSquare++;
        affectedStages.set(id,(affectedStages.get(id)??0)+1);
      }
      checked++;
    }
  }
  assert.equal(checked,4300);
  assert.equal(containingSquare,50);
  assert.deepEqual(Object.fromEntries(affectedStages),
    {'e1.bridge':10,'e1.forest':20,'e1.tower':20});
  assert.ok(totalSquareGlyphs>=200);
});

test('audit every existing preschool prototype stage for square display, including 16–20',()=>{
  const preschool=worldIslands.find(grade=>grade.id==='preschool');
  assert.ok(preschool);
  assert.equal(preschool.stages.length,65);
  let checked=0,stagesContainingSquares=0;
  for(const stage of preschool.stages){
    const questions=uiPreviewBank(stage);
    assert.ok(questions.length>=10,stage.id);
    let stageHasSquare=false;
    for(const q of questions){
      forEachString(q,(value,path)=>{
        checkSquareDisplay(value,q.id+'.'+path);
        if(value.includes('□'))stageHasSquare=true;
      });
      checked++;
    }
    if(stageHasSquare)stagesContainingSquares++;
  }
  assert.ok(checked>=650);
  assert.ok(stagesContainingSquares>=3);
});

test('every shared text path draws a full-sized centered native square, not a font square glyph',()=>{
  const view=textAt('src/components/MathText.tsx');
  const game=textAt('src/FullAdventure.tsx');
  const stage20=textAt('src/components/PreschoolSequenceFillPanel.tsx');
  assert.match(view,/displayMathParts\(value,format\)/);
  assert.match(view,/part.kind==='square'/);
  assert.match(view,/testID="math-empty-square"/);
  assert.match(view,/squareSide=Math.max\(19,Math.round\(fontSize\)\)/);
  assert.match(view,/alignSelf:'center',marginHorizontal:2,flexShrink:0/);
  assert.match(game,/<MathText key=\{index\} value=\{line\} style=\{index===0/);
  assert.match(game,/<MathText style=\{styles.questionText\} value=\{question.question\}/);
  assert.match(game,/<MathText style=\{styles.preschoolHintText\} value=\{hint\}/);
  assert.match(game,/<MathText style=\{styles.explanation\} value=\{question.explanation\}/);
  assert.match(stage20,/testID="sequence-empty-square"/);
  assert.match(stage20,/testID="preschool-sequence-question-square"/);
});
