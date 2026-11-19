import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');

test('all three preschool area titles render as unboxed lettering on the grass',()=>{
 assert.match(ui,/\{row:0,title:stageLabels\.normal,count:50,kind:'normal'\}/);
 assert.match(ui,/\{row:10,title:stageLabels\.extra,count:10,kind:'extra'\}/);
 assert.match(ui,/\{row:12,title:stageLabels\.secret,count:5,kind:'secret'\}/);
 assert.match(ui,/testID=\{'island-area-'\+area\.kind\}/);
 assert.match(ui,/grade.id==='preschool'&&styles.pixelZoneLabel/);
 assert.match(ui,/grade.id!=='preschool'&&area.kind==='extra'&&styles.extraAreaLabel/);
 assert.match(ui,/grade.id!=='preschool'&&area.kind==='secret'&&styles.secretAreaLabel/);
 assert.match(ui,/pixelZoneLabel:\{borderRadius:0,backgroundColor:'transparent',borderWidth:0/);
 assert.match(ui,/pixelZoneName:\{color:'#283e55',fontSize:17,lineHeight:23/);
 assert.match(ui,/textShadowColor:'rgba\(240,248,218,0\.95\)'/);
});
test('65 individual preschool stage titles have no cards but stay readable and tappable',()=>{
 assert.match(ui,/grade.id==='preschool' && grade.stages.map/);
 assert.match(ui,/testID=\{'preschool-stage-topic-'\+String\(index\+1\)\}/);
 assert.match(ui,/onPress=\{\(\)=>setDetailStageId\(stage.id\)\}/);
 assert.match(ui,/numberOfLines=\{compactStageMap\?3:2\}/);
 assert.match(ui,/preschoolStageTopic:\{position:'absolute',minHeight:36/);
 assert.match(ui,/backgroundColor:'transparent',borderRadius:0,borderWidth:0/);
 assert.match(ui,/preschoolStageTopicText:\{fontSize:12,lineHeight:16/);
 assert.match(ui,/preschoolStageTopicSmall:\{fontSize:10,lineHeight:14\}/);
 assert.match(ui,/textShadowColor:'rgba\(244,249,226,0\.96\)'/);
 assert.match(ui,/testID="preschool-stage-info-card"/);
});
test('the regular other-island zone labels remain unchanged',()=>{
 assert.match(ui,/zoneLabel:\{position:'absolute',paddingVertical:5,paddingHorizontal:9,backgroundColor:'#fff8dd'/);
 assert.match(ui,/extraAreaLabel:\{backgroundColor:'#e0eae5',borderColor:'#90b4a8'\}/);
 assert.match(ui,/secretAreaLabel:\{backgroundColor:'#eee2e9',borderColor:'#b39aaa'\}/);
});
