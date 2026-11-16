import assert from 'node:assert/strict';
import test from 'node:test';
import { worldStageById } from '../src/domain/worldCatalog.ts';
import { checkMathAnswer, generateWorldQuestions } from '../src/domain/worldQuestions.ts';
import { inspectQuestion } from '../scripts/question-audit-rules.mjs';

const stageIds=[
  ...[26,27,28,29,30,31,32,33,34,35,41,42,43,44,45,46,47,48,49,50].map(n=>'e5.n'+n),
  'e5.x06','e5.x07','e5.x09','e5.x10',
];
function numbers(text) { return [...text.matchAll(/\d+(?:\.\d+)?/g)].map(token=>Number(token[0])); }
function area(points) {
  return Math.abs(points.reduce((sum,[x,y],i)=>{
    const [a,b]=points[(i+1)%points.length];
    return sum+x*b-y*a;
  },0))/2;
}

test('小5の図形24ステージは図・3段階ヒントを持ち、図と正答が一致する',()=>{
  let count=0;
  for (const id of stageIds) {
    const stage=worldStageById.get(id);
    for (let seed=0; seed<8; seed++) for (const q of generateWorldQuestions(stage,seed)) {
      count++;
      const figure=q.figure;
      assert.match(q.id,/:figure1:/);
      assert.ok(figure.labels.length>0);
      assert.equal(q.guidedHints.length,3);
      assert.equal(new Set(q.guidedHints).size,3);
      assert.ok(q.guidedHints.every(text=>text.length>15));
      assert.ok(!inspectQuestion(q).issues.includes('figure-referenced-but-missing'));
      for (const {at:[x,y]} of figure.labels) assert.ok(x>=0 && x<=320 && y>=0 && y<=188,q.id);
      const [a,b,c]=numbers(q.question);
      let answer;
      if (stage.family==='area') {
        const polygon=figure.outline[0];
        const base=q.question.includes('台形')?b:a;
        const height=q.question.includes('台形')?c:b;
        const pixelsPerCm=(polygon[1][0]-polygon[0][0])/base;
        assert.ok(Math.abs((figure.lines[0].to[1]-figure.lines[0].from[1])/pixelsPerCm-height)<1e-9);
        answer=area(polygon)/(pixelsPerCm*pixelsPerCm);
      } else if (stage.family==='volume') {
        assert.equal(figure.outline.length,3);
        answer=q.question.includes('高さは何')?c/a/b:(a*b)*c;
        if(q.question.includes('高さは何')) assert.ok(figure.labels.some(label=>label.text==='？ cm'));
        else assert.equal(figure.labels[2].text,c+' cm');
      } else if (stage.family==='circle') {
        const {center:[x,y],radius}=figure.circle;
        const segment=figure.lines[0];
        const isRadius=q.question.includes('円の半径は');
        assert.deepEqual(segment.from,[isRadius?x:x-radius,y]);
        assert.deepEqual(segment.to,[x+radius,y]);
        answer=q.question.includes('直径を求め')?a*100/314:a*(isRadius?628:314)/100;
      } else {
        const side=(points,a,b)=>Math.hypot(points[a][0]-points[b][0],points[a][1]-points[b][1]);
        assert.deepEqual([[0,1],[0,2],[1,2]].map(pair=>side(figure.outline[0],...pair).toFixed(8)),
          [[0,1],[0,2],[1,2]].map(pair=>side(figure.outline[1],...pair).toFixed(8)));
        answer=q.question.includes('辺DF')?b:a;
      }
      assert.ok(checkMathAnswer(q,String(answer)),q.question+' => '+answer);
    }
  }
  assert.equal(count,1920);
});
