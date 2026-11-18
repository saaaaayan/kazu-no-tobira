import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {allWorldStages} from '../src/domain/worldCatalog.ts';
import {uiPreviewRound} from '../src/domain/uiPreviewRound.ts';

const source=readFileSync(new URL('../src/FullAdventure.tsx',import.meta.url),'utf8');

test('preschool 01–05 all share the stage 01 guided counting UI',()=>{
  const countStages=allWorldStages.filter(stage=>stage.gradeId==='preschool'&&stage.order<5);
  assert.deepEqual(countStages.map(stage=>stage.id),[
    'preschool.n01','preschool.n02','preschool.n03','preschool.n04','preschool.n05'
  ]);
  const titlePattern=/const preschoolGuideTitles: Readonly<Record<string,string>> = \{([\s\S]*?)\n\};/u;
  const titles=source.match(titlePattern)?.[1];
  assert.ok(titles,'guided counting stage titles must exist');
  for(const stage of countStages){
    assert.match(titles,new RegExp("'"+stage.id.replaceAll('.','\\.')+"'"));
    const questions=uiPreviewRound(stage);
    assert.equal(questions.length,10);
    assert.ok(questions.every(q=>q.type==='choice'&&q.diagram?.kind==='countingBoard'&&q.diagram.guide===true));
  }
  assert.match(source,/const preschoolStage=Boolean\(round\?\.stage\.gradeId==='preschool'\)/u);
  assert.match(source,/const countingGuide=Boolean\(preschoolStage && question\?\.type==='choice'\)/u);
  assert.match(source,/\{countingGuide && !round\.feedback && \(\s*<View style=\{styles\.preschoolAnswerSection\}>/u);
  assert.match(source,/onPress=\{\(\)=>void submit\(option\)\}/u);
  assert.match(source,/\{\(!countingGuide \|\| round\.feedback\) && <View/u);
  assert.match(source,/\{!countingGuide && <CalculationMemo/u);
  assert.match(source,/\{preschoolStage && !round\.feedback &&\s*<QuestionReadAloud/u);
  assert.match(source,/\{preschoolStage && <QuestionReadAloud text=\{question\.explanation\}\/>\}/u);
  assert.match(source,/\{countingGuide && diagram && <QuestionDiagram diagram=\{diagram\} phase="solution"\/>\}/u);
});

test('only preschool stages 01–05 get this UI, not a future stage',()=>{
  const ids=(source.match(/'preschool\.n\d{2}':/gu)??[]);
  assert.deepEqual(ids,[
    "'preschool.n01':","'preschool.n02':","'preschool.n03':","'preschool.n04':","'preschool.n05':"
  ]);
  const later=allWorldStages.find(stage=>stage.id==='preschool.n06');
  assert.equal(uiPreviewRound(later).length,0);
});
