import test from 'node:test';
import assert from 'node:assert/strict';
import { worldMapLayout, islandStageLayout, routeThrough, islandRouteByKind, compactIslandStageMap, islandCheckpointLayout, PRESCHOOL_MAP_TITLE_INSET } from '../src/domain/worldMapLayout.ts';
import { worldGrades } from '../src/domain/worldCatalog.ts';

test('世界地図の16島は格子に揃わず、狭い画面でも島ラベルが地図内に収まる', () => {
  for (const width of [288, 340, 430, 699, 700, 820, 1000]) {
    const map = worldMapLayout(width);
    assert.equal(map.positions.length, 16);
    assert.equal(new Set(map.positions.map(point => point.y)).size, 16);
    assert.equal(new Set(map.positions.map(point => point.x)).size, 16);
    for (const point of map.positions) {
      assert.ok(point.x - map.targetWidth / 2 >= 0 && point.x + map.targetWidth / 2 <= width);
      assert.ok(point.y >= 36 && point.y + 85 <= map.height);
    }
    for (const [index, point] of map.positions.entries()) {
      for (const other of map.positions.slice(index + 1)) {
        assert.ok(Math.abs(point.x - other.x) >= map.targetWidth || Math.abs(point.y - other.y) >= 52,
          JSON.stringify({ width, point, other }));
      }
    }
    assert.equal((routeThrough(map.positions).match(/ Q/g) || []).length, 15);
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
      const compact=compactIslandStageMap(width);
      const atAreaBoundary=compact && (b.row===10||b.row===12) && b.row!==a.row;
      const maxStep=a.row===b.row?width/5+12:map.rowHeight+(atAreaBoundary?58:0)+12;
      assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<maxStep,
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

test('スマホの5地点行には単元名と確認テストのための重ならない領域がある',()=>{
  for(const width of [290,340,390,480,600,619,620,850]){
    const map=islandStageLayout(width);
    const compact=compactIslandStageMap(width);
    assert.equal(compact,width<620);
    assert.equal(map.rowHeight,compact?166:119);
    for(let row=0;row<10;row++){
      const end=map.positions[row*5+4];
      const marker=Math.max(46,Math.min(57,Math.floor(width/5)-9));
      const next=map.positions[(row+1)*5];
      const testBox=islandCheckpointLayout(width,end,marker,next);
      assert.equal(testBox.compact,compact);
      assert.ok(testBox.left>=0 && testBox.left+testBox.width<=width,
        JSON.stringify({width,row,testBox}));
      if(!compact)continue;
      const topicInset=Math.max(68,Math.ceil(width*.16));
      const topicLeft=topicInset,topicRight=width-topicInset;
      // Checkpoints and centered topic labels may share some vertical space,
      // but their horizontal bounds must never overlap.
      assert.ok(
        testBox.left+testBox.width<=topicLeft || testBox.left>=topicRight,
        JSON.stringify({width,row,testBox,topicLeft,topicRight}));
      assert.equal(testBox.top,Math.round((end.y+next.y-testBox.height)/2),
        'checkpoint must be vertically centered between neighboring rows');
      assert.ok(testBox.top>end.y+marker/2,
        JSON.stringify({width,row,testBox,end}));
      assert.ok(testBox.top+testBox.height<next.y-marker/2,
        JSON.stringify({width,row,testBox,next}));
    }
    if(compact){
      // Area banners must not collide with the preceding five-stage checkpoint.
      for(const row of [10,12]){
        const current=map.positions[row*5];
        const prev=map.positions[row*5-1];
        assert.ok(current.y-60 > prev.y+130,JSON.stringify({width,row,current,prev}));
      }
    }
  }
});

test('ぬいぐるみの島だけ、タイトル分の余白を追加して65ステージを同じ順番で維持',()=>{
  assert.equal(PRESCHOOL_MAP_TITLE_INSET,86);
  for(const width of [290,340,390,480,620,850,1024]){
    const old=islandStageLayout(width);
    const themed=islandStageLayout(width,65,PRESCHOOL_MAP_TITLE_INSET);
    assert.equal(themed.positions.length,65);
    assert.equal(themed.height,old.height+PRESCHOOL_MAP_TITLE_INSET);
    assert.ok(themed.positions[0].y-60>=18+58+12,'Header and first area banner need a gap');
    for(let i=0;i<65;i++){
      assert.equal(themed.positions[i].x,old.positions[i].x);
      assert.equal(themed.positions[i].y,old.positions[i].y+PRESCHOOL_MAP_TITLE_INSET);
    }
    for(let i=0;i<10;i++){
      const first=themed.positions[5*i+4];
      const next=themed.positions[5*i+5];
      const b=islandCheckpointLayout(width,first,48,next);
      assert.ok(b.top>=0&&b.top+b.height<themed.height);
    }
  }
  assert.throws(()=>islandStageLayout(340,65,-1),RangeError);
});

test('ぬいぐるみ島の個別ステージ名用の行間・テスト配置をスマホとPCで確保',()=>{
  for (const width of [290,340,390,480,619,620,850,1080]) {
    const compact=compactIslandStageMap(width);
    const base=islandStageLayout(width,65,86);
    const detailed=islandStageLayout(width,65,86,true);
    assert.equal(detailed.rowHeight,compact?190:160);
    assert.ok(detailed.height>base.height);
    for (let i=0;i<65;i++) {
      assert.equal(detailed.positions[i].order,i);
      assert.equal(detailed.positions[i].x,base.positions[i].x);
      assert.ok(detailed.positions[i].y>=base.positions[i].y);
    }
    for(let row=0;row<10;row++){
      const first=detailed.positions[row*5+4];
      const next=detailed.positions[(row+1)*5];
      const marker=Math.max(46,Math.min(57,Math.floor(width/5)-9));
      const check=islandCheckpointLayout(width,first,marker,next,true);
      assert.ok(check.top>first.y+marker/2+35,
        JSON.stringify({width,row,check,first}));
      assert.ok(check.top+check.height<next.y-marker/2,
        JSON.stringify({width,row,check,next}));
    }
  }
});
