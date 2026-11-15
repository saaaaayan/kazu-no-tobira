import test from 'node:test';
import assert from 'node:assert/strict';
import { worldMapLayout, islandStageLayout, routeThrough, islandRouteByKind } from '../src/domain/worldMapLayout.ts';
import { worldGrades } from '../src/domain/worldCatalog.ts';

test('世界地図はデスクトップで3列×4行、スマホで2列×6行、全12島を表示', () => {
  for (const [width, cols, rows] of [[340, 2, 6], [430, 2, 6], [700, 3, 4], [1000, 3, 4]]) {
    const map = worldMapLayout(width);
    assert.equal(map.columns, cols);
    assert.equal(map.positions.length, 12);
    assert.equal(new Set(map.positions.map(point => point.x + ':' + point.y)).size, 12);
    assert.ok(map.height >= map.positions.at(-1).y + 80);
    assert.equal(new Set(map.positions.map(p=>p.y)).size, rows);
    for (const point of map.positions) {
      assert.ok(point.x >= 65 && point.x < width - 65, JSON.stringify({width,point}));
      assert.ok(point.y >= 60 && point.y < map.height);
    }
    for (let i = 1; i < map.positions.length; i++) {
      const prev=map.positions[i-1], next=map.positions[i];
      // Adjacent grade islands follow the chart without impossible teleportation.
      assert.ok(Math.hypot(next.x-prev.x,next.y-prev.y)<width/cols+120);
    }
    assert.ok(routeThrough(map.positions).startsWith('M'));
    assert.equal((routeThrough(map.positions).match(/ Q/g)||[]).length, 11);
  }
});

test('各島の65地点は5列×13行のジグザグの航路となる', () => {
  for (const width of [290,340,480,850,1024]) {
    const map = islandStageLayout(width);
    assert.equal(map.positions.length, 65);
    assert.equal(map.positions[0].row, 0);
    assert.equal(map.positions[64].row, 12);
    assert.equal(new Set(map.positions.map(p=>p.x+':'+p.y)).size, 65);
    for (const point of map.positions) {
      assert.ok(point.x >= 28 && point.x <= width - 28, JSON.stringify({width,point}));
      assert.ok(point.y > 70 && point.y < map.height - 30);
    }
    for(let i=1;i<65;i++) {
      const a=map.positions[i-1], b=map.positions[i];
      assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<Math.max(119,width/5)+12,
        JSON.stringify({width,a,b}));
    }
    for(const grade of worldGrades) {
      const routes=islandRouteByKind(grade.stages,map.positions);
      assert.equal(routes.normal.length,50);
      assert.equal(routes.extra.length,10);
      assert.equal(routes.secret.length,5);
      assert.equal((routeThrough(routes.normal).match(/ Q/g)||[]).length,49);
    }
  }
});

test('航路の空配列と長さ1にも対応する',()=>{
  assert.equal(routeThrough([]),'');
  assert.equal(routeThrough([{x:5,y:8}]),'M5 8');
  assert.throws(()=>islandStageLayout(300,0),RangeError);
});
